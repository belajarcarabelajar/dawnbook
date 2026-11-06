import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { injectSeoAndGating } from "../../scripts/inject-gating";

const SITE = "https://dawnbook.belajarcarabelajar.com";
const OPENER = "Kalimat pembuka bab satu ini cukup panjang untuk menjadi deskripsi halaman yang berdiri sendiri.";
const html = `<html><head><title>Bab Satu - Buku Uji</title></head><body><main><p>${OPENER}</p></main></body></html>`;
const chapterUrl = `${SITE}/books/buku-uji/content/01_satu`;
const rootUrl = `${SITE}/books/buku-uji/`;

function seoUrls(out: string) {
  return {
    canonical: out.match(/<link rel="canonical" href="([^"]*)"/)?.[1],
    hreflangEn: out.match(/<link rel="alternate" hreflang="en" href="([^"]*)"/)?.[1],
    hreflangId: out.match(/<link rel="alternate" hreflang="id" href="([^"]*)"/)?.[1],
    ogUrl: out.match(/<meta property="og:url" content="([^"]*)"/)?.[1],
  };
}
const description = (out: string) => out.match(/<meta name="description" content="([^"]*)"/)?.[1];

describe("injectSeoAndGating canonicalUrl", () => {
  test("canonicalUrl goes to canonical, og:url and both hreflang links", () => {
    const out = injectSeoAndGating(html, {
      pageTitle: "Bab Satu - Buku Uji",
      url: chapterUrl,
      isGatedClientSide: false,
      canonicalUrl: rootUrl,
    });
    expect(seoUrls(out)).toEqual({ canonical: rootUrl, hreflangEn: rootUrl, hreflangId: rootUrl, ogUrl: rootUrl });
  });

  test("without canonicalUrl every one of them is the page url", () => {
    const out = injectSeoAndGating(html, { pageTitle: "Bab Satu - Buku Uji", url: chapterUrl, isGatedClientSide: false });
    expect(seoUrls(out)).toEqual({
      canonical: chapterUrl,
      hreflangEn: chapterUrl,
      hreflangId: chapterUrl,
      ogUrl: chapterUrl,
    });
  });

  test("the meta description stays the chapter opener and JSON-LD keeps the page url", () => {
    const out = injectSeoAndGating(html, {
      pageTitle: "Bab Satu - Buku Uji",
      url: chapterUrl,
      isGatedClientSide: false,
      bookDescription: "Deskripsi buku yang tidak boleh dipakai sebagai deskripsi halaman bab satu ini sama sekali.",
      canonicalUrl: rootUrl,
    });
    expect(description(out)).toBe(OPENER);
    expect(out).toContain(`"url": "${chapterUrl}"`);
  });
});

describe("inject-gating.ts gives the first chapter the book root as canonical", () => {
  const script = join(import.meta.dir, "../../scripts/inject-gating.ts");
  const tempDirs: string[] = [];
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });
  function touch(file: string, content = "x") {
    mkdirSync(join(file, ".."), { recursive: true });
    writeFileSync(file, content);
  }
  function site(chapters: Record<string, string[]>): string {
    const cwd = mkdtempSync(join(tmpdir(), "canonical-"));
    tempDirs.push(cwd);
    touch(join(cwd, "output/manifest.json"), JSON.stringify({ chapters }));
    for (const page of ["index", "content/01_spasi jalan", "content/02_b"]) {
      touch(join(cwd, `output/books/buku/${page}.html`), html);
      touch(join(cwd, `output/og/buku/${page}.png`));
    }
    touch(join(cwd, "output/books/buku/toc.html"), html);
    return cwd;
  }
  function run(cwd: string) {
    const result = Bun.spawnSync(["bun", "run", script], { cwd, stdout: "pipe", stderr: "pipe" });
    expect(result.stderr.toString()).toBe("");
    expect(result.exitCode).toBe(0);
  }
  const page = (cwd: string, rel: string) => seoUrls(readFileSync(join(cwd, "output/books/buku", rel), "utf8"));
  const self = (u: string) => ({ canonical: u, hreflangEn: u, hreflangId: u, ogUrl: u });
  const bookRoot = `${SITE}/books/buku/`;

  test("chapter 1 points at the root; root, chapter 2 and toc keep their own url", () => {
    const cwd = site({ buku: ["/books/buku/content/01_spasi%20jalan.html", "/books/buku/content/02_b.html"] });
    run(cwd);
    expect(page(cwd, "content/01_spasi jalan.html")).toEqual(self(bookRoot));
    expect(page(cwd, "index.html")).toEqual(self(bookRoot));
    expect(page(cwd, "content/02_b.html")).toEqual(self(`${SITE}/books/buku/content/02_b`));
    expect(page(cwd, "toc.html")).toEqual(self(`${SITE}/books/buku/toc`));
    const first = readFileSync(join(cwd, "output/books/buku/content/01_spasi jalan.html"), "utf8");
    expect(description(first)).toBe(OPENER);
  });

  test("a book missing from manifest.chapters keeps self canonicals", () => {
    const cwd = site({});
    run(cwd);
    expect(page(cwd, "content/01_spasi jalan.html")).toEqual(self(`${SITE}/books/buku/content/01_spasi jalan`));
    expect(page(cwd, "content/02_b.html")).toEqual(self(`${SITE}/books/buku/content/02_b`));
  });

  test("first chapter carries the free-chapter meta exactly once; root and chapter 2 carry none", () => {
    const cwd = site({ buku: ["/books/buku/content/01_spasi%20jalan.html", "/books/buku/content/02_b.html"] });
    run(cwd);
    const metaCount = (rel: string) =>
      readFileSync(join(cwd, "output/books/buku", rel), "utf8").split('<meta name="dawnbook-free-chapter" content="1" />')
        .length - 1;
    expect(metaCount("content/01_spasi jalan.html")).toBe(1);
    expect(metaCount("index.html")).toBe(0);
    expect(metaCount("content/02_b.html")).toBe(0);
  });
});

describe("injectSeoAndGating isFirstChapter", () => {
  const META = '<meta name="dawnbook-free-chapter" content="1" />';
  const base = { pageTitle: "Bab Satu - Buku Uji", url: chapterUrl, isGatedClientSide: false };

  test("first chapter: adds the free-chapter meta exactly once, inside the head", () => {
    const out = injectSeoAndGating(html, { ...base, isFirstChapter: true });
    expect(out.split(META).length - 1).toBe(1);
    expect(out.indexOf(META)).toBeLessThan(out.indexOf("</head>"));
  });

  test("without isFirstChapter there is no free-chapter meta", () => {
    expect(injectSeoAndGating(html, base)).not.toContain("dawnbook-free-chapter");
  });
});
