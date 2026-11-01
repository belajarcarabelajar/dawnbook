import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "../..");
// Scratch lives under ~/.cache/tmp because $TMPDIR can be swapped per command on this machine.
const SCRATCH = path.join(os.homedir(), ".cache/tmp/dawnbook-scratch/cli-tests-check-book-structure");

const OPENER = "Kamu mungkin mengenal Doraemon sejak kecil, tetapi jarang yang tahu bahwa robot kucing itu pernah diangkat menjadi duta resmi Jepang.";
// 100 to 155 characters, so it is neither out of range nor cut in the root page meta.
const DESCRIPTION = "Buku contoh tentang robot kucing dari masa depan, dipakai untuk menguji pemeriksaan struktur buku lewat baris perintah.";

function chapter(title: string): string {
  return `## ${title}\n\n${OPENER} Kalimat kedua menjelaskan lebih jauh.\n\n### Rincian ${title}\n\nIsi bagian.\n`;
}

function book(): Record<string, string> {
  return {
    "book.toml": `[book]\ntitle = "Contoh"\ndescription = "${DESCRIPTION}"\n`,
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
  const r = Bun.spawnSync(["bun", "run", "scripts/check-book-structure.ts", ...args], { cwd: ROOT, stdout: "pipe", stderr: "pipe" });
  return { exitCode: r.exitCode, stdout: r.stdout.toString() };
}

beforeAll(() => {
  fs.rmSync(SCRATCH, { recursive: true, force: true });
  fs.mkdirSync(SCRATCH, { recursive: true });
});

afterAll(() => {
  fs.rmSync(SCRATCH, { recursive: true, force: true });
});

describe("check-book-structure --all from the repo root", () => {
  test("exits 0 on two clean books and reports both", () => {
    const { exitCode, stdout } = runCli(["--books-dir", library({ alfa: book(), beta: book() }), "--all"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("alfa: 2 chapters, 0 problems");
    expect(stdout).toContain("beta: 2 chapters, 0 problems");
  });

  test("exits 1 when one book has a chapter file missing from SUMMARY and names that book and file", () => {
    const stray = { ...book(), "src/content/03_liar.md": chapter("Liar") };
    const { exitCode, stdout } = runCli(["--books-dir", library({ alfa: book(), beta: stray }), "--all"]);
    expect(exitCode).toBe(1);
    expect(stdout).toContain("03_liar.md: chapter file not in SUMMARY");
    expect(stdout).toContain("beta: 2 chapters, 1 problems");
    expect(stdout).toContain("alfa: 2 chapters, 0 problems");
  });

  test("skips a slug that starts with an underscore", () => {
    const stray = { ...book(), "src/content/03_liar.md": chapter("Liar") };
    const { exitCode, stdout } = runCli(["--books-dir", library({ alfa: book(), _template: stray }), "--all"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("alfa: 2 chapters, 0 problems");
    expect(stdout).not.toContain("_template");
    expect(stdout).not.toContain("03_liar.md");
  });
});
