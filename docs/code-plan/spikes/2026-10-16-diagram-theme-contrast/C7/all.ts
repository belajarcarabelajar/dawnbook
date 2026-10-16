// C7 generalisation: every cached SVG of every book inlined into ONE real built chapter page
// (copy of state-of-flow 04 with its own diagram, written as 99_all.html under /tmp/dtc-C7/site),
// measured per theme in the real cascade, then compared element by element with the static
// probe.ts construction of the same SVG. Also lists every page CSS rule that matches any SVG node.
// Usage: bun all.ts   (server.ts running on 8807)
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";
import { measure, cdpRules } from "./measure.ts";

const BASE = "http://127.0.0.1:8807";
const SITE = "/tmp/dtc-C7/site";
const M = "/home/belajarcarabelajar/Proyek/dawnbook";
const THEMES = ["light", "rust", "coal", "navy", "ayu"];
const CHROME = path.join(process.env.HOME!, ".cache/puppeteer/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const variablesCss = fs.readFileSync(path.join(SITE, "books/state-of-flow/css/variables-8adf115d.css"), "utf8");
const sharedCss = fs.readFileSync(path.join(M, "books/shared-header.css"), "utf8");

const svgs: { key: string; svg: string }[] = [];
for (const book of fs.readdirSync(path.join(M, "books")).sort()) {
  const dir = path.join(M, "books", book, "diagrams");
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).sort()) if (f.endsWith(".svg")) svgs.push({ key: `${book}/${f}`, svg: fs.readFileSync(path.join(dir, f), "utf8").trim() });
}
const base = fs.readFileSync(path.join(SITE, "books/state-of-flow/content/04_neurobiologi-di-balik-kondisi-alir.html"), "utf8");
const own = "state-of-flow/0c5e175bdc88.svg";
const order = [own, ...svgs.map((s) => s.key).filter((k) => k !== own)];
const extra = svgs.filter((s) => s.key !== own).map((s) => `\n<div class="dawnbook-diagram">${s.svg}</div>\n`).join("");
const at = base.indexOf("</div>", base.indexOf('<div class="dawnbook-diagram">')) ; // end of the existing diagram div is after its </svg>
const svgEnd = base.indexOf("</svg>", base.indexOf('<div class="dawnbook-diagram">')) + "</svg></div>".length;
fs.writeFileSync(path.join(SITE, "books/state-of-flow/content/99_all.html"), base.slice(0, svgEnd) + extra + base.slice(svgEnd));
void at;

type Item = { kind: string; idx: number; text: string; fill?: string; bg?: string; ratio?: number; offscreen?: boolean };
const browser = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const real: Record<string, Item[]> = {}, stat: Record<string, Item[]> = {};
const states: unknown[] = [];
let rules: string[] = [];
for (const theme of THEMES) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1280, height: 3000 });
  await page.evaluateOnNewDocument((t: string) => { try { localStorage.setItem("mdbook-theme", t); } catch {} }, theme);
  await page.goto(`${BASE}/books/state-of-flow/content/99_all.html`, { waitUntil: "load", timeout: 90000 });
  await sleep(1500);
  const pre = await page.evaluate(() => { const c = getComputedStyle(document.documentElement); return `${c.opacity}/${c.visibility}`; });
  const forced = pre !== "1/visible";
  if (forced) await page.evaluate(() => { document.documentElement.style.opacity = "1"; document.documentElement.style.visibility = "visible"; });
  const n = await page.evaluate(() => document.querySelectorAll(".dawnbook-diagram svg").length);
  for (let i = 0; i < n; i++) {
    const r = await page.evaluate(measure, i);
    real[`${order[i]}|${theme}`] = r.items;
    if (i === 0) states.push({ theme, pre, forced, diagrams: n, htmlClass: r.state.htmlClass, mathjax: r.state.mathjax, backdrop: r.state.backdrop });
  }
  if (theme === "light") {
    const ids = await page.evaluate(() => Array.from(document.querySelectorAll(".dawnbook-diagram svg")).map((s) => s.id));
    rules = await cdpRules(page, ids, [".dawnbook-diagram", ".dawnbook-diagram svg", ".dawnbook-diagram svg *"], 100000);
  }
  await ctx.close();
}
const sp = await browser.newPage();
await sp.setViewport({ width: 900, height: 2400 });
for (const { key, svg } of svgs) {
  await sp.setContent(`<!doctype html><html class="light js"><head><style>${variablesCss}</style><style>html,body{margin:0;background:var(--bg);color:var(--fg)}${sharedCss}</style></head><body><div class="content"><main><div class="dawnbook-diagram">${svg}</div></main></div></body></html>`, { waitUntil: "load" });
  for (const theme of THEMES) {
    await sp.evaluate((t: string) => { document.documentElement.className = `${t} js`; }, theme);
    stat[`${key}|${theme}`] = (await sp.evaluate(measure, 0)).items;
  }
}
await browser.close();

const summary: Record<string, any> = {};
for (const t of THEMES) summary[t] = { realLabels: 0, realFail: 0, realOffscreen: 0, staticLabels: 0, staticFail: 0, fillDiff: 0, ratioDiff: 0, htmlLabels: 0 };
const fails: string[] = [], diffs: string[] = [];
for (const k of Object.keys(stat)) {
  const [file, theme] = k.split("|");
  const s = summary[theme];
  const sIdx = new Map(stat[k].map((i) => [`${i.kind}#${i.idx}`, i]));
  for (const it of stat[k]) if (!it.offscreen) { s.staticLabels++; if (it.ratio! < 3) { s.staticFail++; fails.push(`static ${theme} ${file} "${it.text}" ${it.ratio}`); } }
  for (const it of real[k] ?? []) {
    if (it.offscreen) { s.realOffscreen++; continue; }
    s.realLabels++;
    if (it.kind === "html") s.htmlLabels++;
    if (it.ratio! < 3) { s.realFail++; fails.push(`real   ${theme} ${file} "${it.text}" ${it.ratio} fg ${it.fill} bg ${it.bg}`); }
    const st = sIdx.get(`${it.kind}#${it.idx}`);
    if (!st || st.offscreen) continue;
    if (st.fill !== it.fill) { s.fillDiff++; diffs.push(`fill ${theme} ${file} "${it.text}" static ${st.fill} real ${it.fill}`); }
    if (Math.abs(st.ratio! - it.ratio!) > 0.05) { s.ratioDiff++; diffs.push(`ratio ${theme} ${file} "${it.text}" static ${st.ratio} bg ${st.bg} real ${it.ratio} bg ${it.bg}`); }
  }
}
const out = { svgs: svgs.length, summary, fails, diffCount: diffs.length, diffs: diffs.slice(0, 30), states, rules };
fs.writeFileSync(path.join(import.meta.dir, "results-all.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
process.exit(fails.length || diffs.length ? 1 : 0);
