// Keeps the R2 bucket of premium images in step with the staging folder the build writes
// (GEMINI.md section 30). deploy-website.sh runs `upload` before the Pages deploy and
// `prune` after it.
//
//   bun run scripts/premium/sync-media.ts upload|prune [--dry-run]
//
// Exit codes: 0 done, 1 failure or refusal, 2 usage error.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import { premiumSlugs } from "../../functions/lib/premium";
import { PREMIUM_MEDIA_DIR } from "./move-media";

export const MEDIA_BUCKET = "dawnbook-premium-media";
const KEY_PREFIX = "books/";
const PAGE_SIZE = 1000; // the API maximum for per_page
const MAX_PAGES = 1000;
const USAGE = "usage: bun run scripts/premium/sync-media.ts upload|prune [--dry-run]";

const CONTENT_TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

export type CfResult = { exitCode: number; stdout: string; stderr: string };
export type SyncDeps = {
  run: (cmd: string[]) => Promise<CfResult>;
  stagingDir: string;
  /** Slugs in data/premium-books.json; prune refuses when one of them has nothing staged. */
  registeredSlugs: string[];
  log: (line: string) => void;
  error: (line: string) => void;
};

type Staged = { key: string; file: string };

async function runCf(cmd: string[]): Promise<CfResult> {
  const proc = Bun.spawn(cmd, {
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, NO_COLOR: "1" },
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { exitCode, stdout, stderr };
}

// dup-defs: allow the other walk is in a spike folder, not shipped code
function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function stagedObjects(stagingDir: string): Staged[] {
  return walk(join(stagingDir, "books"))
    .map((file) => ({ key: relative(stagingDir, file).split(sep).join("/"), file }))
    .sort((a, b) => (a.key < b.key ? -1 : 1));
}

const contentType = (key: string): string | undefined => CONTENT_TYPES[extname(key).toLowerCase()];
const md5 = (file: string) => createHash("md5").update(readFileSync(file)).digest("hex");

function parseListing(stdout: string): { key: string; etag?: string }[] {
  let data: unknown;
  try {
    data = JSON.parse(stdout);
  } catch {
    throw new Error(`cf r2 objects list printed no JSON: ${stdout.trim().slice(0, 200)}`);
  }
  if (!Array.isArray(data) || !data.every((o) => typeof o?.key === "string")) {
    throw new Error("cf r2 objects list printed something other than an array of objects with a key");
  }
  return data;
}

/** Every key under books/ with its etag (R2 sets a single-part upload's etag to the MD5 of its body). */
async function listObjects(run: SyncDeps["run"]): Promise<Map<string, string>> {
  const etags = new Map<string, string>();
  let after: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const cmd = ["cf", "r2", "objects", "list", "--bucket-name", MEDIA_BUCKET, "--prefix", KEY_PREFIX, "--per-page", String(PAGE_SIZE)];
    // cf prints only the result array and drops result_info, so the API cursor never reaches
    // us; the next page starts after the last key. A page can hold fewer keys than asked for
    // while more follow, so only an empty page ends the listing.
    if (after !== undefined) cmd.push("--start-after", after);
    const res = await run(cmd);
    if (res.exitCode !== 0) throw new Error(`cf r2 objects list failed (exit ${res.exitCode}): ${res.stderr.trim()}`);
    const items = parseListing(res.stdout);
    if (items.length === 0) return etags;
    const before = etags.size;
    for (const item of items) etags.set(item.key, (item.etag ?? "").replaceAll('"', "").toLowerCase());
    if (etags.size === before) throw new Error(`cf r2 objects list repeated the page after ${after}`);
    after = items[items.length - 1]!.key;
  }
  throw new Error(`cf r2 objects list returned more than ${MAX_PAGES} pages`);
}

