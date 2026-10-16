// C3 harness (H2): late <html> theme switch after inline Mermaid SVG first paint,
// compared with a fresh render in the final theme. Usage:
//   bun /tmp/dtc-C3/harness.ts webkit|chromium
import { webkit, chromium, devices } from "playwright";
import { PNG } from "pngjs";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const ENGINE = (process.argv[2] ?? "webkit") as "webkit" | "chromium";
const M = "/home/belajarcarabelajar/Proyek/dawnbook";
const CSS = `${M}/output/books/neuroplastisitas-dalam-belajar/css`;
const PORT = 8803;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = `/tmp/dtc-C3/out/${ENGINE}`;
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
const THEMES = ["navy", "coal"];

function html(type: string, mode: string, theme: string): string {
  const svg = readFileSync(TYPES[type], "utf8");
  // mode: late = start light, switch after first paint; fresh = start in final theme
  const initial = mode === "late" ? "light sidebar-visible" : `${theme} js sidebar-visible`;
  const doSwitch = mode === "late"
    ? `var h=document.documentElement;h.classList.remove('light');h.classList.add('${theme}');h.classList.add('js');`
    : "";
  return `<!DOCTYPE html><html lang="id" class="${initial}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/css/variables.css"><link rel="stylesheet" href="/css/general.css">
<link rel="stylesheet" href="/css/chrome.css"><link rel="stylesheet" href="/css/shared-header.css">
</head><body><main style="max-width:750px;margin:0 auto;padding:10px"><div class="dawnbook-diagram">${svg}</div></main>
<script>
window.__s={phase:'init'};
addEventListener('load',function(){requestAnimationFrame(function(){requestAnimationFrame(function(){
  window.__s.phase='painted';
  setTimeout(function(){${doSwitch}window.__s.phase='switched';},300);
});});});
</script></body></html>`;
}

const server = Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",
  fetch(req) {
    const u = new URL(req.url);
    const css = (p: string) => new Response(Bun.file(p), { headers: { "content-type": "text/css" } });
    if (u.pathname === "/css/variables.css") return css(`${CSS}/variables-8adf115d.css`);
    if (u.pathname === "/css/general.css") return css(`${CSS}/general-e96d0476.css`);
    if (u.pathname === "/css/chrome.css") return css(`${CSS}/chrome-d279d366.css`);
    if (u.pathname === "/css/shared-header.css") return css(`${M}/books/shared-header.css`);
    if (u.pathname === "/p") {
      const q = u.searchParams;
      return new Response(html(q.get("type")!, q.get("mode")!, q.get("theme")!), { headers: { "content-type": "text/html" } });
    }
    return new Response("nf", { status: 404 });
  },
});

const PROBE = `(() => {
  const svg = document.querySelector('.dawnbook-diagram svg');
  const pick = [];
  for (const sel of ['text','rect','path','line','circle','polygon']) {
    const el = svg.querySelector(sel); if (el) pick.push(el);
  }
  return pick.map(el => { const cs = getComputedStyle(el);
    return { sel: el.tagName + (el.getAttribute('class') ? '.' + el.getAttribute('class').split(' ')[0] : ''), fill: cs.fill, stroke: cs.stroke, color: cs.color }; });
})()`;

