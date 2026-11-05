import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkBookStructure, extractLinkTargets, extractUrls } from "../../scripts/check-book-structure";
import { escapeHtml, extractLeadText, formatSerpDescription } from "../../scripts/inject-gating";
import { contentFiles, sourceTableSection, sourceTableUrls } from "../helpers/book-test";

const ROOT = path.resolve(import.meta.dir, "../..");
const SLUG = "simbolisme-alam-dalam-sastra";
const BOOK = path.join(ROOT, "books", SLUG);
const NOTES = path.join(ROOT, "docs/code-plan/plans/research-dawnbook-simbolisme-alam.md");

const DATA_ROW = /^\| S[0-9]+ \|/;
const CHAPTERS = 14;
const REFERENSI = "14_referensi.md";

// GEMINI.md section 8 asks for 110 to 160; the site cuts chapter metas at 155.
const META_MIN = 110;
const META_MAX = 155;

// Built at run time so this file stays ASCII; the Write tool would decode an escape into the real character.
const EM_DASH = String.fromCharCode(0x2014);

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
const SOURCE =
  process.env.DAWNBOOK_SA_SOURCE ?? path.join(os.homedir(), "Dokumen/Learn Earth/Simbolisme Alam dalam Sastra.md");
const SOURCE_EXISTS = fs.existsSync(SOURCE);
if (!SOURCE_EXISTS) console.warn(`source overlap scan skipped: owner's notes not found at ${SOURCE}`);

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

function readChapter(f: string): string {
  return fs.readFileSync(path.join(BOOK, "src/content", f), "utf-8");
}

function chaptersContaining(phrases: string[]): { f: string; phrase: string }[] {
  return contentFiles(BOOK).flatMap((f) => {
    const md = readChapter(f).toLowerCase();
    return phrases.filter((p) => md.includes(p.toLowerCase())).map((phrase) => ({ f, phrase }));
  });
}

describe(`book ${SLUG}`, () => {
  test("has 13 content chapters plus Referensi last with no structural problems", () => {
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
      const max = isRef ? 10500 : 9000;
      const min = isRef ? 3000 : 5500;
      expect({ f, size, ok: size >= min && size <= max }).toEqual({ f, size, ok: true });
    }
  });

  test("meta length check flags a short opener cut before a long second sentence and passes a 123-character one", () => {
    const longSecond =
      "Kamu duduk di beranda sambil memperhatikan genangan air yang memantulkan langit kelabu, lalu bertanya mengapa begitu banyak puisi memilih hujan sebagai lambang.";
    const shortOpener = "Hujan sore itu turun pelan di atas atap seng rumah nenek di ujung kampung kami.";
    const short = chapterMeta(`## Hujan\n\n${shortOpener} ${longSecond}\n\nParagraf berikutnya.\n`);
    expect(short).toBe(shortOpener);
    expect(short.length).toBe(79);
    expect(metaOutOfRange(short)).toBe(true);

    const okOpener =
      "Sebuah pohon beringin besar berdiri di tengah alun-alun desa, dan setiap generasi menitipkan cerita yang berbeda kepadanya.";
    const ok = chapterMeta(`## Beringin\n\n${okOpener} ${longSecond}\n`);
    expect(ok).toBe(okOpener);
    expect(ok.length).toBe(123);
    expect(metaOutOfRange(ok)).toBe(false);
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

  test("the research notes source table has 65 data rows", () => {
    const notes = fs.readFileSync(NOTES, "utf-8");
    expect(sourceTableSection(notes).filter((l) => DATA_ROW.test(l)).length).toBe(65);
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

  test("banned scaffolds from the notes appear in no chapter", () => {
    expect(contentFiles(BOOK).length).toBe(CHAPTERS);
    const banned = [
      "Think about this",
      "Real-World Application",
      "Latihan Refleksi",
      "Pesan Penting",
      "Wawasan Memorable",
      "Ektropi",
    ];
    expect(chaptersContaining(banned)).toEqual([]);
  });

  test("facts corrected from the notes never reappear in any chapter", () => {
    expect(contentFiles(BOOK).length).toBe(CHAPTERS);
    expect(chaptersContaining(["Mazmur 24", "Celestial Mountains", "28 hari", "pohon pule"])).toEqual([]);
  });

  test("no chapter uses Anda, an em dash, a non-mermaid code fence, or a dollar sign", () => {
    const files = contentFiles(BOOK);
    expect(files.length).toBe(CHAPTERS);
    const bad = files.flatMap((f) => {
      const md = readChapter(f);
      const issues: string[] = [];
      if (/\bAnda\b/.test(md)) issues.push("Anda");
      if (md.includes(EM_DASH)) issues.push("em dash");
      for (const fence of nonMermaidFences(md)) issues.push(`fence ${fence}`);
      if (md.includes("$")) issues.push("dollar sign");
      return issues.map((issue) => ({ f, issue }));
    });
    expect(bad).toEqual([]);
  });
});

describe(`${SLUG} detectors`, () => {
  const source =
    "Dalam catatan itu bulan purnama menjadi lambang kerinduan yang tidak pernah selesai bagi tokoh yang menunggu kabar dari laut jauh setiap malam.";

  test("shared-run detector flags a 16-word run copied from the notes despite case and punctuation", () => {
    // Words 3 to 18 of the source, then a different word on each side.
    const text =
      "Ringkasnya, ITU bulan-purnama menjadi lambang; kerinduan yang tidak pernah selesai bagi tokoh yang menunggu kabar dari, kata guru.";
    expect(sharedRuns(text, source)).toEqual([
      "itu bulan purnama menjadi lambang kerinduan yang tidak pernah selesai bagi tokoh yang menunggu kabar dari",
    ]);
  });

  test("shared-run detector ignores a run of exactly 15 shared words", () => {
    const text =
      "Ringkasnya, itu bulan purnama menjadi lambang kerinduan yang tidak pernah selesai bagi tokoh yang menunggu kabar, kata guru.";
    expect(sharedRuns(text, source)).toEqual([]);
    expect(sharedRuns(text, source, 15)).toEqual([
      "itu bulan purnama menjadi lambang kerinduan yang tidak pernah selesai bagi tokoh yang menunggu kabar",
    ]);
  });

  test("fence check flags a non-mermaid fence and passes a mermaid block", () => {
    const md = ["Teks.", "", "```mermaid", "flowchart TD", "  A --> B", "```", "", "```python", "x = 1", "```", ""].join("\n");
    expect(nonMermaidFences(md)).toEqual(["```python"]);
    expect(nonMermaidFences(["```mermaid", "pie", "```"].join("\n"))).toEqual([]);
  });

  test.skipIf(!SOURCE_EXISTS)("no chapter shares a 16-word run with the owner's notes", () => {
    const notes = fs.readFileSync(SOURCE, "utf-8");
    const files = contentFiles(BOOK);
    expect(files.length).toBe(CHAPTERS);
    // Report counts only, so a failing run never prints the private notes.
    const hits = files.map((f) => ({ f, runs: sharedRuns(readChapter(f), notes).length })).filter((h) => h.runs > 0);
    expect(hits).toEqual([]);
  });
});
