import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "../..");
// Scratch lives under ~/.cache/tmp because $TMPDIR can be swapped per command on this machine.
const SCRATCH = path.join(os.homedir(), ".cache/tmp/dawnbook-scratch/cli-tests-check-voice");

const CLEAN = "Si petani berhenti sebentar dan mengusap kening. Kamu tahu artinya: sudah waktunya istirahat.";

function chapter(title: string, body = CLEAN): string {
  return `## ${title}\n\n${body}\n`;
}

function book(): Record<string, string> {
  return {
    "book.toml": '[book]\ntitle = "Contoh"\ndescription = "Buku contoh untuk menguji pemeriksaan suara lewat baris perintah."\n',
    "src/SUMMARY.md": "# Summary\n\n- [Bab Pertama](content/01_bab-pertama.md)\n- [Bab Kedua](content/02_bab-kedua.md)\n",
    "src/content/01_bab-pertama.md": chapter("Bab Pertama"),
    "src/content/02_bab-kedua.md": chapter("Bab Kedua"),
  };
}

let counter = 0;
function library(books: Record<string, Record<string, string>>): string {
  const lib = path.join(SCRATCH, `lib-${counter++}`);
  for (const [slug, files] of Object.entries(books)) {
    for (const [rel, body] of Object.entries(files)) {
      const full = path.join(lib, slug, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, body);
    }
  }
  return lib;
}

function runCli(args: string[]): { exitCode: number; stdout: string } {
  const r = Bun.spawnSync(["bun", "run", "scripts/check-voice.ts", ...args], { cwd: ROOT, stdout: "pipe", stderr: "pipe" });
  return { exitCode: r.exitCode, stdout: r.stdout.toString() };
}

beforeAll(() => {
  fs.rmSync(SCRATCH, { recursive: true, force: true });
  fs.mkdirSync(SCRATCH, { recursive: true });
});

afterAll(() => {
  fs.rmSync(SCRATCH, { recursive: true, force: true });
});

describe("check-voice --all from the repo root", () => {
  test("exits 0 on two clean books and reports both", () => {
    const { exitCode, stdout } = runCli(["--books-dir", library({ alfa: book(), beta: book() }), "--all"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("alfa: 2 chapters, 0 problems");
    expect(stdout).toContain("beta: 2 chapters, 0 problems");
  });

  test("exits 1 when one book has a stock connector and names that book and file", () => {
    const dirty = { ...book(), "src/content/02_bab-kedua.md": chapter("Bab Kedua", `Menariknya, ${CLEAN}`) };
    const { exitCode, stdout } = runCli(["--books-dir", library({ alfa: book(), beta: dirty }), "--all"]);
    expect(exitCode).toBe(1);
    expect(stdout).toContain("beta/02_bab-kedua.md: stock connector x1 (max 0)");
    expect(stdout).toContain("beta: 2 chapters, 1 problems");
    expect(stdout).toContain("alfa: 2 chapters, 0 problems");
  });

  test("skips a slug that starts with an underscore", () => {
    const dirty = { ...book(), "src/content/01_bab-pertama.md": chapter("Bab Pertama", `Menariknya, ${CLEAN}`) };
    const { exitCode, stdout } = runCli(["--books-dir", library({ alfa: book(), _template: dirty }), "--all"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("alfa: 2 chapters, 0 problems");
    expect(stdout).not.toContain("_template");
  });
});
