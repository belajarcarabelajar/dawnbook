// C7 setup: copy the old real mdBook build into /tmp/dtc-C7/site and inline cached diagram SVGs
// into four chapter pages at the position of their mermaid block (after the preceding paragraph).
// Usage: bun setup-site.ts   (reads the main checkout M, writes only under /tmp/dtc-C7)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const M = "/home/belajarcarabelajar/Proyek/dawnbook";
const SITE = "/tmp/dtc-C7/site";
fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(SITE, { recursive: true });
for (const p of ["books", "apps", "pake-compat.js", "manifest.webmanifest"]) {
  execFileSync("cp", ["-r", path.join(M, "output", p), path.join(SITE, p)]);
}
// The old build predates diagrams; overlay the current (deployed) shared-header.css, which adds .dawnbook-diagram rules.
fs.copyFileSync(path.join(M, "books/shared-header.css"), path.join(SITE, "books/shared-header.css"));

const targets = [
  { book: "state-of-flow", chapter: "04_neurobiologi-di-balik-kondisi-alir" },
  { book: "state-of-flow", chapter: "06_model-tantangan-vs-keterampilan" },
  { book: "sejarah-evolusi-drama-korea", chapter: "01_akar-awal-era-drama-radio-dan-kelahiran-televisi" },
  { book: "sejarah-evolusi-drama-korea", chapter: "02_era-hitam-putih-dan-formasi-dasar-1960-an-kelahiran-sang-raksasa-layar-kaca" },
];

const norm = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const manifest: unknown[] = [];
for (const { book, chapter } of targets) {
  const md = fs.readFileSync(path.join(M, "books", book, "src/content", `${chapter}.md`), "utf8").split("\n");
  const start = md.findIndex((l) => l.startsWith("```mermaid"));
  const accTitle = md.slice(start, start + 6).find((l) => l.includes("accTitle:"))!.split("accTitle:")[1].trim();
  // Match the cached SVG by its <title> text (= accTitle).
  const diagDir = path.join(M, "books", book, "diagrams");
  const svgFile = fs.readdirSync(diagDir).find((f) => f.endsWith(".svg") && fs.readFileSync(path.join(diagDir, f), "utf8").includes(`>${accTitle}</title>`))!;
  if (!svgFile) throw new Error(`no svg for ${book}/${chapter} "${accTitle}"`);
  const svg = fs.readFileSync(path.join(diagDir, svgFile), "utf8").trim();
  // Paragraphs before the block, nearest first. The diagram intro sentence may be newer than the old
  // build, so fall back to the nearest earlier paragraph that exists in the built HTML.
  const paras: string[] = [];
  let cur: string[] = [];
  for (let k = start - 1; k >= 0; k--) {
    if (md[k].trim() === "") { if (cur.length) { paras.push(cur.join(" ")); cur = []; } }
    else cur.unshift(md[k]);
  }
  if (cur.length) paras.push(cur.join(" "));
  const htmlPath = path.join(SITE, "books", book, "content", `${chapter}.html`);
  const html = fs.readFileSync(htmlPath, "utf8");
  let insertAt = -1, paraBack = -1, tail = "";
  outer: for (let pi = 0; pi < Math.min(paras.length, 6); pi++) {
    const words = norm(paras[pi]).split(" ");
    for (const probe of [words.slice(-6).join(" "), words.slice(0, 6).join(" ")]) {
      for (const m of html.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
        if (norm(m[2]).includes(probe)) {
          insertAt = m.index! + m[0].length;
          if (m[1] === "li") insertAt = html.indexOf(">", html.slice(insertAt).search(/<\/(ul|ol)>/) + insertAt) + 1;
          paraBack = pi; tail = probe;
          break outer;
        }
      }
    }
  }
  if (insertAt < 0) throw new Error(`paragraph not found in ${htmlPath}: "${tail}"`);
  const out = html.slice(0, insertAt) + `\n<div class="dawnbook-diagram">${svg}</div>\n` + html.slice(insertAt);
  fs.writeFileSync(htmlPath, out);
  const after = md.slice(md.findIndex((l, k) => k > start && l.startsWith("```")) + 1).find((l) => l.trim() !== "") ?? "";
  manifest.push({
    book, chapter, svgFile, accTitle, mdLine: start + 1, paraBack, matched: tail, nearestMdPara: norm(paras[0]).slice(-70),
    before: norm(html.slice(Math.max(0, insertAt - 300), insertAt)).slice(-70),
    afterHtml: norm(html.slice(insertAt, insertAt + 400)).slice(0, 70),
    afterMd: norm(after).slice(0, 70),
  });
}
fs.writeFileSync("/tmp/dtc-C7/manifest.json", JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
