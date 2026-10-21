/**
 * Share cards (Open Graph images) for book pages (GEMINI.md section 27).
 *
 * Each card is 1200x630: a black text panel in the hub's monochrome style on
 * the left, and the book's own illustration (`books/<slug>/cover.svg`, 630x630)
 * on the right. Rendered with satori (layout to SVG) and resvg (SVG to PNG),
 * so CI needs no browser. The same inputs always give the same PNG bytes.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import opentype from "opentype.js";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;
export const ART_SIZE = 630;

export interface CardText {
  /** Muted line above the title: the book title on a chapter card. */
  context: string;
  /** The large title: the chapter name, or the book title on the book card. */
  title: string;
  author: string;
}

export interface CardPage {
  /** Output name without `.png`: `index` for the book root, else the chapter path (`content/01_x`). */
  page: string;
  text: CardText;
}

export interface SummaryEntry {
  name: string;
  /** Path relative to `src/` without `./` and `.md`; README and index become `index`. */
  page: string;
}

export function parseSummaryEntries(summary: string): SummaryEntry[] {
  const entries: SummaryEntry[] = [];
  for (const line of summary.split("\n")) {
    const m = line.match(/^\s*- \[(.+)\]\(([^)\s]+\.md)\)/);
    if (!m) continue;
    const rel = m[2].replace(/^\.\//, "").replace(/\.md$/, "");
    entries.push({ name: m[1], page: rel === "README" || rel === "index" ? "index" : rel });
  }
  return entries;
}

/** The book card first, then one card per chapter, in SUMMARY.md order. */
export function cardPages(
  book: { title: string; author: string; chapterCount: number },
  summary: string,
): CardPage[] {
  const pages: CardPage[] = [
    { page: "index", text: { context: `${book.chapterCount} bab`, title: book.title, author: book.author } },
  ];
  const seen = new Set(["index"]);
  for (const entry of parseSummaryEntries(summary)) {
    if (seen.has(entry.page)) continue;
    seen.add(entry.page);
    pages.push({ page: entry.page, text: { context: book.title, title: entry.name, author: book.author } });
  }
  return pages;
}

const FONT_DIR = path.resolve(import.meta.dir, "..", "..", "node_modules", "@fontsource");
const fontFile = (pkg: string, subset: string, weight: number) =>
  path.join(FONT_DIR, pkg, "files", `${pkg}-${subset}-${weight}-normal.woff`);

const PANEL_PAD = { top: 56, right: 48, bottom: 48, left: 56 };
export const TITLE_WIDTH = CARD_WIDTH - ART_SIZE - PANEL_PAD.left - PANEL_PAD.right;
const TITLE_SIZES = [58, 54, 50, 46, 42, 38, 34, 30];
const TITLE_MAX_LINES = 4;
// Syne subsets in fallback order; β lives only in the greek file.
const TITLE_SUBSETS = ["latin", "latin-ext", "greek"];

// Epilogue (context line and author) has no greek subset.
const BODY_SUBSETS = ["latin", "latin-ext"];

