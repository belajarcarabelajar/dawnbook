/**
 * Gate for book cover illustrations (GEMINI.md section 27).
 *
 * Every book needs `books/<slug>/cover.svg`: a self-contained 630x630 SVG with
 * no text, scripts, styles, embedded or external resources, or emoji, that
 * resvg can render. The share-card renderer and `bun run build` rely on it.
 * It also reports title or author characters the card fonts cannot draw.
 *
 *   bun run check:covers [--book <slug>] [--root <dir>]
 */
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { listBooks } from "./diagrams/books";
import { missingGlyphs, summaryPages } from "./og/cards";

export const COVER_FILE = "cover.svg";
export const MAX_COVER_BYTES = 40 * 1024;
const VIEWBOX = "0 0 630 630";

export interface CoverViolation {
  book: string;
  rule: string;
  message: string;
}

export const FORBIDDEN_ELEMENTS = ["script", "style", "foreignObject", "image", "text", "tspan", "textPath", "a", "iframe", "video", "audio"];

export function coverRules(svg: string): [rule: string, message: string][] {
  const out: [string, string][] = [];
  const bytes = Buffer.byteLength(svg, "utf8");
  if (bytes > MAX_COVER_BYTES) out.push(["too-large", `${bytes} bytes; keep the cover under ${MAX_COVER_BYTES} bytes`]);

  const root = svg.match(/<svg\b[^>]*>/);
  if (!root) {
    out.push(["no-svg-root", "the file has no <svg> root element"]);
    return out;
  }
  const viewBox = root[0].match(/\bviewBox\s*=\s*["']([^"']*)["']/);
  if (!viewBox || viewBox[1].trim().replace(/[\s,]+/g, " ") !== VIEWBOX) {
    out.push(["bad-viewbox", `the root <svg> needs viewBox="${VIEWBOX}"`]);
  }

  for (const name of FORBIDDEN_ELEMENTS) {
    if (new RegExp(`<${name}[\\s/>]`, "i").test(svg)) {
      out.push(["forbidden-element", `<${name}> is not allowed; draw with shapes and paths only (the card adds all text)`]);
    }
  }
  for (const m of svg.matchAll(/(?:xlink:)?href\s*=\s*["']([^"']*)["']/g)) {
    if (!m[1].startsWith("#")) out.push(["external-ref", `href="${m[1].slice(0, 60)}" points outside the file; only #id references are allowed`]);
  }
  for (const m of svg.matchAll(/url\(\s*["']?([^)"']*)/g)) {
    if (!m[1].startsWith("#")) out.push(["external-ref", `url(${m[1].slice(0, 60)}) points outside the file; only url(#id) is allowed`]);
  }
  if (/\son[a-z]+\s*=/i.test(svg)) out.push(["event-attr", "event attributes (onload, onclick, ...) are not allowed"]);
  if (/\p{Extended_Pictographic}/u.test(svg)) out.push(["emoji", "remove the emoji"]);

  try {
    new Resvg(svg, { fitTo: { mode: "width", value: 63 }, font: { loadSystemFonts: false } }).render();
  } catch (error) {
    out.push(["render-error", `resvg cannot render the file: ${(error as Error).message}`]);
  }
  return out;
}

/** Texts the cards draw for one book, split by font: Syne titles and Epilogue body lines. */
export function cardTexts(bookDir: string): { title: string[]; body: string[] } {
  const toml = fs.readFileSync(path.join(bookDir, "book.toml"), "utf8");
  const bookTitle = toml.match(/^\s*title\s*=\s*"([^"]*)"/m)?.[1] ?? "";
  const authors = toml.replace(/#.*$/gm, "").match(/authors\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? "";
  const summaryFile = path.join(bookDir, "src", "SUMMARY.md");
  const chapters = fs.existsSync(summaryFile)
    ? summaryPages(fs.readFileSync(summaryFile, "utf8")).map((e) => e.name)
    : [];
  return { title: [bookTitle, ...chapters], body: [bookTitle, authors.replace(/["']/g, "")] };
}

export function checkCovers(root: string, opts: { book?: string } = {}): CoverViolation[] {
  const violations: CoverViolation[] = [];
  for (const book of listBooks(root, opts.book)) {
    const texts = cardTexts(path.join(root, "books", book));
    for (const [role, list] of [["title", texts.title], ["body", texts.body]] as const) {
      for (const text of list) {
        const missing = missingGlyphs(text, role);
        if (missing.length > 0) {
          violations.push({
            book,
            rule: "missing-glyph",
            message: `the share card cannot draw ${missing.map((c) => `"${c}"`).join(", ")} in "${text}"; spell it out, or add a font subset in scripts/og/cards.ts`,
          });
        }
      }
    }
    const file = path.join(root, "books", book, COVER_FILE);
    if (!fs.existsSync(file)) {
      violations.push({ book, rule: "missing-cover", message: `no ${COVER_FILE}; write one by the cover contract in GEMINI.md section 27` });
      continue;
    }
    for (const [rule, message] of coverRules(fs.readFileSync(file, "utf8"))) violations.push({ book, rule, message });
  }
  return violations;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const valueOf = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const root = path.resolve(valueOf("--root") ?? process.cwd());
  let violations: CoverViolation[];
  try {
    violations = checkCovers(root, { book: valueOf("--book") });
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
  for (const v of violations) console.log(`books/${v.book}/${COVER_FILE} [${v.rule}] ${v.message}`);
  console.log(`TOTAL: ${violations.length} cover violations`);
  process.exit(violations.length === 0 ? 0 : 1);
}
