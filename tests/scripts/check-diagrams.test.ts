import { describe, expect, it, afterEach } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkDiagrams, MAX_NATURAL_WIDTH } from "../../scripts/check-diagrams";
import { diagramKey } from "../../scripts/diagrams/cache";

const repoRoot = path.join(import.meta.dir, "..", "..");
const script = path.join(repoRoot, "scripts", "check-diagrams.ts");
const roots: string[] = [];

function makeRoot(opts: { withCli?: boolean } = {}): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "check-diagrams-"));
  roots.push(root);
  const dir = path.join(root, "scripts", "diagrams");
  fs.mkdirSync(dir, { recursive: true });
  for (const name of ["render-config.json", "theme.css"]) {
    fs.copyFileSync(path.join(repoRoot, "scripts", "diagrams", name), path.join(dir, name));
  }
  const devDependencies = opts.withCli === false ? {} : { "@mermaid-js/mermaid-cli": "12.0.0" };
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "fixture", devDependencies }, null, 2));
  return root;
}

function addBook(root: string, slug: string, files: Record<string, string>, withToml = true): string {
  const bookDir = path.join(root, "books", slug);
  fs.mkdirSync(bookDir, { recursive: true });
  if (withToml) fs.writeFileSync(path.join(bookDir, "book.toml"), '[book]\ntitle = "Buku Uji"\n');
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(bookDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body);
  }
  return bookDir;
}

// Root element shaped like mermaid-cli output; the negative min-x checks that the third viewBox number is the width.
const svgOfWidth = (width: number) => `<svg id="dbd-uji" style="max-width:${width}px" viewBox="-50 -10 ${width} 480"></svg>`;

// Writes the cached SVG each source would need, so a clean case has no cache-miss and no too-wide.
function cache(root: string, slug: string, sources: string[], svg = svgOfWidth(400)): void {
  const dir = path.join(root, "books", slug, "diagrams");
  fs.mkdirSync(dir, { recursive: true });
  for (const source of sources) fs.writeFileSync(path.join(dir, `${diagramKey(source, root)}.svg`), svg);
}

const fence = (source: string) => "```mermaid\n" + source + "\n```";

function chapter(...sources: string[]): string {
  return ["# Bab Uji", "Paragraf pembuka bab ini.", ...sources.flatMap((s) => [fence(s), "Paragraf penjelas."])].join("\n\n") + "\n";
}

// 1-based line of the n-th mermaid fence, counted from the text rather than from the parser.
function fenceLine(md: string, n: number): number {
  const lines = md.split("\n");
  const hits = lines.flatMap((l, i) => (l === "```mermaid" ? [i + 1] : []));
  return hits[n];
}

const lines = (...xs: string[]) => xs.join("\n");

const FLOW = lines(
  "flowchart LR",
  "    accTitle: Siklus PDCA",
  "    accDescr: Empat tahap PDCA berjalan berurutan lalu kembali ke awal.",
  '    A["Rencanakan (Plan)"] --> B["Kerjakan (Do)"]',
  '    B --> C["Periksa (Check)"]',
  '    C -->|"siklus berikutnya"| A',
);

const flowWith = (extra: string) => FLOW + "\n" + extra;

const XY_HEAD = lines(
  "xychart-beta",
  "    accTitle: Pendapatan per kuartal",
  "    accDescr: Pendapatan naik dari kuartal satu sampai kuartal tiga.",
);

const XY = lines(
  XY_HEAD,
  '    title "Pendapatan 2025"',
  '    x-axis "Kuartal" ["K1", "K2", "K3"]',
  '    y-axis "Juta rupiah" 0 --> 3000',
  "    bar [2170.2, 2400, 2650.5]",
  "    line [2170.2, 2400, 2650.5]",
);

const TIMELINE = lines(
  "timeline",
  "    accTitle: Linimasa kemerdekaan",
  "    accDescr: Dua peristiwa yang disebut dalam bab ini, dari 1945 sampai 1998.",
  "    title Sejarah singkat",
  "    1945 : Proklamasi",
  "    1998 : Reformasi",
);

const SEQ = lines(
  "sequenceDiagram",
  "    accTitle: Alur pembelian",
  "    accDescr: Pembeli menekan tombol lalu toko mengirim konfirmasi.",
  "    participant A as Pembeli",
  "    participant B as Toko",
);

