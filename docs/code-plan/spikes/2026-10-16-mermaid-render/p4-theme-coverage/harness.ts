// Question: does every allowed Mermaid type keep text contrast >= 3.0 and visible marks in all five mdBook themes at 1280 and 375 px?
// Usage: bun run harness.ts [--no-shots] [--only=name,name]
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const HERE = import.meta.dir;
const WT = resolve(HERE, "../../../../..");
const SPIKE = resolve(HERE, "..");
const OUT = "/tmp/mermaid-spike/p4";
const ROOT = join(OUT, "root");
const SHOTS = join(OUT, "shots");
const BOOK = join(ROOT, "books", "p4-fixture");
const THEMES = ["light", "rust", "coal", "navy", "ayu"] as const;
const WIDTHS = [1280, 375] as const;
const MIN_RATIO = 3.0;

const args = process.argv.slice(2);
const noShots = args.includes("--no-shots");
const only = args.find((a) => a.startsWith("--only="))?.slice(7).split(",");

const { renderBooks } = await import(join(WT, "scripts/render-diagrams.ts"));
const { findDiagramBlocks } = await import(join(WT, "scripts/diagrams/extract.ts"));
const { diagramKey, cachePath } = await import(join(WT, "scripts/diagrams/cache.ts"));

interface Fixture {
  name: string;
  type: string;
  source: string;
}

function typeOf(source: string): string {
  const head = source.split("\n").find((l) => l.trim() !== "")!.trim().split(/\s+/)[0];
  if (head === "flowchart" || head === "graph") return "flowchart";
  if (head === "sequenceDiagram") return "sequence";
  if (head === "stateDiagram-v2") return "state";
  if (head === "quadrantChart") return "quadrant";
  if (head.startsWith("xychart")) {
    const bar = /^\s*bar\b/m.test(source);
    const line = /^\s*line\b/m.test(source);
    return bar && line ? "xychart-combo" : bar ? "xychart-bar" : "xychart-line";
  }
  return head;
}

function collectFixtures(): Fixture[] {
  const list: Fixture[] = [];
  const p2 = ["01-flowchart", "02-sequence", "03-state", "04-timeline", "06-pie", "07-quadrant", "08-xychart-bar", "10-xychart-line"];
  for (const n of p2) {
    const source = readFileSync(join(SPIKE, "p2-types", `${n}.mmd`), "utf8").trim();
    list.push({ name: `p2-${n}`, type: typeOf(source), source });
  }
  const fixDir = join(HERE, "fixtures");
  for (const f of readdirSync(fixDir).filter((f) => f.endsWith(".mmd")).sort()) {
    const source = readFileSync(join(fixDir, f), "utf8").trim();
    list.push({ name: `p4-${basename(f, ".mmd")}`, type: typeOf(source), source });
  }
  for (const slug of ["nudge-theory", "iklan-digital-dan-penargetan-algoritma"]) {
    const dir = join(WT, "books", slug, "src", "content");
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
      const blocks = findDiagramBlocks(readFileSync(join(dir, f), "utf8"));
      blocks.forEach((b: { source: string }, i: number) => {
        const chapter = f.slice(0, 2);
        list.push({ name: `pilot-${slug.split("-")[0]}${chapter}-${i + 1}`, type: typeOf(b.source), source: b.source });
      });
    }
  }
  return only ? list.filter((f) => only.some((o) => f.name.includes(o))) : list;
}

function prepareRoot(fixtures: Fixture[]): void {
  mkdirSync(join(ROOT, "scripts", "diagrams"), { recursive: true });
  mkdirSync(join(BOOK, "src"), { recursive: true });
  cpSync(join(WT, "package.json"), join(ROOT, "package.json"));
  for (const f of ["render-config.json", "theme.css"]) cpSync(join(WT, "scripts/diagrams", f), join(ROOT, "scripts/diagrams", f));
  writeFileSync(join(BOOK, "book.toml"), '[book]\ntitle = "p4 fixture"\n');
  const md = ["# P4 fixture", ""];
  for (const f of fixtures) md.push(`## ${f.name}`, "", "```mermaid", f.source, "```", "");
  writeFileSync(join(BOOK, "src", "chapter.md"), md.join("\n"));
}

