import type { D1Database } from "@cloudflare/workers-types";
import bundled from "../../data/premium-books.json";

export type PremiumEntry = { products: string[]; productUrl: string };

const BUNDLED: Record<string, PremiumEntry> = (bundled as { books: Record<string, PremiumEntry> }).books;

let override: Record<string, PremiumEntry> | null = null;

export function loadPremiumRegistry(): Record<string, PremiumEntry> {
  return override ?? BUNDLED;
}

export function setPremiumRegistryForTest(reg: Record<string, PremiumEntry> | null): void {
  override = reg;
}

export function premiumSlugs(): string[] {
  return Object.keys(loadPremiumRegistry());
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
  const m = BOOK_PATH.exec((tryDecode(pathname) ?? pathname).replace(/\/{2,}/g, "/"));
  if (!m) return null;
  return Object.hasOwn(loadPremiumRegistry(), m[1]) ? m[1] : null;
}

const ROOT_PAGES = new Set(["", "index.html", "index", "toc.html", "toc", "404.html"]);
const ASSET_EXTENSIONS = new Set([".css", ".js", ".woff", ".woff2", ".ttf", ".otf", ".eot"]);
const ASSET_DIRS = ["css/", "fonts/", "FontAwesome/", "images/public/"];

export function isPremiumPublicPage(pathname: string): boolean {
  const decoded = tryDecode(pathname);
  if (decoded === null) return false;
  const m = BOOK_PATH.exec(decoded.replace(/\/{2,}/g, "/"));
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

  const base = rest.slice(rest.lastIndexOf("/") + 1);
  if (base.startsWith("favicon")) return true;
  if (base.startsWith("searchindex")) return false;
  const dot = base.lastIndexOf(".");
  return dot > 0 && ASSET_EXTENSIONS.has(base.slice(dot).toLowerCase());
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
  const sql =
    `SELECT 1 AS ok FROM entitlements WHERE email = ?1 AND revoked_at IS NULL AND (kind = 'member'${unduhan})` +
    ` UNION ALL SELECT 1 AS ok FROM allowlist WHERE email = ?1 LIMIT 1`;

  try {
    const row = await lms.prepare(sql).bind(normalised, ...entry.products).first();
    return row ? "allowed" : "refused";
  } catch {
    console.error("premium: entitlement lookup failed");
    return "unavailable";
  }
}
