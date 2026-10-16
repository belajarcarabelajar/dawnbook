// C2 / H3 probe: does a late <html> theme-class switch leave an inline Mermaid SVG painted in the
// first theme? For one cached SVG per diagram type, compare a "late" render (load as
// `light sidebar-visible`, wait for first paint, switch to `<final> js`, wait 500 ms) with a "fresh"
// render (loaded as `<final> js` from the start). Pixel diff via sharp, plus computed-style diff.
//
// Usage: bun late-switch.ts --mode shell|chrome|headful [--runs 2] [--finals navy,coal] [--dark] [--out /tmp/dtc-C2]
//   --dark  = emulate prefers-color-scheme: dark (pre-js paint then follows the html:not(.js) media block)
//   shell   = chrome-headless-shell
//   chrome  = full Chrome, new headless mode
//   headful = full Chrome with a window (run under xvfb-run)
// Exit code: 0 when every late render matches its fresh render (H3 false), 1 when any differs
// (H3 confirmed for that case), 2 when the positive control fails to detect a theme difference.
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";
import sharp from "sharp";

const args = process.argv.slice(2);
const opt = (n: string, d?: string) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};
const mode = opt("--mode", "shell")!;
const runs = Number(opt("--runs", "2"));
const dark = args.includes("--dark");
const outDir = path.join(opt("--out", "/tmp/dtc-C2")!, mode + (dark ? "-dark" : ""));
fs.mkdirSync(outDir, { recursive: true });

const M = "/home/belajarcarabelajar/Proyek/dawnbook";
const HOME = process.env.HOME!;
const BIN = {
  shell: `${HOME}/.cache/puppeteer/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell`,
  chrome: `${HOME}/.cache/puppeteer/chrome/linux-153.0.8010.36/chrome-linux64/chrome`,
  headful: `${HOME}/.cache/puppeteer/chrome/linux-153.0.8010.36/chrome-linux64/chrome`,
}[mode]!;

const SVGS = [
  "mekanisme-koping-dan-manajemen-stres/diagrams/5d5acd760f56.svg", // flowchart-v2
  "iklan-digital-dan-penargetan-algoritma/diagrams/a4cb0644a9c2.svg", // sequence
  "teori-permainan-game-theory/diagrams/3f0c533b9768.svg", // stateDiagram
  "quarter-life-crisis/diagrams/5d38f794a704.svg", // pie
  "psikologi-positif/diagrams/49aec8f08293.svg", // quadrantChart
  "state-of-flow/diagrams/89fdb4768425.svg", // quadrantChart (F3 low-contrast case)
  "nudge-theory/diagrams/abf7759a2e5f.svg", // xychart
  "metodologi-microteaching/diagrams/132eb9d65363.svg", // timeline
];
const FINALS = opt("--finals", "navy,coal")!.split(",");
const PIXEL_THRESHOLD = 16; // a pixel "differs" when any RGBA channel differs by more than 16/255

const variablesCss = fs.readFileSync(`${M}/output/books/neuroplastisitas-dalam-belajar/css/variables-8adf115d.css`, "utf8");
const sharedCss = fs.readFileSync(`${M}/books/shared-header.css`, "utf8");
const svgText = SVGS.map((s) => fs.readFileSync(`${M}/books/${s}`, "utf8"));

const server = Bun.serve({
  port: 8802,
  hostname: "127.0.0.1",
  fetch(req) {
    const u = new URL(req.url);
    if (u.pathname === "/css/variables.css") return new Response(variablesCss, { headers: { "content-type": "text/css" } });
    if (u.pathname === "/css/shared-header.css") return new Response(sharedCss, { headers: { "content-type": "text/css" } });
    if (u.pathname === "/page") {
      const i = Number(u.searchParams.get("svg"));
      const cls = u.searchParams.get("cls")!;
      const html = `<!DOCTYPE html><html lang="id" class="${cls}" dir="ltr"><head><meta charset="UTF-8"><link rel="stylesheet" href="/css/variables.css"><link rel="stylesheet" href="/css/shared-header.css"><style>html,body{margin:0;background:var(--bg);color:var(--fg)}</style></head><body><div class="content"><main><p>Paragraf pengantar.</p><div class="dawnbook-diagram">${svgText[i]}</div></main></div></body></html>`;
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }
    return new Response("not found", { status: 404 });
  },
});

