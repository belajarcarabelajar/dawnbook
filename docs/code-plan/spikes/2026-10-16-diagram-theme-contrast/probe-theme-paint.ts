// Phase 0 feedback loop for the instability symptom: store a reader theme, load a book page N times,
// and record which theme class <html> carried when the browser painted first contentful content.
// Usage: bun probe-theme-paint.ts <url> [--theme navy] [--runs 5] [--dark]
import path from "node:path";
import puppeteer from "puppeteer";

const args = process.argv.slice(2);
const url = args[0];
const opt = (name: string, dflt: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const stored = opt("--theme", "navy");
const runs = Number(opt("--runs", "5"));
const CHROME =
  process.env.PUPPETEER_EXECUTABLE_PATH ??
  path.join(process.env.HOME!, ".cache/puppeteer/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell");
const THEMES = ["light", "rust", "coal", "navy", "ayu"];

const browser = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const page = await browser.newPage();
if (args.includes("--dark")) await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
await page.evaluateOnNewDocument((stored: string) => {
  try {
    localStorage.setItem("mdbook-theme", stored);
  } catch {}
  const log: { t: number; cls: string }[] = [];
  (window as any).__themeLog = log;
  const rec = () => log.push({ t: performance.now(), cls: document.documentElement?.className ?? "" });
  rec();
  // childList records the parser inserting <html>, so the class at parse time is logged even when no class change precedes FCP.
  new MutationObserver(rec).observe(document, { attributes: true, attributeFilter: ["class"], subtree: true, childList: true });
  (window as any).__paint = {} as Record<string, number>;
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) (window as any).__paint[e.name] = e.startTime;
  }).observe({ type: "paint", buffered: true });
}, stored);

let bad = 0;
for (let i = 1; i <= runs; i++) {
  const response = await page.goto(url, { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 2500));
  const r = await page.evaluate(() => {
    const log = ((window as any).__themeLog as { t: number; cls: string }[]).filter((e) => /\S/.test(e.cls) || e.t === 0);
    const fcp = (window as any).__paint["first-contentful-paint"] ?? NaN;
    const atFcp = [...log].reverse().find((e) => e.t <= fcp)?.cls ?? log[0]?.cls ?? "";
    const bg = getComputedStyle(document.body).backgroundColor;
    return { fcp: Math.round(fcp), atFcp, final: document.documentElement.className, bg, changes: log.map((e) => `${Math.round(e.t)}ms:${e.cls}`) };
  });
  const theme = (cls: string) => cls.split(/\s+/).filter((c) => THEMES.includes(c)).join("+") || "(none)";
  const ok = theme(r.atFcp) === stored;
  if (!ok) bad++;
  console.log(
    `run ${i}: http ${response?.status()}  FCP ${r.fcp}ms  theme at FCP ${theme(r.atFcp)}${r.atFcp.includes("js") ? "" : " (no js class)"}  final ${theme(r.final)}  ${ok ? "OK" : "MISMATCH"}`,
  );
  if (i === 1) console.log(`  class log: ${r.changes.join(" | ")}`);
}
await browser.close();
console.log(`stored theme ${stored}: ${bad}/${runs} runs painted first with a different theme`);
process.exit(bad > 0 ? 1 : 0);
