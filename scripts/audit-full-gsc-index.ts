import fs from "fs";
import path from "path";
import crypto from "crypto";

function base64url(str: string | Buffer): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getAccessToken(sa: any): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
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

interface InspectionResult {
  url: string;
  verdict: string;
  coverageState: string;
  indexingState: string;
  googleCanonical?: string;
  userCanonical?: string;
  error?: string;
}

async function inspectUrl(token: string, inspectionUrl: string, siteUrl: string): Promise<InspectionResult> {
  try {
    const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspectionUrl: inspectionUrl,
        siteUrl: siteUrl,
      }),
    });

    const data = await res.json();
    if (data.inspectionResult && data.inspectionResult.indexStatusResult) {
      const st = data.inspectionResult.indexStatusResult;
      return {
        url: inspectionUrl,
        verdict: st.verdict || "UNKNOWN",
        coverageState: st.coverageState || "UNKNOWN",
        indexingState: st.indexingState || "UNKNOWN",
        googleCanonical: st.googleCanonical,
        userCanonical: st.userCanonical,
      };
    }
    return {
      url: inspectionUrl,
      verdict: "ERROR",
      coverageState: data.error ? data.error.message : "NO_RESULT",
      indexingState: "ERROR",
    };
  } catch (err: any) {
    return {
      url: inspectionUrl,
      verdict: "ERROR",
      coverageState: err.message,
      indexingState: "ERROR",
    };
  }
}