const launchArgs = ["--no-sandbox", "--window-size=1100,1700", "--force-device-scale-factor=1", "--hide-scrollbars"];
const browser = await puppeteer.launch({
  executablePath: BIN,
  headless: mode === "headful" ? false : mode === "shell" ? "shell" : true,
  args: launchArgs,
  defaultViewport: { width: 1000, height: 1600, deviceScaleFactor: 1 },
});
const version = await browser.version();

const waitFirstPaint = (page: any) =>
  page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 300)))));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const styles = (page: any): Promise<string[]> =>
  page.evaluate(() => {
    const svg = document.querySelector(".dawnbook-diagram svg")!;
    const skip = new Set(["style", "defs", "title", "desc", "g", "marker", "svg"]);
    return Array.from(svg.querySelectorAll("*"))
      .filter((e) => !skip.has(e.tagName.toLowerCase()))
      .map((e) => {
        const cs = getComputedStyle(e);
        return `${e.tagName}.${(e.getAttribute("class") ?? "").slice(0, 40)}|fill=${cs.fill}|stroke=${cs.stroke}|color=${cs.color}|bg=${cs.backgroundColor}|op=${cs.opacity}`;
      });
  });

const meta = (page: any) =>
  page.evaluate(() => ({
    cls: document.documentElement.className,
    type: document.querySelector(".dawnbook-diagram svg")!.getAttribute("aria-roledescription"),
    bodyBg: getComputedStyle(document.body).backgroundColor,
  }));

async function shot(page: any, name: string) {
  const el = await page.$(".dawnbook-diagram");
  const buf = (await el.screenshot({ path: path.join(outDir, `${name}.png`) })) as Uint8Array;
  return buf;
}