function cssLinks(): string {
  const cssDir = join(WT, "output/books/nudge-theory/css");
  const pick = (prefix: string) => readdirSync(cssDir).find((n) => n.startsWith(prefix))!;
  const hrefs = ["variables-", "general-", "chrome-"].map((p) => join(cssDir, pick(p)));
  hrefs.push(join(WT, "books/shared-header.css"));
  return hrefs.map((h) => `<link rel="stylesheet" href="file://${h}">`).join("\n");
}

function writePage(fixtures: Fixture[]): string {
  const parts: string[] = [];
  for (const f of fixtures) {
    const svg = readFileSync(cachePath(BOOK, diagramKey(f.source, ROOT)), "utf8").trim();
    parts.push(`<h3 class="p4-label">${f.name} (${f.type})</h3>\n<div class="dawnbook-diagram" data-name="${f.name}" data-type="${f.type}">${svg}</div>`);
  }
  // mdBook nests the column as .page > #content.content > main, which is what caps it at --content-max-width.
  const html = `<!DOCTYPE html>
<html lang="id" class="light js" dir="ltr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
${cssLinks()}
<style>.p4-label{font:12px monospace;opacity:.7;margin:2rem 0 0}</style>
</head><body><div id="body-container"><div class="page-wrapper"><div class="page"><div id="content" class="content"><main>
${parts.join("\n")}
</main></div></div></div></div></body></html>`;
  const file = join(OUT, "page.html");
  writeFileSync(file, html);
  return file;
}

