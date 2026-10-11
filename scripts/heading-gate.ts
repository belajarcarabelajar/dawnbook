import fs from "node:fs";
import path from "node:path";

// Resolved from this module, not cwd, so the gate works from any working directory.
const CHECKER = path.resolve(import.meta.dir, "check-heading-colons.ts");
const REPEATS = path.resolve(import.meta.dir, "check-repeated-headings.ts");

function countBooks(root: string): number {
  const dir = path.join(root, "books");
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, "book.toml"))).length;
}

function run(script: string, root: string): { code: number | null; text: string } {
  const r = Bun.spawnSync([process.execPath, "run", script, "--root", root], {
    stdout: "pipe",
    stderr: "pipe",
  });
  return { code: r.exitCode, text: r.stdout.toString() + r.stderr.toString() };
}

export function runHeadingGate(root: string): { ok: boolean; output: string } {
  // An empty root would scan nothing and pass, which hides a wrong --root or a missing checkout.
  if (countBooks(root) === 0) return { ok: false, output: `heading gate: no books found under ${root}/books` };
  const colons = run(CHECKER, root);
  const repeats = run(REPEATS, root);
  return {
    ok: colons.code === 0 && repeats.code === 0,
    output: colons.text + repeats.text,
  };
}
