import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { checkBookStructure } from "../../scripts/check-book-structure";

const BOOK = path.resolve(import.meta.dir, "../../books/literasi-keuangan");
const chapter = (file: string) => readFileSync(path.join(BOOK, "src/content", file), "utf8");

// Follow-up U2a of plan 2026-10-24-dawnbook-attribution-fixes: quotes and facts.
describe("book literasi-keuangan attribution and fact fixes", () => {
  test("structure has no problems", () => {
    expect(checkBookStructure(BOOK).problems).toEqual([]);
  });

  test("03: the budget line is not attributed to John C. Maxwell", () => {
    expect(chapter("03_anggaran-dan-perencanaan-keuangan.md")).not.toContain("Maxwell");
  });

  test("05: the double-edged knife line is not an unsourced quotation", () => {
    expect(chapter("05_manajemen-utang-yang-sehat.md")).not.toMatch(/"Utang adalah pisau bermata dua/);
  });

  test("05: SLIK is not called a blacklist", () => {
    const text = chapter("05_manajemen-utang-yang-sehat.md");
    expect(text).not.toContain("masuk daftar hitam");
    expect(text).toContain("SLIK bukan daftar hitam");
  });

  test("08: inflation is not the unsourced 3-5% average", () => {
    expect(chapter("08_perencanaan-pensiun.md")).not.toContain("rata-rata sekitar 3-5%");
  });

  test("10: the Anti-Scam Centre figure is not the old 180 thousand", () => {
    expect(chapter("10_mengenali-dan-menghindari-penipuan-keuangan.md")).not.toContain("180 ribu");
  });

  test("10: CekRekening.id is not credited to Kominfo", () => {
    expect(chapter("10_mengenali-dan-menghindari-penipuan-keuangan.md")).not.toContain("Kominfo");
  });

  test("11: SPT filing describes Coretax, not DJP Online e-Filing form choice", () => {
    const text = chapter("11_perencanaan-pajak-dasar.md");
    expect(text).toContain("Coretax");
    expect(text).not.toContain("e-Filing");
    expect(text).not.toContain("1770SS");
  });

  test("01: the 66,46% literacy index names SNLIK 2025", () => {
    const text = chapter("01_pengantar-literasi-keuangan.md");
    expect(text).toMatch(/SNLIK[^\n]*2025[^\n]*66,46%|66,46%[^\n]*SNLIK/);
  });
});

// Review round (2026-10-24): the loss total must carry its own period and source, and the unsourced
// claim about dominant scam modes is gone (OJK SP 09/GKPB/OJK/I/2026: Rp9 triliun to 28 Dec 2025).
describe("literasi-keuangan scam figures", () => {
  const ch10 = () => {
    const dir = path.join(BOOK, "src/content");
    const file = readdirSync(dir).find((f) => f.startsWith("10_"))!;
    return readFileSync(path.join(dir, file), "utf-8");
  };
  test("the IASC loss total names its amount and period", () => {
    expect(ch10()).toContain("Rp9 triliun");
    expect(ch10()).toContain("28 Desember 2025");
  });
  test("no unsourced claim about which scam modes dominate", () => {
    expect(ch10()).not.toContain("masih mendominasi");
  });
});