async function upload(deps: SyncDeps, staged: Staged[], dryRun: boolean): Promise<number> {
  const unknown = staged.filter((s) => !contentType(s.key));
  if (unknown.length > 0) {
    for (const s of unknown) {
      deps.error(`sync-media: ${s.key} has no known content type (${Object.keys(CONTENT_TYPES).join(", ")}); nothing uploaded`);
    }
    return 1;
  }
  if (staged.length === 0) {
    deps.log("sync-media upload: no premium images staged, nothing to upload");
    return 0;
  }

  const remote = await listObjects(deps.run);
  const todo = staged.filter((s) => remote.get(s.key) !== md5(s.file));
  for (const s of todo) deps.log(`${dryRun ? "would put" : "put"} ${s.key} (${remote.has(s.key) ? "changed" : "new"})`);
  deps.log(`sync-media upload: ${todo.length} to put, ${staged.length - todo.length} unchanged${dryRun ? " (dry run, nothing written)" : ""}`);
  if (dryRun) return 0;

  let failed = 0;
  for (const s of todo) {
    const res = await deps.run(["cf", "r2", "objects", "put", s.key, "--bucket-name", MEDIA_BUCKET, "--file", s.file, "--content-type", contentType(s.key)!]);
    if (res.exitCode !== 0) {
      failed++;
      deps.error(`sync-media: put ${s.key} failed (exit ${res.exitCode}): ${res.stderr.trim()}`);
    }
  }
  return failed > 0 ? 1 : 0;
}

async function prune(deps: SyncDeps, staged: Staged[], dryRun: boolean): Promise<number> {
  if (staged.length === 0) {
    deps.error(`sync-media: refusing to prune, ${deps.stagingDir}/books holds no images; a build without the private books would empty the bucket`);
    return 1;
  }
  const missing = deps.registeredSlugs.filter((slug) => !staged.some((s) => s.key.startsWith(`${KEY_PREFIX}${slug}/`)));
  if (missing.length > 0) {
    deps.error(`sync-media: refusing to prune, no images staged for registered premium book(s): ${missing.join(", ")}`);
    return 1;
  }

  const remote = await listObjects(deps.run);
  const keep = new Set(staged.map((s) => s.key));
  const stale = [...remote.keys()].filter((key) => !keep.has(key)).sort();
  for (const key of stale) deps.log(`${dryRun ? "would delete" : "delete"} ${key}`);
  deps.log(`sync-media prune: ${stale.length} to delete, ${remote.size - stale.length} kept${dryRun ? " (dry run, nothing deleted)" : ""}`);
  if (dryRun) return 0;

  let failed = 0;
  for (const key of stale) {
    const res = await deps.run(["cf", "r2", "objects", "delete", key, "--bucket-name", MEDIA_BUCKET, "--force"]);
    if (res.exitCode !== 0) {
      failed++;
      deps.error(`sync-media: delete ${key} failed (exit ${res.exitCode}): ${res.stderr.trim()}`);
    }
  }
  return failed > 0 ? 1 : 0;
}

export async function main(argv: string[], deps: Partial<SyncDeps> = {}): Promise<number> {
  const d: SyncDeps = {
    run: runCf,
    stagingDir: resolve(import.meta.dir, "../..", PREMIUM_MEDIA_DIR),
    registeredSlugs: deps.registeredSlugs ?? premiumSlugs(),
    log: (line) => console.log(line),
    error: (line) => console.error(line),
    ...deps,
  };

  const flags = argv.filter((a) => a.startsWith("-"));
  const commands = argv.filter((a) => !a.startsWith("-"));
  const command = commands[0];
  if (commands.length !== 1 || (command !== "upload" && command !== "prune") || flags.some((f) => f !== "--dry-run")) {
    d.error(USAGE);
    return 2;
  }
  const dryRun = flags.includes("--dry-run");

  if (!existsSync(join(d.stagingDir, "books"))) {
    d.error(`sync-media: ${d.stagingDir}/books is missing; run bun run build first`);
    return 1;
  }

  try {
    const staged = stagedObjects(d.stagingDir);
    return command === "upload" ? await upload(d, staged, dryRun) : await prune(d, staged, dryRun);
  } catch (err) {
    d.error(`sync-media: ${(err as Error).message}`);
    return 1;
  }
}

if (import.meta.main) {
  process.exit(await main(process.argv.slice(2)));
}
