// Answers: under one locked Mermaid config, which diagram types render correctly and deterministically, and how does a syntax error surface?
import { homedir } from "node:os";
import { mkdirSync, rmSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const HERE = import.meta.dir;
const OUT = "/tmp/mermaid-spike/p2";
const MMDC = `${homedir()}/.bun/bin/mmdc`;
const CHROME = `${homedir()}/.cache/puppeteer/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell`;
const CLI_DIR = `${homedir()}/.bun/install/global/node_modules/@mermaid-js/mermaid-cli/src/`;
const CFG_PATH = join(HERE, "mermaid-config.json");
const LOCKED = JSON.parse(readFileSync(CFG_PATH, "utf8"));
const PUP_PATH = join(OUT, "puppeteer.json");

for (const d of ["cli", "api", "labels", "wrap", "cfg"]) mkdirSync(join(OUT, d), { recursive: true });
writeFileSync(PUP_PATH, JSON.stringify({ executablePath: CHROME }));

const { renderMermaid } = await import(join(CLI_DIR, "index.js"));
const puppeteer = (await import(Bun.resolveSync("puppeteer", CLI_DIR))).default;
const mermaidUmd = join(Bun.resolveSync("mermaid", CLI_DIR), "..", "mermaid.min.js");

const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

function texts(svg: string): string[] {
  return [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map((m) =>
    decode(m[1].replace(/<\/tspan>\s*<tspan/g, "</tspan> <tspan").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim(),
  );
}

function inspect(svg: string) {
  return {
    bytes: Buffer.byteLength(svg),
    fo: (svg.match(/<foreignObject/gi) ?? []).length,
    p: (svg.match(/<p[\s>]/g) ?? []).length,
    title: /<title\b/.test(svg),
    desc: /<desc\b/.test(svg),
    labelled: /aria-labelledby="/.test(svg),
    described: /aria-describedby="/.test(svg),
    role: svg.match(/aria-roledescription="([^"]*)"/)?.[1] ?? "-",
    errMarker: /Syntax error in text|aria-roledescription="error"/.test(svg),
  };
}

function mmdc(input: string, output: string, svgId: string, cfg = CFG_PATH, quiet = true) {
  rmSync(output, { force: true });
  const args = ["timeout", "120s", MMDC, "-p", PUP_PATH, "-c", cfg, "-I", svgId, "-b", "transparent", "--no-font-embed"];
  if (quiet) args.push("-q");
  args.push("-i", input, "-o", output);
  const t = performance.now();
  const r = Bun.spawnSync(args, { stderr: "pipe", stdout: "pipe" });
  return { code: r.exitCode, ms: Math.round(performance.now() - t), stderr: r.stderr.toString(), wrote: existsSync(output) };
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "shell" });
async function api(def: string, svgId: string, cfg: object = LOCKED) {
  const warns: string[] = [];
  const orig = console.warn;
  console.warn = (...a: unknown[]) => warns.push(a.join(" "));
  const t = performance.now();
  try {
    const r = await renderMermaid(browser, def, "svg", { mermaidConfig: cfg, backgroundColor: "transparent", fontEmbed: false, svgId });
    return { ok: true, ms: Math.round(performance.now() - t), svg: new TextDecoder().decode(r.data), err: "", warns };
  } catch (e) {
    return { ok: false, ms: Math.round(performance.now() - t), svg: "", err: String((e as Error).message).split("\n").slice(0, 3).join(" | "), warns };
  } finally {
    console.warn = orig;
  }
}

const results: Record<string, unknown> = {};
const fixtures = readdirSync(HERE).filter((f) => /^\d\d-.*\.mmd$/.test(f) && !f.startsWith("9")).sort();

// 1. Matrix through the CLI, two renders each.
console.log("## Matrix (mmdc, locked config)\n");
console.log("| fixture | exit | ms (1st/2nd) | bytes | fO | <p> | title | desc | aria-lb/db | roledescription | byte-identical |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|");
const matrix: unknown[] = [];
for (const f of fixtures) {
  const id = f.replace(/\.mmd$/, "");
  const a = join(OUT, "cli", `${id}.1.svg`), b = join(OUT, "cli", `${id}.2.svg`);
  const r1 = mmdc(join(HERE, f), a, `d-${id}`);
  const r2 = mmdc(join(HERE, f), b, `d-${id}`);
  const same = r1.wrote && r2.wrote ? Bun.spawnSync(["cmp", "-s", a, b]).exitCode === 0 : false;
  const i = r1.wrote ? inspect(readFileSync(a, "utf8")) : null;
  matrix.push({ id, r1, r2, same, i });
  console.log(
    i
      ? `| ${id} | ${r1.code}/${r2.code} | ${r1.ms}/${r2.ms} | ${i.bytes} | ${i.fo} | ${i.p} | ${i.title} | ${i.desc} | ${i.labelled}/${i.described} | ${i.role} | ${same} |`
      : `| ${id} | ${r1.code}/${r2.code} | ${r1.ms}/${r2.ms} | - | - | - | - | - | - | - | ${same} | ${r1.stderr.trim().split("\n")[0].slice(0, 120)}`,
  );
}
results.matrix = matrix;

// 2. Locked-config keys: flip each one and see if the output changes.
console.log("\n## Config key probes (JS API, 01-flowchart unless noted)\n");
const flow = readFileSync(join(HERE, "01-flowchart.mmd"), "utf8");
const secProbe = `flowchart LR\n    A["<b>tebal</b> <img src=x onerror=alert(1)>"] --> B[Tautan]\n    click B "https://contoh.id" "judul"\n    click A callback\n`;
const base = await api(flow, "cfg");
const baseSec = await api(secProbe, "cfg");
const variants: [string, object, string][] = [
  ["theme default", { ...LOCKED, theme: "default" }, flow],
  ["htmlLabels true", { ...LOCKED, htmlLabels: true }, flow],
  ["layout omitted", (({ layout, ...r }) => r)(LOCKED), flow],
  ["layout elk", { ...LOCKED, layout: "elk" }, flow],
  ["securityLevel loose (probe)", { ...LOCKED, securityLevel: "loose" }, secProbe],
  ["look classic (not in locked config)", { ...LOCKED, look: "classic" }, flow],
  ["unknown key",{ ...LOCKED, kunciPalsu: 1 }, flow],
];
for (const [name, cfg, def] of variants) {
  const r = await api(def, "cfg", cfg);
  const ref = def === secProbe ? baseSec : base;
  const i = r.ok ? inspect(r.svg) : null;
  console.log(`- ${name}: ok=${r.ok} differsFromLocked=${r.ok ? r.svg !== ref.svg : "-"} fO=${i?.fo ?? "-"} ${r.err} ${r.warns.slice(0, 2).join(" ; ").slice(0, 160)}`);
}
console.log(`- securityLevel strict probe texts: ${JSON.stringify(texts(baseSec.svg).slice(0, 2))} hasOnerror=${/onerror/.test(baseSec.svg)} hasHref=${/contoh\.id/.test(baseSec.svg)}`);
for (const det of [true, false]) {
  const cfg = { ...LOCKED, deterministicIds: det };
  const x = await api(flow, "det", cfg), y = await api(flow, "det", cfg);
  console.log(`- deterministicIds ${det}: two API renders identical=${x.svg === y.svg}`);
}
const cliVsApi = readFileSync(join(OUT, "cli", "01-flowchart.1.svg"), "utf8") === (await api(flow, "d-01-flowchart")).svg;
console.log(`- CLI output == API output for 01-flowchart (same svgId): ${cliVsApi}`);
const loud = mmdc(join(HERE, "01-flowchart.mmd"), join(OUT, "cfg", "loud.svg"), "loud", CFG_PATH, false);
console.log(`- mmdc without -q: exit=${loud.code} stderr=${JSON.stringify(loud.stderr.trim().slice(0, 200))}`);

// 3. Label characters authors will type.
console.log("\n## Label characters\n");
const fc = (node: string, edge = "-->") => `flowchart LR\n    accTitle: Uji label\n    accDescr: Uji karakter label\n    ${node} ${edge} B[Selesai]\n`;
const xy = (o: { title?: string; cats?: string; y?: string; data?: string }) =>
  `xychart\n    accTitle: Uji label\n    accDescr: Uji karakter label\n    title ${o.title ?? '"Judul"'}\n    x-axis [${o.cats ?? "K1, K2"}]\n    y-axis ${o.y ?? '"Nilai"'} 0 --> 4000\n    bar [${o.data ?? "10, 20"}]\n`;
const cases: [string, string, string][] = [
  ["fc colon bare", fc("A[Rasio: 2 banding 1]"), "Rasio: 2 banding 1"],
  ["fc colon quoted", fc('A["Rasio: 2 banding 1"]'), "Rasio: 2 banding 1"],
  ["fc percent bare", fc("A[Naik 50% per tahun]"), "Naik 50% per tahun"],
  ["fc percent quoted", fc('A["Naik 50% per tahun"]'), "Naik 50% per tahun"],
  ["fc dquote bare", fc('A[Ia berkata "halo"]'), 'Ia berkata "halo"'],
  ["fc dquote nested", fc('A["Ia berkata "halo""]'), 'Ia berkata "halo"'],
  ["fc dquote #quot;", fc('A["Ia berkata #quot;halo#quot;"]'), 'Ia berkata "halo"'],
  ["fc dquote curly bare", fc("A[Ia berkata “halo”]"), "Ia berkata “halo”"],
  ["fc parens bare", fc("A[Biaya (Rp)]"), "Biaya (Rp)"],
  ["fc parens quoted", fc('A["Biaya (Rp)"]'), "Biaya (Rp)"],
  ["fc amp bare", fc("A[Untung & rugi]"), "Untung & rugi"],
  ["fc amp quoted", fc('A["Untung & rugi"]'), "Untung & rugi"],
  ["fc amp #amp;", fc('A["Untung #amp; rugi"]'), "Untung & rugi"],
  ["fc lt bare", fc("A[x < 5]"), "x < 5"],
  ["fc lt quoted", fc('A["x < 5"]'), "x < 5"],
  ["fc lt #lt;", fc('A["x #lt; 5"]'), "x < 5"],
  ["fc lt no-space quoted", fc('A["x<5 dan y>2"]'), "x<5 dan y>2"],
  ["fc decimal bare", fc("A[Rp 2.170,2 triliun]"), "Rp 2.170,2 triliun"],
  ["fc Anda bare", fc("A[Anda membaca bab ini]"), "Anda membaca bab ini"],
  ["fc edge bare", fc("A[Mulai]", "-->|Naik 50%: (cepat)|"), "Naik 50%: (cepat)"],
  ["fc edge quoted", fc("A[Mulai]", '-->|"Naik 50%: (cepat)"|'), "Naik 50%: (cepat)"],
  ["xy title colon bare", xy({ title: "Penjualan: 2026" }), "Penjualan: 2026"],
  ["xy title colon quoted", xy({ title: '"Penjualan: 2026"' }), "Penjualan: 2026"],
  ["xy title percent bare", xy({ title: "Naik 50% per tahun" }), "Naik 50% per tahun"],
  ["xy title percent quoted", xy({ title: '"Naik 50% per tahun"' }), "Naik 50% per tahun"],
  ["xy title parens bare", xy({ title: "Biaya (Rp)" }), "Biaya (Rp)"],
  ["xy title amp quoted", xy({ title: '"Untung & rugi"' }), "Untung & rugi"],
  ["xy title lt quoted", xy({ title: '"x < 5"' }), "x < 5"],
  ["xy title #lt;", xy({ title: '"x #lt; 5"' }), "x < 5"],
  ["xy title #quot;",xy({ title: '"Ia berkata #quot;halo#quot;"' }), 'Ia berkata "halo"'],
  ["xy title Anda bare", xy({ title: "Anda membaca" }), "Anda membaca"],
  ["xy cats parens bare", xy({ cats: "K1 (Jan), K2 (Feb)" }), "K1 (Jan)"],
  ["xy cats parens quoted", xy({ cats: '"K1 (Jan)", "K2 (Feb)"' }), "K1 (Jan)"],
  ["xy cats decimal bare", xy({ cats: "2.170,2, 3.000,5" }), "2.170,2"],
  ["xy cats decimal quoted", xy({ cats: '"2.170,2", "3.000,5"' }), "2.170,2"],
  ["xy y-title %() bare", xy({ y: "Persen (%)" }), "Persen (%)"],
  ["xy y-title %() quoted", xy({ y: '"Persen (%)"' }), "Persen (%)"],
  ["xy data comma decimal", xy({ data: "2.170,2, 3.000,5" }), ""],
  ["xy data dot decimal", xy({ data: "2170.2, 3000.5" }), ""],
];
const labelRows: unknown[] = [];
for (const [name, def, expect] of cases) {
  writeFileSync(join(OUT, "labels", `${name.replace(/[^a-z0-9]+/gi, "-")}.mmd`), def);
  const r = await api(def, "lbl");
  const t = r.ok ? texts(r.svg) : [];
  const bars = r.ok ? (r.svg.match(/class="bar-plot-0"[\s\S]*?<\/g>/)?.[0].match(/<rect/g) ?? []).length : 0;
  const hit = expect ? t.some((x) => x.includes(expect)) : null;
  const note = r.ok ? (expect ? (hit ? "" : `texts=${JSON.stringify(t.filter((x) => x && x !== "Selesai").slice(0, 4))}`) : `bars=${bars}`) : r.err.slice(0, 110);
  labelRows.push({ name, ok: r.ok, hit, bars, note });
  console.log(`| ${name} | ${r.ok ? "renders" : "ERROR"} | ${hit === null ? "-" : hit ? "text exact" : "TEXT WRONG"} | ${note} |`);
}
results.labels = labelRows;

// 4. Long label wrapping with htmlLabels false.
console.log("\n## Long label (66 chars)\n");
const longPlain = readFileSync(join(HERE, "91-long-label.mmd"), "utf8");
const longMd = readFileSync(join(HERE, "92-long-label-markdown.mmd"), "utf8");
const rowsOf = (svg: string) => {
  const seg = svg.match(/flowchart-A-0"[\s\S]*?(?=<g class="node|$)/)?.[0] ?? "";
  return { rows: (seg.match(/text-outer-tspan/g) ?? []).length, width: svg.match(/viewBox="[\d.-]+ [\d.-]+ ([\d.]+)/)?.[1] };
};
const wraps: [string, string, object][] = [
  ["plain, locked", longPlain, LOCKED],
  ["markdown, locked", longMd, LOCKED],
  ["plain, wrap true", longPlain, { ...LOCKED, wrap: true }],
  ["plain, markdownAutoWrap true", longPlain, { ...LOCKED, markdownAutoWrap: true }],
  ["plain, flowchart.wrappingWidth 150", longPlain, { ...LOCKED, flowchart: { wrappingWidth: 150 } }],
  ["plain, flowchart.wrappingWidth 300", longPlain, { ...LOCKED, flowchart: { wrappingWidth: 300 } }],
  ["markdown, flowchart.wrappingWidth 150",longMd, { ...LOCKED, flowchart: { wrappingWidth: 150 } }],
  ["markdown, markdownAutoWrap false", longMd, { ...LOCKED, markdownAutoWrap: false }],
  ["plain with <br/>", longPlain.replace("latihan wajib", "latihan<br/>wajib"), LOCKED],
];
for (const [name, def, cfg] of wraps) {
  const r = await api(def, "wrap", cfg);
  if (r.ok) writeFileSync(join(OUT, "wrap", `${name.replace(/[^a-z0-9]+/gi, "-")}.svg`), r.svg);
  const w = r.ok ? rowsOf(r.svg) : null;
  console.log(`- ${name}: ok=${r.ok} rows=${w?.rows ?? "-"} svgWidth=${w?.width ?? "-"} ${r.err}`);
}

// 5. Syntax error: CLI, JS API, and the in-page error SVG.
console.log("\n## Syntax error\n");
const errIn = join(HERE, "90-syntax-error.mmd"), errOut = join(OUT, "cli", "90-syntax-error.svg");
const ce = mmdc(errIn, errOut, "err");
console.log(`- mmdc -q: exit=${ce.code} ms=${ce.ms} svgWritten=${ce.wrote} stderr=${JSON.stringify(ce.stderr.trim().split("\n").slice(0, 3).join(" | ").slice(0, 300))}`);
const ae = await api(readFileSync(errIn, "utf8"), "err");
console.log(`- renderMermaid: ok=${ae.ok} threw=${JSON.stringify(ae.err.slice(0, 200))}`);
const ue = await api("diagramtidakada\n    A --> B\n", "err");
console.log(`- unknown type via renderMermaid: ok=${ue.ok} threw=${JSON.stringify(ue.err.slice(0, 160))}`);
const page = await browser.newPage();
await page.addScriptTag({ path: mermaidUmd });
const probe = await page.evaluate(
  async (def: string, cfg: object) => {
    // @ts-ignore mermaid is the UMD global injected above
    const m = window.mermaid;
    m.initialize({ startOnLoad: false, ...cfg });
    try {
      await m.render("perr", def);
      return { threw: false, svg: "" };
    } catch (e) {
      return { threw: true, msg: String((e as Error).message).split("\n")[0], svg: document.getElementById("perr")?.outerHTML ?? "" };
    }
  },
  readFileSync(errIn, "utf8"),
  LOCKED,
);
await page.close();
console.log(`- in-page mermaid.render: threw=${probe.threw} errorSvgLeftInDom=${probe.svg.length > 0} role=${inspect(probe.svg).role} texts=${JSON.stringify(texts(probe.svg).slice(0, 2))}`);

// 6. Shared-browser batch through the JS API.
console.log("\n## Shared-browser batch (JS API)\n");
const defs = fixtures.map((f) => [f.replace(/\.mmd$/, ""), readFileSync(join(HERE, f), "utf8")] as const);
for (const pass of ["sequential warm-up", "sequential"]) {
  const t = performance.now();
  const per: string[] = [];
  for (const [id, def] of defs) {
    const r = await api(def, `b-${id}`);
    per.push(`${id}=${r.ms}${r.ok ? "" : "!ERR"}`);
    if (pass === "sequential") writeFileSync(join(OUT, "api", `${id}.svg`), r.svg);
  }
  console.log(`- ${pass}: total=${Math.round(performance.now() - t)}ms ${per.join(" ")}`);
}
{
  const t = performance.now();
  const rs = await Promise.all(defs.map(([id, def]) => api(def, `p-${id}`)));
  console.log(`- parallel (${defs.length} pages): total=${Math.round(performance.now() - t)}ms allOk=${rs.every((r) => r.ok)}`);
}
const apiVsCli = defs.filter(([id]) => existsSync(join(OUT, "cli", `${id}.1.svg`)) && readFileSync(join(OUT, "api", `${id}.svg`), "utf8").replaceAll(`b-${id}`, `d-${id}`) === readFileSync(join(OUT, "cli", `${id}.1.svg`), "utf8"));
console.log(`- API SVG equals CLI SVG after id swap: ${apiVsCli.length}/${defs.length}`);

await browser.close();
writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 1));
