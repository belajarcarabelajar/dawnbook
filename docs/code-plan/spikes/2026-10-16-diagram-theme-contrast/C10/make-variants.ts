// C10 throwaway harness: build four copies of a built mdBook site tree to compare first-paint theme.
//   base : untouched build output (no Rocket Loader)
//   rl   : Rocket Loader simulated (every non data-cfasync JS script deferred until 600 ms after load)
//   rlA  : rl + candidate early theme script where head.hbs content lands (option A)
//   rlB  : data-cfasync="false" added to the three mdBook theme scripts, then rl (option B)
// Usage: bun make-variants.ts <srcRoot> <outRoot>
import { cp, readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

const [srcRoot, outRoot] = process.argv.slice(2);

export const EARLY = `<script data-cfasync="false">
(function () {
  try {
    var t = localStorage.getItem('mdbook-theme');
    if (t && t.charAt(0) === '"' && t.charAt(t.length - 1) === '"') t = t.slice(1, -1);
    if (['light', 'rust', 'coal', 'navy', 'ayu'].indexOf(t) < 0) return;
    var h = document.documentElement;
    h.classList.remove('light');
    h.classList.add(t, 'js');
  } catch (e) {}
})();
</script>`;

// A2: also covers the no-stored-theme case. 'light' and 'navy' are what mdBook v0.5.3 renders for
// {{ default_theme }} and {{ preferred_dark_theme }} inside head.hbs (proved in /tmp/dtc-C10/hbtest).
export const EARLY2 = `<script data-cfasync="false">
(function () {
  var t = null;
  try { t = localStorage.getItem('mdbook-theme'); } catch (e) {}
  if (t && t.charAt(0) === '"' && t.charAt(t.length - 1) === '"') t = t.slice(1, -1);
  if (['light', 'rust', 'coal', 'navy', 'ayu'].indexOf(t) < 0) {
    t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'navy' : 'light';
  }
  var h = document.documentElement;
  h.classList.remove('light');
  h.classList.add(t, 'js');
})();
</script>`;

const LOADER = `<script data-cfasync="false">
window.addEventListener('load', function () {
  setTimeout(function () {
    var list = Array.prototype.slice.call(document.querySelectorAll('script[type="text/rocketscript-sim"]'));
    (function next(i) {
      if (i >= list.length) return;
      var old = list[i], s = document.createElement('script');
      for (var k = 0; k < old.attributes.length; k++) { var a = old.attributes[k]; if (a.name !== 'type' && a.name !== 'src') s.setAttribute(a.name, a.value); }
      s.async = false;
      if (old.getAttribute('src')) { s.onload = s.onerror = function () { next(i + 1); }; s.src = old.getAttribute('src'); old.parentNode.insertBefore(s, old); }
      else { s.text = old.text; old.parentNode.insertBefore(s, old); next(i + 1); }
    })(0);
  }, 600);
});
</script>`;

const B_COMMENTS = [
  "<!-- Provide site root and default themes to javascript -->",
  "<!-- Work around some values being stored in localStorage wrapped in quotes -->",
  "<!-- Set the theme before any content is loaded, prevents flash -->",
];

function rocket(html: string): string {
  let n = 0;
  const out = html.replace(/<script\b([^>]*)>/gi, (m, attrs: string) => {
    if (/data-cfasync\s*=\s*["']false["']/i.test(attrs)) return m;
    const t = attrs.match(/\btype\s*=\s*["']([^"']*)["']/i)?.[1];
    if (t && !/javascript|module/i.test(t)) return m; // ld+json etc. untouched, like the real Rocket Loader
    n++;
    return `<script type="text/rocketscript-sim"${attrs.replace(/\btype\s*=\s*["'][^"']*["']/i, "")}>`;
  });
  if (!out.includes("</body>")) throw new Error("no </body>");
  return { html: out.replace("</body>", LOADER + "\n</body>"), n } as any;
}

function optionA(html: string): string {
  const marker = "<!-- Custom HTML head -->";
  if (!html.includes(marker)) throw new Error("no head.hbs marker");
  return html.replace(marker, marker + "\n" + EARLY);
}

function optionB(html: string): { html: string; hits: number } {
  let hits = 0;
  for (const c of B_COMMENTS) {
    const re = new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\s*<script)");
    if (re.test(html)) { hits++; html = html.replace(re, (m) => m + ' data-cfasync="false"'); }
  }
  return { html, hits };
}

async function walk(dir: string, fn: (p: string) => Promise<void>) {
  for (const e of await readdir(dir)) {
    const p = join(dir, e);
    if ((await stat(p)).isDirectory()) await walk(p, fn);
    else if (p.endsWith(".html")) await fn(p);
  }
}

for (const v of ["base", "rl", "rlA", "rlA2", "rlB"]) {
  const root = join(outRoot, v);
  await cp(srcRoot, root, { recursive: true });
  let files = 0, rewritten = 0, bMiss = 0;
  await walk(root, async (p) => {
    if (v === "base") return;
    let html = await readFile(p, "utf-8");
    if (v === "rlA") html = optionA(html);
    if (v === "rlA2") html = optionA(html).replace(EARLY, EARLY2);
    if (v === "rlB") { const r = optionB(html); html = r.html; if (r.hits !== 3) bMiss++; }
    const r = rocket(html) as any;
    files++; rewritten += r.n;
    await writeFile(p, r.html);
  });
  console.log(`${v}: html files ${files}, scripts deferred ${rewritten}, option-B pages missing a marker ${bMiss}`);
}
