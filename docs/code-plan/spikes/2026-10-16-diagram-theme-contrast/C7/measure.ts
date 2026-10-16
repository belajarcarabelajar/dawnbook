// C7 (H8) measurement: the same cached SVGs measured (a) inside real built chapter pages served on
// 127.0.0.1:8807 with the full mdBook cascade, scripts and MathJax, theme chosen through localStorage
// 'mdbook-theme' before load, and (b) in the static probe.ts page (variables.css + shared-header.css,
// class switched synchronously). Labels are compared element by element.
// Usage: bun measure.ts      (server.ts must be running; setup-site.ts must have run)
import fs from "node:fs";
import path from "node:path";
import puppeteer, { type Page } from "puppeteer";

const BASE = "http://127.0.0.1:8807";
const SITE = "/tmp/dtc-C7/site";
const M = "/home/belajarcarabelajar/Proyek/dawnbook";
const MIN = 3;
const THEMES = ["light", "rust", "coal", "navy", "ayu"];
const manifest: { book: string; chapter: string; svgFile: string }[] = JSON.parse(fs.readFileSync("/tmp/dtc-C7/manifest.json", "utf8"));
const variablesCss = fs.readFileSync(path.join(SITE, "books/state-of-flow/css/variables-8adf115d.css"), "utf8");
const sharedCss = fs.readFileSync(path.join(M, "books/shared-header.css"), "utf8");
const CHROME = path.join(process.env.HOME!, ".cache/puppeteer/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Item = { kind: string; idx: number; text: string; fill?: string; font?: string; bg?: string; ratio?: number; offscreen?: boolean; clipped?: boolean };

// Runs in the page. Same compositing logic as probe.ts, plus: shapes restricted to this SVG, backdrop
// taken from the nearest ancestor with a painted background, HTML labels in foreignObject included.
export function measure(i = 0) {
  const svgEl = document.querySelectorAll(".dawnbook-diagram svg")[i] as SVGSVGElement;
  svgEl.scrollIntoView({ block: "center", inline: "center" });
  const parse = (c: string): number[] | null => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  };
  const over = (top: number[], a: number, under: number[]) => [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a));
  const lum = (c: number[]) => {
    const [r, g, b] = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: number[], b: number[]) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  let back = { rgb: [255, 255, 255], from: "default" };
  for (let n: Element | null = svgEl.parentElement; n; n = n.parentElement) {
    const c = parse(getComputedStyle(n).backgroundColor);
    if (c && c[3] > 0) {
      back = { rgb: c.slice(0, 3), from: `${n.tagName.toLowerCase()}${n.id ? "#" + n.id : ""}.${String(n.className).trim().split(/\s+/).join(".")} a=${c[3]}` };
      break;
    }
  }
  const alphaOf = (el: Element) => {
    let a = 1;
    for (let n: Element | null = el; n && n !== svgEl.parentElement; n = n.parentElement) a *= Number(getComputedStyle(n).opacity);
    return a;
  };
  const dr = svgEl.parentElement!.getBoundingClientRect();
  const items: Item[] = [];
  const texts = Array.from(svgEl.querySelectorAll("text"));
  const htmlLabels = Array.from(svgEl.querySelectorAll("foreignObject *")).filter((n) => n.children.length === 0 && (n.textContent ?? "").trim());
  for (const [kind, list] of [["text", texts], ["html", htmlLabels]] as [string, Element[]][]) {
    list.forEach((el, idx) => {
      const label = (el.textContent ?? "").trim().slice(0, 40);
      const r = el.getBoundingClientRect();
      if (!label || r.width === 0 || r.height === 0) return;
      const cs = getComputedStyle(el);
      if (cs.visibility !== "visible" || cs.display === "none") return;
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      if (cx < 0 || cy < 0 || cx >= innerWidth || cy >= innerHeight) return void items.push({ kind, idx, text: label, offscreen: true });
      const fgRaw = parse(kind === "text" ? cs.fill : cs.color);
      if (!fgRaw) return;
      const stack = document.elementsFromPoint(cx, cy).filter((n) => {
        if (n === el || !svgEl.contains(n) || n.closest("text") || !(n instanceof SVGGeometryElement)) return false;
        const s = getComputedStyle(n);
        return s.fill !== "none" && s.visibility === "visible" && Number(s.fillOpacity) > 0;
      });
      let bg = back.rgb.slice();
      for (const n of stack.reverse()) {
        const s = getComputedStyle(n);
        const c = parse(s.fill);
        if (c) bg = over(c, c[3] * Number(s.fillOpacity) * alphaOf(n), bg);
      }
      const fo = kind === "text" ? Number(cs.fillOpacity) : 1;
      const fg = over(fgRaw, fgRaw[3] * fo * alphaOf(el), bg);
      items.push({
        kind, idx, text: label, fill: kind === "text" ? cs.fill : cs.color, font: `${cs.fontSize} ${cs.fontFamily.slice(0, 30)}`,
        bg: `rgb(${bg.map(Math.round).join(",")})`, ratio: Math.round(ratio(fg, bg) * 100) / 100,
        clipped: cx < dr.left || cx > dr.right || cy < dr.top || cy > dr.bottom,
      });
    });
  }
  const h = document.documentElement, hcs = getComputedStyle(h);
  return {
    items,
    state: {
      htmlClass: h.className, htmlOpacity: hcs.opacity, htmlVisibility: hcs.visibility, backdrop: `${back.from} rgb(${back.rgb.join(",")})`,
      bodyBg: getComputedStyle(document.body).backgroundColor, mathjax: !!(window as any).MathJax?.Hub, svgId: svgEl.id,
      svgSize: `${Math.round(svgEl.getBoundingClientRect().width)}x${Math.round(svgEl.getBoundingClientRect().height)}`, foreignObjects: svgEl.querySelectorAll("foreignObject").length,
    },
  };
}

