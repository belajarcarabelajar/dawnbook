import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { decodeHtmlEntities, injectSeoAndGating, shareCardUrl } from "../../scripts/inject-gating";

const SITE = "https://dawnbook.belajarcarabelajar.com";
const html = "<html><head><title>Bab Satu - Buku Uji</title></head><body><main><p>Kalimat pembuka bab ini cukup panjang untuk menjadi deskripsi halaman.</p></main></body></html>";
const base = {
  pageTitle: "Bab Satu - Buku Uji",
  url: `${SITE}/books/buku-uji/content/01_satu`,
  isGatedClientSide: false,
};
const meta = (out: string, attr: string, key: string) =>
  out.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))?.[1];

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});
function workDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "og-image-"));
  tempDirs.push(dir);
  return dir;
}
function touch(file: string, content = "x") {
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
}

describe("og:image", () => {
  test("points at the page's share card and declares its size", () => {
    const card = `${SITE}/og/buku-uji/content/01_satu.png`;
    const out = injectSeoAndGating(html, { ...base, ogImage: card });
    expect(meta(out, "property", "og:image")).toBe(card);
    expect(meta(out, "name", "twitter:image")).toBe(card);
    expect(meta(out, "property", "og:image:width")).toBe("1200");
    expect(meta(out, "property", "og:image:height")).toBe("630");
    expect(meta(out, "property", "og:image:alt")).toBe("Bab Satu - Buku Uji");
  });

  test("uses the card's own title for the alt text, escaped once", () => {
    const out = injectSeoAndGating(html, {
      ...base,
      pageTitle: "Bab Satu - Sejarah & Evolusi",
      ogImage: `${SITE}/og/x/index.png`,
      ogImageAlt: "Sejarah & Evolusi",
    });
    expect(meta(out, "property", "og:image:alt")).toBe("Sejarah &amp; Evolusi");
  });

  test("falls back to the site icon without size tags when a page has no card", () => {
    const out = injectSeoAndGating(html, base);
    expect(meta(out, "property", "og:image")).toBe(`${SITE}/icon-512.png`);
    expect(out).not.toContain("og:image:width");
  });
});

describe("decodeHtmlEntities", () => {
  test("decodes named and numeric entities in one pass", () => {
    expect(decodeHtmlEntities("Sejarah &amp; Evolusi")).toBe("Sejarah & Evolusi");
    expect(decodeHtmlEntities("Prisoner&#x27;s &#39;Dilemma&#39; &quot;x&quot;")).toBe(`Prisoner's 'Dilemma' "x"`);
    expect(decodeHtmlEntities("&amp;lt;b&amp;gt;")).toBe("&lt;b&gt;");
    expect(decodeHtmlEntities("a &unknown; b &#0; c")).toBe("a &unknown; b &#0; c");
  });
});

describe("shareCardUrl", () => {
  test("maps the book root to index.png and a chapter to its own card", () => {
    const out = workDir();
    touch(join(out, "og/buku/index.png"));
    touch(join(out, "og/buku/content/01_a.png"));
    expect(shareCardUrl(out, "buku", "")).toBe(`${SITE}/og/buku/index.png`);
    expect(shareCardUrl(out, "buku", "index.html")).toBe(`${SITE}/og/buku/index.png`);
    expect(shareCardUrl(out, "buku", "content/01_a.html")).toBe(`${SITE}/og/buku/content/01_a.png`);
    expect(shareCardUrl(out, "buku", "content/02_b.html")).toBeUndefined();
  });
});

describe("inject-gating.ts and share cards", () => {
  const script = join(import.meta.dir, "../../scripts/inject-gating.ts");
  function site(withCard: boolean): string {
    const cwd = workDir();
    touch(join(cwd, "output/manifest.json"), JSON.stringify({ chapters: {} }));
    touch(join(cwd, "output/books/buku/content/01_a.html"), html);
    touch(join(cwd, "output/books/buku/toc.html"), html);
    if (withCard) touch(join(cwd, "output/og/buku/content/01_a.png"));
    return cwd;
  }
  const run = (cwd: string) => Bun.spawnSync(["bun", "run", script], { cwd, stdout: "pipe", stderr: "pipe" });

  test("fails and names the chapter page that has no card", () => {
    const result = run(site(false));
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain("/books/buku/content/01_a.html");
    expect(result.stderr.toString()).not.toContain("toc.html");
  });

  test("passes and sets og:image when every chapter page has its card", () => {
    const cwd = site(true);
    const result = run(cwd);
    expect(result.stderr.toString()).toBe("");
    expect(result.exitCode).toBe(0);
    const page = readFileSync(join(cwd, "output/books/buku/content/01_a.html"), "utf8");
    expect(meta(page, "property", "og:image")).toBe(`${SITE}/og/buku/content/01_a.png`);
  });

  test("escapes the mdBook title exactly once in og:title, twitter:title and JSON-LD", () => {
    const cwd = site(true);
    const titled = html.replace("<title>Bab Satu - Buku Uji</title>", "<title>Prisoner&#x27;s Dilemma - Sejarah &amp; Evolusi</title>");
    touch(join(cwd, "output/books/buku/content/01_a.html"), titled);
    expect(run(cwd).exitCode).toBe(0);
    const page = readFileSync(join(cwd, "output/books/buku/content/01_a.html"), "utf8");
    expect(meta(page, "property", "og:title")).toBe("Prisoner&#39;s Dilemma - Sejarah &amp; Evolusi");
    expect(meta(page, "name", "twitter:title")).toBe("Prisoner&#39;s Dilemma - Sejarah &amp; Evolusi");
    expect(page).toContain(`"headline": "Prisoner's Dilemma - Sejarah & Evolusi"`);
    expect(page).not.toContain("&amp;amp;");
    expect(page).not.toContain("&amp;#");
  });
});
