/**
 * functions/lib/gating.ts
 *
 * Centralised gating policy for Dawnbook content.
 *
 * Terminology:
 *   "public preview" = pages accessible without authentication
 *   "gated content"  = pages that require an authenticated Clerk session
 *
 * Policy:
 *   - Hub pages (/, /about.html, /contribute.html) are always public.
 *   - Admin SPA (/admin/*) is always public at the edge (Clerk UI gates it client-side).
 *   - All static assets (CSS, JS, fonts, images, manifest, _redirects, _headers) are public.
 *   - Clerk routes (/sign-in*, /.clerk/*) are public.
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

/**
 * The numeric prefix that identifies the first chapter in mdBook output.
 * mdBook convention: SUMMARY.md entries are rendered as "01 - Title.html",
 * "02 - Title.html", etc.
 */
const FIRST_CHAPTER_PREFIX = "01";

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
  "/favicon.ico",
  "/favicon.svg",
  "/.nojekyll",
]);

/** Prefix-based public paths. */
const PUBLIC_PATH_PREFIXES = [
  "/admin/",
  "/admin",
  "/api/",
  "/sign-in",
  "/.clerk/",
  "/.clerk",
];

/**
 * Determines whether a pathname is public (no auth required).
 *
 * @param pathname - The URL pathname, e.g. "/books/piaget/02%20-%20Konsep.html"
 * @returns true if the path should be served without authentication
 */
export function isPublicPath(pathname: string): boolean {
  // Decode percent-encoded pathnames for accurate matching
  const decoded = decodeURIComponent(pathname);

  // 1. Exact matches
  if (PUBLIC_EXACT_PATHS.has(decoded)) {
    return true;
  }

  // 2. Prefix matches
  for (const prefix of PUBLIC_PATH_PREFIXES) {
    if (decoded.startsWith(prefix)) {
      return true;
    }
  }

  // 3. Static asset extensions — always public regardless of path
  const lastDot = decoded.lastIndexOf(".");
  if (lastDot !== -1) {
    const ext = decoded.slice(lastDot).toLowerCase();
    // Non-HTML assets are always public
    if (ext !== ".html" && PUBLIC_ASSET_EXTENSIONS.has(ext)) {
      return true;
    }
  }

  // 4. Book-specific logic: /books/<slug>/<page>
  const bookMatch = decoded.match(/^\/books\/([a-zA-Z0-9_-]+)\/(.*)?$/);
  if (!bookMatch) {
    // Not a book path — anything else not matched above is public
    // (e.g. /tokens.css, /HubLayout.css, /typography.css)
    return true;
  }

  const page = bookMatch[2] ?? "";

  // Book root (index.html or empty) = public preview
  if (page === "" || page === "index.html") {
    return true;
  }

  // mdBook assets within a book directory (JS, CSS, fonts, images)
  const pageLastDot = page.lastIndexOf(".");
  if (pageLastDot !== -1) {
    const pageExt = page.slice(pageLastDot).toLowerCase();
    if (pageExt !== ".html" && PUBLIC_ASSET_EXTENSIONS.has(pageExt)) {
      return true;
    }
  }

  // ALL book paths are public at the edge for SEO.
  // Gating is handled dynamically on the client-side (shared-script-v3.js)
  // to allow one free chapter view before requiring sign-in.
  return true;
}
