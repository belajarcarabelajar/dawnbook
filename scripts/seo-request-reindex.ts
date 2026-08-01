import fs from "fs";
import crypto from "crypto";

function base64url(str: string | Buffer): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getAccessToken(sa: any, scope: string): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: sa.client_email,
    scope: scope,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedClaimSet = base64url(JSON.stringify(claimSet));
  const signInput = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signInput);
  const signature = signer
    .sign(sa.private_key, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  return data.access_token;
}

async function purgeCloudflareCache(): Promise<void> {
  console.log("\n=== 1. PURGING CLOUDFLARE PAGES CACHE ===");
  const cfEnvPath = "/home/belajarcarabelajar/cloudflare/.env";
  if (!fs.existsSync(cfEnvPath)) {
    console.warn("Cloudflare .env not found at", cfEnvPath);
    return;
  }

  const envContent = fs.readFileSync(cfEnvPath, "utf8");
  let token = "";
  let accountId = "";
  for (const line of envContent.split("\n")) {
    if (line.startsWith("CF_API_TOKEN=")) token = line.split("=")[1].trim();
    if (line.startsWith("CF_ACCOUNT_ID=")) accountId = line.split("=")[1].trim();
  }

  if (!token || !accountId) {
    console.warn("Missing CF_API_TOKEN or CF_ACCOUNT_ID");
    return;
  }

  // Purge build cache for Pages project 'dawnbook'
  const purgeRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/dawnbook/purge_build_cache`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const purgeData = await purgeRes.json();
  console.log("Cloudflare Build Cache Purge Result:", purgeData.success ? "SUCCESS" : JSON.stringify(purgeData));
}

async function pingGoogleSitemap(): Promise<void> {
  console.log("\n=== 2. PINGING GOOGLE SITEMAP ===");
  const sitemapUrl = "https://dawnbook.belajarcarabelajar.com/sitemap.xml";
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
  try {
    const res = await fetch(pingUrl);
    console.log(`Sitemap ping response status: ${res.status}`);
  } catch (err: any) {
    console.error("Sitemap ping failed:", err.message);
  }
}

async function inspectUrlsInGSC(sa: any): Promise<void> {
  console.log("\n=== 3. GSC URL INSPECTION & RE-INDEX AUDIT ===");
  const token = await getAccessToken(sa, "https://www.googleapis.com/auth/webmasters.readonly");
  const siteUrl = "sc-domain:dawnbook.belajarcarabelajar.com";

  const urlsToInspect = [
    "https://dawnbook.belajarcarabelajar.com/",
    "https://dawnbook.belajarcarabelajar.com/books/bias-kognitif/index.html",
    "https://dawnbook.belajarcarabelajar.com/books/arsitektur-kernel-linux/index.html",
    "https://dawnbook.belajarcarabelajar.com/books/metakognisi/index.html",
    "https://dawnbook.belajarcarabelajar.com/books/arsitektur-kernel-linux/content/13_referensi.html",
    "https://dawnbook.belajarcarabelajar.com/books/bias-kognitif/content/08_efek-halo-dan-efek-tanduk-ketika-satu-kesan-mengubah-segalanya.html",
  ];

  for (const url of urlsToInspect) {
    const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspectionUrl: url,
        siteUrl: siteUrl,
      }),
    });

    const data = await res.json();
    console.log(`\nURL: ${url}`);
    if (data.inspectionResult) {
      const state = data.inspectionResult.indexStatusResult;
      console.log(`  Verdict: ${state.verdict}`);
      console.log(`  Coverage State: ${state.coverageState}`);
      console.log(`  Indexing State: ${state.indexingState}`);
      console.log(`  Google Canonical: ${state.googleCanonical || "N/A"}`);
    } else {
      console.log("  Response:", JSON.stringify(data));
    }
  }
}

async function pingIndexNow(): Promise<void> {
  console.log("\n=== 2b. SUBMITTING TO INDEXNOW (BING / YANDEX) ===");
  const key = process.env.INDEXNOW_KEY || process.env.SEARCH_CONSOLE_API_KEY || "e4bb998231538111cf6f9cd1ebbc9124b616d7bd";
  const host = "dawnbook.belajarcarabelajar.com";
  const keyLocation = `https://${host}/${key}.txt`;

  const sitemapPath = "/home/belajarcarabelajar/dawnbook/output/sitemap.xml";
  let urlList: string[] = [];
  if (fs.existsSync(sitemapPath)) {
    const content = fs.readFileSync(sitemapPath, "utf8");
    const matches = content.matchAll(/<loc>(.*?)<\/loc>/g);
    for (const match of matches) {
      urlList.push(match[1]);
    }
  } else {
    urlList = [`https://${host}/`];
  }

  console.log(`Submitting ${urlList.length} URLs to IndexNow...`);
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation,
        urlList,
      }),
    });
    console.log(`IndexNow submission response status: ${res.status}`);
  } catch (err: any) {
    console.error("IndexNow submission failed:", err.message);
  }
}

async function main() {
  const saPath = "/home/belajarcarabelajar/dawnbook/service-account.json";
  await purgeCloudflareCache();
  await pingGoogleSitemap();
  await pingIndexNow();

  if (fs.existsSync(saPath)) {
    const sa = JSON.parse(fs.readFileSync(saPath, "utf8"));
    await inspectUrlsInGSC(sa);
  } else {
    console.log("\n💡 Note: Skipping GSC URL inspection -- awaiting service-account.json placement.");
  }
}

main().catch((err) => {
  console.error("Error in seo-request-reindex script:", err);
  process.exit(1);
});
