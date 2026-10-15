import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { renderBooks, type RenderResult } from "../../scripts/render-diagrams";

const repoRoot = path.join(import.meta.dir, "..", "..");
const script = path.join(repoRoot, "scripts", "render-diagrams.ts");
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ?? "/usr/bin/chromium";
// Any attempt to launch this path fails, so a run that succeeds with it never started a browser.
const noBrowser = "/nonexistent/chromium-for-render-diagrams-test";

const FLOWCHART = [
  "flowchart LR",
  "    accTitle: Alur belajar satu bab",
  "    accDescr: Pembaca membaca bab, lalu mencoba latihan, lalu mengulang bagian yang sulit.",
  '    A["Membaca"] --> B["Mencoba"]',
  '    B --> C["Mengulang"]',
].join("\n");

const TIMELINE = [
  "timeline",
  "    accTitle: Linimasa platform",
  "    accDescr: Peluncuran pada 2024, buku pertama pada 2025, dan diagram pada 2026.",
  "    2024 : Peluncuran",
  "    2025 : Buku pertama",
  "    2026 : Diagram",
].join("\n");

const fence = (source: string) => "```mermaid\n" + source + "\n```";

const CHAPTER_ONE = [
  "# Bab Satu",
  "",
  "Proses belajar berjalan dari membaca ke mencoba.",
  "",
  fence(FLOWCHART),
  "",
  "Perjalanan platform ini tercatat dalam tiga tahun.",
  "",
  fence(TIMELINE),
  "",
].join("\n");

// Repeats the flowchart, so the same key appears in two places of one book.
const CHAPTER_TWO = ["# Bab Dua", "", "Alur yang sama berlaku di bab ini.", "", fence(FLOWCHART), ""].join("\n");

const roots: string[] = [];

function writeFile(file: string, text: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function makeRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "render-diagrams-"));
  roots.push(root);
  writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "fixture", devDependencies: { "@mermaid-js/mermaid-cli": "12.0.0" } }, null, 2),
  );
  for (const name of ["render-config.json", "theme.css"]) {
    fs.copyFileSync(path.join(repoRoot, "scripts", "diagrams", name), path.join(mkdir(root, "scripts", "diagrams"), name));
  }
  const demo = path.join(root, "books", "demo");
  writeFile(path.join(demo, "book.toml"), '[book]\ntitle = "Demo"\n');
  writeFile(path.join(demo, "src", "SUMMARY.md"), "# Ringkasan\n\n- [Bab Satu](content/01_bab-satu.md)\n");
  writeFile(path.join(demo, "src", "content", "01_bab-satu.md"), CHAPTER_ONE);
  writeFile(path.join(demo, "src", "content", "02_bab-dua.md"), CHAPTER_TWO);
  // Folders starting with "_" are templates, so this block without acc text must never be read.
  writeFile(path.join(root, "books", "_template", "book.toml"), '[book]\ntitle = "Template"\n');
  writeFile(
    path.join(root, "books", "_template", "src", "content", "contoh.md"),
    "Contoh.\n\n" + fence("flowchart LR\n    X --> Y") + "\n",
  );
  return root;
}

function mkdir(...parts: string[]): string {
  const dir = path.join(...parts);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function copyRoot(from: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "render-diagrams-"));
  roots.push(root);
  fs.cpSync(from, root, { recursive: true });
  return root;
}

function svgFiles(root: string, book = "demo"): string[] {
  const dir = path.join(root, "books", book, "diagrams");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".svg"))
    .sort();
}

function readSvg(root: string, name: string): string {
  return fs.readFileSync(path.join(root, "books", "demo", "diagrams", name), "utf8");
}

function runCli(args: string[], env: Record<string, string> = {}) {
  const proc = Bun.spawnSync(["bun", "run", script, ...args], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  });
  return { code: proc.exitCode, out: proc.stdout.toString() + proc.stderr.toString() };
}

