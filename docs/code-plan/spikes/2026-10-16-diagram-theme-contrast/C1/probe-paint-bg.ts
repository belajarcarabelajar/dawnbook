// C1 companion to ../probe-theme-paint.ts: same loop, but also records the resolved --bg for every <html> class state
// (so the html:not(.js) prefers-color-scheme fallback is visible) and every uncaught page error.
// Usage: bun probe-paint-bg.ts <url> --theme <stored> --expect-bg <css colour of stored theme> [--runs 3] [--dark]
import path from "node:path";
import puppeteer from "puppeteer";

const args = process.argv.slice(2);
const url = args[0];
const opt = (n: string, d: string) => (args.indexOf(n) >= 0 ? args[args.indexOf(n) + 1] : d);
const stored = opt("--theme", "navy");
const expectBg = opt("--expect-bg", "");
const runs = Number(opt("--runs", "3"));
const CHROME = path.join(process.env.HOME!, ".cache/puppeteer/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell");

const browser = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const page = await browser.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String((e as Error).message ?? e).slice(0, 140)));
if (args.includes("--dark")) await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
await page.evaluateOnNewDocument((stored: string) => {
  try { localStorage.setItem("mdbook-theme", stored); } catch {}
  const log: { t: number; cls: string; bg: string }[] = [];
  (window as any).__log = log;
  const rec = () => {
    const h = document.documentElement;
    if (!h || !document.body) return;
    log.push({ t: performance.now(), cls: h.className, bg: getComputedStyle(h).getPropertyValue("--bg").trim() });
  };
  new MutationObserver(rec).observe(document, { attributes: true, attributeFilter: ["class"], subtree: true, childList: true });
  (window as any).__paint = {} as Record<string, number>;
  new PerformanceObserver((l) => { for (const e of l.getEntries()) (window as any).__paint[e.name] = e.startTime; }).observe({ type: "paint", buffered: true });
}, stored);

let bad = 0;
for (let i = 1; i <= runs; i++) {
  errors.length = 0;
  const res = await page.goto(url, { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 2500));
  const r = await page.evaluate(() => {
    const log = (window as any).__log as { t: number; cls: string; bg: string }[];
    const fcp = (window as any).__paint["first-contentful-paint"] ?? NaN;
    const at = [...log].reverse().find((e) => e.t <= fcp) ?? log[0];
    const h = document.documentElement;
    return { fcp: Math.round(fcp), at, final: { cls: h.className, bg: getComputedStyle(h).getPropertyValue("--bg").trim() } };
  });
  const ok = !!expectBg && r.at?.bg === expectBg;
  if (!ok) bad++;
  console.log(`run ${i}: http ${res?.status()} FCP ${r.fcp}ms  at FCP [${r.at?.cls}] --bg ${r.at?.bg}  final [${r.final.cls}] --bg ${r.final.bg}  ${ok ? "OK" : "MISMATCH"}`);
  if (i === 1) console.log(`  page errors: ${errors.length ? [...new Set(errors)].join(" || ") : "none"}`);
}
await browser.close();
console.log(`stored ${stored}, expected --bg ${expectBg}: ${bad}/${runs} runs painted a different background first`);
process.exit(bad > 0 ? 1 : 0);
