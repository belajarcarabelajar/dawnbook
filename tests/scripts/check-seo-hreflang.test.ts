import { describe, expect, test } from "bun:test";
import { hreflangError } from "../../scripts/check-seo";

const U = "https://dawnbook.belajarcarabelajar.com/books/buku/content/02_b";
const link = (lang: string) => `<link rel="alternate" hreflang="${lang}" href="${U}" />`;
const page = (...langs: string[]) => `<html lang="id"><head>${langs.map(link).join("")}</head><body></body></html>`;

describe("check-seo R2 hreflang rule", () => {
  test("id plus x-default passes", () => {
    expect(hreflangError(page("id", "x-default"))).toBeNull();
  });

  test("an en alternate fails, even next to id and x-default", () => {
    expect(hreflangError(page("en", "id", "x-default"))).toContain('hreflang="en"');
  });

  test("the old en plus id pair fails", () => {
    expect(hreflangError(page("en", "id"))).not.toBeNull();
  });

  test("a missing x-default fails", () => {
    expect(hreflangError(page("id"))).toContain("x-default");
  });

  test("a missing id fails", () => {
    expect(hreflangError(page("x-default"))).toContain('hreflang="id"');
  });
});