// Runs in the page. Composites each text over the shapes painted before it that contain its centre.
function measure(minRatio: number) {
  type RGBA = { r: number; g: number; b: number; a: number };
  const parse = (c: string): RGBA | null => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (top: RGBA, alpha: number, under: RGBA): RGBA => ({
    r: top.r * alpha + under.r * (1 - alpha),
    g: top.g * alpha + under.g * (1 - alpha),
    b: top.b * alpha + under.b * (1 - alpha),
    a: 1,
  });
  const lum = (c: RGBA) => {
    const ch = (v: number) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  };
  const ratio = (a: RGBA, b: RGBA) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const hex = (c: RGBA) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const effOpacity = (el: Element, stop: Element) => {
    let o = 1;
    for (let e: Element | null = el; e && e !== stop.parentElement; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
    return o;
  };
  const hidden = (el: Element) => {
    const cs = getComputedStyle(el);
    return cs.display === "none" || cs.visibility === "hidden" || !!el.closest("defs, marker, clipPath, mask, pattern, symbol");
  };
  const page = parse(getComputedStyle(document.documentElement).backgroundColor)!;
  const texts: any[] = [];
  const marks: any[] = [];
  const diagrams: any[] = [];
  for (const wrap of Array.from(document.querySelectorAll<HTMLElement>(".dawnbook-diagram"))) {
    const name = wrap.dataset.name!;
    const type = wrap.dataset.type!;
    const svg = wrap.querySelector("svg")!;
    const vb = svg.viewBox.baseVal;
    diagrams.push({ name, type, natural: Math.round(vb.width), shown: Math.round(svg.getBoundingClientRect().width), scroll: wrap.scrollWidth > wrap.clientWidth + 1 });
    const shapes: { el: SVGGeometryElement; fill: RGBA; alpha: number; box: DOMRect }[] = [];
    for (const el of Array.from(svg.querySelectorAll<SVGGeometryElement>("rect, circle, ellipse, polygon, path, line"))) {
      if (hidden(el)) continue;
      const cs = getComputedStyle(el);
      const fill = parse(cs.fill);
      const box = el.getBoundingClientRect();
      if (fill && el.tagName !== "line" && box.width * box.height > 0) {
        const alpha = fill.a * Number(cs.fillOpacity) * effOpacity(el, svg);
        if (alpha > 0.01) shapes.push({ el, fill, alpha, box });
      }
      // Mark visibility: the stronger of fill and stroke against the page, for every painted shape.
      const stroke = parse(cs.stroke);
      const sw = parseFloat(cs.strokeWidth) || 0;
      let best = 0;
      if (fill && el.tagName !== "line") {
        const a = fill.a * Number(cs.fillOpacity) * effOpacity(el, svg);
        if (a > 0.01) best = Math.max(best, ratio(over(fill, a, page), page));
      }
      if (stroke && sw > 0) {
        const a = stroke.a * Number(cs.strokeOpacity) * effOpacity(el, svg);
        if (a > 0.01) best = Math.max(best, ratio(over(stroke, a, page), page));
      }
      // Boxes whose job is to match the page (label backgrounds, the chart background) are not marks.
      // Quadrant fills are background regions behind the points and labels; their text is checked, the region edge is the border line.
      const isBackdrop = !!el.closest(".edgeLabel, .labelBkg, .quadrant") || /\b(background|labelBkg)\b/.test(el.getAttribute("class") ?? "");
      if (best > 0 && !isBackdrop) marks.push({ name, type, ratio: best, what: `${el.tagName}.${el.getAttribute("class") ?? ""} in ${el.parentElement?.getAttribute("class") ?? ""}` });
    }
    for (const el of Array.from(svg.querySelectorAll<SVGGeometryElement>("marker path, marker circle, marker polygon"))) {
      const cs = getComputedStyle(el);
      let best = 0;
      const fill = parse(cs.fill);
      if (fill && fill.a * Number(cs.fillOpacity) > 0.01) best = ratio(over(fill, fill.a * Number(cs.fillOpacity), page), page);
      const stroke = parse(cs.stroke);
      if (stroke && (parseFloat(cs.strokeWidth) || 0) > 0 && stroke.a * Number(cs.strokeOpacity) > 0.01) {
        best = Math.max(best, ratio(over(stroke, stroke.a * Number(cs.strokeOpacity), page), page));
      }
      if (best > 0) marks.push({ name, type, ratio: best, what: `marker ${el.closest("marker")!.id.replace(/^dbd-[0-9a-f]+_?/, "")}` });
    }
    for (const t of Array.from(svg.querySelectorAll<SVGTextElement>("text"))) {
      const content = (t.textContent ?? "").trim();
      if (!content || hidden(t)) continue;
      const span = Array.from(t.querySelectorAll("tspan")).find((s) => (s.textContent ?? "").trim()) ?? t;
      const cs = getComputedStyle(span);
      const fill = parse(cs.fill);
      if (!fill) continue;
      const box = t.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      let bg = page;
      let top: (typeof shapes)[number] | null = null;
      const numberDot = t.classList.contains("sequenceNumber") ? svg.querySelector('[id$="-sequencenumber"] circle') : null;
      for (const s of shapes) {
        if (!(s.el.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        if (cx < s.box.left || cx > s.box.right || cy < s.box.top || cy > s.box.bottom) continue;
        const ctm = s.el.getScreenCTM();
        if (!ctm) continue;
        const pt = new DOMPoint(cx, cy).matrixTransform(ctm.inverse());
        if (!s.el.isPointInFill(pt)) continue;
        bg = over(s.fill, s.alpha, bg);
        top = s;
      }
      // Sequence numbers sit on a circle drawn by a marker on the line painted just before the number.
      if (numberDot) {
        const dot = getComputedStyle(numberDot);
        const f = parse(dot.fill);
        if (f) bg = over(f, f.a * Number(dot.fillOpacity), bg);
      }
      const a = fill.a * Number(cs.fillOpacity) * effOpacity(span, svg);
      const fg = over(fill, a, bg);
      const r = ratio(fg, bg);
      const overflow = top !== null && !/activation/.test(top.el.getAttribute("class") ?? "") && (box.left < top.box.left - 1 || box.right > top.box.right + 1);
      texts.push({ name, type, text: content.slice(0, 40), ratio: r, fg: hex(fg), bg: hex(bg), cls: `${t.getAttribute("class") ?? ""}`, bgFrom: top ? `${top.el.tagName}.${top.el.getAttribute("class") ?? ""}` : numberDot ? "sequencenumber-marker" : "page", overflow, low: r < minRatio });
    }
  }
  return { texts, marks, diagrams };
}

const fixtures = collectFixtures();
mkdirSync(SHOTS, { recursive: true });
prepareRoot(fixtures);
const t0 = performance.now();
const result = await renderBooks(ROOT, { prune: true });
console.log(`render: ${result.rendered.length} rendered, ${result.cached} cached, ${result.pruned.length} pruned in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
const pageFile = writePage(fixtures);

const { default: puppeteer } = await import("puppeteer");
const browser = await puppeteer.launch({ executablePath: "/usr/bin/chromium", headless: true });
const minText = new Map<string, number>();
const minMark = new Map<string, number>();
const low = new Map<string, { themes: Set<string>; min: number; sample: string }>();
const overflows = new Set<string>();
const marksLow = new Map<string, { themes: Set<string>; min: number }>();
const sizes = new Map<string, string>();
try {
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    await page.goto(`file://${pageFile}`, { waitUntil: "load" });
    for (const theme of THEMES) {
      await page.evaluate((t) => {
        // mdBook applies the light variables to html:not(.js), so the js class is needed for any other theme to win.
        document.documentElement.className = `${t} js`;
      }, theme);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const m = await page.evaluate(measure, MIN_RATIO);
      for (const t of m.texts) {
        const k = `${t.type}|${theme}`;
        minText.set(k, Math.min(minText.get(k) ?? 99, t.ratio));
        if (t.low) {
          const key = `${t.name} class=${t.cls || "-"} bg=${t.bgFrom}`;
          const g = low.get(key) ?? { themes: new Set<string>(), min: 99, sample: "" };
          g.themes.add(theme);
          if (t.ratio < g.min) Object.assign(g, { min: t.ratio, sample: `"${t.text}" ${t.fg} on ${t.bg} (${theme})` });
          low.set(key, g);
        }
        if (t.overflow) overflows.add(`${width} ${t.name} "${t.text}" overflows ${t.bgFrom}`);
      }
      for (const mk of m.marks) {
        const k = `${mk.type}|${theme}`;
        minMark.set(k, Math.min(minMark.get(k) ?? 99, mk.ratio));
        if (mk.ratio < MIN_RATIO) {
          const key = `${mk.name} ${mk.what}`;
          const g = marksLow.get(key) ?? { themes: new Set<string>(), min: 99 };
          g.themes.add(theme);
          g.min = Math.min(g.min, mk.ratio);
          marksLow.set(key, g);
        }
      }
      if (theme === "light") for (const d of m.diagrams) sizes.set(`${d.name}|${width}`, `${d.shown}px${d.scroll ? " scroll" : ""}`);
      if (!noShots) {
        for (const handle of await page.$$(".dawnbook-diagram")) {
          const name = await handle.evaluate((el) => (el as HTMLElement).dataset.name);
          await handle.scrollIntoView();
          await handle.screenshot({ path: join(SHOTS, `${theme}-${width}-${name}.png`) });
        }
      }
    }
    if (width === 1280) {
      const naturals = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>(".dawnbook-diagram")).map((w) => [w.dataset.name, Math.round(w.querySelector("svg")!.viewBox.baseVal.width)]),
      );
      for (const [n, w] of naturals) sizes.set(`${n}|natural`, `${w}px`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}

const types = [...new Set(fixtures.map((f) => f.type))];
const row = (label: string, cells: string[]) => `${label.padEnd(15)}${cells.map((c) => c.padStart(7)).join("")}`;
console.log("\nminimum text contrast per type per theme");
console.log(row("type", [...THEMES]));
for (const t of types) console.log(row(t, THEMES.map((th) => (minText.get(`${t}|${th}`) ?? NaN).toFixed(2))));
console.log("\nminimum mark contrast (fill or stroke vs page) per type per theme");
console.log(row("type", [...THEMES]));
for (const t of types) console.log(row(t, THEMES.map((th) => (minMark.get(`${t}|${th}`) ?? NaN).toFixed(2))));
console.log(`\ntext groups below ${MIN_RATIO}: ${low.size}`);
for (const [k, g] of low) console.log(`  ${k} min ${g.min.toFixed(2)} [${[...g.themes].join(",")}] e.g. ${g.sample}`);
console.log(`\nmark groups below ${MIN_RATIO} (fill or stroke vs page): ${marksLow.size}`);
for (const [k, g] of [...marksLow].slice(0, 60)) console.log(`  ${k} min ${g.min.toFixed(2)} [${[...g.themes].join(",")}]`);
console.log(`\ntext overflows: ${overflows.size}`);
for (const l of [...overflows].slice(0, 30)) console.log("  " + l);
console.log("\nsize per diagram (natural, shown at 1280, shown at 375)");
for (const f of fixtures) console.log(`  ${f.name.padEnd(36)} ${sizes.get(`${f.name}|natural`)}  ${sizes.get(`${f.name}|1280`)}  ${sizes.get(`${f.name}|375`)}`);
if (!noShots) console.log(`\nshots in ${SHOTS}`);
process.exit(low.size > 0 ? 1 : 0);
