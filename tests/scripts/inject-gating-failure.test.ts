import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const scriptPath = join(import.meta.dir, "../../scripts/inject-gating.ts");
const tempDirs: string[] = [];

function makeWorkDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "inject-gating-failure-"));
  tempDirs.push(dir);
  mkdirSync(join(dir, "output"));
  writeFileSync(
    join(dir, "output/manifest.json"),
    JSON.stringify({ chapters: {} }),
  );
  return dir;
}

function runScript(cwd: string) {
  return Bun.spawnSync(["bun", "run", scriptPath], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("inject-gating.ts exit code", () => {
  test("exits non-zero and reports the error when output/books cannot be read", () => {
    const cwd = makeWorkDir();
    // A regular file where the books directory belongs makes readdir reject with ENOTDIR.
    writeFileSync(join(cwd, "output/books"), "not a directory");

    const result = runScript(cwd);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain("ENOTDIR");
  });

  test("exits 0 when output/books is a valid empty directory", () => {
    const cwd = makeWorkDir();
    mkdirSync(join(cwd, "output/books"));

    const result = runScript(cwd);

    expect(result.stderr.toString()).toBe("");
    expect(result.exitCode).toBe(0);
  });
});
