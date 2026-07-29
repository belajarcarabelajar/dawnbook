#!/usr/bin/env python3
import json
import time
import urllib.request
import urllib.parse
import base64
import subprocess
import os
import tempfile

def base64url_encode(data: bytes) -> str:
    return base64.b64encode(data).decode('utf-8').replace('=', '').replace('+', '-').replace('/', '_')

def get_access_token_jwt(sa: dict, scope: str) -> str:
    header = {"alg": "RS256", "typ": "JWT"}
    now = int(time.time())
    claim_set = {
        "iss": sa["client_email"],
        "scope": scope,
        "aud": "https://oauth2.googleapis.com/token",
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
            raise RuntimeError(f"OpenSSL signing failed: {stderr.decode('utf-8')}")
    finally:
        if os.path.exists(key_file_path):
            os.remove(key_file_path)

    signature = base64url_encode(signature_bytes)
    jwt = f"{sign_input}.{signature}"

    data = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": jwt
    }).encode('utf-8')

    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req) as response:
        res_json = json.loads(response.read().decode('utf-8'))
        return res_json["access_token"]

def query_search_analytics(token: str, site_url: str, dimensions: list, row_limit: int = 500):
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

    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8')).get("rows", [])
    except Exception as e:
        print(f"Error querying search analytics for dimensions {dimensions}: {e}")
        return []

def main():
    sa_path = "/home/belajarcarabelajar/dawnbook/service-account.json"
    if not os.path.exists(sa_path):
        print(f"Service account file not found: {sa_path}")
        return

    with open(sa_path, 'r', encoding='utf-8') as f:
        sa = json.load(f)

    print("🔐 Authenticating with Google Search Console API...")
    token = get_access_token_jwt(sa, "https://www.googleapis.com/auth/webmasters.readonly")
    site_url = "sc-domain:dawnbook.belajarcarabelajar.com"

    print("📊 Mining GSC Search Analytics Data (Last 90 Days)...")

    # 1. Query & Page breakdown
    query_page_rows = query_search_analytics(token, site_url, ["query", "page"], row_limit=500)
    # 2. Page breakdown
    page_rows = query_search_analytics(token, site_url, ["page"], row_limit=200)

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

    report_path = "/home/belajarcarabelajar/dawnbook/docs/GSC_SEO_OPPORTUNITIES_REPORT.md"
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_md)

    print(f"Report saved to {report_path}")

if __name__ == "__main__":
    main()
