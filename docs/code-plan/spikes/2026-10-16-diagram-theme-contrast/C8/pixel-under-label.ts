// C8 ground truth: what colours are actually painted under the quadrantChart labels "Arousal" and "Boredom"?
// Hides all text, screenshots each label's box per theme, and histograms the pixels in the page itself.
// Usage: bun pixel-under-label.ts <variables.css> <svg-file> [labels regex]
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const [cssFile, svgFile, re = "Arousal|Boredom"] = process.argv.slice(2);
const variablesCss = fs.readFileSync(cssFile, "utf8");
const svg = fs.readFileSync(svgFile, "utf8");
const sharedCss = fs.readFileSync(path.join(path.dirname(svgFile), "../../shared-header.css"), "utf8");
const CHROME = path.join(process.env.HOME!, ".cache/puppeteer/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell");
const browser = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 2400, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><html class="light js"><head><style>${variablesCss}</style><style>html,body{margin:0;background:var(--bg);color:var(--fg)}${sharedCss}</style></head><body><div class="content"><main><div class="dawnbook-diagram">${svg}</div></main></div><canvas id="c"></canvas></body></html>`, { waitUntil: "load" });
for (const theme of ["light", "rust", "coal", "navy", "ayu"]) {
  const boxes = await page.evaluate((theme: string, re: string) => {
    document.documentElement.className = `${theme} js`;
    const texts = Array.from(document.querySelectorAll(".dawnbook-diagram svg text")).filter((t) => new RegExp(re).test(t.textContent ?? ""));
    const out = texts.map((t) => { const r = t.getBoundingClientRect(); return { label: t.textContent!.trim(), x: r.x, y: r.y, width: r.width, height: r.height }; });
    for (const t of Array.from(document.querySelectorAll(".dawnbook-diagram svg text"))) (t as SVGElement).style.visibility = "hidden";
    return out;
  }, theme, re);
  for (const b of boxes) {
    const png = (await page.screenshot({ clip: { x: b.x, y: b.y, width: b.width, height: b.height }, encoding: "base64" })) as string;
    const hist: [string, number][] = await page.evaluate(async (png: string) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const c = document.getElementById("c") as HTMLCanvasElement;
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, img.width, img.height).data;
      const h = new Map<string, number>();
      for (let i = 0; i < d.length; i += 4) { const k = `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`; h.set(k, (h.get(k) ?? 0) + 1); }
      const n = d.length / 4;
      return [...h].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => [k, Math.round((v / n) * 1000) / 10]);
    }, png);
    const has333 = hist.some(([k]) => k === "rgb(51,51,51)");
    console.log(`${theme.padEnd(5)} ${b.label.padEnd(8)} box ${Math.round(b.width)}x${Math.round(b.height)}  top pixels: ${hist.map(([k, p]) => `${k} ${p}%`).join(", ")}  rgb(51,51,51) among top: ${has333}`);
  }
  await page.evaluate(() => { for (const t of Array.from(document.querySelectorAll(".dawnbook-diagram svg text"))) (t as SVGElement).style.visibility = ""; });
}
await browser.close();
