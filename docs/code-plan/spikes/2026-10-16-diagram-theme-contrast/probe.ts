// Phase 0 feedback loop: inject each cached diagram SVG into an mdBook-styled page, switch the
// five reader themes, and measure every label against the shape painted behind it.
// Usage: bun probe.ts <variables.css> [--book <slug>] [--shots <dir>] [--min 3]
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const args = process.argv.slice(2);
const variablesCss = fs.readFileSync(args[0], "utf8");
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const onlyBook = opt("--book");
const shots = opt("--shots");
const minRatio = Number(opt("--min") ?? "3");
const repo = path.resolve(import.meta.dir, "../../../..");
const sharedCss = fs.readFileSync(path.join(repo, "books/shared-header.css"), "utf8");
const THEMES = ["light", "rust", "coal", "navy", "ayu"];
const CHROME =
  process.env.PUPPETEER_EXECUTABLE_PATH ??
  path.join(process.env.HOME!, ".cache/puppeteer/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell");

const svgs: { book: string; file: string; svg: string }[] = [];
for (const book of fs.readdirSync(path.join(repo, "books")).sort()) {
  if (onlyBook && book !== onlyBook) continue;
  const dir = path.join(repo, "books", book, "diagrams");
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).sort()) {
    if (file.endsWith(".svg")) svgs.push({ book, file, svg: fs.readFileSync(path.join(dir, file), "utf8") });
  }
}

const browser = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 2400 });

type Finding = { theme: string; text: string; fg: string; bg: string; ratio: number; type: string };
const failures: (Finding & { book: string; file: string })[] = [];
const perTheme: Record<string, { texts: number; fail: number }> = {};
for (const t of THEMES) perTheme[t] = { texts: 0, fail: 0 };

for (const { book, file, svg } of svgs) {
  const html = `<!doctype html><html class="light js"><head><style>${variablesCss}</style><style>html,body{margin:0;background:var(--bg);color:var(--fg)}${sharedCss}</style></head><body><div class="content"><main><div class="dawnbook-diagram">${svg}</div></main></div></body></html>`;
  await page.setContent(html, { waitUntil: "load" });
  for (const theme of THEMES) {
    const found: Finding[] = await page.evaluate((theme: string) => {
      document.documentElement.className = `${theme} js`;
      const svgEl = document.querySelector(".dawnbook-diagram svg")!;
      const type = svgEl.getAttribute("aria-roledescription") ?? "?";
      const parse = (c: string): number[] | null => {
        const m = c.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
        return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
      };
      const over = (top: number[], alpha: number, under: number[]) => [0, 1, 2].map((i) => top[i] * alpha + under[i] * (1 - alpha));
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
      const pageBg = parse(getComputedStyle(document.body).backgroundColor)!;
      const alphaOf = (el: Element) => {
        let a = 1;
        for (let n: Element | null = el; n && n !== svgEl.parentElement; n = n.parentElement) a *= Number(getComputedStyle(n).opacity);
        return a;
      };
      const out: Finding[] = [];
      for (const el of Array.from(svgEl.querySelectorAll("text"))) {
        const label = (el.textContent ?? "").trim();
        const r = el.getBoundingClientRect();
        if (!label || r.width === 0 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility !== "visible" || cs.display === "none") continue;
        const fgRaw = parse(cs.fill);
        if (!fgRaw) continue;
        // Paint stack under the label centre, bottom to top, composited onto the page background.
        const stack = document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2).filter((n) => {
          if (n === el || n.closest("text") || !(n instanceof SVGGeometryElement)) return false;
          const s = getComputedStyle(n);
          return s.fill !== "none" && s.visibility === "visible" && Number(s.fillOpacity) > 0;
        });
        let bg = pageBg.slice(0, 3);
        for (const n of stack.reverse()) {
          const s = getComputedStyle(n);
          const c = parse(s.fill);
          if (c) bg = over(c, c[3] * Number(s.fillOpacity) * alphaOf(n), bg);
        }
        const fg = over(fgRaw, fgRaw[3] * Number(cs.fillOpacity) * alphaOf(el), bg);
        out.push({ theme, text: label.slice(0, 40), fg: cs.fill, bg: `rgb(${bg.map(Math.round).join(",")})`, ratio: Math.round(ratio(fg, bg) * 100) / 100, type });
      }
      return out;
    }, theme);
    perTheme[theme].texts += found.length;
    for (const f of found) {
      if (f.ratio < minRatio) {
        perTheme[theme].fail++;
        failures.push({ ...f, book, file });
      }
    }
    if (shots) {
      fs.mkdirSync(shots, { recursive: true });
      const el = await page.$(".dawnbook-diagram");
      await el!.screenshot({ path: path.join(shots, `${book}--${file.replace(".svg", "")}--${theme}.png`) });
    }
  }
}
await browser.close();

console.log(`diagrams: ${svgs.length}, themes: ${THEMES.join(",")}, min ratio: ${minRatio}`);
for (const t of THEMES) console.log(`  ${t.padEnd(6)} labels ${perTheme[t].texts}  below ${minRatio}: ${perTheme[t].fail}`);
const byType = new Map<string, number>();
for (const f of failures) byType.set(`${f.theme} ${f.type}`, (byType.get(`${f.theme} ${f.type}`) ?? 0) + 1);
console.log("failures by theme and type:", Object.fromEntries([...byType].sort()));
for (const f of failures.sort((a, b) => a.ratio - b.ratio).slice(0, 15)) {
  console.log(`  ${f.ratio.toFixed(2)}  ${f.theme}  ${f.type}  ${f.book}/${f.file}  "${f.text}"  fg ${f.fg}  bg ${f.bg}`);
}
process.exit(failures.length > 0 ? 1 : 0);
