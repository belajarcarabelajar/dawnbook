import path from "node:path";

// Resolved from this module, not cwd, so the gate works from any working directory.
const CHECKER = path.resolve(import.meta.dir, "check-heading-colons.ts");

export function runHeadingGate(root: string): { ok: boolean; output: string } {
  const r = Bun.spawnSync([process.execPath, "run", CHECKER, "--root", root], {
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    ok: r.exitCode === 0,
    output: r.stdout.toString() + r.stderr.toString(),
  };
}
