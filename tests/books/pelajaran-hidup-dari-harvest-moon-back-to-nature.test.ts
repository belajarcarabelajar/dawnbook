import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkBookStructure, extractLinkTargets, extractUrls } from "../../scripts/check-book-structure";
import { escapeHtml, extractLeadText, formatSerpDescription } from "../../scripts/inject-gating";
import { BOOK_VOICE_CONFIG, voiceViolations as sharedVoiceViolations } from "../../scripts/check-voice";
import { contentFiles, sourceTableSection, sourceTableUrls } from "../helpers/book-test";

const ROOT = path.resolve(import.meta.dir, "../..");
const BOOK = path.join(ROOT, "books/pelajaran-hidup-dari-harvest-moon-back-to-nature");
const NOTES = path.join(ROOT, "docs/code-plan/plans/research-dawnbook-harvest-moon.md");
const PLAN = path.join(ROOT, "docs/code-plan/plans/2026-10-23-dawnbook-harvest-moon.md");

const DATA_ROW = /^\| S[0-9]+ \|/;

// Overridable so the meta-length case can be shown red on a mutated copy of the book.
const META_BOOK = process.env.DAWNBOOK_HM_BOOK ?? BOOK;

// GEMINI.md section 8 asks for 110 to 160; the site cuts chapter metas at 155.
const META_MIN = 110;
const META_MAX = 155;

// The build reads the lead from the mdBook HTML with extractLeadText and cuts it like injectSeoAndGating
// (155, then 145 if the escaped meta passes 160). Bun.markdown stands in for mdBook's CommonMark renderer.
function chapterMeta(md: string): string {
  const lead = extractLeadText(`<main>${Bun.markdown.html(md)}</main>`);
  const meta = formatSerpDescription(lead, 155);
  return escapeHtml(meta).length > 160 ? formatSerpDescription(lead, 145) : meta;
}

// GEMINI.md section 29: the shared caps plus this book's "panduan" cap (scripts/check-voice.ts).
const SLUG = "pelajaran-hidup-dari-harvest-moon-back-to-nature";
function voiceViolations(file: string, md: string): string[] {
  return sharedVoiceViolations(file, md, BOOK_VOICE_CONFIG[SLUG]);
}

function metaOutOfRange(meta: string): boolean {
  return meta.length < META_MIN || meta.length > META_MAX;
}

// The guide is a copyrighted OCR text, so it stays outside the repository and the scan reads it at run time.
const GUIDE =
  process.env.DAWNBOOK_HM_GUIDE ??
  path.join(os.homedir(), "Unduhan/Full text of _Harvest Moon Back To Nature Strategy Guide Official eBook in PDF Format_.md");
const GUIDE_EXISTS = fs.existsSync(GUIDE);
if (!GUIDE_EXISTS) console.warn(`guide overlap scan skipped: guide not found at ${GUIDE}`);

function words(text: string): string[] {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter((w) => w.length > 0);
}

function nGrams(ws: string[], n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i + n <= ws.length; i++) out.push(ws.slice(i, i + n).join(" "));
  return out;
}

function sharedRuns(text: string, guide: string, n = 12): string[] {
  const guideRuns = new Set(nGrams(words(guide), n));
  return [...new Set(nGrams(words(text), n).filter((r) => guideRuns.has(r)))];
}

