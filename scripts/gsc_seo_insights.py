#!/usr/bin/env python3
"""Mine Search Console analytics (last 90 days) into docs/GSC_SEO_OPPORTUNITIES_REPORT.md.

Credentials, first match wins:
  1. GSC_OAUTH_REFRESH_TOKEN_TULIS, with GSC_OAUTH_CLIENT_ID and GSC_OAUTH_CLIENT_SECRET.
  2. GSC_OAUTH_REFRESH_TOKEN with the same client id and secret.
  3. Service account (GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY, or service-account.json).
Exits 1 on any failed API call or missing credential, before the report is written.
Never prints a token value.
"""
import json
import time
import urllib.error
import urllib.request
import urllib.parse
import base64
import subprocess
import os
import sys
import tempfile

# Repo moved from ~/dawnbook to ~/Proyek/dawnbook on 2026-09-30.
# Paths are derived from this file's location instead of hardcoded absolute paths.
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TOKEN_URL = "https://oauth2.googleapis.com/token"
SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
REFRESH_TOKEN_VARS = ("GSC_OAUTH_REFRESH_TOKEN_TULIS", "GSC_OAUTH_REFRESH_TOKEN")
DEFAULT_SITE_URL = "sc-domain:dawnbook.belajarcarabelajar.com"
DEFAULT_REPORT_PATH = os.path.join(REPO_ROOT, "docs", "GSC_SEO_OPPORTUNITIES_REPORT.md")


class GscError(Exception):
    pass


def base64url_encode(data: bytes) -> str:
    return base64.b64encode(data).decode('utf-8').replace('=', '').replace('+', '-').replace('/', '_')


def _error_detail(raw: bytes) -> str:
    # Google error bodies carry a code and message, never the credential that was sent.
    try:
        body = json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return ""
    err = body.get("error") if isinstance(body, dict) else None
    if isinstance(err, dict):
        return " ".join(str(err.get(k)) for k in ("status", "message") if err.get(k))
    if isinstance(err, str):
        return " ".join(x for x in (err, body.get("error_description")) if x)
    return ""


def http_json(req, urlopen, what: str) -> dict:
    try:
        with urlopen(req, timeout=60) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as e:
        raise GscError(f"{what} failed: HTTP {e.code} {_error_detail(e.read())}".rstrip())
    except urllib.error.URLError as e:
        raise GscError(f"{what} failed: {e.reason}")
    return json.loads(raw.decode("utf-8")) if raw else {}


