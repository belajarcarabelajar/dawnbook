// V1: collect console errors, uncaught exceptions, failed requests and HTTP >= 400 responses for one page.
// Usage: bun probe-errors.ts <url> [--theme navy] [--loads 2] [--dark]
import path from "node:path";
import puppeteer from "puppeteer";

const args = process.argv.slice(2);
const url = args[0];
const opt = (n: string, d: string) => (args.indexOf(n) >= 0 ? args[args.indexOf(n) + 1] : d);
const stored = opt("--theme", "navy");
const loads = Number(opt("--loads", "2"));
const CHROME =
  process.env.PUPPETEER_EXECUTABLE_PATH ??
  path.join(process.env.HOME!, ".cache/puppeteer/chrome-headless-shell/linux-153.0.8010.36/chrome-headless-shell-linux64/chrome-headless-shell");

const browser = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const page = await browser.newPage();
if (args.includes("--dark")) await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
await page.evaluateOnNewDocument((stored: string) => {
  try { if (stored === "none") localStorage.removeItem("mdbook-theme"); else localStorage.setItem("mdbook-theme", stored); } catch {}
}, stored);
const seen = new Set<string>();
const local = (u: string) => u.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, "");
page.on("console", (m) => { if (m.type() === "error") seen.add(`console.error: ${m.text().slice(0, 160)} @ ${local(m.location()?.url ?? "")}`); });
page.on("pageerror", (e) => seen.add(`pageerror: ${String((e as Error).message ?? e).slice(0, 160)}`));
page.on("requestfailed", (r) => seen.add(`requestfailed: ${local(r.url()).slice(0, 120)} ${r.failure()?.errorText ?? ""}`));
page.on("response", (r) => { if (r.status() >= 400) seen.add(`http ${r.status()}: ${local(r.url()).slice(0, 120)}`); });
let finalUrl = "";
for (let i = 0; i < loads; i++) {
  await page.goto(url, { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 2500));
  finalUrl = local(page.url());
}
await browser.close();
console.log(`final url ${finalUrl}`);
for (const s of [...seen].sort()) console.log(`  ${s}`);
console.log(`${seen.size} distinct error entries`);