const OPEN_QUOTE = String.fromCodePoint(0x201c);
const CLOSE_QUOTE = String.fromCodePoint(0x201d);

// One book, one chapter at src/content/01_a.md, every listed source cached.
function single(md: string, cached: string[], svg?: string): string {
  const root = makeRoot();
  addBook(root, "buku-uji", { "src/content/01_a.md": md });
  cache(root, "buku-uji", cached, svg);
  return root;
}

function rulesFor(source: string): string[] {
  const root = single(chapter(source), [source]);
  return checkDiagrams(root).violations.map((v) => v.rule);
}

afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

describe("checkDiagrams clean trees", () => {
  it("passes a valid flowchart, xychart and timeline with their SVGs cached", () => {
    const md = chapter(FLOW, XY, TIMELINE);
    const root = single(md, [FLOW, XY, TIMELINE]);
    expect(checkDiagrams(root)).toEqual({ violations: [], orphans: [] });
  });

  it("passes a tree with no diagrams even when package.json lacks the mermaid-cli devDependency", () => {
    const root = makeRoot({ withCli: false });
    addBook(root, "buku-uji", { "src/content/01_a.md": "# Bab\n\nTanpa diagram.\n" });
    expect(() => diagramKey("flowchart LR", root)).toThrow();
    expect(checkDiagrams(root)).toEqual({ violations: [], orphans: [] });
  });

  it("skips blank lines, %% comments and front matter when reading the diagram type", () => {
    const flow = lines("---", "title: Contoh", "---", "%% komentar", "", FLOW);
    const xy = lines("---", "title: Grafik penjualan", "---", XY);
    expect(checkDiagrams(single(chapter(flow, xy), [flow, xy])).violations).toEqual([]);
  });

  it("accepts the accDescr block form", () => {
    const flow = lines("flowchart LR", "    accTitle: Alur", "    accDescr {", "        Dua langkah berurutan.", "    }", "    A --> B");
    expect(rulesFor(flow)).toEqual([]);
  });

  it("does not treat a word that only starts with Anda as the pronoun", () => {
    expect(rulesFor(flowWith('    C --> D["Andalan tim"]'))).toEqual([]);
  });
});

