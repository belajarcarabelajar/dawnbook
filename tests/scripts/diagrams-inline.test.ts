import { afterEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { diagramKey } from "../../scripts/diagrams/cache";
import { inlineDiagramsInBook } from "../../scripts/diagrams/inline";

const repoRoot = path.join(import.meta.dir, "..", "..");
const realConfig = path.join(repoRoot, "scripts", "diagrams", "render-config.json");
const realCss = path.join(repoRoot, "scripts", "diagrams", "theme.css");

const roots: string[] = [];

afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

function makeRoot(withPackage = true): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "diagrams-inline-"));
  roots.push(root);
  if (withPackage) {
    const dir = path.join(root, "scripts", "diagrams");
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(realConfig, path.join(dir, "render-config.json"));
    fs.copyFileSync(realCss, path.join(dir, "theme.css"));
    fs.writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ name: "fixture", devDependencies: { "@mermaid-js/mermaid-cli": "12.0.0" } }, null, 2),
    );
  }
  return root;
}

interface Book {
  srcDir: string;
  tmpDir: string;
}

// Writes the same markdown into the source book and its build copy, plus one cached SVG per
// entry of `cached` (diagram source -> svg markup).
function makeBook(root: string, slug: string, files: Record<string, string>, cached: Record<string, string> = {}): Book {
  const srcDir = path.join(root, "books", slug);
  const tmpDir = path.join(root, ".build-tmp", slug);
  for (const dir of [srcDir, tmpDir]) {
    for (const [rel, text] of Object.entries(files)) {
      const full = path.join(dir, "src", rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, text);
    }
  }
  for (const [source, svg] of Object.entries(cached)) {
    const svgPath = path.join(srcDir, "diagrams", `${diagramKey(source, root)}.svg`);
    fs.mkdirSync(path.dirname(svgPath), { recursive: true });
    fs.writeFileSync(svgPath, svg + "\n");
  }
  return { srcDir, tmpDir };
}

function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else out[path.relative(dir, full)] = fs.readFileSync(full, "utf8");
    }
  };
  walk(dir);
  return out;
}

const read = (book: Book, rel: string) => fs.readFileSync(path.join(book.tmpDir, "src", rel), "utf8");

const SOURCE_A = "flowchart TD\n  A[Mulai] --> B[Selesai]";
const SOURCE_B = "flowchart LR\n  X --> Y";
const SVG_A = '<svg viewBox="0 0 10 10"><title>t</title></svg>';
const SVG_B = '<svg viewBox="0 0 10 10"><title>u</title></svg>';
const FENCE = "```";

const ONE_BLOCK = [
  "# Judul",
  "",
  "Paragraf pembuka.",
  "",
  `${FENCE}mermaid`,
  "flowchart TD",
  "  A[Mulai] --> B[Selesai]",
  FENCE,
  "",
  "Paragraf penutup.",
  "",
].join("\n");

