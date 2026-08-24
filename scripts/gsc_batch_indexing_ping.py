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
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

def get_repo_path(relative_path: str) -> str:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    primary_path = os.path.join(repo_root, relative_path)
    if os.path.exists(primary_path) or os.path.exists(os.path.dirname(primary_path)):
        return primary_path
    legacy_path = os.path.join("/home/belajarcarabelajar/dawnbook", relative_path)
    return legacy_path

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

def send_indexing_notification(url: str, token: str, stop_event: threading.Event, idx_endpoint: str = "https://indexing.googleapis.com/v3/urlNotifications:publish"):
    if stop_event.is_set():
        return url, False, False, "stopped"

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
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status == 200:
                return url, True, False, None
            return url, False, False, f"Status {resp.status}"
    except urllib.error.HTTPError as e:
        if e.code == 429:
            stop_event.set()
            return url, False, True, "429 Quota Exceeded"
        return url, False, False, str(e)
    except Exception as e:
        return url, False, False, str(e)

def process_indexing_batch(target_urls: list, token: str, max_workers: int = 10, idx_endpoint: str = "https://indexing.googleapis.com/v3/urlNotifications:publish"):
    success_count = 0
    error_count = 0
    processed_count = 0
    total_urls = len(target_urls)
    stop_event = threading.Event()

    if total_urls == 0:
        return 0, 0

    print(f"\n📡 Sending Indexing API notifications for {total_urls} URLs (Parallel workers: {max_workers})...")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(send_indexing_notification, url, token, stop_event, idx_endpoint): (idx, url)
            for idx, url in enumerate(target_urls, 1)
        }

        for future in as_completed(futures):
            processed_count += 1
            url, is_success, is_quota, err = future.result()

            if is_success:
                success_count += 1
            elif err != "stopped":
                error_count += 1

            if is_quota:
                idx, _ = futures[future]
                print(f"⚠️ Daily quota reached at item {idx} (URL: {url}). Stopping batch.")

            if processed_count % 50 == 0 or processed_count == total_urls:
                print(f"  Processed {processed_count}/{total_urls} URLs (Success: {success_count}, Quota/Note: {error_count})...")

    return success_count, error_count

def main():
    env_vars = {}
    env_path = get_repo_path(".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env_vars[k] = v.strip('\"\'')

    sa_path = get_repo_path("service-account.json")
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
    checkpoint_path = get_repo_path("docs/indexing_checkpoint.json")
    if "--resume" in sys.argv or "--offset" in sys.argv:
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
    sitemap_file = get_repo_path("output/sitemap.xml")
    if os.path.exists(sitemap_file):
        tree = ET.parse(sitemap_file)
        all_urls = [u.find('{http://www.sitemaps.org/schemas/sitemap/0.9}loc').text for u in tree.findall('{http://www.sitemaps.org/schemas/sitemap/0.9}url')]
        target_urls = all_urls[offset:]

        max_workers = int(os.environ.get("GSC_MAX_WORKERS", "10"))
        success_count, error_count = process_indexing_batch(target_urls, token, max_workers=max_workers)
                
        print(f"\n🎉 Indexing Notification Batch Complete! {success_count} URLs directly pushed to Google Indexing API queue.")

        sent_count = offset + success_count
        cp_data = {
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "total_urls": len(all_urls),
            "batch_1_sent_count": sent_count,
            "batch_2_remaining_count": max(0, len(all_urls) - sent_count),
            "batch_1_sent_urls": all_urls[:sent_count]
        }
        with open(checkpoint_path, 'w', encoding='utf-8') as f:
            json.dump(cp_data, f, indent=2)
        print(f"💾 Updated checkpoint saved to {checkpoint_path} (Sent count: {sent_count})")

if __name__ == "__main__":
    main()
