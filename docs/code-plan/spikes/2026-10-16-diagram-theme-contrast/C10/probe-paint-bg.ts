// C10 variant of ../probe-theme-paint.ts that judges by colour, not class name: it samples the
// computed --bg of <html> every animation frame and compares the value at first contentful paint
// with the settled value 2.5 s after load. Red-capable for --dark --theme light, where the class
// probe reports OK (class "light") while html:not(.js) + prefers-color-scheme: dark paints navy.
// Usage: bun probe-paint-bg.ts <url> [--theme navy] [--runs 5] [--dark]
import path from "node:path";
import puppeteer from "puppeteer";

const args = process.argv.slice(2);
const url = args[0];
const opt = (n: string, d: string) => (args.indexOf(n) >= 0 ? args[args.indexOf(n) + 1] : d);
const stored = opt("--theme", "navy");
const runs = Number(opt("--runs", "5"));
const CHROME =
  process.env.PUPPETEER_EXECUTABLE_PATH ??
  path.join(process.env.HOME!, ".cache/puppeteer/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell");

const browser = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const page = await browser.newPage();
if (args.includes("--dark")) await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
await page.evaluateOnNewDocument((stored: string) => {
  try { if (stored === "none") localStorage.removeItem("mdbook-theme"); else localStorage.setItem("mdbook-theme", stored); } catch {}
  const s: { t: number; bg: string; cls: string }[] = [];
  (window as any).__bg = s;
  const tick = () => {
    const h = document.documentElement;
    if (h) s.push({ t: performance.now(), bg: getComputedStyle(h).getPropertyValue("--bg").trim(), cls: h.className });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  (window as any).__paint = {} as Record<string, number>;
  new PerformanceObserver((l) => { for (const e of l.getEntries()) (window as any).__paint[e.name] = e.startTime; }).observe({ type: "paint", buffered: true });
}, stored);

let bad = 0;
for (let i = 1; i <= runs; i++) {
  const res = await page.goto(url, { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 2500));
  const r = await page.evaluate(() => {
    const s = (window as any).__bg as { t: number; bg: string; cls: string }[];
    const fcp = (window as any).__paint["first-contentful-paint"] ?? NaN;
    const at = [...s].reverse().find((e) => e.t <= fcp) ?? s[0];
    const fin = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    const firstFinal = s.find((e) => e.bg === fin && e.t > fcp);
    return { fcp: Math.round(fcp), atBg: at?.bg, atCls: at?.cls, fin, finCls: document.documentElement.className, settle: firstFinal ? Math.round(firstFinal.t) : null };
  });
  const ok = r.atBg === r.fin;
  if (!ok) bad++;
  console.log(`run ${i}: http ${res?.status()}  FCP ${r.fcp}ms  --bg at FCP ${r.atBg} [${r.atCls}]  settled --bg ${r.fin} [${r.finCls}]${ok ? "  OK" : `  MISMATCH (settled at ${r.settle}ms)`}`);
}
await browser.close();
console.log(`stored theme ${stored}${args.includes("--dark") ? " (OS dark)" : ""}: ${bad}/${runs} runs painted a different --bg first`);
process.exit(bad > 0 ? 1 : 0);
