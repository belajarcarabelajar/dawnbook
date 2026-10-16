// V1: build CONTROL and FIXED replicas of a Cloudflare-served book page, before deploy.
//   CONTROL = Cloudflare-style Rocket Loader rewrite of the pre-Cloudflare mdBook page as is.
//   FIXED   = markThemeScriptsCfAsync (scripts/inject-gating.ts, the fix) then the same rewrite.
// The rewrite copies the live form seen in /tmp/dtc-C1/live/books/state-of-flow/index.html:
//   every <script> without data-cfasync="false" and without a non-JS type gets
//   ` type="<hash>-text/javascript"` appended to its open tag, and
//   <script src="/cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="<hash>-|49" defer></script>
//   is inserted right before </body>. (The live challenge-platform <script> after it is left out: it is
//   untouched by Rocket Loader, loads /cdn-cgi/challenge-platform, and has nothing to do with the theme.)
// Usage: bun make-variants.ts <mdbook output root, e.g. M/output> <rocket-loader.min.js> <site root to create>
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { markThemeScriptsCfAsync } from "../../../../../scripts/inject-gating.ts";

const [outRoot, rocketLoader, site] = process.argv.slice(2).map((p) => path.resolve(p));
const HASH = "cfa84b61803e83102ad4aab8";
const RL_TAG = `<script src="/cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="${HASH}-|49" defer></script>`;

export function cloudflareRewrite(html: string): { html: string; deferred: number; skipped: number } {
  let deferred = 0;
  let skipped = 0;
  const out = html.replace(/<script(\s[^>]*)?>/g, (tag, attrs: string = "") => {
    if (/\bdata-cfasync="false"/.test(attrs)) return skipped++, tag;
    const type = attrs.match(/\btype="([^"]*)"/)?.[1];
    if (type !== undefined && type !== "text/javascript") return tag; // application/ld+json stays as is on the live page
    deferred++;
    const rest = type === undefined ? attrs : attrs.replace(/\s*\btype="text\/javascript"/, "");
    return `<script${rest} type="${HASH}-text/javascript">`;
  });
  const end = out.lastIndexOf("</body>");
  if (end < 0) throw new Error("no </body>");
  return { html: out.slice(0, end) + RL_TAG + out.slice(end), deferred, skipped };
}

const book = path.join(site, "books/state-of-flow");
cpSync(path.join(outRoot, "books/state-of-flow"), book, { recursive: true });
for (const f of ["books/shared-script.js", "books/shared-header.css", "apps/hub/src/styles/typography.css", "pake-compat.js", "manifest.webmanifest"]) {
  mkdirSync(path.dirname(path.join(site, f)), { recursive: true });
  cpSync(path.join(outRoot, f), path.join(site, f));
}
const rlDest = path.join(site, "cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js");
mkdirSync(path.dirname(rlDest), { recursive: true });
cpSync(rocketLoader, rlDest);

const THEME_MARKERS = ["const default_light_theme =", "localStorage.getItem('mdbook-theme')", "const default_theme ="];
const themeTags = (html: string) =>
  THEME_MARKERS.map((m) => {
    const i = html.indexOf(m);
    const open = html.lastIndexOf("<script", i);
    return html.slice(open, html.indexOf(">", open) + 1);
  });

const pages = [
  { src: "index.html", dir: book, name: "index" },
  { src: "content/04_neurobiologi-di-balik-kondisi-alir.html", dir: path.join(book, "content"), name: "ch" },
];
for (const p of pages) {
  const orig = readFileSync(path.join(book, p.src), "utf8");
  const control = cloudflareRewrite(orig);
  const marked = markThemeScriptsCfAsync(orig);
  const fixed = cloudflareRewrite(marked);
  writeFileSync(path.join(p.dir, `${p.name}-control.html`), control.html);
  writeFileSync(path.join(p.dir, `${p.name}-fixed.html`), fixed.html);
  const a = control.html.split("\n");
  const b = fixed.html.split("\n");
  const differing = a.length === b.length ? a.filter((l, i) => l !== b[i]).length : -1;
  console.log(`${p.src}: control deferred ${control.deferred} kept ${control.skipped} | fixed deferred ${fixed.deferred} kept ${fixed.skipped} | lines differing ${differing} (of ${a.length})`);
  console.log(`  control theme tags: ${themeTags(control.html).join(" ")}`);
  console.log(`  fixed   theme tags: ${themeTags(fixed.html).join(" ")}`);
}
