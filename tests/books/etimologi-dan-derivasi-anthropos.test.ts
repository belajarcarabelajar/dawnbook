import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { checkBookStructure, extractLinkTargets, extractUrls } from "../../scripts/check-book-structure";
import { escapeHtml, extractLeadText, formatSerpDescription } from "../../scripts/inject-gating";
import { contentFiles, sourceTableSection, sourceTableUrls } from "../helpers/book-test";

const ROOT = path.resolve(import.meta.dir, "../..");
const SLUG = "etimologi-dan-derivasi-anthropos";
const BOOK = path.join(ROOT, "books", SLUG);
const NOTES = path.join(ROOT, "docs/code-plan/plans/research-dawnbook-etimologi-anthropos.md");
const PLAN = path.join(ROOT, "docs/code-plan/plans/2026-11-15-dawnbook-etimologi-anthropos.md");

const DATA_ROW = /^\| S[0-9]+ \|/;
const CHAPTERS = 14;
const REFERENSI = "14_referensi.md";
const SOURCE_ROWS = 130;

// GEMINI.md section 8 asks for 110 to 160; the site cuts chapter metas at 155.
const META_MIN = 110;
const META_MAX = 155;

// Built at run time so this file stays ASCII; the Write tool would decode an escape into the real character.
const EM_DASH = String.fromCharCode(0x2014);

// Scaffolds and wrong or unsourced claims from the owner's notes (plan, section 8 of the research notes).
const BANNED_PHRASES = [
  "Wawasan Penting",
  "Analogi untuk Mengingat",
  "Real-World Application",
  "Aplikasi Dunia Nyata",
  "Latihan Refleksi",
  "Insight Memorable",
  "Pesan Penting",
  "Pikirkan Tentang Ini",
  "Eksplorasi Mandiri",
  "Anathro",
  "menyerap kekuatan musuh",
  "dua kategori utama",
  "Anerlogi",
  "Wajah yang Menatap ke Atas",
  "dunia yang asing menjadi akrab",
  "rumus 3T",
  "Filantropi Demokratis",
  "oksitosin",
  "evolusi tertinggi",
  "manusia yang jujur",
  "istana Prancis",
  "Sherlock",
  "psikologis universal",
  "Antroposentrisme Terencana",
  "Chauvinisme",
  "98,8",
  "98.8",
  "ritual duka",
  "anggota puncak",
  "ortognatik",
  "415 ppm",
  "3 juta tahun",
  "100 hingga 1.000",
  "Laju Kepunahan",
  "1,645",
  "jangka sorong",
  "sidik jari linguistik",
  "Tuhan Maha Pengasih",
  "Sudarmono",
  "Eriksson",
  "Pot Marks",
  "Anvil Marks",
  "Prion Scrapie",
  "Tahap Deskriptif",
  "ratusan istilah",
];

// GEMINI.md section 24 caps generic scaffold labels at 2 headings per book.
const SCAFFOLD_LABELS = ["Analogi", "Studi Kasus", "Skenario", "Kasus", "Kesimpulan", "Aplikasi", "Real-World", "Contoh"];
const SCAFFOLD_LABEL_CAP = 2;

// The build reads the lead from the mdBook HTML with extractLeadText and cuts it like injectSeoAndGating
// (155, then 145 if the escaped meta passes 160). Bun.markdown stands in for mdBook's CommonMark renderer.
function chapterMeta(md: string): string {
  const lead = extractLeadText(`<main>${Bun.markdown.html(md)}</main>`);
  const meta = formatSerpDescription(lead, 155);
  return escapeHtml(meta).length > 160 ? formatSerpDescription(lead, 145) : meta;
}

function metaOutOfRange(meta: string): boolean {
  return meta.length < META_MIN || meta.length > META_MAX;
}

// The owner's notes are private study material, so they stay outside the repository and the scan reads them at run time.
const SOURCE = process.env.DAWNBOOK_ETA_SOURCE ?? "";
const SOURCE_EXISTS = SOURCE !== "" && fs.existsSync(SOURCE);
if (!SOURCE_EXISTS) console.warn("source overlap scan skipped: set DAWNBOOK_ETA_SOURCE to the owner's notes file");

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

