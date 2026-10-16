// C8 (H7): which SVG geometry elements keep the same computed fill in all five mdBook themes?
// Based on ../probe.ts (static page, real mdBook variables.css, theme class switched synchronously).
// Usage: bun probe-unthemed.ts <variables.css> <books-dir> [--out <json>] [--min-area 400]
// Exit 1 when at least one visible geometry element above the area floor is unthemed, else 0.
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const args = process.argv.slice(2);
const variablesCss = fs.readFileSync(args[0], "utf8");
const booksDir = path.resolve(args[1]);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const outFile = opt("--out");
const minArea = Number(opt("--min-area") ?? "400");
const sharedCss = fs.readFileSync(path.join(booksDir, "shared-header.css"), "utf8");
const THEMES = ["light", "rust", "coal", "navy", "ayu"];
const CHROME =
  process.env.PUPPETEER_EXECUTABLE_PATH ??
  path.join(process.env.HOME!, ".cache/puppeteer/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell");

const svgs: { book: string; file: string; svg: string }[] = [];
for (const book of fs.readdirSync(booksDir).sort()) {
  const dir = path.join(booksDir, book, "diagrams");
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).sort()) {
    if (file.endsWith(".svg")) svgs.push({ book, file, svg: fs.readFileSync(path.join(dir, file), "utf8") });
  }
}

type El = {
  i: number; sig: string; area: number; w: number; h: number;
  fill: Record<string, string>; eff: Record<string, number[]>; lum: Record<string, number>;
  source: string; text?: string;
};
const browser = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 2400 });

const rows: { book: string; file: string; type: string; els: El[] }[] = [];
for (const { book, file, svg } of svgs) {
  const html = `<!doctype html><html class="light js"><head><style>${variablesCss}</style><style>html,body{margin:0;background:var(--bg);color:var(--fg)}${sharedCss}</style></head><body><div class="content"><main><div class="dawnbook-diagram">${svg}</div></main></div></body></html>`;
  await page.setContent(html, { waitUntil: "load" });
  const res = await page.evaluate((THEMES: string[], minArea: number) => {
    const svgEl = document.querySelector(".dawnbook-diagram svg")!;
    const type = svgEl.getAttribute("aria-roledescription") ?? "?";
    const parse = (c: string): number[] | null => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    };
    const lum = (c: number[]) => {
      const [r, g, b] = c.slice(0, 3).map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const alphaOf = (el: Element) => {
      let a = 1;
      for (let n: Element | null = el; n && n !== svgEl.parentElement; n = n.parentElement) a *= Number(getComputedStyle(n).opacity);
      return a;
    };
    // Specificity of the part of a selector list that matches el (ids, classes/attrs/pseudo, types).
    const splitTop = (s: string) => {
      const out: string[] = []; let depth = 0; let cur = "";
      for (const ch of s) {
        if (ch === "(" || ch === "[") depth++;
        if (ch === ")" || ch === "]") depth--;
        if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
      }
      if (cur.trim()) out.push(cur.trim());
      return out;
    };
    const spec = (sel: string) => {
      const s = sel.replace(/:not\(([^)]*)\)/g, " $1 ");
      const ids = (s.match(/#[\w-]+/g) ?? []).length;
      const cls = (s.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(\([^)]*\))?/g) ?? []).length;
      const types = (s.replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|::?[\w-]+(\([^)]*\))?/g, " ").match(/(^|[\s>+~])([a-zA-Z][\w-]*)/g) ?? []).length;
      return ids * 10000 + cls * 100 + types;
    };
    const rules: { sel: string; fill: string; imp: boolean; order: number; inSvg: boolean }[] = [];
    let order = 0;
    for (const sheet of Array.from(document.styleSheets)) {
      const inSvg = !!(sheet.ownerNode as Element | null)?.closest?.("svg");
      const walk = (list: CSSRuleList) => {
        for (const r of Array.from(list)) {
          if (r instanceof CSSStyleRule && r.style.getPropertyValue("fill")) {
            rules.push({ sel: r.selectorText, fill: r.style.getPropertyValue("fill"), imp: r.style.getPropertyPriority("fill") === "important", order: order++, inSvg });
          } else if ((r as CSSGroupingRule).cssRules) walk((r as CSSGroupingRule).cssRules);
        }
      };
      walk(sheet.cssRules);
    }
    const sourceOf = (el: Element, depth = 0): string => {
      const inline = (el as SVGElement).style?.getPropertyValue("fill");
      const hits: { sel: string; fill: string; key: number }[] = [];
      for (const r of rules) {
        const parts = splitTop(r.sel).filter((p) => { try { return el.matches(p); } catch { return false; } });
        if (!parts.length) continue;
        const sp = Math.max(...parts.map(spec));
        hits.push({ sel: `${r.inSvg ? "svg<style>" : "page"} ${parts.sort((a, b) => spec(b) - spec(a))[0]}`, fill: r.fill, key: (r.imp ? 1e9 : 0) + sp * 1000 + r.order });
      }
      hits.sort((a, b) => b.key - a.key);
      const imp = hits.find((h) => h.key >= 1e9);
      if (imp) return `${imp.sel} {fill:${imp.fill} !important}`;
      if (inline) return `inline style fill:${inline}`;
      if (hits[0]) return `${hits[0].sel} {fill:${hits[0].fill}}`;
      const attr = el.getAttribute("fill");
      if (attr) return `attribute fill="${attr}"`;
      if (el.parentElement && el.parentElement !== svgEl.parentElement && depth < 8) return `inherited <- ${sourceOf(el.parentElement, depth + 1)}`;
      return "initial (black)";
    };
    const sigOf = (el: Element) => {
      const own = el.tagName.toLowerCase() + Array.from(el.classList).sort().map((c) => "." + c).join("");
      const g = el.parentElement?.closest("g[class]");
      const gs = g && g !== svgEl ? "g" + Array.from(g.classList).slice(0, 2).map((c) => "." + c).join("") + " > " : "";
      return gs + own;
    };
    const geoms = Array.from(svgEl.querySelectorAll("rect, circle, ellipse, polygon, path, line, polyline")).filter(
      (n) => n instanceof SVGGeometryElement && !n.closest("defs, marker, clipPath, mask, symbol, pattern"),
    );
    const els: any[] = [];
    const pageBgs: Record<string, number[]> = {};
    for (const theme of THEMES) {
      document.documentElement.className = `${theme} js`;
      pageBgs[theme] = parse(getComputedStyle(document.body).backgroundColor)!;
      geoms.forEach((n, i) => {
        const r = n.getBoundingClientRect();
        const area = r.width * r.height;
        const cs = getComputedStyle(n);
        const vis = cs.visibility === "visible" && cs.display !== "none" && cs.fill !== "none" && Number(cs.fillOpacity) > 0 && alphaOf(n) > 0;
        if (theme === THEMES[0]) els[i] = { i, sig: sigOf(n), area: Math.round(area), w: Math.round(r.width), h: Math.round(r.height), fill: {}, eff: {}, lum: {}, keep: vis && area > minArea, source: "" };
        const e = els[i];
        e.fill[theme] = cs.fill;
        const c = parse(cs.fill);
        if (c) {
          const a = c[3] * Number(cs.fillOpacity) * alphaOf(n);
          const bg = pageBgs[theme];
          const eff = [0, 1, 2].map((k) => Math.round(c[k] * a + bg[k] * (1 - a)));
          e.eff[theme] = eff;
          e.lum[theme] = Math.round(lum(eff) * 1000) / 1000;
        }
      });
    }
    const kept = els.filter((e) => e.keep);
    for (const e of kept) {
      e.source = sourceOf(geoms[e.i]);
      delete e.keep;
    }
    return { type, els: kept };
  }, THEMES, minArea);
  rows.push({ book, file, ...res });
}