describe("book pelajaran-hidup-dari-harvest-moon-back-to-nature", () => {
  test("has 13 content chapters plus Referensi with no structural problems", () => {
    const result = checkBookStructure(BOOK);
    expect(result.problems).toEqual([]);
    expect(result.chapters).toBe(14);
    expect(contentFiles(BOOK).at(-1)).toBe("14_referensi.md");
  });

  test("every chapter stays inside the house byte budget", () => {
    const files = contentFiles(BOOK);
    expect(files.length).toBe(14);
    for (const f of files) {
      const size = fs.statSync(path.join(BOOK, "src/content", f)).size;
      const isRef = f === "14_referensi.md";
      const max = isRef ? 10500 : 9000;
      const min = isRef ? 3000 : 5500;
      expect({ f, size, ok: size >= min && size <= max }).toEqual({ f, size, ok: true });
    }
  });

  test("meta length check flags a short opener cut before a long second sentence and passes a 120-character one", () => {
    const longSecond =
      "Kamu datang hanya membawa ransel kecil, sedikit uang, dan janji kepada kakek bahwa ladang ini akan hidup lagi sebelum musim gugur pertama tiba.";
    const shortOpener = "Ladang tua itu penuh batu, rumput liar, dan ranting patah di setiap sudutnya.";
    const short = chapterMeta(`## Ladang\n\n${shortOpener} ${longSecond}\n\nParagraf berikutnya.\n`);
    expect(short).toBe(shortOpener);
    expect(short.length).toBe(77);
    expect(metaOutOfRange(short)).toBe(true);

    const okOpener =
      "Setiap pagi kamu bangun sebelum ayam berkokok, menyiram tanaman satu per satu, lalu pergi ke desa menjual hasil kebunmu.";
    const ok = chapterMeta(`## Ladang\n\n${okOpener} ${longSecond}\n`);
    expect(ok).toBe(okOpener);
    expect(ok.length).toBe(120);
    expect(metaOutOfRange(ok)).toBe(false);
  });

  test("every chapter meta description, computed as the build does, is 110 to 155 characters", () => {
    const files = contentFiles(META_BOOK);
    expect(files.length).toBe(14);
    const bad = files
      .map((f) => ({ f, meta: chapterMeta(fs.readFileSync(path.join(META_BOOK, "src/content", f), "utf-8")) }))
      .filter((m) => metaOutOfRange(m.meta))
      .map((m) => ({ f: m.f, length: m.meta.length }));
    expect(bad).toEqual([]);
  });

  test("voice guard flags report-style scaffolds and passes cooked prose", () => {
    const raw = "Kalau dipikir-pikir, panduan menyebut hal itu. Menurut panduan, tokoh kita lelah. Panduan juga mencatat tokoh kita tidur, dan tokoh kita bangun.";
    expect(voiceViolations("05_x.md", raw)).toEqual([
      "Kalau dipikir-pikir x1 (max 0)",
      "Menurut panduan x1 (max 0)",
      "tokoh kita x3 (max 2)",
      "panduan x3 (max 2)",
    ]);
    const scaffolds = "Seperti tulis panduan itu, hasilnya mirip dengan ladang dan mirip dengan kandang. Perhatikan juga, menariknya, bab berikutnya.";
    expect(voiceViolations("05_x.md", scaffolds)).toEqual([
      "tulis panduan x1 (max 0)",
      "mirip dengan x2 (max 1)",
      "stock connector x2 (max 0)",
      "bab berikutnya x1 (max 0)",
    ]);
    const cooked = "Si petani berhenti sebentar dan mengusap kening. Kamu tahu artinya: sudah waktunya istirahat, bukan menebas satu tunggul lagi.";
    expect(voiceViolations("05_x.md", cooked)).toEqual([]);
    expect(voiceViolations("01_x.md", "panduan panduan panduan panduan")).toEqual([]);
    expect(voiceViolations("01_x.md", "panduan panduan panduan panduan panduan")).toEqual(["panduan x5 (max 4)"]);
  });

  test("no content chapter exceeds the GEMINI.md section 29 scaffold caps", () => {
    const files = contentFiles(META_BOOK).filter((f) => f !== "14_referensi.md");
    expect(files.length).toBe(13);
    const bad = files
      .map((f) => ({ f, issues: voiceViolations(f, fs.readFileSync(path.join(META_BOOK, "src/content", f), "utf-8")) }))
      .filter((v) => v.issues.length > 0);
    expect(bad).toEqual([]);
  });

  test("source table allowlist ignores URLs mentioned only in prose", () => {
    const notes = [
      "## 8. Prose",
      "See https://example.com/prose-only for context.",
      "",
      "## 9. Source table",
      "",
      "| ID | Source | URL |",
      "|---|---|---|",
      "| S1 | First | https://example.com/s1 |",
      "| S12 | Twelfth | https://example.com/s12 |",
      "| X3 | Other prefix | https://example.com/x3 |",
      "",
      "Footnote mentioning https://example.com/after-table in prose.",
      "",
      "## 10. Later",
      "| S9 | Out of section | https://example.com/s9 |",
    ].join("\n");
    expect(sourceTableUrls(notes, DATA_ROW).sort()).toEqual(["https://example.com/s1", "https://example.com/s12"]);
  });

  test("source table of the real notes has 31 data rows with 31 distinct URLs", () => {
    const notes = fs.readFileSync(NOTES, "utf-8");
    const dataRows = sourceTableSection(notes).filter((l) => DATA_ROW.test(l)).length;
    expect(dataRows).toBe(31);
    expect(new Set(sourceTableUrls(notes, DATA_ROW)).size).toBe(31);
  });

  test("every URL in the book comes from the source table and every table URL is used", () => {
    const allowed = new Set(sourceTableUrls(fs.readFileSync(NOTES, "utf-8"), DATA_ROW));
    const used = contentFiles(BOOK).flatMap((f) => {
      const md = fs.readFileSync(path.join(BOOK, "src/content", f), "utf-8");
      return [...extractUrls(md), ...extractLinkTargets(md).filter((t) => /^https?:\/\//i.test(t))];
    });
    expect(used.filter((u) => !allowed.has(u))).toEqual([]);
    expect([...allowed].filter((u) => !used.includes(u))).toEqual([]);
  });

  test("shared-run detector flags a 12-word run copied from the guide despite case and punctuation", () => {
    const guide = "Chapter 3. In spring, plant Turnip seeds early; water the crops every single morning before the shop opens at ten.";
    const text = "Kata pemandu: PLANT turnip-seeds, early... water THE crops; every single morning before the! Lalu kamu istirahat.";
    expect(sharedRuns(text, guide)).toEqual(["plant turnip seeds early water the crops every single morning before the"]);
  });

  test("shared-run detector ignores an 11-word run and unrelated Indonesian text", () => {
    const guide = "Chapter 3. In spring, plant Turnip seeds early; water the crops every single morning before the shop opens at ten.";
    const eleven = "Plant turnip seeds early, water the crops every single morning before kamu berangkat kerja.";
    expect(sharedRuns(eleven, guide)).toEqual([]);
    expect(sharedRuns(eleven, guide, 11)).toEqual(["plant turnip seeds early water the crops every single morning before"]);
    const unrelated = "Kamu belajar sabar karena panen tidak datang dalam semalam, melainkan lewat kerja kecil yang diulang setiap hari.";
    expect(sharedRuns(unrelated, guide)).toEqual([]);
  });

  test.skipIf(!GUIDE_EXISTS)("no chapter or SUMMARY.md shares a 12-word run with the strategy guide", () => {
    const guide = fs.readFileSync(GUIDE, "utf-8");
    const files = contentFiles(BOOK);
    expect(files.length).toBe(14);
    const summary = path.join(BOOK, "src/SUMMARY.md");
    expect(fs.existsSync(summary)).toBe(true);
    const targets = [...files.map((f) => path.join(BOOK, "src/content", f)), summary];
    // Report counts only, so a failing run never prints the copyrighted guide text.
    const hits = targets
      .map((p) => ({ file: path.relative(BOOK, p), runs: sharedRuns(fs.readFileSync(p, "utf-8"), guide).length }))
      .filter((h) => h.runs > 0);
    expect(hits).toEqual([]);
  });

  // The notes and the plan are public too; short attributed quotes are fine there, longer copied passages are not.
  test.skipIf(!GUIDE_EXISTS)("the research notes and the plan share no 16-word run with the strategy guide", () => {
    const guide = fs.readFileSync(GUIDE, "utf-8");
    const hits = [NOTES, PLAN]
      .map((p) => ({ file: path.relative(ROOT, p), runs: sharedRuns(fs.readFileSync(p, "utf-8"), guide, 16).length }))
      .filter((h) => h.runs > 0);
    expect(hits).toEqual([]);
  });
});
