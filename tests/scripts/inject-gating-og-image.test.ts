import { describe, expect, test } from "bun:test";
import { injectSeoAndGating } from "../../scripts/inject-gating";

const html = "<html><head><title>Bab Satu - Buku Uji</title></head><body><main><p>Kalimat pembuka bab ini cukup panjang untuk menjadi deskripsi halaman.</p></main></body></html>";
const base = {
  pageTitle: "Bab Satu - Buku Uji",
  url: "https://dawnbook.belajarcarabelajar.com/books/buku-uji/content/01_satu",
  isGatedClientSide: false,
};
const meta = (out: string, attr: string, key: string) =>
  out.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))?.[1];

describe("og:image", () => {
  test("points at the page's share card and declares its size", () => {
    const card = "https://dawnbook.belajarcarabelajar.com/og/buku-uji/content/01_satu.png";
    const out = injectSeoAndGating(html, { ...base, ogImage: card });
    expect(meta(out, "property", "og:image")).toBe(card);
    expect(meta(out, "name", "twitter:image")).toBe(card);
    expect(meta(out, "property", "og:image:width")).toBe("1200");
    expect(meta(out, "property", "og:image:height")).toBe("630");
    expect(meta(out, "property", "og:image:alt")).toBe("Bab Satu - Buku Uji");
  });

  test("falls back to the site icon without size tags when a page has no card", () => {
    const out = injectSeoAndGating(html, base);
    expect(meta(out, "property", "og:image")).toBe("https://dawnbook.belajarcarabelajar.com/icon-512.png");
    expect(out).not.toContain("og:image:width");
  });
});
