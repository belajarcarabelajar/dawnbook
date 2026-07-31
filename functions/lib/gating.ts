/**
 * functions/lib/gating.ts
 *
 * Centralised gating policy for Dawnbook content.
 *
 * Terminology:
 *   "public preview" = pages accessible without authentication
 *   "gated content"  = pages that require an authenticated D1 session
 *
 * Policy:
 *   - Hub pages (/, /about.html, /contribute.html) are always public.
 *   - Admin SPA (/admin/*) is always public at the edge (the admin UI gates it via /api/auth/me).
 *   - All static assets (CSS, JS, fonts, images, manifest, _redirects, _headers) are public.
 *   - Sign-in pages (/sign-in*, /sign-up*) are public.
 *   - API routes (/api/*) are public at the edge (individual handlers enforce their own auth).
 *   - Book index/root (/books/<slug>/ and /books/<slug>/index.html) is public preview.
 *   - The first chapter of each book is public preview.
 *   - All other book pages are gated content.
 *
 * mdBook generates HTML filenames from SUMMARY.md entries. The first chapter
 * listed in SUMMARY.md becomes both the index.html and a numbered HTML file
 * (e.g. "01 - ...html"). We use a prefix-based matcher: any filename under
 * /books/<slug>/ whose decoded basename starts with "01" is public preview.
 */

/**
 * The public-preview boundary. Chapters at or before this prefix are public.
 * mdBook uses zero-padded numeric prefixes ("01 - ...", "02 - ...").
 */
export const PUBLIC_PREVIEW_CHAPTER = "chapter_1";


/** Static asset extensions that are always public. */
const PUBLIC_ASSET_EXTENSIONS = new Set([
  ".css",
  ".js",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".avif",
  ".mp4",
  ".webm",
  ".json",
  ".xml",
  ".txt",
  ".map",
]);

/** Exact public paths (case-sensitive). */
const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/index.html",
  "/about.html",
  "/contribute.html",
  "/manifest.json",
  "/_redirects",
  "/_headers",
  "/sign-in",
  "/sign-in/",
  "/sign-up",
  "/sign-up/",
  "/favicon.ico",
  "/favicon.svg",
  "/.nojekyll",
  "/donate",
  "/donate.html",
  "/appreciation",
  "/appreciation.html",
]);

/** Prefix-based public paths. */
const PUBLIC_PATH_PREFIXES = [
  "/api/",
  "/sign-in",
  "/sign-up",
];

/**
 * Determines whether a pathname is public (no auth required at edge).
 *
 * All content pages, book chapters, static assets, and public routes are public at the edge
 * so search engines (Googlebot, Bingbot, etc.) can crawl and index 100% of book content without 302 redirects.
 * Only /admin/* routes require authentication.
 *
 * @param pathname - The URL pathname, e.g. "/books/piaget/02%20-%20Konsep.html"
 * @returns true if the path should be served without edge-level auth redirection
 */
export function isPublicPath(pathname: string): boolean {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch (err) {
    console.error(`[gating] URIError decoding pathname: ${pathname}`);
  }

  // 1. Admin SPA routes are gated
  if (decoded === "/admin" || decoded.startsWith("/admin/")) {
    return false;
  }

  // 2. Exact public paths
  if (PUBLIC_EXACT_PATHS.has(decoded)) {
    return true;
  }

  // 3. Prefix-based public paths
  for (const prefix of PUBLIC_PATH_PREFIXES) {
    if (decoded.startsWith(prefix)) return true;
  }

  // 4. Static assets (by extension)
  const dotIdx = decoded.lastIndexOf(".");
  if (dotIdx !== -1) {
    const ext = decoded.slice(dotIdx).toLowerCase();
    if (PUBLIC_ASSET_EXTENSIONS.has(ext)) {
      return true;
    }
  }

  // 5. Book routes (/books/<slug>/...)
  const bookMatch = decoded.match(/^\/books\/([^\/]+)\/(.*)$/);
  if (bookMatch) {
    let page = bookMatch[2];
    if (page.startsWith("content/")) {
      page = page.slice("content/".length);
    }
    // Book root, index.html, or toc.html are public preview
    if (page === "" || page === "index.html" || page === "toc.html") {
      return true;
    }
    // Chapter 1 / first chapter is public preview (starts with "01" or "chapter_1")
    if (page.startsWith("01") || page.startsWith("chapter_1")) {
      return true;
    }
    // All other chapters require authentication at edge
    return false;
  }

  return true;
}

/**
 * Detects whether a request originates from a known Search Engine Crawler or AI Bot.
 */
export function isSearchEngineBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const botPattern = /Googlebot|Google-InspectionTool|Google-Extended|Storebot-Google|Bingbot|BingPreview|msnbot|YandexBot|Baiduspider|DuckDuckBot|GPTBot|ChatGPT-User|PerplexityBot|ClaudeBot|Claude-Web|Anthropic|Bytespider|CCBot|Amazonbot|Applebot|facebookexternalhit|Twitterbot|LinkedInBot/i;
  return botPattern.test(userAgent);
}

