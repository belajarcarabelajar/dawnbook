// Dev tool, not part of the build. Measures how well rewritten headings of ONE book
// hold up against a base ref: connector overuse, length growth, and lost topic labels.
// Usage: bun run scripts/measure-heading-quality.ts <slug> [--base origin/main]
import fs from "node:fs";
import path from "node:path";

export interface FilePair {
  file: string;
  oldText: string;
  newText: string;
}

export interface Row {
  file: string;
  line: number;
  old: string;
  next: string;
  first: boolean;
}

export interface Measurement {
  rows: Row[];
  cap: number;
  counts: Record<string, number>;
  over: string[];
  longer: Row[];
  longerPct: number;
  lost: string[];
  fail: boolean;
}

const CONNECTORS = ["sebagai", "dengan", "melalui", "lewat", "pada", "saat", "untuk", "menurut", "dalam", "ibarat", "hingga", "oleh", "di", "ketika", "agar", "demi"];
const HEADING = /^(#{1,6})\s+(.*)$/;
const LINK_TEXT = /\[([^\]]*)\]\(/;
const GENERIC = /^(pendahuluan|pengantar|kritik|studi kasus|kesimpulan|penutup|analogi|skenario|kasus|aplikasi|implementasi|real-?world|langkah|tahap|fase|bagian|pilar|komponen)\b/i;
const STOP = new Set(["dan", "yang", "dari", "untuk", "dengan", "dalam", "pada", "atau", "the", "and"]);

const words = (t: string) =>
  t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

function collectRows(pairs: FilePair[]): Row[] {
  const rows: Row[] = [];
  for (const p of pairs) {
    const oldT = p.oldText.split("\n");
    const newT = p.newText.split("\n");
    const isSum = p.file.endsWith("SUMMARY.md");
    const firstIdx = isSum ? -1 : oldT.findIndex((l) => HEADING.test(l));
    // Line-by-line only: a rewrite that shifts line counts is outside what this ruler can pair up.
    for (let i = 0; i < Math.min(oldT.length, newT.length); i++) {
      if (oldT[i] === newT[i]) continue;
      let o: string;
      let n: string;
      if (isSum) {
        const a = LINK_TEXT.exec(oldT[i]);
        const b = LINK_TEXT.exec(newT[i]);
        if (!a || !b) continue;
        o = a[1];
        n = b[1];
      } else {
        const a = HEADING.exec(oldT[i]);
        const b = HEADING.exec(newT[i]);
        if (!a || !b) continue;
        o = a[2];
        n = b[2];
      }
      rows.push({ file: path.basename(p.file), line: i + 1, old: o, next: n, first: isSum || i === firstIdx });
    }
  }
  return rows;
}

export function measureHeadings(pairs: FilePair[]): Measurement {
  const rows = collectRows(pairs);
  const N = rows.length;
  const cap = Math.max(4, Math.ceil(0.15 * N));
  const counts: Record<string, number> = {};
  for (const r of rows) {
    for (const w of new Set(r.next.toLowerCase().split(/\s+/))) {
      if (CONNECTORS.includes(w)) counts[w] = (counts[w] || 0) + 1;
    }
  }
  const longer = rows.filter((r) => r.next.length > r.old.length);
  const longerPct = N ? Math.round((100 * longer.length) / N) : 0;
  const over = Object.entries(counts).filter(([, v]) => v > cap).map(([k]) => k);

  // Chapter titles (first heading of a file, and SUMMARY entries) must keep the topic named by the old label.
  const lost: string[] = [];
  for (const r of rows) {
    if (!r.first || !r.old.includes(":")) continue;
    const label = r.old.split(":")[0].replace(/\\\./g, ".").replace(/^\d+\.\s*/, "");
    const rest = label.replace(GENERIC, "").trim();
    if (!rest) continue;
    const lw = words(GENERIC.test(label) ? rest : label);
    const nw = new Set(words(r.next));
    const kept = lw.filter((w) => nw.has(w)).length;
    if (lw.length && kept / lw.length < 0.6) lost.push(`${r.file}:${r.line} label="${label}" new="${r.next}"`);
  }

  const fail = longerPct > 50 || over.length > 0 || lost.length > 0;
  return { rows, cap, counts, over, longer, longerPct, lost, fail };
}

export function formatMeasurement(m: Measurement, slug = ""): string {
  const out: string[] = [];
  out.push(`book=${slug} rewritten=${m.rows.length} perConnectorCap=${m.cap} (max(4, ceil(15%))) longerCap=50%`);
  out.push(
    "connector counts: " +
      Object.entries(m.counts)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k}:${v}${v > m.cap ? " OVER" : ""}`)
        .join(" "),
  );
  out.push(`longer than old: ${m.longer.length}/${m.rows.length} = ${m.longerPct}% ${m.longerPct > 50 ? "OVER" : "ok"}`);
  if (m.over.length) {
    out.push("--- headings using an OVER connector (revise enough of these to get each connector at or below the cap):");
    for (const r of m.rows) {
      const ws = new Set(r.next.toLowerCase().split(/\s+/));
      const hit = m.over.filter((w) => ws.has(w));
      if (hit.length) out.push(`${r.file}:${r.line} [${hit.join(",")}] ${r.next}`);
    }
  }
  if (m.longerPct > 50) {
    out.push("--- headings longer than the old one (shorten enough of these, preferably by dropping a part, so at most 50% are longer):");
    for (const r of m.longer) out.push(`${r.file}:${r.line} (+${r.next.length - r.old.length}) ${r.next}`);
  }
  out.push(`chapter titles that lost their topic label: ${m.lost.length} ${m.lost.length ? "OVER" : "ok"}`);
  for (const l of m.lost) out.push("  " + l);
  out.push(m.fail ? "RULER: FAIL" : "RULER: PASS");
  return out.join("\n") + "\n";
}

function git(root: string, args: string[]): { code: number; out: string; err: string } {
  const r = Bun.spawnSync(["git", ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
  return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() };
}

function usage(msg: string): never {
  console.error(msg);
  console.error("usage: bun run scripts/measure-heading-quality.ts <slug> [--base origin/main]");
  process.exit(2);
}

if (import.meta.main) {
  const root = path.resolve(import.meta.dir, "..");
  let slug: string | undefined;
  let base = "origin/main";
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--base") {
      const v = argv[++i];
      if (!v || v.startsWith("-")) usage("--base needs a git ref");
      base = v;
    } else if (argv[i].startsWith("-")) {
      usage(`unknown option: ${argv[i]}`);
    } else if (!slug) {
      slug = argv[i];
    } else {
      usage(`unexpected argument: ${argv[i]}`);
    }
  }
  if (!slug) usage("missing <slug>");
  if (!/^[A-Za-z0-9._-]+$/.test(slug)) usage(`invalid slug: ${slug}`);

  const diff = git(root, ["-c", "core.quotepath=off", "diff", "--name-only", base, "--", `books/${slug}`]);
  if (diff.code !== 0) usage(`git diff failed: ${diff.err.trim()}`);
  const pairs: FilePair[] = [];
  for (const f of diff.out.split("\n").filter((x) => x.endsWith(".md"))) {
    const show = git(root, ["show", `${base}:${f}`]);
    // A file absent from the base is new, so there is no old heading to compare against.
    if (show.code !== 0) continue;
    const abs = path.join(root, f);
    if (!fs.existsSync(abs)) continue;
    pairs.push({ file: f, oldText: show.out, newText: fs.readFileSync(abs, "utf8") });
  }
  const m = measureHeadings(pairs);
  process.stdout.write(formatMeasurement(m, slug));
  process.exit(m.fail ? 1 : 0);
}