describe("checkDiagrams rules", () => {
  it("type-not-allowed refuses mindmap and stateDiagram without -v2", () => {
    const acc = "  accTitle: Peta\n  accDescr: Peta konsep.";
    expect(rulesFor(`mindmap\n${acc}\n  root((Akar))\n    Cabang`)).toEqual(["type-not-allowed"]);
    expect(rulesFor(`stateDiagram\n${acc}\n  [*] --> A`)).toEqual(["type-not-allowed"]);
    expect(rulesFor(`stateDiagram-v2\n${acc}\n  [*] --> A`)).toEqual([]);
  });

  it("missing-acc-title", () => {
    expect(rulesFor(FLOW.replace(/\n\s*accTitle:.*$/m, ""))).toEqual(["missing-acc-title"]);
  });

  it("missing-acc-descr", () => {
    expect(rulesFor(FLOW.replace(/\n\s*accDescr:.*$/m, ""))).toEqual(["missing-acc-descr"]);
  });

  it("double-brace", () => {
    expect(rulesFor(flowWith('    C --> D{{"Keputusan"}}'))).toEqual(["double-brace"]);
  });

  it("emoji", () => {
    expect(rulesFor(flowWith('    C --> D["Selesai \u{1F600}"]'))).toEqual(["emoji"]);
  });

  it("em-dash", () => {
    expect(rulesFor(flowWith(`    C --> D["Tahap ${String.fromCodePoint(0x2014)} akhir"]`))).toEqual(["em-dash"]);
  });

  it("anda", () => {
    expect(rulesFor(flowWith('    C --> D["Anda memeriksa"]'))).toEqual(["anda"]);
  });

  it("dollar", () => {
    expect(rulesFor(flowWith('    C --> D["Biaya $5"]'))).toEqual(["dollar"]);
  });

  it.each([
    ["square", '    A["Tombol "Beli" ditekan"]'],
    ["round", '    C --> D("Tombol "Beli" ditekan")'],
    ["rhombus", '    C --> D{"Tombol "Beli" ditekan?"}'],
    ["stadium", '    C --> D(["Tombol "Beli" ditekan"])'],
    ["subroutine", '    C --> D[["Tombol "Beli" ditekan"]]'],
    ["circle", '    C --> D(("Tombol "Beli""))'],
    ["edge", '    C -->|"klik "Beli""| D'],
  ])("straight-quote flags a straight quote inside a quoted %s label", (_label, extra) => {
    expect(rulesFor(flowWith(extra))).toEqual(["straight-quote"]);
  });

  it("straight-quote passes delimiter quotes around flowchart node and edge labels", () => {
    expect(rulesFor(flowWith('    A["Biaya (Rp)"] -->|"ya"| B'))).toEqual([]);
  });

  it("straight-quote reports a flowchart once even with two offending labels", () => {
    expect(rulesFor(flowWith('    C --> D["a "b" c"]\n    D --> E["d "e" f"]'))).toEqual(["straight-quote"]);
  });

  it.each([
    ["sequence message", lines(SEQ, '    A->>B: Menekan tombol "Beli"')],
    ["sequence note", lines(SEQ, '    Note right of B: Status "lunas"')],
    ["timeline event", lines(TIMELINE, '    2024 : Kampanye "Bangga"')],
  ])("straight-quote flags a straight quote in a %s", (_label, source) => {
    expect(rulesFor(source)).toEqual(["straight-quote"]);
  });

  it("straight-quote passes curly quotes in a sequence message", () => {
    expect(rulesFor(lines(SEQ, `    A->>B: Menekan tombol ${OPEN_QUOTE}Beli${CLOSE_QUOTE}`))).toEqual([]);
  });

  it("straight-quote ignores a %% comment line in a sequence diagram", () => {
    expect(rulesFor(lines(SEQ, '    %% catatan: "draf"', "    A->>B: Bayar"))).toEqual([]);
  });

  it("straight-quote leaves pie and stateDiagram-v2 delimiter quotes alone, even after a colon", () => {
    const acc = "    accTitle: Uji\n    accDescr: Diagram uji.";
    expect(rulesFor(`pie\n${acc}\n    "Biaya: tetap" : 40\n    "Biaya: variabel" : 60`)).toEqual([]);
    expect(rulesFor(`stateDiagram-v2\n${acc}\n    state "Tahap: bayar" as S1\n    [*] --> S1`)).toEqual([]);
  });

  it.each([
    ["title", XY.replace('title "Pendapatan 2025"', "title Pendapatan 2025")],
    ["x-axis title", XY.replace('x-axis "Kuartal"', "x-axis Kuartal")],
    ["y-axis title", XY.replace('y-axis "Juta rupiah" 0', "y-axis Rupiah 0")],
    ["category", XY.replace('"K2"', "K2")],
  ])("xychart-unquoted flags an unquoted %s", (_label, source) => {
    expect(rulesFor(source)).toEqual(["xychart-unquoted"]);
  });

  it.each([
    ["bar", XY.replace("bar [2170.2, 2400, 2650.5]", "bar [2.170,2, 2400, 2650.5]")],
    ["line", XY.replace("line [2170.2, 2400, 2650.5]", "line [2170,2, 2400, 2650.5]")],
  ])("xychart-decimal flags a comma decimal in a %s series", (_label, source) => {
    expect(rulesFor(source)).toEqual(["xychart-decimal"]);
  });

  const XY_TWO = lines(XY_HEAD, '    title "Penjualan"', '    x-axis "Bulan" ["Jan", "Feb"]', '    y-axis "Unit" 0 --> 3000');

  it.each([
    ["bar", lines(XY_TWO, "    bar [1.500, 2.750]")],
    ["line", lines(XY_TWO, "    line [1.500, 2.750]")],
  ])("xychart-thousands flags a dot thousands separator in a %s series", (_label, source) => {
    expect(rulesFor(source)).toEqual(["xychart-thousands"]);
  });

  it("xychart-thousands passes one and two decimals", () => {
    expect(rulesFor(lines(XY_TWO, "    bar [2170.2, 3000.5]", "    line [1.25, 3]"))).toEqual([]);
  });

  it("xychart-thousands reports once for a negative value and a second offending series", () => {
    expect(rulesFor(lines(XY_TWO, "    bar [-1.500, 2]", "    line [1.500, 2]"))).toEqual(["xychart-thousands"]);
  });

  it("xychart-count flags a series with fewer values than categories", () => {
    expect(rulesFor(XY.replace("bar [2170.2, 2400, 2650.5]", "bar [2170.2, 2400]"))).toEqual(["xychart-count"]);
  });

  it("xychart-count ignores a numeric x-axis", () => {
    const source = XY.replace('x-axis "Kuartal" ["K1", "K2", "K3"]', 'x-axis "Tahun" 2020 --> 2025');
    expect(rulesFor(source)).toEqual([]);
  });

  it.each([
    ["init directive", lines('%%{init: {"flowchart": {"htmlLabels": false}} }%%', FLOW)],
    ["wrap directive", flowWith("    %%{wrap}%%")],
    ["front matter config key", lines("---", "title: Contoh", "config:", "  theme: dark", "---", FLOW)],
  ])("config-override flags a %s", (_label, source) => {
    expect(rulesFor(source)).toEqual(["config-override"]);
  });

  it("config-override reports once for a directive plus a front matter config key", () => {
    expect(rulesFor(lines("---", "config:", "  theme: dark", "---", "%%{wrap}%%", FLOW))).toEqual(["config-override"]);
  });

  it("config-override passes a plain %% comment, title-only front matter and config: in a label", () => {
    expect(rulesFor(lines("---", "title: Contoh", "---", "%% catatan penulis", FLOW, '    C --> D["config: aktif"]'))).toEqual([]);
  });

  it("first-block flags a diagram with only headings before it", () => {
    const md = "# Bab Uji\n\n## Sub\n\n" + fence(FLOW) + "\n\nParagraf.\n";
    const root = single(md, [FLOW]);
    const { violations } = checkDiagrams(root);
    expect(violations.map((v) => [v.rule, v.line])).toEqual([["first-block", 5]]);
  });

  it("duplicate reports the second of two identical blocks", () => {
    const md = chapter(FLOW, XY, FLOW);
    const { violations } = checkDiagrams(single(md, [FLOW, XY]));
    expect(violations.map((v) => [v.rule, v.line])).toEqual([["duplicate", fenceLine(md, 2)]]);
  });

  it("too-many reports once, at the fourth block", () => {
    const flows = [1, 2, 3, 4, 5].map((n) => flowWith(`    C --> D${n}["Langkah ${n}"]`));
    const md = chapter(...flows);
    const { violations } = checkDiagrams(single(md, flows));
    expect(violations.map((v) => [v.rule, v.line])).toEqual([["too-many", fenceLine(md, 3)]]);
  });

  it("cache-miss reports the block with no cached SVG", () => {
    const md = chapter(FLOW);
    const { violations } = checkDiagrams(single(md, []));
    expect(violations).toEqual([
      expect.objectContaining({ book: "buku-uji", file: "src/content/01_a.md", line: 5, rule: "cache-miss" }),
    ]);
  });

  it("too-wide reports a cached SVG whose root viewBox is 1001 px wide", () => {
    const md = chapter(FLOW);
    const { violations } = checkDiagrams(single(md, [FLOW], svgOfWidth(1001)));
    expect(violations.map((v) => [v.rule, v.line])).toEqual([["too-wide", fenceLine(md, 0)]]);
    expect(violations[0].message).toContain("natural width 1001 px exceeds 1000 px");
  });

  it("too-wide allows a root viewBox exactly 1000 px wide", () => {
    expect(checkDiagrams(single(chapter(FLOW), [FLOW], svgOfWidth(1000))).violations).toEqual([]);
  });

  it("too-wide reports a root svg with no viewBox as missing, even when a nested svg has one", () => {
    const svg = '<svg id="dbd-uji" style="max-width:400px"><svg viewBox="0 0 400 100"></svg></svg>';
    const { violations } = checkDiagrams(single(chapter(FLOW), [FLOW], svg));
    expect(violations.map((v) => v.rule)).toEqual(["too-wide"]);
    expect(violations[0].message).toContain("viewBox");
    expect(violations[0].message).toContain("missing");
  });

  it("too-wide ignores a wide nested svg inside a narrow root", () => {
    const svg = '<svg id="dbd-uji" viewBox="0 0 400 300"><svg viewBox="0 0 5000 100"></svg></svg>';
    expect(checkDiagrams(single(chapter(FLOW), [FLOW], svg)).violations).toEqual([]);
  });

  it("too-wide uses the exported 1000 px limit", () => {
    expect(MAX_NATURAL_WIDTH).toBe(1000);
  });

  it("a cache miss reports cache-miss only, never too-wide", () => {
    const { violations } = checkDiagrams(single(chapter(FLOW), []));
    expect(violations.map((v) => v.rule)).toEqual(["cache-miss"]);
  });
});