def refresh_access_token(client_id, client_secret, refresh_token, var_name, urlopen) -> str:
    data = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }).encode("utf-8")
    req = urllib.request.Request(TOKEN_URL, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    body = http_json(req, urlopen, f"Refreshing the access token from {var_name}")
    if not body.get("access_token"):
        raise GscError(f"Refreshing the access token from {var_name} returned no access_token")
    return body["access_token"]


def get_access_token_jwt(sa: dict, scope: str, urlopen) -> str:
    header = {"alg": "RS256", "typ": "JWT"}
    now = int(time.time())
    claim_set = {
        "iss": sa["client_email"],
        "scope": scope,
        "aud": TOKEN_URL,
        "exp": now + 3600,
        "iat": now
    }

    encoded_header = base64url_encode(json.dumps(header).encode('utf-8'))
    encoded_claim_set = base64url_encode(json.dumps(claim_set).encode('utf-8'))
    sign_input = f"{encoded_header}.{encoded_claim_set}"

    with tempfile.NamedTemporaryFile('w', delete=False) as key_file:
        key_file.write(sa["private_key"])
        key_file_path = key_file.name

    try:
        proc = subprocess.Popen(
            ["openssl", "pkeyutl", "-sign", "-inkey", key_file_path, "-rawin", "-digest", "sha256"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        signature_bytes, stderr = proc.communicate(input=sign_input.encode('utf-8'))
        if proc.returncode != 0:
            raise GscError(f"OpenSSL signing failed: {stderr.decode('utf-8')}")
    finally:
        if os.path.exists(key_file_path):
            os.remove(key_file_path)

    jwt = f"{sign_input}.{base64url_encode(signature_bytes)}"
    data = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": jwt
    }).encode('utf-8')
    req = urllib.request.Request(TOKEN_URL, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    body = http_json(req, urlopen, "Service account token exchange")
    if not body.get("access_token"):
        raise GscError("Service account token exchange returned no access_token")
    return body["access_token"]


def load_service_account(env: dict, sa_path: str):
    if env.get("GSC_CLIENT_EMAIL") and env.get("GSC_PRIVATE_KEY"):
        return {
            "client_email": env["GSC_CLIENT_EMAIL"],
            "private_key": env["GSC_PRIVATE_KEY"].replace("\\n", "\n"),
        }
    if os.path.exists(sa_path):
        with open(sa_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def get_access_token(env: dict, urlopen, scope: str, sa_path: str) -> str:
    for var_name in REFRESH_TOKEN_VARS:
        if env.get(var_name):
            client_id = env.get("GSC_OAUTH_CLIENT_ID")
            client_secret = env.get("GSC_OAUTH_CLIENT_SECRET")
            if not client_id or not client_secret:
                raise GscError(f"{var_name} is set but GSC_OAUTH_CLIENT_ID or GSC_OAUTH_CLIENT_SECRET is missing")
            print(f"🔐 Authenticating with Google Search Console API via {var_name}...")
            return refresh_access_token(client_id, client_secret, env[var_name], var_name, urlopen)

    sa = load_service_account(env, sa_path)
    if sa:
        print("🔐 Authenticating with Google Search Console API via Service Account...")
        return get_access_token_jwt(sa, scope, urlopen)

    raise GscError(
        "No credentials: set GSC_OAUTH_REFRESH_TOKEN_TULIS (or GSC_OAUTH_REFRESH_TOKEN) with "
        "GSC_OAUTH_CLIENT_ID and GSC_OAUTH_CLIENT_SECRET, or a service account"
    )


def query_search_analytics(token: str, site_url: str, dimensions: list, urlopen, row_limit: int = 500):
    url = f"https://www.googleapis.com/webmasters/v3/sites/{urllib.parse.quote(site_url, safe='')}/searchAnalytics/query"

    end_date = time.strftime('%Y-%m-%d')
    start_date = time.strftime('%Y-%m-%d', time.localtime(time.time() - 90 * 86400))

    payload = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": dimensions,
        "rowLimit": row_limit
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    return http_json(req, urlopen, f"Search analytics query for dimensions {dimensions}").get("rows", [])


def main(env=None, urlopen=urllib.request.urlopen, sa_path=None, report_path=DEFAULT_REPORT_PATH) -> int:
    if env is None:
        env = dict(os.environ)
    if sa_path is None:
        sa_path = os.path.join(REPO_ROOT, "service-account.json")
    try:
        token = get_access_token(env, urlopen, SCOPE, sa_path)
        site_url = env.get("GSC_SITE_URL") or DEFAULT_SITE_URL
        write_report(token, site_url, urlopen, report_path)
    except GscError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1
    return 0


def write_report(token: str, site_url: str, urlopen, report_path: str):
    print("📊 Mining GSC Search Analytics Data (Last 90 Days)...")

    # 1. Query & Page breakdown
    query_page_rows = query_search_analytics(token, site_url, ["query", "page"], urlopen, row_limit=500)
    # 2. Page breakdown
    page_rows = query_search_analytics(token, site_url, ["page"], urlopen, row_limit=200)

    # Analysis 1: Striking Distance Keywords (Position 4.0 to 20.0)
    striking_distance = []
    for r in query_page_rows:
        keys = r.get("keys", [])
        if len(keys) == 2:
            query, page = keys[0], keys[1]
            pos = r.get("position", 0)
            clicks = r.get("clicks", 0)
            impressions = r.get("impressions", 0)
            ctr = r.get("ctr", 0)
            if 4.0 <= pos <= 20.0:
                striking_distance.append({
                    "query": query,
                    "page": page,
                    "position": round(pos, 1),
                    "clicks": clicks,
                    "impressions": impressions,
                    "ctr": f"{round(ctr * 100, 2)}%"
                })

    striking_distance.sort(key=lambda x: x["impressions"], reverse=True)

    # Analysis 2: Low-CTR High Impression Pages (Impressions > 5, CTR < 2%)
    low_ctr_pages = []
    for r in page_rows:
        keys = r.get("keys", [])
        if keys:
            page = keys[0]
            clicks = r.get("clicks", 0)
            impressions = r.get("impressions", 0)
            ctr = r.get("ctr", 0)
            pos = r.get("position", 0)
            if impressions >= 1 and ctr < 0.05:
                low_ctr_pages.append({
                    "page": page,
                    "impressions": impressions,
                    "clicks": clicks,
                    "ctr": f"{round(ctr * 100, 2)}%",
                    "position": round(pos, 1)
                })

    low_ctr_pages.sort(key=lambda x: x["impressions"], reverse=True)

    print("\n================ GSC SEO OPPORTUNITIES REPORT ================")
    print(f"🎯 Striking Distance Keywords Found: {len(striking_distance)}")
    for item in striking_distance[:10]:
        print(f"  • Keyword: '{item['query']}' | Pos: {item['position']} | Imp: {item['impressions']} | Page: {item['page']}")

    print(f"\n📈 Pages Requiring Title/Meta CTR Optimization: {len(low_ctr_pages)}")
    for item in low_ctr_pages[:10]:
        print(f"  • Page: {item['page']} | Imp: {item['impressions']} | CTR: {item['ctr']} | Pos: {item['position']}")
    print("==============================================================\n")

    # Generate Markdown Report
    report_md = f"# GSC SEO Opportunities & Keyword Mining Report — Dawnbook\n\n"
    report_md += f"**Audit Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
    report_md += f"**Property:** `sc-domain:dawnbook.belajarcarabelajar.com` (Last 90 Days)\n\n"

    report_md += f"## 🎯 1. Striking Distance Keywords (Positions 4.0 – 20.0)\n"
    report_md += f"These keywords get impressions and rank on pages 1-2, but minor content/heading updates can propel them to Top 3:\n\n"
    report_md += f"| Target Keyword | Current Position | Impressions | Clicks | CTR | Target Page |\n"
    report_md += f"|---|---|---|---|---|---|\n"

    if striking_distance:
        for item in striking_distance:
            report_md += f"| `{item['query']}` | **{item['position']}** | {item['impressions']} | {item['clicks']} | {item['ctr']} | [`{item['page'].split('.com')[1]}`]({item['page']}) |\n"
    else:
        report_md += f"| *No queries currently in striking distance (Wait for Googlebot re-crawl wave)* | - | - | - | - | - |\n"

    report_md += f"\n## 📈 2. Pages Needing Title & Meta Description CTR Rewrites\n"
    report_md += f"These pages get search impressions but low clicks. Enhancing titles with action words or numbers will boost CTR:\n\n"
    report_md += f"| Page URL | Impressions | Clicks | CTR | Avg Position |\n"
    report_md += f"|---|---|---|---|---|\n"

    if low_ctr_pages:
        for item in low_ctr_pages:
            report_md += f"| [`{item['page'].split('.com')[1]}`]({item['page']}) | {item['impressions']} | {item['clicks']} | {item['ctr']} | {item['position']} |\n"
    else:
        report_md += f"| *All pages have healthy CTR or pending crawl data* | - | - | - | - |\n"

    report_md += f"\n## 💡 Recommended Action Plan\n"
    report_md += f"1. **Incorporate Striking Distance Keywords**: Add the exact query phrases above into `H2` subheadings and introduction paragraphs.\n"
    report_md += f"2. **CTR Optimization**: Rewrite `<meta name=\"description\">` in `book.toml` for low-CTR pages to include clear action benefits.\n"
    report_md += f"3. **Internal Link Juicing**: Link from high-impression chapters to newly published chapters.\n"

    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_md)

    print(f"Report saved to {report_path}")

if __name__ == "__main__":
    sys.exit(main())
