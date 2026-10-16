// C3 harness 2 (H2): same late-switch pages as harness.ts, but measured on compositor
// screencast frames (Playwright tracing screenshots), not on Page.snapshotRect, which
// repaints the document fresh and so cannot show a stale on-screen paint.
//   bun /tmp/dtc-C3/harness2.ts webkit|chromium
import { webkit, chromium, devices } from "playwright";
import jpeg from "jpeg-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const ENGINE = (process.argv[2] ?? "webkit") as "webkit" | "chromium";
const M = "/home/belajarcarabelajar/Proyek/dawnbook";
const CSS = `${M}/output/books/neuroplastisitas-dalam-belajar/css`;
const PORT = 8803;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = `/tmp/dtc-C3/out2/${ENGINE}`;
mkdirSync(OUT, { recursive: true });
const TYPES: Record<string, string> = {
  flowchart: `${M}/books/mekanisme-koping-dan-manajemen-stres/diagrams/5d5acd760f56.svg`,
  timeline: `${M}/books/metodologi-microteaching/diagrams/132eb9d65363.svg`,
  xychart: `${M}/books/nudge-theory/diagrams/abf7759a2e5f.svg`,
  stateDiagram: `${M}/books/teori-permainan-game-theory/diagrams/3f0c533b9768.svg`,
  sequence: `${M}/books/iklan-digital-dan-penargetan-algoritma/diagrams/a4cb0644a9c2.svg`,
  quadrantChart: `${M}/books/psikologi-positif/diagrams/49aec8f08293.svg`,
  pie: `${M}/books/quarter-life-crisis/diagrams/5d38f794a704.svg`,
};
function html(type: string, mode: string, theme: string): string {
  const svg = readFileSync(TYPES[type], "utf8");
  const initial = mode === "late" ? "light sidebar-visible" : `${theme} js sidebar-visible`;
  const sw = mode === "late" ? `var h=document.documentElement;h.classList.remove('light');h.classList.add('${theme}');h.classList.add('js');` : "";
  return `<!DOCTYPE html><html lang="id" class="${initial}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/css/variables.css"><link rel="stylesheet" href="/css/general.css">
<link rel="stylesheet" href="/css/chrome.css"><link rel="stylesheet" href="/css/shared-header.css">
</head><body><main style="max-width:750px;margin:0 auto;padding:10px"><div class="dawnbook-diagram">${svg}</div></main>
<script>window.__s={phase:'init'};addEventListener('load',function(){requestAnimationFrame(function(){requestAnimationFrame(function(){
window.__s.phase='painted';window.__s.tp=performance.now();setTimeout(function(){${sw}window.__s.phase='switched';window.__s.ts=performance.now();},300);});});});</script></body></html>`;
}
const server = Bun.serve({
  port: PORT, hostname: "127.0.0.1",
  fetch(req) {
    const u = new URL(req.url);
    const css = (p: string) => new Response(Bun.file(p), { headers: { "content-type": "text/css" } });
    if (u.pathname === "/css/variables.css") return css(`${CSS}/variables-8adf115d.css`);
    if (u.pathname === "/css/general.css") return css(`${CSS}/general-e96d0476.css`);
    if (u.pathname === "/css/chrome.css") return css(`${CSS}/chrome-d279d366.css`);
    if (u.pathname === "/css/shared-header.css") return css(`${M}/books/shared-header.css`);
    if (u.pathname === "/p") { const q = u.searchParams; return new Response(html(q.get("type")!, q.get("mode")!, q.get("theme")!), { headers: { "content-type": "text/html" } }); }
    return new Response("nf", { status: 404 });
  },
});
const browser = ENGINE === "webkit" ? await webkit.launch({ headless: true })
  : await chromium.launch({ headless: true, executablePath: `${process.env.HOME}/.cache/puppeteer/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell` });
console.log(`[C3b] engine=${ENGINE} version=${browser.version()}`);