const INHERIT = new Set(["color", "fill", "stroke", "font-family", "font-size", "font-weight", "visibility", "fill-opacity", "stroke-opacity", "text-shadow", "-webkit-text-fill-color", "opacity", "filter", "mix-blend-mode"]);
export async function cdpRules(page: Page, svgId: string | string[], sels0?: string[], cap = 60) {
  const ids = Array.isArray(svgId) ? svgId : [svgId];
  const cdp = await page.createCDPSession();
  const sheets = new Map<string, any>();
  cdp.on("CSS.styleSheetAdded", ({ header }: any) => sheets.set(header.styleSheetId, header));
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
  const out = new Map<string, { props: Set<string>; on: Set<string> }>();
  const sels = sels0 ?? [".dawnbook-diagram", ".dawnbook-diagram svg", ".dawnbook-diagram svg g", ".dawnbook-diagram svg text", ".dawnbook-diagram svg tspan", ".dawnbook-diagram svg rect", ".dawnbook-diagram svg path", ".dawnbook-diagram svg polygon", ".dawnbook-diagram svg line", ".dawnbook-diagram svg circle", ".dawnbook-diagram foreignObject *"];
  for (const sel of sels) {
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: sel });
    for (const nodeId of nodeIds.slice(0, cap)) {
      const m: any = await cdp.send("CSS.getMatchedStylesForNode", { nodeId });
      const groups = [{ rules: m.matchedCSSRules ?? [], inh: false }, ...(m.inherited ?? []).map((x: any) => ({ rules: x.matchedCSSRules ?? [], inh: true }))];
      for (const { rules, inh } of groups) {
        for (const { rule } of rules) {
          if (rule.origin !== "regular") continue;
          const selector = rule.selectorList.text;
          if (ids.some((id) => selector.includes(`#${id}`))) continue; // Mermaid's own scoped rules
          const props = rule.style.cssProperties.filter((p: any) => p.text).map((p: any) => p.name).filter((p: string) => !inh || INHERIT.has(p));
          if (!props.length) continue;
          const h = sheets.get(rule.styleSheetId);
          const url = (h?.sourceURL ?? "?").replace(BASE, "");
          const line = (rule.style.range?.startLine ?? -1) + (h?.isInline ? h.startLine : 0) + 1;
          const key = `${url}${h?.isInline ? " (inline <style>)" : ""}:${line}  ${selector}${inh ? "  [inherited]" : ""}`;
          if (!out.has(key)) out.set(key, { props: new Set(), on: new Set() });
          props.forEach((p: string) => out.get(key)!.props.add(p));
          out.get(key)!.on.add(sel.replace(".dawnbook-diagram", "div"));
        }
      }
    }
  }
  await cdp.detach();
  return [...out].map(([k, v]) => `${k}  {${[...v.props].join(", ")}}  on: ${[...v.on].join(" | ")}`);
}