function parseFont(file: string): opentype.Font {
  const buf = readFileSync(file);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

let titleFontCache: opentype.Font[] | null = null;
let bodyFontCache: opentype.Font[] | null = null;
const titleFonts = () => (titleFontCache ??= TITLE_SUBSETS.map((s) => parseFont(fontFile("syne", s, 700))));
const bodyFonts = () => (bodyFontCache ??= BODY_SUBSETS.map((s) => parseFont(fontFile("epilogue", s, 600))));

/**
 * Characters of `text` that no subset of the role's font draws. satori drops
 * them silently, so check-covers reports them before a card ships with a gap.
 */
export function missingGlyphs(text: string, role: "title" | "body"): string[] {
  const fonts = role === "title" ? titleFonts() : bodyFonts();
  const missing = new Set<string>();
  for (const ch of text) {
    if (/\s/.test(ch)) continue;
    if (!fonts.some((f) => f.charToGlyph(ch).index !== 0)) missing.add(ch);
  }
  return [...missing];
}

/** Width in px of `text` in the title font (Syne 700), per glyph without kerning. */
export function measureTitle(text: string, size: number): number {
  const fonts = titleFonts();
  let width = 0;
  for (const ch of text) {
    const font = fonts.find((f) => f.charToGlyph(ch).index !== 0) ?? fonts[0];
    width += font.getAdvanceWidth(ch, size);
  }
  return width;
}

/**
 * The largest title size at which every word fits the panel width and the
 * title wraps into at most four lines. Syne is wide, so long Indonesian words
 * ("Perkembangan", "Neuroplastisitas") decide the size more often than length.
 */
export function titleSize(text: string, measure: (text: string, size: number) => number = measureTitle): number {
  const words = text.split(/\s+/).filter(Boolean);
  const limit = TITLE_WIDTH * 0.96;
  for (const size of TITLE_SIZES) {
    const space = measure(" ", size);
    let fits = true;
    let lines = 1;
    let used = 0;
    for (const word of words) {
      // satori may also break a line after a hyphen (UAX 14), so "Menunda-nunda?" wraps as two pieces.
      word.split(/(?<=-)/).forEach((piece, i) => {
        const width = measure(piece, size);
        if (width > limit) fits = false;
        const gap = used === 0 || i > 0 ? 0 : space;
        if (used + gap + width <= limit) used += gap + width;
        else {
          lines++;
          used = width;
        }
      });
    }
    if (fits && lines <= TITLE_MAX_LINES) return size;
  }
  return TITLE_SIZES[TITLE_SIZES.length - 1];
}

type FontWeight = 400 | 600 | 700;
let fontCache: { name: string; data: Buffer; weight: FontWeight; style: "normal" }[] | null = null;

function fonts() {
  if (fontCache) return fontCache;
  const load = (family: string, pkg: string, subset: string, weight: FontWeight) => ({
    name: family,
    data: readFileSync(fontFile(pkg, subset, weight)),
    weight,
    style: "normal" as const,
  });
  fontCache = [
    ...TITLE_SUBSETS.map((subset) => load("Syne", "syne", subset, 700)),
    load("Epilogue", "epilogue", "latin", 400),
    load("Epilogue", "epilogue", "latin-ext", 400),
    load("Epilogue", "epilogue", "latin", 600),
    load("Epilogue", "epilogue", "latin-ext", 600),
  ];
  return fontCache;
}

// Every SVG here is shapes and paths only (satori outlines its text), so resvg
// must not scan the system fonts: that scan was ~90 of the ~100 ms per card.
const RESVG_FONTS = { loadSystemFonts: false };

/** Renders the cover illustration once per book; every card of the book reuses it. */
export function renderArt(coverSvg: string): Buffer {
  return Buffer.from(new Resvg(coverSvg, { fitTo: { mode: "width", value: ART_SIZE }, font: RESVG_FONTS }).render().asPng());
}

const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}) => ({
  type,
  props: { style, children, ...extra },
});

function cardTree(text: CardText, artPng: Buffer) {
  const muted = "#a3a3a3";
  const panelPad = PANEL_PAD;
  return h("div", { display: "flex", width: CARD_WIDTH, height: CARD_HEIGHT, background: "#0b0b0b" }, [
    h(
      "div",
      {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        // satori sizes the content box, so the padding is subtracted here.
        width: CARD_WIDTH - ART_SIZE - panelPad.left - panelPad.right,
        height: CARD_HEIGHT - panelPad.top - panelPad.bottom,
        padding: `${panelPad.top}px ${panelPad.right}px ${panelPad.bottom}px ${panelPad.left}px`,
      },
      [
        h("div", { display: "flex", fontFamily: "Syne", fontWeight: 700, fontSize: 22, letterSpacing: 6, color: muted, flexShrink: 0 }, "DAWNBOOK"),
        h("div", { display: "flex", flexDirection: "column" }, [
          h("div", { display: "block", fontFamily: "Epilogue", fontWeight: 600, fontSize: 24, color: muted, marginBottom: 18, lineClamp: 2 }, text.context),
          h("div", { display: "block", fontFamily: "Syne", fontWeight: 700, fontSize: titleSize(text.title), lineHeight: 1.1, color: "#ffffff", lineClamp: 4 }, text.title),
        ]),
        h("div", { display: "block", fontFamily: "Epilogue", fontWeight: 400, fontSize: 22, color: muted, flexShrink: 0, lineClamp: 1 }, `oleh ${text.author}`),
      ],
    ),
    h("img", { width: ART_SIZE, height: ART_SIZE }, undefined, {
      src: `data:image/png;base64,${artPng.toString("base64")}`,
      width: ART_SIZE,
      height: ART_SIZE,
    }),
  ]);
}

export async function renderCard(text: CardText, artPng: Buffer): Promise<Buffer> {
  const svg = await satori(cardTree(text, artPng) as any, { width: CARD_WIDTH, height: CARD_HEIGHT, fonts: fonts() });
  return Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: CARD_WIDTH }, font: RESVG_FONTS }).render().asPng());
}
