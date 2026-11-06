import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateSitePages } from "../../scripts/builder/template-engine";
import type { BuiltBook } from "../../scripts/builder/metadata";

const ROOT = join(import.meta.dir, "../..");
const BASE = "https://dawnbook.belajarcarabelajar.com";

const INDEXABLE: Record<string, string> = {
  "index.html": `${BASE}/`,
  "about.html": `${BASE}/about`,
  "contribute.html": `${BASE}/contribute`,
  "donate.html": `${BASE}/donate`,
  "appreciation.html": `${BASE}/appreciation`,
  "statistics.html": `${BASE}/statistics`,
  "dmca.html": `${BASE}/dmca`,
};
const NOINDEX = ["sign-in.html", "sign-up.html"];
const ALL = [...Object.keys(INDEXABLE), ...NOINDEX];

const builtBooks: BuiltBook[] = [
  {
    slug: "seo-fixture",
    title: "SEO Fixture",
    author: "Tester",
    chapterCount: 1,
    emoji: "x",
    chapters: ["content/01_x.md"],
    mtimeMs: 0,
    formattedDate: "",
  },
];

let outDir = "";
const pages: Record<string, string> = {};

beforeAll(async () => {
  outDir = mkdtempSync(join(tmpdir(), "dawnbook-hub-seo-"));
  try {
    await generateSitePages(ROOT, outDir, builtBooks, {});
    for (const name of ALL) pages[name] = readFileSync(join(outDir, name), "utf8");
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

function head(page: string): string {
  const m = /<head>([\s\S]*?)<\/head>/.exec(page);
  if (!m) throw new Error("no <head> in page");
  return m[1];
}

function canonicals(page: string): string[] {
  return [...page.matchAll(/<link rel="canonical" href="([^"]*)">/g)].map((m) => m[1]);
}

function description(page: string): string {
  const all = [...head(page).matchAll(/<meta name="description" content="([^"]*)">/g)];
  if (all.length !== 1) throw new Error(`expected one description, got ${all.length}`);
  return all[0][1];
}

const NOINDEX_META = '<meta name="robots" content="noindex">';

describe("hub canonical links", () => {
  for (const [name, href] of Object.entries(INDEXABLE)) {
    test(`${name} has exactly one canonical, in <head>, pointing at ${href}`, () => {
      expect(canonicals(pages[name])).toEqual([href]);
      expect(canonicals(head(pages[name]))).toEqual([href]);
    });
  }
  for (const name of NOINDEX) {
    test(`${name} has no canonical`, () => {
      expect(canonicals(pages[name])).toEqual([]);
    });
  }
});

describe("hub robots noindex", () => {
  for (const name of NOINDEX) {
    test(`${name} carries noindex in <head>`, () => {
      expect(head(pages[name])).toContain(NOINDEX_META);
    });
  }
  for (const name of Object.keys(INDEXABLE)) {
    test(`${name} is not noindex`, () => {
      expect(pages[name]).not.toContain('name="robots"');
    });
  }
  test("public/offline.html carries noindex in <head>", () => {
    const offline = readFileSync(join(ROOT, "public/offline.html"), "utf8");
    expect(head(offline)).toContain(NOINDEX_META);
  });
});

describe("hub pages declare Indonesian", () => {
  const htmlLang = (page: string) => [...page.matchAll(/<html\b[^>]*\blang="([^"]*)"/g)].map((m) => m[1]);
  for (const name of ALL) {
    test(`${name} has <html lang="id">`, () => {
      expect(htmlLang(pages[name])).toEqual(["id"]);
    });
  }
  for (const rel of ["public/offline.html", "scripts/public/offline.html", "public/404.html"]) {
    test(`${rel} has <html lang="id">`, () => {
      expect(htmlLang(readFileSync(join(ROOT, rel), "utf8"))).toEqual(["id"]);
    });
  }
});

describe("hub meta descriptions", () => {
  test("the home keeps its existing description", () => {
    expect(description(pages["index.html"])).toBe(
      "Dawnbook - A Scalable Educational Publishing Platform",
    );
  });
  test("the indexable pages have pairwise distinct descriptions", () => {
    const descs = Object.keys(INDEXABLE).map((n) => description(pages[n]));
    expect(new Set(descs).size).toBe(descs.length);
  });
  for (const name of Object.keys(INDEXABLE)) {
    test(`${name} description is non-empty, under 160 characters, with no em dash`, () => {
      const d = description(pages[name]);
      expect(d.length).toBeGreaterThan(0);
      expect(d.length).toBeLessThan(160);
      expect(d).not.toContain("—");
    });
  }
});

describe("hub links point at extensionless URLs", () => {
  for (const name of ALL) {
    test(`${name} has no root-relative .html link`, () => {
      expect(pages[name].match(/href="\/[a-z-]+\.html/g) ?? []).toEqual([]);
      expect(pages[name].match(/redirect_url=\/[a-z-]+\.html/g) ?? []).toEqual([]);
    });
  }
  test("the nav links every hub page by its extensionless path", () => {
    for (const p of ["/about", "/statistics", "/contribute", "/donate", "/dmca"]) {
      expect(pages["index.html"]).toContain(`href="${p}"`);
    }
  });
  test("book card links are left alone", () => {
    expect(pages["index.html"]).toContain('href="/books/seo-fixture/"');
  });
});