describe("checkDiagrams scope", () => {
  it("scans src/**/*.md and reports files relative to the book folder", () => {
    const root = makeRoot();
    addBook(root, "buku-uji", {
      "src/intro.md": chapter(FLOW),
      "src/content/bagian/02_b.md": chapter(XY),
      "src/content/catatan.txt": chapter(TIMELINE),
      "README.md": chapter(TIMELINE),
    });
    const files = checkDiagrams(root).violations.map((v) => v.file);
    expect(files.sort()).toEqual(["src/content/bagian/02_b.md", "src/intro.md"]);
  });

  it("skips folders starting with _ or . and folders without book.toml", () => {
    const root = makeRoot();
    addBook(root, "_template", { "src/content/01_a.md": chapter(FLOW) });
    addBook(root, ".tersembunyi", { "src/content/01_a.md": chapter(FLOW) });
    addBook(root, "tanpa-toml", { "src/content/01_a.md": chapter(FLOW) }, false);
    expect(checkDiagrams(root)).toEqual({ violations: [], orphans: [] });
  });

  it("the book option limits the scan to that book", () => {
    const root = makeRoot();
    addBook(root, "buku-a", { "src/content/01_a.md": chapter(FLOW) });
    addBook(root, "buku-b", { "src/content/01_a.md": chapter(FLOW), "diagrams/aaaaaaaaaaaa.svg": "<svg/>" });
    const all = checkDiagrams(root);
    expect(all.violations.map((v) => v.book)).toEqual(["buku-a", "buku-b"]);
    const onlyA = checkDiagrams(root, { book: "buku-a" });
    expect(onlyA).toEqual({ violations: [expect.objectContaining({ book: "buku-a" })], orphans: [] });
  });

  it("throws when the book option names no book", () => {
    const root = makeRoot();
    addBook(root, "buku-a", { "src/content/01_a.md": "# Bab\n" });
    expect(() => checkDiagrams(root, { book: "salah-ketik" })).toThrow(/salah-ketik/);
  });

  // Orphans are root-relative paths with forward slashes.
  it("reports an unused cached SVG as an orphan without a violation", () => {
    const root = single(chapter(FLOW), [FLOW]);
    const dir = path.join(root, "books", "buku-uji", "diagrams");
    fs.writeFileSync(path.join(dir, "000000000000.svg"), "<svg/>");
    fs.writeFileSync(path.join(dir, "catatan.txt"), "bukan svg");
    expect(checkDiagrams(root)).toEqual({ violations: [], orphans: ["books/buku-uji/diagrams/000000000000.svg"] });
  });
});

