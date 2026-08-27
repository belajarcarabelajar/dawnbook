import { expect, test, describe } from "bun:test";
import { formatSerpDescription, extractLeadText, injectSeoAndGating } from "../scripts/inject-gating";

describe("Google SERP Meta Description Compliance (Rule R26)", () => {
  test("REQ-03: Complete sentence ending within 160 chars is preserved without trailing ellipsis", () => {
    const input = "Selamat datang di penjelajahan mendalam mengenai salah satu sistem sensorik paling vital namun sering kali terlupakan: Sistem Vestibular. Jika penglihatan memberi tahu kita...";
    const result = formatSerpDescription(input, 160);
    expect(result).toBe("Selamat datang di penjelajahan mendalam mengenai salah satu sistem sensorik paling vital namun sering kali terlupakan: Sistem Vestibular.");
    expect(result.endsWith("...")).toBe(false);
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.length).toBeGreaterThanOrEqual(100);
  });

  test("REQ-04: Long sentence (>160 chars) truncates cleanly at word boundary without chopping words in half", () => {
    const input = "Bayangkan sebuah kastil kuno yang memiliki sistem pipa rahasia di dalam dinding-dinding batunya yang sangat megah dan terlindungi dengan sistem keamanan yang tak tertandingi di seluruh penjuru kerajaan.";
    const result = formatSerpDescription(input, 160);
    expect(result.endsWith("...")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(160);
    // Ensure last word before ellipsis is not a cut off isolated 1-2 letter fragment (e.g. " m..." or " a...")
    expect(result).not.toMatch(/\s[a-zA-Z]{1,2}\.\.\.$/);
  });

  test("REQ-05: Cleans stray spaces before punctuation marks", () => {
    const input = "Sistem vestibular mendeteksi akselerasi linear , rotasi , dan gravitasi bumi .";
    const result = formatSerpDescription(input, 160);
    expect(result).toBe("Sistem vestibular mendeteksi akselerasi linear, rotasi, dan gravitasi bumi.");
    expect(result).not.toMatch(/\s+[.,;:!?]/);
  });

  test("REQ-05: Strips inline LaTeX delimiters and footnote markers", () => {
    const input = "Gravitasi bumi \\(g \\approx 9.8 \\text{ m/s}^2\\) bekerja secara konstan[^1] pada reseptor otolit.";
    const result = formatSerpDescription(input, 160);
    expect(result).not.toContain("\\(");
    expect(result).not.toContain("\\)");
    expect(result).not.toContain("[^1]");
  });

  test("REQ-06: Root book landing page uses authentic book.toml description", () => {
    const html = `<html><head><title>Pengantar - Buku Uji</title></head><body><main><p>Paragraf pembuka bab pertama yang panjang sekali.</p></main></body></html>`;
    const bookDescription = "Panduan neurobiologi sistem vestibular, anatomi labirin, fisiologi sel rambut, jalur saraf, refleks keseimbangan, hingga patofisiologi klinis.";
    const resultHtml = injectSeoAndGating(html, {
      pageTitle: "Pengantar - Buku Uji",
      url: "https://dawnbook.belajarcarabelajar.com/books/buku-uji/",
      isGatedClientSide: false,
      bookDescription,
      isBookRoot: true,
    });

    expect(resultHtml).toContain(`<meta name="description" content="${bookDescription}" />`);
    expect(resultHtml).toContain(`<meta property="og:description" content="${bookDescription}" />`);
    expect(resultHtml).not.toContain(`<meta name="description" content="Paragraf pembuka`);
  });

  test("REQ-01: Chapter page does NOT duplicate pageTitle or book title in meta description", () => {
    const html = `<html><head><title>Bab 1 Pengantar - Buku Uji</title></head><body><main><p>Selamat datang di materi pengantar ini. Mari kita pelajari sistem sensorik tubuh kita secara mendalam.</p></main></body></html>`;
    const resultHtml = injectSeoAndGating(html, {
      pageTitle: "Bab 1 Pengantar - Buku Uji",
      url: "https://dawnbook.belajarcarabelajar.com/books/buku-uji/content/01_pengantar.html",
      isGatedClientSide: false,
      bookDescription: "Deskripsi umum buku dari book.toml",
      isBookRoot: false,
    });

    expect(resultHtml).not.toContain(`content="Bab 1 Pengantar - Buku Uji.`);
    expect(resultHtml).toContain(`content="Selamat datang di materi pengantar ini.`);
  });
});
