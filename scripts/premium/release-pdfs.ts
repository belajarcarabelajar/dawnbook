#!/usr/bin/env bun
/**
 * Reprints every revised premium book and replaces its store PDF in R2.
 *
 * Usage:
 *   bun run scripts/premium/release-pdfs.ts [--books-dir <dir>] [--dry-run]
 *
 * --books-dir defaults to books/ of this repo, which scripts/premium-sync.ts fills.
 * --dry-run prints and checks every book but runs no cf command.
 * Exit codes: 0 every book released (or printed, with --dry-run), 1 a book failed or the books
 *   folder is missing, 2 usage error.
 *
 * Books: every registry slug with `edition: 2026`. A book without an edition is skipped; a
 * revised book without <books-dir>/<slug>/print-cover.svg fails the run, so a deploy never
 * leaves its store PDF stale silently. An optional <books-dir>/<slug>/print.json such as
 * {"hideImages": ["lancar-nugas-sampul.png"]} adds one --hide-image per name.
 *
 * Per book, one failure never stops the next book:
 *   1. bun run scripts/premium/print-pdf.ts <slug> --out <temp>/<slug>.pdf --books-dir <dir>
 *      --cover <dir>/<slug>/print-cover.svg [--hide-image <name>]... --restrict
 *      The output must exist and start with %PDF-.
 *   2. cf r2 objects put member/<slug>.pdf --bucket-name bcb-admin-media --file <pdf>
 *      --content-type application/pdf
 *   3. cf r2 objects get member/<slug>.pdf --bucket-name bcb-admin-media (raw body on stdout),
 *      and its sha256 must equal the printed file's.
 * The only key written is member/<slug>.pdf, overwritten in place: no backup object, no other
 * key, no delete. cf takes its credentials from the environment (CLOUDFLARE_API_TOKEN and
 * CLOUDFLARE_ACCOUNT_ID, from ~/cloudflare/.env).
 *
 * Output: one summary line per registry book at the end, "release-pdfs: <slug>: ok, member/
 * <slug>.pdf sha256 <hex>", "... ok (dry run, not uploaded), sha256 <hex>", "... failed:
 * <reason>" or "... skipped: <reason>". A book that fails before its upload keeps its previous
 * store PDF; after a failed upload, a failed read-back or a sha256 mismatch the stored object is
 * unverified. Either way, rerun the script. The temp folder is removed at the end.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadPremiumRegistry } from "../../functions/lib/premium";
import { UsageError, tail } from "./cli";

const BUCKET = "bcb-admin-media";
const REPO_ROOT = path.resolve(import.meta.dir, "../..");
const PRINT_SCRIPT = path.join(REPO_ROOT, "scripts/premium/print-pdf.ts");
const USAGE = "usage: bun run scripts/premium/release-pdfs.ts [--books-dir <dir>] [--dry-run]";
const PRINT_TIMEOUT_MS = 900_000;
const CF_TIMEOUT_MS = 300_000;

export type Runner = (
  cmd: string[],
  opts: { cwd?: string; timeoutMs: number },
) => { exitCode: number; stdout: Uint8Array; stderr: string };

export interface Deps {
  run: Runner;
  tmpRoot: string;
  bun: string;
  log: (line: string) => void;
  error: (line: string) => void;
}

const spawnRunner: Runner = (cmd, opts) => {
  const res = Bun.spawnSync(cmd, { cwd: opts.cwd, stdout: "pipe", stderr: "pipe", timeout: opts.timeoutMs });
  return { exitCode: res.exitCode ?? 1, stdout: res.stdout, stderr: res.stderr.toString() };
};

// dup-defs: allow same name as in print-pdf.ts, different dependencies (cf and the print script)
function defaultDeps(): Deps {
  return {
    run: spawnRunner,
    tmpRoot: os.tmpdir(),
    bun: process.execPath,
    log: (line) => console.log(line),
    error: (line) => console.error(line),
  };
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

// The optional print.json beside the cover: {"hideImages": ["<basename>", ...]}.
function readHideImages(file: string): string[] {
  if (!fs.existsSync(file)) return [];
  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    throw new Error("print.json is not valid JSON");
  }
  const hide = typeof data === "object" && data !== null && !Array.isArray(data)
    ? (data as { hideImages?: unknown }).hideImages
    : null;
  if (hide === undefined) return [];
  if (!Array.isArray(hide) || !hide.every((name) => typeof name === "string")) {
    throw new Error('print.json must look like {"hideImages": ["<image file name>", ...]}');
  }
  return hide;
}

// status is the text after "<slug>: " in the summary line.
type Outcome = { ok: boolean; status: string };

export function parseArgs(argv: string[]): { booksDir?: string; dryRun: boolean } {
  let booksDir: string | undefined;
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--books-dir") {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) throw new UsageError("--books-dir needs a value");
      booksDir = value;
    } else {
      throw new UsageError(arg.startsWith("-") ? `unknown option ${arg}` : `unexpected argument ${arg}`);
    }
  }
  return { booksDir, dryRun };
}

export function main(argv: string[], deps: Deps = defaultDeps()): number {
  let args: { booksDir?: string; dryRun: boolean };
  try {
    args = parseArgs(argv);
  } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    deps.error(`release-pdfs: ${err.message}\n${USAGE}`);
    return 2;
  }
  const booksDir = path.resolve(args.booksDir ?? path.join(REPO_ROOT, "books"));
  // Without this, a mistyped folder would skip every book (no print cover) and exit 0.
  if (!fs.existsSync(booksDir)) {
    deps.error(`release-pdfs: books folder not found: ${booksDir} (run scripts/premium-sync.ts first?)`);
    return 1;
  }
  const temp = fs.mkdtempSync(path.join(deps.tmpRoot, "dawnbook-release-pdfs-"));
  const summary: string[] = [];
  let failed = 0;
  try {
    for (const [slug, entry] of Object.entries(loadPremiumRegistry())) {
      // A book without an edition is published verbatim from its original PDF; only a revised
      // edition is reprinted.
      if (entry.edition !== 2026) {
        summary.push(`release-pdfs: ${slug}: skipped: not edition 2026`);
        continue;
      }
      // A revised book must have its cover: skipping it would leave its store PDF stale silently.
      if (!fs.existsSync(path.join(booksDir, slug, "print-cover.svg"))) {
        failed++;
        summary.push(`release-pdfs: ${slug}: failed: no print-cover.svg`);
        continue;
      }
      const outcome = releaseBook(slug, booksDir, temp, args.dryRun, deps);
      if (!outcome.ok) failed++;
      summary.push(`release-pdfs: ${slug}: ${outcome.status}`);
    }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  for (const line of summary) deps.log(line);
  if (failed > 0) {
    deps.error(`release-pdfs: ${failed} book(s) failed; their store PDF was not replaced as printed. Rerun this script.`);
    return 1;
  }
  return 0;
}

function releaseBook(slug: string, booksDir: string, temp: string, dryRun: boolean, deps: Deps): Outcome {
  const pdf = path.join(temp, `${slug}.pdf`);
  const cover = path.join(booksDir, slug, "print-cover.svg");
  const failed = (step: string, res: { exitCode: number; stderr: string }): Outcome => {
    deps.error(`release-pdfs: ${step} failed for ${slug} (exit ${res.exitCode})\n${tail(res.stderr)}`);
    return { ok: false, status: `failed: ${step} exited ${res.exitCode}` };
  };

  let hideImages: string[];
  try {
    hideImages = readHideImages(path.join(booksDir, slug, "print.json"));
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    deps.error(`release-pdfs: ${slug}: ${reason}`);
    return { ok: false, status: `failed: ${reason}` };
  }

  deps.log(`release-pdfs: printing ${slug}`);
  const print = deps.run(
    [
      deps.bun, "run", PRINT_SCRIPT, slug, "--out", pdf, "--books-dir", booksDir, "--cover", cover,
      ...hideImages.flatMap((name) => ["--hide-image", name]),
      "--restrict",
    ],
    { cwd: REPO_ROOT, timeoutMs: PRINT_TIMEOUT_MS },
  );
  if (print.exitCode !== 0) return failed("print-pdf", print);
  const bytes = fs.existsSync(pdf) ? fs.readFileSync(pdf) : null;
  if (bytes === null || bytes.subarray(0, 5).toString("latin1") !== "%PDF-") {
    deps.error(`release-pdfs: print-pdf exited 0 for ${slug} but ${pdf} is missing or not a PDF`);
    return { ok: false, status: "failed: print-pdf wrote no PDF" };
  }
  const local = sha256(bytes);
  if (dryRun) return { ok: true, status: `ok (dry run, not uploaded), sha256 ${local}` };

  const key = `member/${slug}.pdf`;
  const put = deps.run(
    ["cf", "r2", "objects", "put", key, "--bucket-name", BUCKET, "--file", pdf, "--content-type", "application/pdf"],
    { timeoutMs: CF_TIMEOUT_MS },
  );
  if (put.exitCode !== 0) return failed("upload", put);
  // cf can exit 0 without doing the work, so the stored object is read back and compared.
  const get = deps.run(["cf", "r2", "objects", "get", key, "--bucket-name", BUCKET], { timeoutMs: CF_TIMEOUT_MS });
  if (get.exitCode !== 0) return failed("download", get);
  const stored = sha256(get.stdout);
  if (stored !== local) return { ok: false, status: `failed: sha256 mismatch: printed ${local}, ${key} in R2 ${stored}` };
  return { ok: true, status: `ok, ${key} sha256 ${local}` };
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
