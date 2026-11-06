#!/usr/bin/env python3
"""Resubmit the Dawnbook sitemap to Google Search Console.

Credentials, first match wins:
  1. GSC_OAUTH_REFRESH_TOKEN_TULIS (webmasters write scope), with GSC_OAUTH_CLIENT_ID and
     GSC_OAUTH_CLIENT_SECRET.
  2. GSC_OAUTH_REFRESH_TOKEN with the same client id and secret.
  3. Service account (GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY, or service-account.json).
Exits 1 on any failed API call or missing credential. Never prints a token value.
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
SCOPE = "https://www.googleapis.com/auth/webmasters"
REFRESH_TOKEN_VARS = ("GSC_OAUTH_REFRESH_TOKEN_TULIS", "GSC_OAUTH_REFRESH_TOKEN")
DEFAULT_SITE_URL = "sc-domain:dawnbook.belajarcarabelajar.com"
SITEMAP_URL = "https://dawnbook.belajarcarabelajar.com/sitemap.xml"


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


def submit_sitemap_gsc(token: str, site_url: str, sitemap_url: str, urlopen):
    print("\n🚀 Sending Sitemap Re-Submission Request to GSC API...")
    url = f"https://www.googleapis.com/webmasters/v3/sites/{urllib.parse.quote(site_url, safe='')}/sitemaps/{urllib.parse.quote(sitemap_url, safe='')}"
    # An explicit empty body makes urllib send Content-Length: 0 on the PUT.
    req = urllib.request.Request(url, data=b"", method="PUT", headers={"Authorization": f"Bearer {token}"})
    http_json(req, urlopen, f"Sitemap submission of {sitemap_url}")
    print(f"✅ SUCCESS! Sitemap {sitemap_url} submitted directly to Google Search Console API.")


def load_env_file(path: str) -> dict:
    env_vars = {}
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env_vars[k.strip()] = v.strip('\"\'')
    return env_vars


def main(env=None, urlopen=urllib.request.urlopen, sa_path=None) -> int:
    if env is None:
        env = {**load_env_file(os.path.join(REPO_ROOT, ".env")), **os.environ}
    if sa_path is None:
        sa_path = os.path.join(REPO_ROOT, "service-account.json")

    try:
        token = get_access_token(env, urlopen, SCOPE, sa_path)
        site_url = env.get("GSC_SITE_URL") or DEFAULT_SITE_URL
        submit_sitemap_gsc(token, site_url, SITEMAP_URL, urlopen)
    except GscError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
