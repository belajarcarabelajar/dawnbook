import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

// GEMINI.md section 14, "Unique icon" (owner rule, 2026-11-15): a book's icon.txt emoji is
// used by no other book and is never a stock pick. Books that existed before the rule are
// grandfathered; any book not listed here must pass both checks. The three premium slugs
// (data/premium-books.json) predate the rule too; their text is synced in only on checkouts
// that hold the private sources, so a worktree without them still passes.
const BOOKS = path.join(import.meta.dir, "..", "..", "books");

const GRANDFATHERED = new Set([
  "100-study-hacks",
  "belajar-cara-belajar",
  "lancar-nugas",
  "aerodinamika-dan-desain-airfoil",
  "analisis-ekspresif-9-summers-10-autumns",
  "analisis-wacana-kritis-awk-dalam-kriminologi",
  "arsitektur-kernel-linux",
  "bias-kognitif",
  "digital-minimalisme",
  "ekonomi-laissez-faire",
  "eksistensialisme-dan-kehendak-bebas",
  "eksistensialisme-dan-makna-hidup",
  "elastisitas-harga-permintaan-dan-penawaran",
  "filosofi-stoikisme",
  "fungsi-manajemen-poac",
  "gegar-budaya",
  "geopolitik-dalam-sejarah-piala-dunia",
  "human-capital-theory",
  "iklan-digital-dan-penargetan-algoritma",
  "kecerdasan-interpersonal",
  "kenapa-kebiasaan-susah-diubah",
  "kenapa-kita-gampang-percaya-hoax",
  "kenapa-kita-suka-menunda-nunda",
  "literasi-keuangan",
  "logika-dan-penalaran-kritis",
  "matriks-keputusan-decision-matrix",
  "mekanisme-koping-dan-manajemen-stres",
  "memahami-algoritma-x-untuk-pembaca",
  "menemukan-tujuan-hidup-ikigai",
  "metakognisi",
  "metodologi-microteaching",
  "multiple-intelligences",
  "neurobiologi-motivasi-dopamin",
  "neurobiologi-sistem-vestibular",
  "neuroplastisitas-dalam-belajar",
  "nudge-theory",
  "pejorasi-dan-ameliorasi",
  "pelajaran-hidup-dari-harvest-moon-back-to-nature",
  "peluruhan-beta",
  "pembelajaran-multidisiplin",
  "pengaruh-uang-terhadap-kebahagiaan",
  "piaget",
  "psikologi-bencana-dan-manajemen-panik",
  "psikologi-di-balik-keputusan-finansial-kita",
  "psikologi-positif",
  "quarter-life-crisis",
  "relief-karmawibhangga-dan-hukum-sebab-akibat",
  "resiliensi-dan-ketangguhan",
  "saat-dia-suka-tapi-kamu-tidak",
  "sejarah-evolusi-drama-korea",
  "siklus-hidrologi-mikrofisika-awan",
  "simbolisme-alam-dalam-sastra",
  "sistem-modul-rust",
  "sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar",
  "sistem-peringatan-dini-early-warning-system",
  "soft-power-jepang-lewat-manga-dan-anime",
  "state-of-flow",
  "strategi-manajemen-kelas-proaktif",
  "struktur-pasar-dan-persaingan",
  "teori-gaya-kelekatan",
  "teori-permainan-game-theory",
  "teori-teori-kepribadian",
  "tonsilektomi",
  "virtue-ethics-aristoteles",
]);

// Stock picks: books and notebooks, memo, brain, target, charts, light bulb, graduation cap,
// scales, compass, sparkles, fire, rocket.
const STOCK = new Set(
  [
    0x1f4da, 0x1f4d6, 0x1f4d8, 0x1f4d9, 0x1f4d5, 0x1f4d7, 0x1f4d3, 0x1f4d4, 0x1f4d2, 0x1f4dd, 0x1f9e0, 0x1f3af,
    0x1f4ca, 0x1f4c8, 0x1f4a1, 0x1f393, 0x2696, 0x1f9ed, 0x2728, 0x1f525, 0x1f680,
  ].map((cp) => String.fromCodePoint(cp)),
);

// Strip variation selectors so "U+2696 U+FE0F" and "U+2696" count as the same icon.
export function normalizeIcon(raw: string): string {
  return raw.trim().replace(/\uFE0F/g, "");
}

function icons(): Map<string, string> {
  const out = new Map<string, string>();
  for (const slug of fs.readdirSync(BOOKS)) {
    if (slug.startsWith("_")) continue;
    const file = path.join(BOOKS, slug, "icon.txt");
    if (fs.existsSync(file)) out.set(slug, normalizeIcon(fs.readFileSync(file, "utf8")));
  }
  return out;
}

export function iconProblems(all: Map<string, string>, grandfathered: Set<string>): string[] {
  const owners = new Map<string, string[]>();
  for (const [slug, icon] of all) owners.set(icon, [...(owners.get(icon) ?? []), slug]);
  const problems: string[] = [];
  for (const [slug, icon] of all) {
    if (grandfathered.has(slug)) continue;
    if (STOCK.has(icon)) problems.push(`${slug}: stock icon`);
    const others = (owners.get(icon) ?? []).filter((s) => s !== slug);
    if (others.length > 0) problems.push(`${slug}: icon shared with ${others.join(", ")}`);
  }
  return problems;
}

describe("book icons", () => {
  test("every book added after 2026-11-15 has a unique, non-stock icon", () => {
    const all = icons();
    expect([...all.keys()].some((slug) => !GRANDFATHERED.has(slug))).toBe(true);
    expect(iconProblems(all, GRANDFATHERED)).toEqual([]);
  });

  test("the check flags a stock icon and a shared icon on a new book", () => {
    const stock = String.fromCodePoint(0x1f4da);
    const amphora = String.fromCodePoint(0x1f3fa);
    const all = new Map([
      ["old", amphora],
      ["new-stock", stock],
      ["new-shared", amphora],
    ]);
    expect(iconProblems(all, new Set(["old"]))).toEqual([
      "new-stock: stock icon",
      "new-shared: icon shared with old",
    ]);
    expect(normalizeIcon(String.fromCodePoint(0x2696, 0xfe0f))).toBe(String.fromCodePoint(0x2696));
  });
});
