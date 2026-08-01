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

def submit_sitemap_gsc(token: str, site_url: str, sitemap_url: str):
    print(f"\n🚀 Sending Sitemap Re-Submission Request to GSC API...")
    url = f"https://www.googleapis.com/webmasters/v3/sites/{urllib.parse.quote(site_url, safe='')}/sitemaps/{urllib.parse.quote(sitemap_url, safe='')}"
    req = urllib.request.Request(url, method="PUT", headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status in (200, 204):
                print(f"✅ SUCCESS! Sitemap {sitemap_url} submitted directly to Google Search Console API.")
            else:
                print(f"Status Code: {resp.status}")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")

def main():
    sa_path = "/home/belajarcarabelajar/dawnbook/service-account.json"
    sa = None
    if os.environ.get("GSC_CLIENT_EMAIL") and os.environ.get("GSC_PRIVATE_KEY"):
        sa = {
            "client_email": os.environ["GSC_CLIENT_EMAIL"],
            "private_key": os.environ["GSC_PRIVATE_KEY"].replace("\\n", "\n")
        }
    elif os.path.exists(sa_path):
        with open(sa_path, 'r', encoding='utf-8') as f:
            sa = json.load(f)
    else:
        print(f"Service account credentials not found in env or at: {sa_path}")
        return

    print("🔐 Authenticating with Google Search Console API via Service Account...")
    token = get_access_token_jwt(sa, "https://www.googleapis.com/auth/webmasters")
    print("Token obtained successfully!")

    site_url = "sc-domain:dawnbook.belajarcarabelajar.com"
    sitemap_url = "https://dawnbook.belajarcarabelajar.com/sitemap.xml"

    submit_sitemap_gsc(token, site_url, sitemap_url)

if __name__ == "__main__":
    main()