type Frame = { w: number; h: number; data: Uint8Array; ts: number };
async function frames(vopts: any, type: string, mode: string, theme: string, tag: string): Promise<{ frames: Frame[]; meta: any }> {
  const ctx = await browser.newContext(vopts);
  await ctx.route("**/*", (r: any) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
  await ctx.tracing.start({ screenshots: true, snapshots: false });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/p?type=${type}&mode=${mode}&theme=${theme}`, { waitUntil: "load" });
  await page.waitForFunction(() => (window as any).__s.phase === "switched", null, { timeout: 10000 });
  await page.waitForTimeout(500);
  const meta = await page.evaluate(() => (window as any).__s);
  const zip = `${OUT}/${tag}.zip`;
  await ctx.tracing.stop({ path: zip });
  await ctx.close();
  const trace = Bun.spawnSync(["unzip", "-p", zip, "trace.trace"]).stdout.toString();
  const ev = trace.split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((e) => e.type === "screencast-frame");
  const out: Frame[] = [];
  for (const e of ev) {
    const buf = Bun.spawnSync(["unzip", "-p", zip, e.file ?? `resources/${e.sha1}`]).stdout;
    const img = jpeg.decode(buf, { useTArray: true });
    out.push({ w: img.width, h: img.height, data: img.data, ts: e.timestamp });
  }
  return { frames: out, meta };
}
const lum = (f: Frame) => { let s = 0; for (let i = 0; i < f.data.length; i += 4) s += 0.2126 * f.data[i] + 0.7152 * f.data[i + 1] + 0.0722 * f.data[i + 2]; return +(s / (f.w * f.h)).toFixed(1); };
function cmp(a?: Frame, b?: Frame) {
  if (!a || !b) return { mad: -1, gt40: -1 };
  if (a.w !== b.w || a.h !== b.h) return { mad: -2, gt40: -2, size: `${a.w}x${a.h} vs ${b.w}x${b.h}` };
  let s = 0, n = 0;
  for (let i = 0; i < a.data.length; i += 4) { const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2])); s += d; if (d > 40) n++; }
  return { mad: +(s / (a.w * a.h)).toFixed(2), gt40: +((100 * n) / (a.w * a.h)).toFixed(2) };
}
const VARIANTS: Record<string, any> = {
  "desktop-dpr1": { viewport: { width: 800, height: 2400 }, deviceScaleFactor: 1 },
  "iphone13": { ...devices["iPhone 13"], defaultBrowserType: undefined },
};
const rows: any[] = [];
for (const [vname, vopts] of Object.entries(VARIANTS)) {
  for (const type of Object.keys(TYPES)) {
    const theme = "navy";
    const L = await frames(vopts, type, "fresh", "light", `${vname}-${type}-light`);
    const A = await frames(vopts, type, "late", theme, `${vname}-${type}-late`);
    const F = await frames(vopts, type, "fresh", theme, `${vname}-${type}-fresh`);
    const F2 = await frames(vopts, type, "fresh", theme, `${vname}-${type}-fresh2`);
    const last = (x: { frames: Frame[] }) => x.frames[x.frames.length - 1];
    const row = {
      variant: vname, type, theme,
      lateFrames: A.frames.length, lateFirstLum: A.frames[0] ? lum(A.frames[0]) : null, lateLastLum: last(A) ? lum(last(A)) : null,
      freshLastLum: last(F) ? lum(last(F)) : null, lightLastLum: last(L) ? lum(last(L)) : null,
      lateLastVsFreshLast: cmp(last(A), last(F)), freshVsFresh2: cmp(last(F), last(F2)), lightVsFresh: cmp(last(L), last(F)),
      switchAfterPaintMs: Math.round(A.meta.ts - A.meta.tp),
    };
    rows.push(row);
    console.log(`[C3b] ${ENGINE} ${vname} ${type} frames=${row.lateFrames} lum late first=${row.lateFirstLum} last=${row.lateLastLum} fresh=${row.freshLastLum} light=${row.lightLastLum} | late-vs-fresh mad=${row.lateLastVsFreshLast.mad} gt40%=${row.lateLastVsFreshLast.gt40} | fresh-vs-fresh2 mad=${row.freshVsFresh2.mad} | light-vs-fresh mad=${row.lightVsFresh.mad} gt40%=${row.lightVsFresh.gt40} | switch+${row.switchAfterPaintMs}ms`);
  }
}
writeFileSync(`${OUT}/results.json`, JSON.stringify(rows, null, 1));
await browser.close();
server.stop(true);
// Stale = the last presented frame of the late page is closer to light than to the fresh final theme.
const stale = rows.filter((r) => r.lateLastVsFreshLast.mad < 0 || r.lateLastVsFreshLast.gt40 > 1);
console.log(`[C3b] ${ENGINE} rows=${rows.length} stale=${stale.length}`);
process.exit(stale.length ? 1 : 0);
