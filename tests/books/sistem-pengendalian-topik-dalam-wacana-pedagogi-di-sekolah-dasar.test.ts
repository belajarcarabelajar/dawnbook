import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { checkBookStructure } from "../../scripts/check-book-structure";

const SLUG = "sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar";
const BOOK = path.resolve(import.meta.dir, "../../books", SLUG);
const CONTENT = path.join(BOOK, "src/content");
const chapters = readdirSync(CONTENT).filter((f) => f.endsWith(".md")).sort();
const read = (file: string) => readFileSync(path.join(CONTENT, file), "utf8");

// The book retells Marliana (2017), whose title it shares; it must never pass
// that study off as its own research.
const OWNERSHIP = /penelitian ini|studi ini|temuan utama/i;

describe(`book ${SLUG}`, () => {
  test("has no structural problems", () => {
    expect(checkBookStructure(BOOK).problems).toEqual([]);
  });

  test("the first chapter and the methodology chapter credit Marliana", () => {
    const first = chapters[0];
    const method = chapters.find((f) => f.startsWith("03_"));
    expect(method).toBeDefined();
    expect(read(first)).toContain("Marliana");
    expect(read(method as string)).toContain("Marliana");
  });

  test("no sentence claims the research as the book's own", () => {
    const offenders: string[] = [];
    for (const file of chapters) {
      read(file)
        .split("\n")
        .forEach((line, i) => {
          for (const sentence of line.split(/(?<=[.!?])\s+/)) {
            if (OWNERSHIP.test(sentence) && !sentence.includes("Marliana")) {
              offenders.push(`${file}:${i + 1}: ${sentence.trim()}`);
            }
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  // One distinctive line per transcript, table or figure taken from the
  // article; each was checked against the AKSIS PDF (Contoh number noted).
  const FROM_ARTICLE: [string, string][] = [
    ["04_", "Dalam sektor manakah persentase pekerja"], // Aman (2005) via Marliana
    ["05_", "Persentase Teks 1"], // 28%, 31%, 11%, 51%
    ["05_", "Apanya yang diangkat?"], // Contoh 4.7, Teks 11
    ["06_", "Pak, boleh liat?"], // Contoh 4.8, Teks 9
    ["06_", "Ibu, ibu, judulnya boleh sama bu?"], // Contoh 4.9, Teks 7
    ["06_", "sebesar 13%"], // "ya" 13%
    ["08_", "Baik, baik sekarang Bapak akan buat satu kalimat"], // Contoh 4.14, Teks 12
    ["08_", "Eh... Ibu akan memberikan lembaran"], // Contoh 4.15, Teks 5
    ["08_", "Anak-anakku sekalian, hari ini kita belajar"], // Contoh 4.16, Teks 11
    ["08_", "Kalo gitu kita nyanyi yuk!"], // Contoh 4.17, Teks 3
    ["09_", "Coba, di mana ubi kayu ini ditanam?"], // Contoh 4.18, Teks 7
  ];

  test("every passage taken from the article credits Marliana within 15 lines", () => {
    const missing: string[] = [];
    for (const [prefix, anchor] of FROM_ARTICLE) {
      const file = chapters.find((f) => f.startsWith(prefix));
      if (!file) {
        missing.push(`${prefix}: chapter not found`);
        continue;
      }
      const lines = read(file).split("\n");
      const at = lines.findIndex((l) => l.includes(anchor));
      if (at < 0) {
        missing.push(`${file}: anchor not found: ${anchor}`);
        continue;
      }
      if (!lines.slice(at, at + 16).some((l) => l.includes("Marliana"))) {
        missing.push(`${file}:${at + 1}: no Marliana credit after "${anchor}"`);
      }
    }
    expect(missing).toEqual([]);
  });

  const lineWith = (prefix: string, needle: string) => {
    const file = chapters.find((f) => f.startsWith(prefix)) as string;
    return read(file).split("\n").find((l) => l.includes(needle)) ?? "";
  };

  // PDF Contoh 4.14: the teacher gives the sentence, a pupil asks the question.
  test("chapter 08 keeps the speakers of Contoh 4.14", () => {
    expect(lineWith("08_", '"Ini-buku-bahasa-Indonesia."')).toContain("Guru");
    expect(lineWith("08_", '"Apa buku itu?"')).toContain("Siswa");
    expect(lineWith("08_", '"Apa-buku-i__"')).toContain("Guru");
  });

  test("the 70-80% teacher-talk figure carries a citation on its line", () => {
    const line = lineWith("02_", "70-80%");
    if (line) expect(line).toMatch(/[A-Z][a-z]+, (19|20)\d{2}/);
  });

  // The PDF only says which texts and greetings appear (Teks 5 and 7 Bu,
  // Teks 9 Pak); purpose and teacher-response cells had no source.
  test("chapter 06 drops the unsourced greeting-table columns", () => {
    const text = read(chapters.find((f) => f.startsWith("06_")) as string);
    expect(text).not.toContain("Tujuan Pengendalian Topik");
    expect(text).not.toContain("Respons Utama Guru");
  });

  test("chapter 06 gives eh and kalau begitu the functions the PDF names", () => {
    expect(lineWith("06_", "| **Eh** |")).toContain("berpikir");
    expect(lineWith("06_", "| **Kalau begitu** |")).toContain("kegiatan baru");
  });
});