function sharedRuns(text: string, source: string, n = 16): string[] {
  const sourceRuns = new Set(nGrams(words(source), n));
  return [...new Set(nGrams(words(text), n).filter((r) => sourceRuns.has(r)))];
}

// Opening fence lines whose info string is not "mermaid"; closing fences are skipped by tracking state.
function nonMermaidFences(md: string): string[] {
  const bad: string[] = [];
  let open: string | null = null;
  for (const line of md.split(/\r?\n/)) {
    const m = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
    if (!m) continue;
    if (open === null) {
      open = m[1];
      if (m[2].trim() !== "mermaid") bad.push(line.trim());
    } else if (m[1].startsWith(open[0]) && m[1].length >= open.length && m[2].trim() === "") {
      open = null;
    }
  }
  return bad;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Heading lines ("##" and deeper) outside code fences whose text, after an optional "N." prefix, starts with a label.
function scaffoldLabelHeadings(md: string, labels: string[]): string[] {
  const label = new RegExp(`^(?:${labels.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}])`, "iu");
  const hits: string[] = [];
  let inFence = false;
  for (const line of md.split(/\r?\n/)) {
    if (/^\s*(`{3,}|~{3,})/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^##+\s+(.*)$/.exec(line);
    if (!m) continue;
    const text = m[1].replace(/^\d+\.\s*/, "");
    if (label.test(text)) hits.push(line.trim());
  }
  return hits;
}

function readChapter(f: string): string {
  return fs.readFileSync(path.join(BOOK, "src/content", f), "utf-8");
}

const REGEX_SPECIAL = /[.*+?^${}()|[\]\\]/g;

// A phrase that starts with a digit must not match inside a longer number ("3 juta tahun" vs "23 juta tahun").
function phraseRe(phrase: string): RegExp {
  const body = phrase.toLowerCase().replace(REGEX_SPECIAL, "\\$&");
  return new RegExp(/^\p{N}/u.test(phrase) ? `(?<![\\p{N}.,])${body}` : body, "u");
}

function chaptersContaining(phrases: string[]): { f: string; phrase: string }[] {
  return contentFiles(BOOK).flatMap((f) => {
    const md = readChapter(f).toLowerCase();
    return phrases.filter((p) => phraseRe(p).test(md)).map((phrase) => ({ f, phrase }));
  });
}

function emDashOrAnda(md: string): string[] {
  const issues: string[] = [];
  if (/\bAnda\b/.test(md)) issues.push("Anda");
  if (md.includes(EM_DASH)) issues.push("em dash");
  return issues;
}

describe(`book ${SLUG}`, () => {
  test("has 14 chapters with Referensi last and no structural problems", () => {
    const result = checkBookStructure(BOOK);
    expect(result.problems).toEqual([]);
    expect(result.chapters).toBe(CHAPTERS);
    expect(contentFiles(BOOK).at(-1)).toBe(REFERENSI);
  });

  test("every chapter stays inside the house byte budget", () => {
    const files = contentFiles(BOOK);
    expect(files.length).toBe(CHAPTERS);
    for (const f of files) {
      const size = Buffer.byteLength(readChapter(f), "utf-8");
      const isRef = f === REFERENSI;
      const max = isRef ? 16000 : 9000;
      const min = isRef ? 3000 : 5500;
      expect({ f, size, ok: size >= min && size <= max }).toEqual({ f, size, ok: true });
    }
  });

  test("every chapter meta description, computed as the build does, is 110 to 155 characters", () => {
    const files = contentFiles(BOOK);
    expect(files.length).toBe(CHAPTERS);
    const bad = files
      .map((f) => ({ f, meta: chapterMeta(readChapter(f)) }))
      .filter((m) => metaOutOfRange(m.meta))
      .map((m) => ({ f: m.f, length: m.meta.length }));
    expect(bad).toEqual([]);
  });

  test(`the research notes source table has ${SOURCE_ROWS} data rows`, () => {
    const notes = fs.readFileSync(NOTES, "utf-8");
    expect(sourceTableSection(notes).filter((l) => DATA_ROW.test(l)).length).toBe(SOURCE_ROWS);
  });

  test("every URL and link target in the book comes from the source table", () => {
    const allowed = new Set(sourceTableUrls(fs.readFileSync(NOTES, "utf-8"), DATA_ROW));
    const files = contentFiles(BOOK);
    expect(files.length).toBe(CHAPTERS);
    const used = files.flatMap((f) => {
      const md = readChapter(f);
      return [...extractUrls(md), ...extractLinkTargets(md).filter((t) => /^https?:\/\//i.test(t))];
    });
    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((u) => !allowed.has(u))).toEqual([]);
  });

  test("banned scaffolds and corrected claims from the notes appear in no chapter", () => {
    expect(contentFiles(BOOK).length).toBe(CHAPTERS);
    expect(chaptersContaining(BANNED_PHRASES)).toEqual([]);
  });

  test("a numeric banned phrase does not match inside a longer number", () => {
    expect(phraseRe("3 juta tahun").test("sekitar 3 juta tahun lalu")).toBe(true);
    expect(phraseRe("3 juta tahun").test("sekitar 23 juta tahun lalu")).toBe(false);
    expect(phraseRe("98,8").test("198,8 persen")).toBe(false);
    expect(phraseRe("Anathro").test("anathrei")).toBe(false);
  });

  test("no chapter has a fenced code block other than mermaid", () => {
    const files = contentFiles(BOOK);
    expect(files.length).toBe(CHAPTERS);
    const bad = files.flatMap((f) => nonMermaidFences(readChapter(f)).map((fence) => ({ f, fence })));
    expect(bad).toEqual([]);
  });

  test("no chapter has a dollar sign, so no LaTeX reaches MathJax", () => {
    const files = contentFiles(BOOK);
    expect(files.length).toBe(CHAPTERS);
    expect(files.filter((f) => readChapter(f).includes("$"))).toEqual([]);
  });

  test(`at most ${SCAFFOLD_LABEL_CAP} headings in the book start with a generic scaffold label`, () => {
    const files = contentFiles(BOOK);
    expect(files.length).toBe(CHAPTERS);
    const hits = files.flatMap((f) => scaffoldLabelHeadings(readChapter(f), SCAFFOLD_LABELS).map((h) => ({ f, h })));
    expect({ count: hits.length, hits, ok: hits.length <= SCAFFOLD_LABEL_CAP }).toEqual({
      count: hits.length,
      hits,
      ok: true,
    });
  });

  test("no chapter and no SUMMARY.md uses an em dash or Anda", () => {
    const files = contentFiles(BOOK);
    expect(files.length).toBe(CHAPTERS);
    const summary = path.join(BOOK, "src/SUMMARY.md");
    expect(fs.existsSync(summary)).toBe(true);
    const bad = [
      ...files.flatMap((f) => emDashOrAnda(readChapter(f)).map((issue) => ({ f, issue }))),
      ...emDashOrAnda(fs.readFileSync(summary, "utf-8")).map((issue) => ({ f: "SUMMARY.md", issue })),
    ];
    expect(bad).toEqual([]);
  });

  test.skipIf(!SOURCE_EXISTS)("no chapter shares a 16-word run with the owner's notes", () => {
    const notes = fs.readFileSync(SOURCE, "utf-8");
    const files = contentFiles(BOOK);
    expect(files.length).toBe(CHAPTERS);
    // Report counts only, so a failing run never prints the private notes.
    const hits = files.map((f) => ({ f, runs: sharedRuns(readChapter(f), notes).length })).filter((h) => h.runs > 0);
    expect(hits).toEqual([]);
  });

  test.skipIf(!SOURCE_EXISTS)("the public research notes and plan share no 16-word run with the owner's notes", () => {
    const notes = fs.readFileSync(SOURCE, "utf-8");
    // Report counts only, so a failing run never prints the private notes.
    const hits = [NOTES, PLAN]
      .map((p) => ({ f: path.basename(p), runs: sharedRuns(fs.readFileSync(p, "utf-8"), notes).length }))
      .filter((h) => h.runs > 0);
    expect(hits).toEqual([]);
  });
});

describe(`${SLUG} detectors`, () => {
  const source =
    "Kata anthropos dalam bahasa Yunani kuno menjadi akar bagi banyak istilah ilmiah yang kita pakai setiap hari di sekolah dan kampus.";

  test("meta length check flags a short opener cut before a long second sentence", () => {
    const longSecond =
      "Kamu duduk di beranda sambil memperhatikan genangan air yang memantulkan langit kelabu, lalu bertanya mengapa begitu banyak puisi memilih hujan sebagai lambang.";
    const shortOpener = "Hujan sore itu turun pelan di atas atap seng rumah nenek di ujung kampung kami.";
    const short = chapterMeta(`## Hujan\n\n${shortOpener} ${longSecond}\n\nParagraf berikutnya.\n`);
    expect(short).toBe(shortOpener);
    expect(short.length).toBe(79);
    expect(metaOutOfRange(short)).toBe(true);
  });

  test("meta length check passes a 123-character opener", () => {
    const longSecond =
      "Kamu duduk di beranda sambil memperhatikan genangan air yang memantulkan langit kelabu, lalu bertanya mengapa begitu banyak puisi memilih hujan sebagai lambang.";
    const okOpener =
      "Sebuah pohon beringin besar berdiri di tengah alun-alun desa, dan setiap generasi menitipkan cerita yang berbeda kepadanya.";
    const ok = chapterMeta(`## Beringin\n\n${okOpener} ${longSecond}\n`);
    expect(ok).toBe(okOpener);
    expect(ok.length).toBe(123);
    expect(metaOutOfRange(ok)).toBe(false);
  });

  test("shared-run detector flags a 16-word run copied from the notes despite case and punctuation", () => {
    // Words 2 to 17 of the source, then a different word on each side.
    const text =
      "Ringkasnya, ANTHROPOS dalam bahasa-Yunani kuno menjadi akar; bagi banyak istilah ilmiah yang kita pakai setiap hari, kata guru.";
    expect(sharedRuns(text, source)).toEqual([
      "anthropos dalam bahasa yunani kuno menjadi akar bagi banyak istilah ilmiah yang kita pakai setiap hari",
    ]);
  });

  test("shared-run detector ignores a run of exactly 15 shared words", () => {
    const text =
      "Ringkasnya, anthropos dalam bahasa Yunani kuno menjadi akar bagi banyak istilah ilmiah yang kita pakai setiap, kata guru.";
    expect(sharedRuns(text, source)).toEqual([]);
    expect(sharedRuns(text, source, 15)).toEqual([
      "anthropos dalam bahasa yunani kuno menjadi akar bagi banyak istilah ilmiah yang kita pakai setiap",
    ]);
  });

  test("fence check flags a non-mermaid fence and passes a mermaid block", () => {
    const md = ["Teks.", "", "```mermaid", "flowchart TD", "  A --> B", "```", "", "```python", "x = 1", "```", ""].join("\n");
    expect(nonMermaidFences(md)).toEqual(["```python"]);
    expect(nonMermaidFences(["```mermaid", "pie", "```"].join("\n"))).toEqual([]);
  });

  test("scaffold label check counts numbered and plain label headings and skips longer words and fenced lines", () => {
    const md = [
      "## 3. Analogi Pohon Keluarga",
      "### Studi Kasus di Laboratorium",
      "## Kasusnya Belum Selesai",
      "## Contoh",
      "```mermaid",
      "## Kesimpulan di dalam fence",
      "```",
      "## Akar Kata Yunani",
      "",
    ].join("\n");
    expect(scaffoldLabelHeadings(md, SCAFFOLD_LABELS)).toEqual([
      "## 3. Analogi Pohon Keluarga",
      "### Studi Kasus di Laboratorium",
      "## Contoh",
    ]);
  });
});
