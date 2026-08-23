import fs from "fs";
import path from "path";
import crypto from "crypto";

export function base64url(str: string | Buffer): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export async function getAccessToken(sa: any): Promise<string> {
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

export async function getAccessTokenFromRefreshToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (data.access_token) {
    return data.access_token;
  }
  throw new Error(`Failed to refresh OAuth token: ${JSON.stringify(data)}`);
}

export interface InspectionResult {
  url: string;
  verdict: string;
  coverageState: string;
  indexingState: string;
  googleCanonical?: string;
  userCanonical?: string;
  error?: string;
}

export async function inspectUrl(
  token: string,
  inspectionUrl: string,
  siteUrl: string,
): Promise<InspectionResult> {
  try {
    const res = await fetch(
      "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inspectionUrl: inspectionUrl,
          siteUrl: siteUrl,
        }),
      },
    );

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

export async function main() {
  console.log("🔍 Starting Full Site-Wide GSC Indexing Audit for Dawnbook...");

  const sitemapPath = "output/sitemap.xml";
  try {
    await fs.promises.access(sitemapPath);
  } catch {
    console.error("sitemap.xml not found at", sitemapPath);
    process.exit(1);
  }

  const sitemapContent = await fs.promises.readFile(sitemapPath, "utf8");
  const urls: string[] = [];
  const matches = sitemapContent.matchAll(/<loc>(.*?)<\/loc>/g);
  for (const match of matches) {
    urls.push(match[1]);
  }

  console.log(`Found ${urls.length} URLs in sitemap.xml.`);

  const saPath = "service-account.json";
  let token = process.env.GOOGLE_SEARCH_CONSOLE_TOKEN || "";
  let sa: any = null;

  let saFileExists = false;
  try {
    await fs.promises.access(saPath);
    saFileExists = true;
  } catch {}

  if (process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY) {
    sa = {
      client_email: process.env.GSC_CLIENT_EMAIL,
      private_key: process.env.GSC_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
    token = await getAccessToken(sa);
  } else if (saFileExists) {
    sa = JSON.parse(await fs.promises.readFile(saPath, "utf8"));
    token = await getAccessToken(sa);
  } else if (
    process.env.GSC_REFRESH_TOKEN &&
    process.env.GSC_CLIENT_ID &&
    process.env.GSC_CLIENT_SECRET
  ) {
    try {
      console.log("🔑 Exchanging OAuth refresh token for access token...");
      token = await getAccessTokenFromRefreshToken(
        process.env.GSC_CLIENT_ID,
        process.env.GSC_CLIENT_SECRET,
        process.env.GSC_REFRESH_TOKEN,
      );
      console.log("✅ Successfully obtained OAuth 2.0 Access Token!");
    } catch (e: any) {
      console.warn("Could not exchange refresh token:", e.message);
      if (!token) {
        token =
          process.env.GOOGLE_SEARCH_CONSOLE_API_KEY ||
          process.env.GSC_API_KEY ||
          process.env.SEARCH_CONSOLE_API_KEY ||
          "";
      }
    }
  }
  const siteUrl = "sc-domain:dawnbook.belajarcarabelajar.com";

  const results: InspectionResult[] = [];
  const BATCH_SIZE = 5;
  const DELAY_MS = 200;

  let tokenRefreshedAt = Date.now();

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    // Refresh token every 45 mins
    if (sa && Date.now() - tokenRefreshedAt > 45 * 60 * 1000) {
      console.log("Refreshing GSC access token...");
      token = await getAccessToken(sa);
      tokenRefreshedAt = Date.now();
    }

    const batch = urls.slice(i, i + BATCH_SIZE);
    const promises = batch.map((url) => inspectUrl(token, url, siteUrl));
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    process.stdout.write(
      `\rInspected ${Math.min(i + BATCH_SIZE, urls.length)} / ${urls.length} URLs...`,
    );
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

  const bookStats: Record<
    string,
    {
      total: number;
      indexed: number;
      crawledNotIndexed: number;
      discoveredNotIndexed: number;
      redirect: number;
      other: number;
    }
  > = {};

  for (const r of results) {
    const isIndexed =
      r.verdict === "PASS" || r.coverageState.toLowerCase().includes("indexed");
    const isCrawledNotIndexed = r.coverageState
      .toLowerCase()
      .includes("crawled");
    const isDiscoveredNotIndexed = r.coverageState
      .toLowerCase()
      .includes("discovered");
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
      bookStats[bookSlug] = {
        total: 0,
        indexed: 0,
        crawledNotIndexed: 0,
        discoveredNotIndexed: 0,
        redirect: 0,
        other: 0,
      };
    }
    bookStats[bookSlug].total++;
    if (isIndexed) bookStats[bookSlug].indexed++;
    else if (isCrawledNotIndexed) bookStats[bookSlug].crawledNotIndexed++;
    else if (isDiscoveredNotIndexed) bookStats[bookSlug].discoveredNotIndexed++;
    else if (isRedirect) bookStats[bookSlug].redirect++;
    else bookStats[bookSlug].other++;
  }

  console.log(
    "\n================ SITE-WIDE GSC INDEX SUMMARY ================",
  );
  console.log(`Total URLs Checked:             ${summary.total}`);
  console.log(
    `🟢 Indexed (PASS):               ${summary.indexed} (${((summary.indexed / summary.total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `🟡 Crawled - currently not indexed: ${summary.crawledNotIndexed}`,
  );
  console.log(
    `🔵 Discovered - not indexed:      ${summary.discoveredNotIndexed}`,
  );
  console.log(`🔴 Page with redirect:            ${summary.pageWithRedirect}`);
  console.log(`⚪ Unknown / Other:               ${summary.unknownOrError}`);
  console.log(
    "=============================================================\n",
  );

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

  const reportPath = "docs/FULL_GSC_INDEXING_REPORT.md";
  await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.promises.writeFile(reportPath, reportMd, "utf8");
  console.log(`\nFull report written to ${reportPath}`);

  // Save JSON raw results
  const jsonPath = "docs/full_gsc_indexing_data.json";
  await fs.promises.writeFile(
    jsonPath,
    JSON.stringify(results, null, 2),
    "utf8",
  );
  console.log(`Raw inspection data saved to ${jsonPath}`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("Error running full GSC audit:", err);
    process.exit(1);
  });
}