type Shot = { png: Buffer; styles: any[]; box: any; vh: number };
async function load(ctx: any, type: string, mode: string, theme: string, full: boolean): Promise<Shot> {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/p?type=${type}&mode=${mode}&theme=${theme}`, { waitUntil: "load" });
  await page.waitForFunction(() => (window as any).__s.phase === "switched", null, { timeout: 10000 });
  await page.waitForTimeout(500);
  const box = await page.locator(".dawnbook-diagram").boundingBox();
  const vh = page.viewportSize()!.height;
  const styles = await page.evaluate(PROBE);
  const png = full
    ? await page.screenshot({ fullPage: true, animations: "disabled" })
    : await page.screenshot({ clip: { x: 0, y: 0, width: page.viewportSize()!.width, height: Math.min(vh, Math.ceil(box!.y + box!.height + 10)) }, animations: "disabled" });
  await page.close();
  return { png, styles, box, vh };
}

function diff(a: Buffer, b: Buffer) {
  const A = PNG.sync.read(a), B = PNG.sync.read(b);
  if (A.width !== B.width || A.height !== B.height) return { size: `${A.width}x${A.height} vs ${B.width}x${B.height}`, any: -1, gt16: -1, total: 0 };
  let any = 0, gt16 = 0;
  for (let i = 0; i < A.data.length; i += 4) {
    const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
    if (d > 0) any++; if (d > 16) gt16++;
  }
  return { size: `${A.width}x${A.height}`, any, gt16, total: A.width * A.height };
}

const browser = ENGINE === "webkit"
  ? await webkit.launch({ headless: true })
  : await chromium.launch({ headless: true, executablePath: `${process.env.HOME}/.cache/puppeteer/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell` });
console.log(`[C3] engine=${ENGINE} version=${browser.version()}`);

const VARIANTS: Record<string, any> = {
  "desktop-dpr1": { viewport: { width: 800, height: 2400 }, deviceScaleFactor: 1 },
  "desktop-dpr2": { viewport: { width: 800, height: 2400 }, deviceScaleFactor: 2 },
  "iphone13": { ...devices["iPhone 13"], defaultBrowserType: undefined },
};

const rows: any[] = [];
for (const [vname, vopts] of Object.entries(VARIANTS)) {
  const ctx = await browser.newContext(vopts);
  await ctx.route("**/*", (r: any) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
  const full = vname === "iphone13";
  for (const type of Object.keys(TYPES)) {
    const light = await load(ctx, type, "fresh", "light", full);
    for (const theme of THEMES) {
      const late = await load(ctx, type, "late", theme, full);
      const fresh = await load(ctx, type, "fresh", theme, full);
      const fresh2 = await load(ctx, type, "fresh", theme, full);
      writeFileSync(`${OUT}/${vname}-${type}-${theme}-late.png`, late.png);
      writeFileSync(`${OUT}/${vname}-${type}-${theme}-fresh.png`, fresh.png);
      const styleMismatch = late.styles.filter((s: any, i: number) => JSON.stringify(s) !== JSON.stringify(fresh.styles[i])).length;
      const lightVsFinalStyles = light.styles.filter((s: any, i: number) => JSON.stringify(s) !== JSON.stringify(fresh.styles[i])).length;
      const row = {
        variant: vname, type, theme,
        lateVsFresh: diff(late.png, fresh.png),
        freshVsFresh2: diff(fresh.png, fresh2.png),
        lightVsFresh: diff(light.png, fresh.png),
        styleMismatchLateVsFresh: `${styleMismatch}/${late.styles.length}`,
        styleChangedLightVsFinal: `${lightVsFinalStyles}/${light.styles.length}`,
        sampleLate: late.styles[0], sampleFresh: fresh.styles[0],
        fitsViewport: full || late.box.y + late.box.height <= late.vh,
      };
      rows.push(row);
      console.log(`[C3] ${ENGINE} ${vname} ${type} ${theme} late-vs-fresh any=${row.lateVsFresh.any} gt16=${row.lateVsFresh.gt16} | fresh-vs-fresh2 any=${row.freshVsFresh2.any} | light-vs-final gt16=${row.lightVsFresh.gt16}/${row.lightVsFresh.total} | styles late!=fresh ${row.styleMismatchLateVsFresh}, light!=final ${row.styleChangedLightVsFinal} | fits=${row.fitsViewport}`);
    }
  }
  await ctx.close();
}
writeFileSync(`${OUT}/results.json`, JSON.stringify(rows, null, 1));
await browser.close();
server.stop(true);
const bad = rows.filter((r) => r.lateVsFresh.any !== 0 || r.styleMismatchLateVsFresh[0] !== "0");
console.log(`[C3] ${ENGINE} rows=${rows.length} late-differs=${bad.length}`);
process.exit(bad.length ? 1 : 0);