afterAll(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

// GitHub's Ubuntu runner ships /usr/bin/chromium, so CI would render although CI never needs to.
const skipRender =
  !fs.existsSync(executablePath) || (!!process.env.CI && process.env.DIAGRAMS_RENDER_TEST !== "1");

describe.skipIf(skipRender)("renderBooks", () => {
  let seed = "";
  let first: RenderResult;

  beforeAll(async () => {
    seed = makeRoot();
    first = await renderBooks(seed);
  }, 60_000);

  it("renders each distinct diagram once on the first run and writes one file per key", () => {
    expect(first.rendered).toHaveLength(2);
    expect(first.cached).toBe(0);
    expect(first.missing).toEqual([]);
    expect(svgFiles(seed)).toHaveLength(2);
    expect(fs.existsSync(path.join(seed, "books", "_template", "diagrams"))).toBe(false);
  });

  it("writes one-line SVGs with a title, no foreignObject, and the theme CSS applied", () => {
    for (const name of svgFiles(seed)) {
      const svg = readSvg(seed, name);
      expect(svg).not.toContain("\n");
      expect(svg).not.toContain("<foreignObject");
      expect(svg).toContain("<title");
      expect(svg).toContain("var(--quote-bg");
    }
  });

  it("labels the timeline SVG through aria-labelledby", () => {
    const timeline = svgFiles(seed)
      .map((name) => readSvg(seed, name))
      .find((svg) => svg.includes("Linimasa platform"));
    expect(timeline).toBeDefined();
    expect(timeline!).toContain('aria-labelledby="');
  });

  it("reports every diagram as cached on a second run and launches no browser", async () => {
    const root = copyRoot(seed);
    const result = await renderBooks(root, { executablePath: noBrowser });
    expect(result.rendered).toEqual([]);
    expect(result.cached).toBe(2);
  });

  it("re-renders every diagram with force and produces byte-identical files", async () => {
    const root = copyRoot(seed);
    const result = await renderBooks(root, { force: true });
    expect(result.rendered).toHaveLength(2);
    expect(svgFiles(root)).toEqual(svgFiles(seed));
    for (const name of svgFiles(seed)) {
      expect(readSvg(root, name)).toBe(readSvg(seed, name));
    }
  }, 60_000);

  it("reports a deleted cache file as missing in check mode without rendering it", async () => {
    const root = copyRoot(seed);
    const [gone] = svgFiles(root);
    fs.rmSync(path.join(root, "books", "demo", "diagrams", gone));
    const result = await renderBooks(root, { check: true, executablePath: noBrowser });
    expect(result.missing).toHaveLength(1);
    expect(result.missing[0]).toMatch(/^demo\/src\/content\/0[12]_bab-[a-z]+\.md:\d+$/);
    expect(result.rendered).toEqual([]);
    expect(fs.existsSync(path.join(root, "books", "demo", "diagrams", gone))).toBe(false);
  });

  it("reports an orphan SVG without deleting it, and deletes it only with prune", async () => {
    const root = copyRoot(seed);
    const orphan = path.join(root, "books", "demo", "diagrams", "000000000000.svg");
    fs.writeFileSync(orphan, "<svg></svg>");

    const reported = await renderBooks(root, { executablePath: noBrowser });
    expect(reported.orphans).toEqual(["demo/diagrams/000000000000.svg"]);
    expect(reported.pruned).toEqual([]);
    expect(fs.existsSync(orphan)).toBe(true);

    const pruned = await renderBooks(root, { prune: true, executablePath: noBrowser });
    expect(pruned.pruned).toEqual(["demo/diagrams/000000000000.svg"]);
    expect(fs.existsSync(orphan)).toBe(false);
    expect(svgFiles(root)).toEqual(svgFiles(seed));
  });

  it("limits the scan to one book when a slug is given", async () => {
    const root = copyRoot(seed);
    const other = path.join(root, "books", "lain");
    writeFile(path.join(other, "book.toml"), '[book]\ntitle = "Lain"\n');
    writeFile(path.join(other, "src", "content", "01_bab.md"), "Paragraf.\n\n" + fence(TIMELINE.replace("2026", "2027")) + "\n");

    const all = await renderBooks(root, { check: true, executablePath: noBrowser });
    expect(all.missing).toEqual(["lain/src/content/01_bab.md:3"]);
    const one = await renderBooks(root, { check: true, book: "demo", executablePath: noBrowser });
    expect(one.missing).toEqual([]);
    expect(one.cached).toBe(2);
  });

  it("rejects with the book, file and line of a diagram that fails to render", async () => {
    const root = copyRoot(seed);
    const broken = [
      "flowchart TD",
      "    accTitle: Diagram rusak",
      "    accDescr: Fixture ini sengaja salah sintaks.",
      "    A[Baca bab --> B{Sudah paham?",
    ].join("\n");
    writeFile(path.join(root, "books", "demo", "src", "content", "03_bab-rusak.md"), "Paragraf.\n\n" + fence(broken) + "\n");
    await expect(renderBooks(root)).rejects.toThrow(/demo\/src\/content\/03_bab-rusak\.md:3 /);
  }, 60_000);

  it("CLI prints the summary line and exits 0 on a fully cached tree", () => {
    const root = copyRoot(seed);
    const { code, out } = runCli(["--root", root], { PUPPETEER_EXECUTABLE_PATH: noBrowser });
    expect(out).toContain("rendered 0, cached 2, missing 0, orphans 0, pruned 0");
    expect(code).toBe(0);
  });

  it("CLI check exits 1 and names the block whose cache file is missing", () => {
    const root = copyRoot(seed);
    for (const name of svgFiles(root)) fs.rmSync(path.join(root, "books", "demo", "diagrams", name));
    const { code, out } = runCli(["--root", root, "--check"], { PUPPETEER_EXECUTABLE_PATH: noBrowser });
    expect(out).toContain("demo/src/content/01_bab-satu.md:5");
    expect(out).toContain("missing 2");
    expect(code).toBe(1);
  });

  it("CLI exits 1 and asks for accTitle and accDescr when a block has none", () => {
    const root = copyRoot(seed);
    writeFile(
      path.join(root, "books", "demo", "src", "content", "03_bab-tanpa-acc.md"),
      "Paragraf.\n\n" + fence("flowchart LR\n    A --> B") + "\n",
    );
    const { code, out } = runCli(["--root", root], { PUPPETEER_EXECUTABLE_PATH: noBrowser });
    expect(out).toContain("demo/src/content/03_bab-tanpa-acc.md:3");
    expect(out).toContain("accTitle");
    expect(out).toContain("accDescr");
    expect(code).toBe(1);
  });
});
