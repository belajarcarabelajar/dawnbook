// C1 (H1): build replay variants of the live, Rocket-Loaded book index.
// Usage: bun make-variants.ts /tmp/dtc-C1/live/books/state-of-flow
//   index.html  A  as delivered (Rocket Loader on, every script deferred by it)
//   b.html      B  only the theme bootstrap script bypasses Rocket Loader (data-cfasync="false")
//   c.html      C  B plus the "default themes" script that defines default_light_theme / default_dark_theme
//   d.html      D  control: every Rocket Loader type rewrite removed and rocket-loader.min.js dropped
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const dir = process.argv[2];
const src = readFileSync(path.join(dir, "index.html"), "utf8");
const token = src.match(/type="([0-9a-f]+)-text\/javascript"/)?.[1];
if (!token) throw new Error("no Rocket Loader type token found");
const rl = `<script type="${token}-text/javascript">`;
const BOOT = `<!-- Set the theme before any content is loaded, prevents flash -->\n        ${rl}`;
const DEFAULTS = `<!-- Provide site root and default themes to javascript -->\n        ${rl}`;

function once(html: string, find: string, repl: string): string {
  const n = html.split(find).length - 1;
  if (n !== 1) throw new Error(`expected exactly 1 match, got ${n}: ${find.slice(0, 80)}`);
  return html.replace(find, repl);
}
const bypass = (s: string) => s.replace(rl, `<script data-cfasync="false">`);

const b = once(src, BOOT, bypass(BOOT));
const c = once(b, DEFAULTS, bypass(DEFAULTS));
let d = src.split(` type="${token}-text/javascript"`).join("");
d = d.replace(/<script src="\/cdn-cgi\/scripts\/[^"]+rocket-loader\.min\.js"[^>]*><\/script>/, "");
if (d.includes("rocket-loader") || d.includes(token)) throw new Error("D still references Rocket Loader");

writeFileSync(path.join(dir, "b.html"), b);
writeFileSync(path.join(dir, "c.html"), c);
writeFileSync(path.join(dir, "d.html"), d);
const count = (h: string) => (h.match(new RegExp(`${token}-text/javascript`, "g")) ?? []).length;
console.log(`token ${token}; Rocket-Loaded scripts: A ${count(src)}, B ${count(b)}, C ${count(c)}, D ${count(d)}`);
