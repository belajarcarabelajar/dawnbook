import { afterEach, describe, expect, test } from "bun:test";
import { setPremiumRegistryForTest } from "../../functions/lib/premium";
import { buildLlmsTxt } from "../../scripts/generate-llmstxt";

const BASE = "https://dawnbook.belajarcarabelajar.com";

afterEach(() => {
  setPremiumRegistryForTest(null);
});

describe("buildLlmsTxt (scripts/generate-llmstxt.ts)", () => {
  const manifest = {
    books: ["sistem-modul-rust"],
    chapters: {
      "sistem-modul-rust": [
        "/books/sistem-modul-rust/content/01_pengantar-modul.html",
        "/books/sistem-modul-rust/content/02_penjelasan-modul.html",
        "/books/sistem-modul-rust/content/03_visibilitas-item.html",
      ],
    },
  };

  test("formats the header and the book root heading with title casing", () => {
    setPremiumRegistryForTest({});
    const result = buildLlmsTxt(manifest);

    expect(result).toContain("# Dawnbook - Platform Buku Edukasi Open Source");
    expect(result).toContain(`### [Sistem Modul Rust](${BASE}/books/sistem-modul-rust/)`);
  });

  test("leaves chapter 1 of a free book out, because its canonical is the book root", () => {
    setPremiumRegistryForTest({});
    const result = buildLlmsTxt(manifest);

    expect(result).not.toContain("01_pengantar-modul");
    expect(result).not.toContain("Pengantar Modul");
  });

  test("lists chapters 2 onward of a free book without .html", () => {
    setPremiumRegistryForTest({});
    const result = buildLlmsTxt(manifest);

    expect(result).toContain(`- [Penjelasan Modul](${BASE}/books/sistem-modul-rust/content/02_penjelasan-modul)\n`);
    expect(result).toContain(`- [Visibilitas Item](${BASE}/books/sistem-modul-rust/content/03_visibilitas-item)\n`);
    expect(result).not.toContain(".html");
  });
});