// Special probe for part 3: paint stack under the quadrantChart labels "Arousal" and "Boredom".
const q = svgs.find((s) => s.book === "state-of-flow" && s.file === "89fdb4768425.svg");
const stacks: any[] = [];
if (q) {
  await page.setContent(`<!doctype html><html class="light js"><head><style>${variablesCss}</style><style>html,body{margin:0;background:var(--bg);color:var(--fg)}${sharedCss}</style></head><body><div class="content"><main><div class="dawnbook-diagram">${q.svg}</div></main></div></body></html>`, { waitUntil: "load" });
  for (const theme of THEMES) {
    stacks.push(...(await page.evaluate((theme: string) => {
      document.documentElement.className = `${theme} js`;
      const svgEl = document.querySelector(".dawnbook-diagram svg")!;
      const out: any[] = [];
      for (const t of Array.from(svgEl.querySelectorAll("text"))) {
        const label = (t.textContent ?? "").trim();
        if (!/Arousal|Boredom/.test(label)) continue;
        const r = t.getBoundingClientRect();
        const stack = document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2)
          .filter((n) => n instanceof SVGGeometryElement)
          .map((n) => {
            const b = n.getBoundingClientRect();
            const anc = [] as string[];
            for (let p = n.parentElement; p && p !== svgEl; p = p.parentElement) anc.push(p.tagName.toLowerCase() + (p.getAttribute("class") ? "." + p.getAttribute("class")!.split(/\s+/).join(".") : ""));
            return `${n.tagName.toLowerCase()}${n.getAttribute("class") ? "." + n.getAttribute("class") : ""} fill=${getComputedStyle(n).fill} attr=${n.getAttribute("fill")} style="${n.getAttribute("style") ?? ""}" box=${Math.round(b.width)}x${Math.round(b.height)} idx=${Array.from(n.parentElement!.children).indexOf(n)} parents=[${anc.join(" < ")}]`;
          });
        out.push({ theme, label, textFill: getComputedStyle(t).fill, textClass: t.getAttribute("class"), textParents: t.parentElement?.getAttribute("class"), stack });
      }
      return out;
    }, theme)));
  }
}
await browser.close();

if (outFile) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ rows, stacks }, null, 1));
}
const all = rows.flatMap((r) => r.els.map((e) => ({ ...e, book: r.book, file: r.file, type: r.type })));
const unthemed = all.filter((e) => new Set(THEMES.map((t) => e.fill[t])).size === 1);
console.log(`diagrams: ${rows.length}, visible geometry > ${minArea} px2: ${all.length}, unthemed: ${unthemed.length}`);
process.exit(unthemed.length > 0 ? 1 : 0);
