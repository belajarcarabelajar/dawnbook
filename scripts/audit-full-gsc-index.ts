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

/**
 * Inspects every sitemap URL with the Search Console URL Inspection API and writes
 * docs/FULL_GSC_INDEXING_REPORT.md plus docs/full_gsc_indexing_data.json.
 *
 * Credentials, first match wins:
 *   1. GSC_OAUTH_REFRESH_TOKEN_TULIS with GSC_OAUTH_CLIENT_ID and GSC_OAUTH_CLIENT_SECRET.
 *   2. GSC_OAUTH_REFRESH_TOKEN with the same client id and secret.
 *   3. Service account (GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY, or service-account.json).
 * Exits 1 when the token exchange fails or any inspection fails. Never prints a token value.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REFRESH_TOKEN_VARS = [
  "GSC_OAUTH_REFRESH_TOKEN_TULIS",
  "GSC_OAUTH_REFRESH_TOKEN",
] as const;
const DEFAULT_SITE_URL = "sc-domain:dawnbook.belajarcarabelajar.com";

type Env = Record<string, string | undefined>;

// Google error bodies carry a code and message, never the credential that was sent.
function describeError(data: any): string {
  if (!data || typeof data !== "object") return "";
  if (typeof data.error === "string") {
    return [data.error, data.error_description].filter(Boolean).join(" ");
  }
  if (data.error && typeof data.error === "object") {
    return [data.error.status, data.error.message].filter(Boolean).join(" ");
  }
  return "";
}

async function readJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function getAccessToken(
  sa: any,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<string> {
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

  const res = await fetchFn(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await readJson(res);
  if (!res.ok || !data.access_token) {
    throw new Error(
      `Service account token exchange failed: HTTP ${res.status} ${describeError(data)}`.trim(),
    );
  }
  return data.access_token;
}

export async function getAccessTokenFromRefreshToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  label = "refresh token",
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<string> {
  const res = await fetchFn(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await readJson(res);
  if (res.ok && data.access_token) {
    return data.access_token;
  }
  throw new Error(
    `Failed to refresh OAuth token: ${label}: HTTP ${res.status} ${describeError(data)}`.trim(),
  );
}

export interface TokenSource {
  label: string;
  token: string;
  refresh: () => Promise<string>;
}

export async function resolveAccessToken(
  env: Env,
  fetchFn: typeof fetch = globalThis.fetch,
  saPath = "service-account.json",
): Promise<TokenSource> {
  const varName = REFRESH_TOKEN_VARS.find((name) => env[name]);
  if (varName) {
    const clientId = env.GSC_OAUTH_CLIENT_ID;
    const clientSecret = env.GSC_OAUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error(
        `${varName} is set but GSC_OAUTH_CLIENT_ID or GSC_OAUTH_CLIENT_SECRET is missing`,
      );
    }
    const refreshToken = env[varName] as string;
    const refresh = () =>
      getAccessTokenFromRefreshToken(clientId, clientSecret, refreshToken, varName, fetchFn);
    return { label: varName, token: await refresh(), refresh };
  }

  let sa: any = null;
  if (env.GSC_CLIENT_EMAIL && env.GSC_PRIVATE_KEY) {
    sa = {
      client_email: env.GSC_CLIENT_EMAIL,
      private_key: env.GSC_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  } else if (fs.existsSync(saPath)) {
    sa = JSON.parse(await fs.promises.readFile(saPath, "utf8"));
  }
  if (sa) {
    const refresh = () => getAccessToken(sa, fetchFn);
    return { label: "service account", token: await refresh(), refresh };
  }

  throw new Error(
    "No credentials: set GSC_OAUTH_REFRESH_TOKEN_TULIS (or GSC_OAUTH_REFRESH_TOKEN) with GSC_OAUTH_CLIENT_ID and GSC_OAUTH_CLIENT_SECRET, or a service account",
  );
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
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<InspectionResult> {
  try {
    const res = await fetchFn(
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

    const data = await readJson(res);
    if (!res.ok) {
      return {
        url: inspectionUrl,
        verdict: "ERROR",
        coverageState: data.error?.message || `HTTP ${res.status}`,
        indexingState: "ERROR",
      };
    }
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

export interface MainOptions {
  env?: Env;
  fetchFn?: typeof fetch;
  sitemapPath?: string;
  reportDir?: string;
  saPath?: string;
  delayMs?: number;
}

export async function main(opts: MainOptions = {}): Promise<number> {
  const env = opts.env ?? process.env;
  const fetchFn = opts.fetchFn ?? globalThis.fetch;
  const sitemapPath = opts.sitemapPath ?? "output/sitemap.xml";
  const reportDir = opts.reportDir ?? "docs";
  const DELAY_MS = opts.delayMs ?? 200;

  console.log("🔍 Starting Full Site-Wide GSC Indexing Audit for Dawnbook...");

  if (!fs.existsSync(sitemapPath)) {
    console.error("sitemap.xml not found at", sitemapPath);
    return 1;
  }

  const sitemapContent = await fs.promises.readFile(sitemapPath, "utf8");
  const urls: string[] = [];
  const matches = sitemapContent.matchAll(/<loc>(.*?)<\/loc>/g);
  for (const match of matches) {
    urls.push(match[1]);
  }

  console.log(`Found ${urls.length} URLs in sitemap.xml.`);

  let source: TokenSource;
  try {
    source = await resolveAccessToken(env, fetchFn, opts.saPath);
  } catch (err: any) {
    console.error("Could not get a Search Console access token:", err.message);
    return 1;
  }
  console.log(`🔑 Authenticated via ${source.label}.`);
  let token = source.token;
  const siteUrl = env.GSC_SITE_URL || DEFAULT_SITE_URL;

  const results: InspectionResult[] = [];
  const BATCH_SIZE = 5;

  let tokenRefreshedAt = Date.now();

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    // Access tokens live one hour.
    if (Date.now() - tokenRefreshedAt > 45 * 60 * 1000) {
      console.log("Refreshing GSC access token...");
      token = await source.refresh();
      tokenRefreshedAt = Date.now();
    }

    const batch = urls.slice(i, i + BATCH_SIZE);
    const promises = batch.map((url) => inspectUrl(token, url, siteUrl, fetchFn));
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    process.stdout.write(
      `\rInspected ${Math.min(i + BATCH_SIZE, urls.length)} / ${urls.length} URLs...`,
    );
    if (DELAY_MS > 0) await new Promise((r) => setTimeout(r, DELAY_MS));
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

  const reportPath = path.join(reportDir, "FULL_GSC_INDEXING_REPORT.md");
  await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.promises.writeFile(reportPath, reportMd, "utf8");
  console.log(`\nFull report written to ${reportPath}`);

  // Save JSON raw results
  const jsonPath = path.join(reportDir, "full_gsc_indexing_data.json");
  await fs.promises.writeFile(
    jsonPath,
    JSON.stringify(results, null, 2),
    "utf8",
  );
  console.log(`Raw inspection data saved to ${jsonPath}`);

  const failed = results.filter((r) => r.verdict === "ERROR");
  if (failed.length > 0) {
    console.error(
      `${failed.length} of ${results.length} inspections failed (first: ${failed[0].url}: ${failed[0].coverageState}).`,
    );
    return 1;
  }
  return 0;
}

if (import.meta.main) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error("Error running full GSC audit:", err?.message ?? err);
      process.exit(1);
    },
  );
}