async function main() {
  console.log("🔍 Starting Full Site-Wide GSC Indexing Audit for Dawnbook...");

  const sitemapPath = "/home/belajarcarabelajar/dawnbook/output/sitemap.xml";
  if (!fs.existsSync(sitemapPath)) {
    console.error("sitemap.xml not found at", sitemapPath);
    process.exit(1);
  }

  const sitemapContent = fs.readFileSync(sitemapPath, "utf8");
  const urls: string[] = [];
  const matches = sitemapContent.matchAll(/<loc>(.*?)<\/loc>/g);
  for (const match of matches) {
    urls.push(match[1]);
  }

  console.log(`Found ${urls.length} URLs in sitemap.xml.`);

  const saPath = "/home/belajarcarabelajar/dawnbook/service-account.json";
  if (!fs.existsSync(saPath)) {
    console.error("service-account.json not found at", saPath);
    process.exit(1);
  }

  const sa = JSON.parse(fs.readFileSync(saPath, "utf8"));
  let token = await getAccessToken(sa);
  const siteUrl = "sc-domain:dawnbook.belajarcarabelajar.com";

  const results: InspectionResult[] = [];
  const BATCH_SIZE = 5;
  const DELAY_MS = 200;

  let tokenRefreshedAt = Date.now();

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    // Refresh token every 45 mins
    if (Date.now() - tokenRefreshedAt > 45 * 60 * 1000) {
      console.log("Refreshing GSC access token...");
      token = await getAccessToken(sa);
      tokenRefreshedAt = Date.now();
    }

    const batch = urls.slice(i, i + BATCH_SIZE);
    const promises = batch.map((url) => inspectUrl(token, url, siteUrl));
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    process.stdout.write(`\rInspected ${Math.min(i + BATCH_SIZE, urls.length)} / ${urls.length} URLs...`);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log("\n\n✅ Inspection Complete! Aggregating Results...");

  const summary = {
    total: results.length,
    indexed: 0,
    crawledNotIndexed: 0,
    discoveredNotIndexed: 0,
    pageWithRedirect: 0,
    unknownOrError: 0,
  };

  const bookStats: Record<string, { total: number; indexed: number; crawledNotIndexed: number; discoveredNotIndexed: number; redirect: number; other: number }> = {};

  for (const r of results) {
    const isIndexed = r.verdict === "PASS" || r.coverageState.toLowerCase().includes("indexed");
    const isCrawledNotIndexed = r.coverageState.toLowerCase().includes("crawled");
    const isDiscoveredNotIndexed = r.coverageState.toLowerCase().includes("discovered");
    const isRedirect = r.coverageState.toLowerCase().includes("redirect");

    if (isIndexed) summary.indexed++;
    else if (isCrawledNotIndexed) summary.crawledNotIndexed++;
    else if (isDiscoveredNotIndexed) summary.discoveredNotIndexed++;
    else if (isRedirect) summary.pageWithRedirect++;
    else summary.unknownOrError++;

    // Extract book slug
    const urlObj = new URL(r.url);
    const parts = urlObj.pathname.split("/").filter(Boolean);
    let bookSlug = "Hub / Root";
    if (parts[0] === "books" && parts[1]) {
      bookSlug = parts[1];
    }

    if (!bookStats[bookSlug]) {
      bookStats[bookSlug] = { total: 0, indexed: 0, crawledNotIndexed: 0, discoveredNotIndexed: 0, redirect: 0, other: 0 };
    }
    bookStats[bookSlug].total++;
    if (isIndexed) bookStats[bookSlug].indexed++;
    else if (isCrawledNotIndexed) bookStats[bookSlug].crawledNotIndexed++;
    else if (isDiscoveredNotIndexed) bookStats[bookSlug].discoveredNotIndexed++;
    else if (isRedirect) bookStats[bookSlug].redirect++;
    else bookStats[bookSlug].other++;
  }

  console.log("\n================ SITE-WIDE GSC INDEX SUMMARY ================");
  console.log(`Total URLs Checked:             ${summary.total}`);
  console.log(`🟢 Indexed (PASS):               ${summary.indexed} (${((summary.indexed / summary.total) * 100).toFixed(1)}%)`);
  console.log(`🟡 Crawled - currently not indexed: ${summary.crawledNotIndexed}`);
  console.log(`🔵 Discovered - not indexed:      ${summary.discoveredNotIndexed}`);
  console.log(`🔴 Page with redirect:            ${summary.pageWithRedirect}`);
  console.log(`⚪ Unknown / Other:               ${summary.unknownOrError}`);
  console.log("=============================================================\n");

  // Save report markdown
  let reportMd = `# Full GSC Indexing Report — Dawnbook\n\n`;
  reportMd += `**Audit Date:** ${new Date().toISOString()}\n`;
  reportMd += `**Total URLs Audited:** ${summary.total}\n\n`;
  reportMd += `## Overall Indexation Rate: **${((summary.indexed / summary.total) * 100).toFixed(1)}%** (${summary.indexed} / ${summary.total} Indexed)\n\n`;
  reportMd += `| Coverage State | Count | Percentage |\n`;
  reportMd += `|---|---|---|\n`;
  reportMd += `| 🟢 Submitted and indexed | ${summary.indexed} | ${((summary.indexed / summary.total) * 100).toFixed(1)}% |\n`;
  reportMd += `| 🟡 Crawled - currently not indexed | ${summary.crawledNotIndexed} | ${((summary.crawledNotIndexed / summary.total) * 100).toFixed(1)}% |\n`;
  reportMd += `| 🔵 Discovered - currently not indexed | ${summary.discoveredNotIndexed} | ${((summary.discoveredNotIndexed / summary.total) * 100).toFixed(1)}% |\n`;
  reportMd += `| 🔴 Page with redirect | ${summary.pageWithRedirect} | ${((summary.pageWithRedirect / summary.total) * 100).toFixed(1)}% |\n`;
  reportMd += `| ⚪ Unknown / Other | ${summary.unknownOrError} | ${((summary.unknownOrError / summary.total) * 100).toFixed(1)}% |\n\n`;

  reportMd += `## Indexation Breakdown per Book\n\n`;
  reportMd += `| Book / Category | Total Pages | Indexed | Crawled (Not Indexed) | Discovered (Not Indexed) | Redirect | Other |\n`;
  reportMd += `|---|---|---|---|---|---|---|\n`;

  for (const [slug, st] of Object.entries(bookStats)) {
    reportMd += `| \`${slug}\` | ${st.total} | ${st.indexed} | ${st.crawledNotIndexed} | ${st.discoveredNotIndexed} | ${st.redirect} | ${st.other} |\n`;
  }

  const reportPath = "/home/belajarcarabelajar/dawnbook/docs/FULL_GSC_INDEXING_REPORT.md";
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.readFileSync;
  fs.writeFileSync(reportPath, reportMd, "utf8");
  console.log(`\nFull report written to ${reportPath}`);

  // Save JSON raw results
  const jsonPath = "/home/belajarcarabelajar/dawnbook/docs/full_gsc_indexing_data.json";
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`Raw inspection data saved to ${jsonPath}`);
}

main().catch((err) => {
  console.error("Error running full GSC audit:", err);
  process.exit(1);
});