describe("check-diagrams CLI", () => {
  const run = (...args: string[]) => {
    const r = Bun.spawnSync([process.execPath, "run", script, ...args], { stdout: "pipe", stderr: "pipe" });
    return { code: r.exitCode, out: r.stdout.toString() };
  };

  it("exits 1 and prints book/file:line [rule] on a violation", () => {
    const root = single(chapter(FLOW), []);
    const { code, out } = run("--root", root);
    expect(code).toBe(1);
    expect(out).toContain("buku-uji/src/content/01_a.md:5 [cache-miss] ");
  });

  it("exits 0 on a clean tree and prints an orphan as a warning", () => {
    const root = single(chapter(FLOW), [FLOW]);
    fs.writeFileSync(path.join(root, "books", "buku-uji", "diagrams", "000000000000.svg"), "<svg/>");
    const { code, out } = run("--root", root);
    expect(code).toBe(0);
    expect(out).toMatch(/warn.*books\/buku-uji\/diagrams\/000000000000\.svg/i);
  });

  it("--book limits the CLI scan", () => {
    const root = makeRoot();
    addBook(root, "rusak", { "src/content/01_a.md": chapter(FLOW) });
    addBook(root, "bersih", { "src/content/01_a.md": "# Bab\n\nTanpa diagram.\n" });
    expect(run("--root", root).code).toBe(1);
    expect(run("--root", root, "--book", "bersih").code).toBe(0);
  });
});
