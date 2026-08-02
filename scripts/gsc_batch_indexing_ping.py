#!/usr/bin/env python3
import json
import time
import urllib.request
import urllib.parse
import base64
import tempfile
import subprocess
import os
import sys
import xml.etree.ElementTree as ET

def base64url_encode(data: bytes) -> str:
    return base64.b64encode(data).decode('utf-8').replace('=', '').replace('+', '-').replace('/', '_')

def get_access_token(sa: dict, scope: str) -> str:
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

def main():
    env_vars = {}
    env_path = "/home/belajarcarabelajar/dawnbook/.env"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env_vars[k] = v.strip('\"\'')

    sa_path = "/home/belajarcarabelajar/dawnbook/service-account.json"
    sa = None
    if env_vars.get("GSC_CLIENT_EMAIL") and env_vars.get("GSC_PRIVATE_KEY"):
        sa = {
            "client_email": env_vars["GSC_CLIENT_EMAIL"],
            "private_key": env_vars["GSC_PRIVATE_KEY"].encode("utf-8").decode("unicode_escape")
        }
    elif os.path.exists(sa_path):
        with open(sa_path, 'r', encoding='utf-8') as f:
            sa = json.load(f)
    else:
        print("❌ Service account credentials not found.")
        return

    print("🔑 Authenticating for Google Indexing & Webmasters API...")
    scope = "https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/indexing"
    try:
        token = get_access_token(sa, scope)
        print("✅ Access token obtained!")
    except Exception as e:
        print("❌ Authentication failed:", e)
        return

    # Check for --resume or --offset argument
    offset = 0
    if "--resume" in sys.argv or "--offset" in sys.argv:
        checkpoint_path = "/home/belajarcarabelajar/dawnbook/docs/indexing_checkpoint.json"
        if os.path.exists(checkpoint_path):
            with open(checkpoint_path) as f:
                cp = json.load(f)
                offset = cp.get("batch_1_sent_count", 200)
            print(f"🔄 Resuming execution from checkpoint offset {offset}...")
        else:
            offset = 200

    # 1. Resubmit Sitemap
    site_url = "sc-domain:dawnbook.belajarcarabelajar.com"
    sitemap_url = "https://dawnbook.belajarcarabelajar.com/sitemap.xml"
    print(f"\n🚀 Submitting sitemap {sitemap_url} to GSC API...")
    sm_endpoint = f"https://www.googleapis.com/webmasters/v3/sites/{urllib.parse.quote(site_url, safe='')}/sitemaps/{urllib.parse.quote(sitemap_url, safe='')}"
    sm_req = urllib.request.Request(sm_endpoint, method="PUT", headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(sm_req) as resp:
            if resp.status in (200, 204):
                print("✅ Sitemap successfully submitted!")
    except Exception as e:
        print("⚠️ Sitemap submission note:", e)

    # 2. Read sitemap.xml and send URL_UPDATED notifications to Google Indexing API
    sitemap_file = "/home/belajarcarabelajar/dawnbook/output/sitemap.xml"
    if os.path.exists(sitemap_file):
        tree = ET.parse(sitemap_file)
        all_urls = [u.find('{http://www.sitemaps.org/schemas/sitemap/0.9}loc').text for u in tree.findall('{http://www.sitemaps.org/schemas/sitemap/0.9}url')]
        target_urls = all_urls[offset:]

        print(f"\n📡 Sending Indexing API notifications for {len(target_urls)} URLs (Offset {offset} to {len(all_urls)})...")
        
        success_count = 0
        error_count = 0
        
        idx_endpoint = "https://indexing.googleapis.com/v3/urlNotifications:publish"
        for i, url in enumerate(target_urls, 1):
            payload = {
                "url": url,
                "type": "URL_UPDATED"
            }
            req = urllib.request.Request(
                idx_endpoint,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                method="POST"
            )
            try:
                with urllib.request.urlopen(req) as resp:
                    if resp.status == 200:
                        success_count += 1
            except urllib.error.HTTPError as e:
                error_count += 1
                if e.code == 429:
                    print(f"⚠️ Daily quota reached at item {i} (URL: {url}). Stopping batch.")
                    break
            except Exception as e:
                error_count += 1

            if i % 50 == 0 or i == len(target_urls):
                print(f"  Processed {i}/{len(target_urls)} URLs (Success: {success_count}, Quota/Note: {error_count})...")
                
        print(f"\n🎉 Indexing Notification Batch Complete! {success_count} URLs directly pushed to Google Indexing API queue.")

if __name__ == "__main__":
    main()