describe("inlineDiagramsInBook", () => {
  it("replaces one block with the wrapped cached SVG on one line and keeps the text around it", () => {
    const root = makeRoot();
    const book = makeBook(root, "buku-uji", { "content/02_x.md": ONE_BLOCK }, { [SOURCE_A]: SVG_A });

    const result = inlineDiagramsInBook(book.tmpDir, book.srcDir, root);

    expect(result).toEqual({ replaced: 1 });
    expect(read(book, "content/02_x.md")).toBe(
      [
        "# Judul",
        "",
        "Paragraf pembuka.",
        "",
        '<div class="dawnbook-diagram"><svg viewBox="0 0 10 10"><title>t</title></svg></div>',
        "",
        "Paragraf penutup.",
        "",
      ].join("\n"),
    );
  });

  it("replaces two blocks in one file in order", () => {
    const root = makeRoot();
    const markdown = [
      "Pembuka.",
      "",
      `${FENCE}mermaid`,
      "flowchart TD",
      "  A[Mulai] --> B[Selesai]",
      FENCE,
      "",
      "Tengah.",
      "",
      `${FENCE}mermaid`,
      "flowchart LR",
      "  X --> Y",
      FENCE,
      "",
      "Akhir.",
    ].join("\n");
    const book = makeBook(root, "buku-uji", { "content/02_x.md": markdown }, { [SOURCE_A]: SVG_A, [SOURCE_B]: SVG_B });

    const result = inlineDiagramsInBook(book.tmpDir, book.srcDir, root);

    expect(result).toEqual({ replaced: 2 });
    expect(read(book, "content/02_x.md")).toBe(
      [
        "Pembuka.",
        "",
        '<div class="dawnbook-diagram"><svg viewBox="0 0 10 10"><title>t</title></svg></div>',
        "",
        "Tengah.",
        "",
        '<div class="dawnbook-diagram"><svg viewBox="0 0 10 10"><title>u</title></svg></div>',
        "",
        "Akhir.",
      ].join("\n"),
    );
  });

  it("keeps the list-item indentation of a block inside a list", () => {
    const root = makeRoot();
    const markdown = [
      "Langkahnya sebagai berikut.",
      "",
      "1. Langkah pertama:",
      "",
      `   ${FENCE}mermaid`,
      "   flowchart LR",
      "     X --> Y",
      `   ${FENCE}`,
      "",
      "2. Langkah kedua.",
      "",
    ].join("\n");
    const book = makeBook(root, "buku-uji", { "content/02_x.md": markdown }, { [SOURCE_B]: SVG_B });

    const result = inlineDiagramsInBook(book.tmpDir, book.srcDir, root);

    expect(result).toEqual({ replaced: 1 });
    expect(read(book, "content/02_x.md")).toBe(
      [
        "Langkahnya sebagai berikut.",
        "",
        "1. Langkah pertama:",
        "",
        '   <div class="dawnbook-diagram"><svg viewBox="0 0 10 10"><title>u</title></svg></div>',
        "",
        "2. Langkah kedua.",
        "",
      ].join("\n"),
    );
  });

  it("throws on a cache miss naming the book, file, line, key and render command", () => {
    const root = makeRoot();
    const book = makeBook(root, "buku-uji", { "content/02_x.md": ONE_BLOCK });
    const key = diagramKey(SOURCE_A, root);

    expect(() => inlineDiagramsInBook(book.tmpDir, book.srcDir, root)).toThrow(
      `buku-uji/src/content/02_x.md:5 has no cached SVG ${key}.svg; run: bun run diagrams:render --book buku-uji`,
    );
  });

  it("lists every miss in the book, one per line, in a single error", () => {
    const root = makeRoot();
    const other = ["Teks.", "", `${FENCE}mermaid`, "flowchart LR", "  X --> Y", FENCE, ""].join("\n");
    const book = makeBook(root, "buku-uji", { "content/01_a.md": other, "content/02_x.md": ONE_BLOCK });
    const keyA = diagramKey(SOURCE_A, root);
    const keyB = diagramKey(SOURCE_B, root);

    let message = "";
    try {
      inlineDiagramsInBook(book.tmpDir, book.srcDir, root);
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message.split("\n")).toEqual([
      `buku-uji/src/content/01_a.md:3 has no cached SVG ${keyB}.svg; run: bun run diagrams:render --book buku-uji`,
      `buku-uji/src/content/02_x.md:5 has no cached SVG ${keyA}.svg; run: bun run diagrams:render --book buku-uji`,
    ]);
  });

  it("leaves a book with no blocks untouched without needing the mermaid-cli devDependency", () => {
    const root = makeRoot(false);
    const markdown = ["# Bab", "", "Teks biasa.", "", `${FENCE}js`, "const a = 1;", FENCE, ""].join("\n");
    const book = makeBook(root, "buku-polos", { "content/01_a.md": markdown, "SUMMARY.md": "# Ringkasan\n" });
    const file = path.join(book.tmpDir, "src", "content", "01_a.md");
    const old = new Date("2020-01-01T00:00:00Z");
    fs.utimesSync(file, old, old);

    const result = inlineDiagramsInBook(book.tmpDir, book.srcDir, root);

    expect(result).toEqual({ replaced: 0 });
    expect(fs.readFileSync(file, "utf8")).toBe(markdown);
    expect(fs.statSync(file).mtimeMs).toBe(old.getTime());
  });

  it("never modifies the source book, on success or on a miss", () => {
    const root = makeRoot();
    const done = makeBook(root, "buku-uji", { "content/02_x.md": ONE_BLOCK }, { [SOURCE_A]: SVG_A });
    const before = snapshot(done.srcDir);
    inlineDiagramsInBook(done.tmpDir, done.srcDir, root);
    expect(snapshot(done.srcDir)).toEqual(before);

    const missing = makeBook(root, "buku-kosong", { "content/02_x.md": ONE_BLOCK });
    const beforeMiss = snapshot(missing.srcDir);
    expect(() => inlineDiagramsInBook(missing.tmpDir, missing.srcDir, root)).toThrow();
    expect(snapshot(missing.srcDir)).toEqual(beforeMiss);
  });
});

describe("build wiring for diagrams", () => {
  const runner = fs.readFileSync(path.join(repoRoot, "scripts", "builder", "mdbook-runner.ts"), "utf8");

  it("runs the diagram gate after the media check and before the per-book loop", () => {
    const media = runner.indexOf("bun run scripts/check-media-support.ts");
    const gate = runner.indexOf("bun run scripts/check-diagrams.ts");
    const loop = runner.indexOf("for (const entry of entries)");
    expect(media).toBeGreaterThan(-1);
    expect(gate).toBeGreaterThan(media);
    expect(gate).toBeLessThan(loop);
  });

  it("inlines diagrams after copying the book and exits 1 on a miss before mdbook build", () => {
    expect(runner).toContain('import { inlineDiagramsInBook } from "../diagrams/inline";');
    const prepare = runner.indexOf("await prepareBookForMdbook(booksDir, tmpBooksDir, entry.name);");
    const inline = runner.indexOf("inlineDiagramsInBook(tmpBookPath, bookPath)");
    const mdbook = runner.indexOf("mdbook build");
    expect(prepare).toBeGreaterThan(-1);
    expect(inline).toBeGreaterThan(prepare);
    expect(inline).toBeLessThan(mdbook);
    expect(runner.slice(inline, mdbook)).toContain("process.exit(1)");
  });

  it("styles the diagram wrapper in the shared book stylesheet", () => {
    const css = fs.readFileSync(path.join(repoRoot, "books", "shared-header.css"), "utf8");
    expect(css).toMatch(/\.dawnbook-diagram \{[^}]*overflow-x: auto;/);
    expect(css).toMatch(/\.dawnbook-diagram svg \{[^}]*height: auto;/);
  });
});