async function decode(buf: Uint8Array) {
  const { data, info } = await sharp(Buffer.from(buf)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

async function diff(a: Uint8Array, b: Uint8Array) {
  const A = await decode(a);
  const B = await decode(b);
  if (A.w !== B.w || A.h !== B.h) return { sizeMismatch: `${A.w}x${A.h} vs ${B.w}x${B.h}`, over: -1, any: -1, maxCh: -1, total: 0 };
  let over = 0, any = 0, maxCh = 0;
  for (let p = 0; p < A.data.length; p += 4) {
    let m = 0;
    for (let c = 0; c < 4; c++) m = Math.max(m, Math.abs(A.data[p + c] - B.data[p + c]));
    if (m > 0) any++;
    if (m > PIXEL_THRESHOLD) over++;
    if (m > maxCh) maxCh = m;
  }
  return { over, any, maxCh, total: A.w * A.h };
}

async function render(i: number, cls: string, name: string, lateTo?: string, shotBefore = false, classList = false) {
  const page = await browser.newPage();
  if (dark) await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await page.goto(`http://127.0.0.1:8802/page?svg=${i}&cls=${encodeURIComponent(cls)}`, { waitUntil: "load" });
  await waitFirstPaint(page);
  let before: Uint8Array | undefined;
  if (lateTo) {
    if (shotBefore) before = await shot(page, `${name}-before`);
    await page.evaluate(
      (c: string, cl: boolean) => {
        const h = document.documentElement;
        if (!cl) h.className = c;
        else {
          // mdBook 0.5 bootstrap order: drop light, add the stored theme, add js (sidebar-visible stays)
          h.classList.remove("light");
          h.classList.add(c.split(" ")[0]);
          h.classList.add("js");
        }
      },
      lateTo,
      classList,
    );
  }
  await sleep(500);
  const png = await shot(page, name);
  const st = await styles(page);
  const m = await meta(page);
  await page.close();
  return { png, st, m, before };
}

const rows: any[] = [];
let anyStale = false;
let controlFailed = false;
for (let i = 0; i < SVGS.length; i++) {
  const tag = path.basename(SVGS[i], ".svg");
  const freshLight = await render(i, "light js", `${tag}-fresh-light`);
  for (const fin of FINALS) {
    const fresh = await render(i, `${fin} js`, `${tag}-fresh-${fin}`);
    const fresh2 = await render(i, `${fin} js`, `${tag}-fresh2-${fin}`);
    const freshSV = await render(i, `sidebar-visible ${fin} js`, `${tag}-freshsv-${fin}`);
    const noise = await diff(fresh.png, fresh2.png);
    const control = await diff(freshLight.png, fresh.png);
    if (control.over <= 0) controlFailed = true;
    for (let r = 0; r < runs; r++) {
      for (const variant of ["late", "late-shot", "late-classlist"]) {
        const late = await render(i, "light sidebar-visible", `${tag}-${variant}-${fin}-r${r}`, `${fin} js`, variant === "late-shot", variant === "late-classlist");
        const ref = variant === "late-classlist" ? freshSV : fresh;
        const d = await diff(late.png, ref.png);
        let styleDiffs = 0;
        const examples: string[] = [];
        const n = Math.max(late.st.length, ref.st.length);
        for (let k = 0; k < n; k++) {
          if (late.st[k] !== ref.st[k]) {
            styleDiffs++;
            if (examples.length < 3) examples.push(`late=${late.st[k]} fresh=${ref.st[k]}`);
          }
        }
        let beforeVsLight: any = null;
        if (late.before) beforeVsLight = (await diff(late.before, freshLight.png)).over;
        const stale = d.over !== 0 || styleDiffs !== 0 || !!(d as any).sizeMismatch;
        if (stale) anyStale = true;
        rows.push({
          svg: SVGS[i], type: fresh.m.type, final: fin, run: r, variant,
          lateClass: late.m.cls, lateBodyBg: late.m.bodyBg, freshBodyBg: fresh.m.bodyBg,
          pxOver: d.over, pxAny: d.any, maxCh: d.maxCh, pxTotal: d.total, sizeMismatch: (d as any).sizeMismatch,
          noiseOver: noise.over, noiseAny: noise.any, controlOver: control.over,
          beforeShotVsFreshLightOver: beforeVsLight, styleCount: fresh.st.length, styleDiffs, examples, stale,
        });
      }
    }
  }
}

fs.writeFileSync(path.join(outDir, "result.json"), JSON.stringify({ mode, bin: BIN, version, threshold: PIXEL_THRESHOLD, rows }, null, 2));
console.log(`mode=${mode} dark=${dark} finals=${FINALS} version=${version} threshold>${PIXEL_THRESHOLD}/255 runs=${runs}`);
console.log("type | final | variant | run | pxOver(late vs fresh) | pxAny | maxCh | noiseOver | controlOver(light vs final) | beforeShotVsLight | styleDiffs/styleCount");
for (const r of rows)
  console.log(
    `${r.type} ${path.basename(r.svg)} | ${r.final} | ${r.variant} | ${r.run} | ${r.sizeMismatch ?? r.pxOver}/${r.pxTotal} | ${r.pxAny} | ${r.maxCh} | ${r.noiseOver} | ${r.controlOver} | ${r.beforeShotVsFreshLightOver ?? "-"} | ${r.styleDiffs}/${r.styleCount}${r.examples.length ? " ex: " + r.examples[0] : ""}`,
  );
await browser.close();
server.stop(true);
const code = controlFailed ? 2 : anyStale ? 1 : 0;
console.log(`stale cases: ${rows.filter((r) => r.stale).length}/${rows.length}; controlFailed=${controlFailed}; exit=${code}`);
process.exit(code);