if (import.meta.main) {
const browser = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const results: any = { real: {}, static: {}, states: [], rules: {}, failedRequests: new Set<string>(), pageErrors: new Set<string>() };

// (b) static probe page, identical construction to probe.ts.
const sp = await browser.newPage();
await sp.setViewport({ width: 900, height: 2400 });
for (const { book, chapter, svgFile } of manifest) {
  const svg = fs.readFileSync(path.join(M, "books", book, "diagrams", svgFile), "utf8");
  const html = `<!doctype html><html class="light js"><head><style>${variablesCss}</style><style>html,body{margin:0;background:var(--bg);color:var(--fg)}${sharedCss}</style></head><body><div class="content"><main><div class="dawnbook-diagram">${svg}</div></main></div></body></html>`;
  await sp.setContent(html, { waitUntil: "load" });
  for (const theme of THEMES) {
    await sp.evaluate((t: string) => { document.documentElement.className = `${t} js`; }, theme);
    results.static[`${chapter}|${theme}`] = (await sp.evaluate(measure)).items;
  }
}
await sp.close();

// (a) real chapter pages, fresh browser context per page and theme.
for (const { book, chapter } of manifest) {
  for (const theme of THEMES) {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: 1280, height: 3000 });
    await page.evaluateOnNewDocument((t: string) => { try { localStorage.setItem("mdbook-theme", t); } catch {} }, theme);
    page.on("requestfailed", (r) => results.failedRequests.add(`${r.url().slice(0, 90)} ${r.failure()?.errorText}`));
    page.on("pageerror", (e) => results.pageErrors.add(String(e).slice(0, 140)));
    await page.goto(`${BASE}/books/${book}/content/${chapter}.html`, { waitUntil: "load", timeout: 60000 });
    await sleep(1500);
    const pre = await page.evaluate(() => { const c = getComputedStyle(document.documentElement); return { o: c.opacity, v: c.visibility }; });
    let forced = false;
    if (pre.o === "0" || pre.v === "hidden") {
      forced = true;
      await page.evaluate(() => { document.documentElement.style.opacity = "1"; document.documentElement.style.visibility = "visible"; });
    }
    const where = await page.evaluate(() => location.pathname + location.search);
    if (!(await page.$(".dawnbook-diagram svg"))) {
      results.states.push({ chapter: chapter.slice(0, 12), theme, forced, preOpacity: pre.o, error: `no diagram at ${where}` });
      await ctx.close();
      continue;
    }
    const r = await page.evaluate(measure);
    results.real[`${chapter}|${theme}`] = r.items;
    results.states.push({ chapter: chapter.slice(0, 12), theme, where, forced, preOpacity: pre.o, preVisibility: pre.v, ...r.state });
    if (theme === "light") results.rules[chapter.slice(0, 12)] = await cdpRules(page, r.state.svgId);
    await ctx.close();
  }
}
await browser.close();

// Compare.
const summary: Record<string, any> = {};
const fails: string[] = [];
const fillDiffs: string[] = [];
const ratioDiffs: string[] = [];
for (const theme of THEMES) summary[theme] = { realLabels: 0, realFail: 0, staticLabels: 0, staticFail: 0, realOffscreen: 0, realClipped: 0 };
for (const key of Object.keys(results.static)) {
  const [chapter, theme] = key.split("|");
  const st: Item[] = results.static[key], re: Item[] = results.real[key] ?? [];
  for (const [mode, list] of [["static", st], ["real", re]] as [string, Item[]][]) {
    for (const it of list) {
      if (it.offscreen) { if (mode === "real") summary[theme].realOffscreen++; continue; }
      summary[theme][`${mode}Labels`]++;
      if (mode === "real" && it.clipped) summary[theme].realClipped++;
      if (it.ratio! < MIN) { summary[theme][`${mode}Fail`]++; fails.push(`${mode} ${theme} ${chapter.slice(0, 12)} ${it.kind}#${it.idx} "${it.text}" ${it.ratio} fg ${it.fill} bg ${it.bg}`); }
    }
  }
  const sIdx = new Map(st.map((i) => [`${i.kind}#${i.idx}`, i]));
  for (const it of re) {
    const s = sIdx.get(`${it.kind}#${it.idx}`);
    if (!s) { if (!it.offscreen) fillDiffs.push(`${theme} ${chapter.slice(0, 12)} ${it.kind}#${it.idx} missing in static`); continue; }
    if (it.offscreen || s.offscreen) continue;
    if (s.fill !== it.fill) fillDiffs.push(`${theme} ${chapter.slice(0, 12)} ${it.kind}#${it.idx} "${it.text}" static ${s.fill} real ${it.fill}`);
    if (Math.abs(s.ratio! - it.ratio!) > 0.05) ratioDiffs.push(`${theme} ${chapter.slice(0, 12)} ${it.kind}#${it.idx} "${it.text}" static ${s.ratio} (bg ${s.bg}) real ${it.ratio} (bg ${it.bg})`);
  }
}
const fontDiffs = new Set<string>();
for (const key of Object.keys(results.static)) {
  const sIdx = new Map((results.static[key] as Item[]).map((i) => [`${i.kind}#${i.idx}`, i.font]));
  for (const it of results.real[key] as Item[]) if (it.font && sIdx.get(`${it.kind}#${it.idx}`) !== it.font) fontDiffs.add(`${key.split("|")[0].slice(0, 12)} static "${sIdx.get(`${it.kind}#${it.idx}`)}" real "${it.font}"`);
}
const report = { summary, fails, fillDiffs, ratioDiffs: ratioDiffs.slice(0, 40), ratioDiffCount: ratioDiffs.length, fontDiffs: [...fontDiffs].slice(0, 10), states: results.states, rules: results.rules, failedRequests: [...results.failedRequests], pageErrors: [...results.pageErrors] };
fs.writeFileSync(path.join(import.meta.dir, "results.json"), JSON.stringify({ ...report, raw: { real: results.real, static: results.static } }, null, 2));
console.log(JSON.stringify(report, null, 1));
process.exit(fails.length || fillDiffs.length || ratioDiffs.length ? 1 : 0);
}
