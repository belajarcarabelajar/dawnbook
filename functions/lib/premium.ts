import type { D1Database } from "@cloudflare/workers-types";
import bundled from "../../data/premium-books.json";
import { canonicalPath, hasEncodedEscape } from "./gating";

// A book with `edition: 2026` is a revised edition we authored, so the content gates check it;
// a book without an edition is published verbatim and the content gates skip it.
export type PremiumEntry = { products: string[]; productUrl: string; edition?: 2026 };

function validated(reg: Record<string, PremiumEntry>): Record<string, PremiumEntry> {
  for (const [slug, entry] of Object.entries(reg)) {
    if ("edition" in entry && entry.edition !== 2026) {
      throw new Error(`premium registry: ${slug} has edition ${JSON.stringify(entry.edition)}, only 2026 is allowed`);
    }
  }
  return reg;
}

const BUNDLED = validated((bundled as { books: Record<string, PremiumEntry> }).books);

let override: Record<string, PremiumEntry> | null = null;

export function loadPremiumRegistry(): Record<string, PremiumEntry> {
  return override ?? BUNDLED;
}

export function setPremiumRegistryForTest(reg: Record<string, PremiumEntry> | null): void {
  override = reg && validated(reg);
}

export function premiumSlugs(): string[] {
  return Object.keys(loadPremiumRegistry());
}

export function contentGateExemptSlugs(): string[] {
  return Object.entries(loadPremiumRegistry())
    .filter(([, entry]) => entry.edition === undefined)
    .map(([slug]) => slug);
}

const BOOK_PATH = /^\/books\/([^/]+)(?:\/(.*))?$/;

function tryDecode(pathname: string): string | null {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

export function premiumSlugOf(pathname: string): string | null {
  // A malformed escape falls back to the raw path: returning null there would
  // treat a premium page as an ordinary one and skip the gate.
  const m = BOOK_PATH.exec(canonicalPath(tryDecode(pathname) ?? pathname));
  if (!m) return null;
  return Object.hasOwn(loadPremiumRegistry(), m[1]) ? m[1] : null;
}

const ROOT_PAGES = new Set(["", "index.html", "index", "toc.html", "toc", "404.html"]);
const ASSET_EXTENSIONS = new Set([".css", ".js", ".woff", ".woff2", ".ttf", ".otf", ".eot"]);
const ASSET_DIRS = ["css/", "fonts/", "FontAwesome/", "images/public/"];

export function isPremiumPublicPage(pathname: string): boolean {
  const decoded = tryDecode(pathname);
  if (decoded === null || hasEncodedEscape(decoded)) return false;
  const m = BOOK_PATH.exec(canonicalPath(decoded));
  if (!m) return false;
  const rest = m[2] ?? "";
  // Encoded slashes decode into dot segments that a prefix check would wave
  // through (content/01_x/../02_y.html); anything with them stays gated.
  if (rest.split("/").some((s) => s === "." || s === "..") || rest.includes("\\")) return false;

  if (ROOT_PAGES.has(rest)) return true;

  const page = rest.startsWith("content/") ? rest.slice("content/".length) : rest;
  // The digit lookahead keeps chapter_10 and 010_x from passing as chapter 1.
  if (/^(?:01|chapter_1)(?!\d)/.test(page)) return true;

  if (ASSET_DIRS.some((d) => rest.startsWith(d))) return true;

  // mdBook writes its loose theme files only at the top of the book directory,
  // so an asset-looking name anywhere deeper (content/02_y.js) is book content.
  if (rest.includes("/")) return false;
  const base = rest.toLowerCase();
  if (base.startsWith("searchindex")) return false;
  if (base.startsWith("favicon")) return true;
  const dot = base.lastIndexOf(".");
  return dot > 0 && ASSET_EXTENSIONS.has(base.slice(dot));
}

const MEDIA_DIR = "images/";

/**
 * The R2 key (`books/<slug>/images/<name>`) of a premium book image, or null.
 * The path is decoded once and its slashes collapsed, as in the checks above.
 * An encoded slash or backslash, a backslash, a leftover escape, an empty name,
 * a dot segment or a control character gives null, so such a path never
 * reaches the bucket.
 */
export function premiumMediaKey(pathname: string): string | null {
  if (/%(?:2f|5c)/i.test(pathname)) return null;
  const decoded = tryDecode(pathname);
  if (decoded === null || hasEncodedEscape(decoded) || decoded.includes("\\") || /[\x00-\x1f\x7f]/.test(decoded)) return null;
  const m = BOOK_PATH.exec(canonicalPath(decoded));
  if (!m || !Object.hasOwn(loadPremiumRegistry(), m[1])) return null;
  const rest = m[2] ?? "";
  if (!rest.startsWith(MEDIA_DIR)) return null;
  const name = rest.slice(MEDIA_DIR.length);
  if (name.split("/").some((s) => s === "" || s === "." || s === "..")) return null;
  return `books/${m[1]}/${rest}`;
}

export async function checkPremiumAccess(
  lms: D1Database | undefined,
  email: string,
  entry: PremiumEntry,
): Promise<"allowed" | "refused" | "unavailable"> {
  const normalised = email.trim().toLowerCase();
  if (!normalised) return "refused";
  if (!lms) return "unavailable";

  const placeholders = entry.products.map((_, i) => `?${i + 2}`).join(", ");
  const unduhan = entry.products.length
    ? ` OR (kind = 'unduhan' AND product_id IN (${placeholders}))`
    : "";
  // 'shinobidone' (Shinobidone buyers) grants no e-book access; the old kind
  // 'member' was split and removed by bcb migrations 0003 and 0004.
  const sql =
    `SELECT 1 AS ok FROM entitlements WHERE email = ?1 AND revoked_at IS NULL AND (kind = 'ebook_premium'${unduhan})` +
    ` UNION ALL SELECT 1 AS ok FROM allowlist WHERE email = ?1 LIMIT 1`;

  try {
    const row = await lms.prepare(sql).bind(normalised, ...entry.products).first();
    return row ? "allowed" : "refused";
  } catch {
    console.error("premium: entitlement lookup failed");
    return "unavailable";
  }
}
