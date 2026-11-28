import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { injectSeoAndGating } from "../../scripts/inject-gating";
import { checkIndexingOutput } from "../../scripts/check-indexing-output";

const SITE = "https://dawnbook.belajarcarabelajar.com";
const ROBOTS = '<meta name="robots" content="noindex" />';
const html = `<html><head><title>Halaman Tidak Ditemukan - Buku Uji</title></head><body><main><p>Halaman yang kamu cari tidak ada di buku ini, coba kembali ke daftar isi.</p></main></body></html>`;

function seo(out: string) {
  return {
    robots: out.split(ROBOTS).length - 1,
    canonical: /<link rel="canonical"/.test(out),
    hreflangId: /<link rel="alternate" hreflang="id"/.test(out),
    hreflangDefault: /<link rel="alternate" hreflang="x-default"/.test(out),
    ogUrl: /<meta property="og:url"/.test(out),
    description: /<meta name="description"/.test(out),
    ogTitle: /<meta property="og:title"/.test(out),
  };
}

describe("injectSeoAndGating noindex", () => {
  const base = { pageTitle: "Halaman Tidak Ditemukan - Buku Uji", url: `${SITE}/books/buku-uji/404`, isGatedClientSide: false };

  test("noindex adds one robots meta and drops canonical, both hreflang links and og:url", () => {
    expect(seo(injectSeoAndGating(html, { ...base, noindex: true }))).toEqual({
      robots: 1,
      canonical: false,
      hreflangId: false,
      hreflangDefault: false,
      ogUrl: false,
      description: true,
      ogTitle: true,
    });
  });

  test("without noindex the page keeps canonical, hreflang and og:url and gets no robots meta", () => {
    expect(seo(injectSeoAndGating(html, base))).toEqual({
      robots: 0,
      canonical: true,
      hreflangId: true,
      hreflangDefault: true,
      ogUrl: true,
      description: true,
      ogTitle: true,
    });
  });

  test("an existing robots noindex meta is not repeated", () => {
    const withRobots = html.replace("</head>", '<meta name="robots" content="noindex"></head>');
    const out = injectSeoAndGating(withRobots, { ...base, noindex: true });
    expect(out.match(/<meta\s+name="robots"/g)?.length).toBe(1);
    expect(/<link rel="canonical"/.test(out)).toBe(false);
  });
});

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});
function touch(file: string, content = "x") {
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
}

describe("inject-gating.ts marks only the book 404 page noindex", () => {
  const script = join(import.meta.dir, "../../scripts/inject-gating.ts");

  test("404.html is noindex without canonical; chapters, root and toc keep their canonical and get no robots meta", () => {
    const cwd = mkdtempSync(join(tmpdir(), "book-404-"));
    tempDirs.push(cwd);
    touch(join(cwd, "output/manifest.json"), JSON.stringify({ chapters: { buku: ["/books/buku/content/01_a.html", "/books/buku/content/02_b.html"] } }));
    for (const page of ["index", "content/01_a", "content/02_b"]) {
      touch(join(cwd, `output/books/buku/${page}.html`), html);
      touch(join(cwd, `output/og/buku/${page}.png`));
    }
    touch(join(cwd, "output/books/buku/toc.html"), html);
    touch(join(cwd, "output/books/buku/404.html"), html);
    const result = Bun.spawnSync(["bun", "run", script], { cwd, stdout: "pipe", stderr: "pipe" });
    expect(result.stderr.toString()).toBe("");
    expect(result.exitCode).toBe(0);
    const page = (rel: string) => seo(readFileSync(join(cwd, "output/books/buku", rel), "utf8"));
    expect(page("404.html")).toMatchObject({ robots: 1, canonical: false, hreflangId: false, hreflangDefault: false, ogUrl: false });
    for (const rel of ["index.html", "content/01_a.html", "content/02_b.html", "toc.html"]) {
      expect({ rel, ...page(rel) }).toMatchObject({ rel, robots: 0, canonical: true, hreflangId: true, ogUrl: true });
    }
  });
});

describe("checkIndexingOutput book 404 pages", () => {
  function output(notFound?: string): string {
    const dir = mkdtempSync(join(tmpdir(), "indexing-404-"));
    tempDirs.push(dir);
    touch(join(dir, "manifest.json"), JSON.stringify({ chapters: {} }));
    touch(join(dir, "books/x/toc-0a1b.js"), "");
    if (notFound !== undefined) touch(join(dir, "books/x/404.html"), notFound);
    return dir;
  }
  const about404 = (dir: string) => checkIndexingOutput(dir).filter((p) => p.includes("404.html") && p.includes("books/"));

  test("a book 404.html without the robots noindex meta is reported", () => {
    expect(about404(output("<html><head></head><body></body></html>"))).toEqual(["books/x/404.html: no robots noindex meta, so Google crawls it as a page"]);
  });

  test("a book 404.html with the meta is not reported", () => {
    expect(about404(output(`<html><head>${ROBOTS}</head><body></body></html>`))).toEqual([]);
  });

  test("an output without books is skipped silently", () => {
    const dir = mkdtempSync(join(tmpdir(), "indexing-404-"));
    tempDirs.push(dir);
    expect(checkIndexingOutput(dir).filter((p) => p.includes("books/"))).toEqual([]);
  });
});
