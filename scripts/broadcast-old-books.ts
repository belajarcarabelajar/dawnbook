/**
 * CLI of the old-book broadcast (GEMINI.md section 28): one old Dawnbook book a
 * day goes to the Telegram group from a laptop systemd timer.
 *
 *   bun run scripts/broadcast-old-books.ts init [--dry-run] [--manifest <file>]   # freeze the queue once
 *   bun run scripts/broadcast-old-books.ts run [--dry-run]                        # one guarded send (the timer)
 *   bun run scripts/broadcast-old-books.ts status                                 # sent count, next book, pause
 *   bun run scripts/broadcast-old-books.ts pause [--reason <text>]                # stop until resumed
 *   bun run scripts/broadcast-old-books.ts resume [--sent | --not-sent]           # lift a pause
 *
 * Run from the repository root. Exit codes: 0 no action needed, 1 attention
 * needed, 2 usage error.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { SITE_URL } from "./announce-new-books";
import { buildQueue, hubReleaseMs } from "./broadcast/queue";
import { applyResume, describeStatus, runOnce } from "./broadcast/run";
import { DEFAULT_ENV_FILE, DEFAULT_STATE_DIR, STATE_FILE, acquireLock, readState, writeState } from "./broadcast/state";

const MANIFEST_URL = `${SITE_URL}/manifest.json`;
const USAGE =
  "usage: broadcast-old-books.ts init [--dry-run] [--manifest <file>] | run [--dry-run] | status | " +
  "pause [--reason <text>] | resume [--sent | --not-sent]";
const FLAGS: Record<string, string[]> = {
  init: ["--dry-run", "--manifest"],
  run: ["--dry-run"],
  status: [],
  pause: ["--reason"],
  resume: ["--sent", "--not-sent"],
};

interface Args { command: string; dryRun: boolean; manifest?: string; reason?: string; sent: boolean; notSent: boolean }
type Log = (text: string) => void;

function parseArgs(argv: string[]): Args | string {
  const [command, ...rest] = argv;
  if (!command || !Object.hasOwn(FLAGS, command)) return `unknown command: ${command ?? "(none)"}`;
  const args: Args = { command, dryRun: false, sent: false, notSent: false };
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    if (!FLAGS[command].includes(flag)) return `unknown argument for ${command}: ${flag}`;
    if (flag === "--manifest" || flag === "--reason") {
      const value = rest[++i];
      if (!value) return `${flag} needs a value`;
      args[flag === "--manifest" ? "manifest" : "reason"] = value;
    } else if (flag === "--dry-run") args.dryRun = true;
    else if (flag === "--sent") args.sent = true;
    else args.notSent = true;
  }
  if (args.sent && args.notSent) return "pass --sent or --not-sent, not both";
  return args;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function desktopNotify(text: string): void {
  Bun.spawnSync(["notify-send", "-u", "critical", "-a", "Dawnbook broadcast", "Dawnbook broadcast", text]);
}

async function liveManifest(fetchImpl: typeof fetch): Promise<unknown> {
  const res = await fetchImpl(MANIFEST_URL, { signal: AbortSignal.timeout(20_000) });
  if (res.status !== 200) throw new Error(`${MANIFEST_URL} answered ${res.status}`);
  return JSON.parse(await res.text());
}

async function init(args: Args, rootDir: string, stateDir: string, fetchImpl: typeof fetch, log: Log, nowIso: string) {
  if (!existsSync(join(rootDir, "release-dates.json"))) {
    log("release-dates.json not found; run from the repository root");
    return 2;
  }
  if (await readState(stateDir)) {
    log(`state already exists at ${join(stateDir, STATE_FILE)}; refusing to overwrite`);
    return 1;
  }
  const manifest = args.manifest
    ? JSON.parse(await readFile(resolve(rootDir, args.manifest), "utf8"))
    : await liveManifest(fetchImpl);
  const queue = await buildQueue({ rootDir, liveManifest: manifest, releaseMs: (slug) => hubReleaseMs(rootDir, slug) });
  log(queue.map((item, i) => `${i + 1}. ${item.text}`).join("\n\n"));
  log(`${queue.length} books queued`);
  if (args.dryRun) {
    log("dry run: nothing written");
    return 0;
  }
  await writeState(stateDir, { version: 1, createdAt: nowIso, queue, sent: [], inFlight: null, paused: null, doneNotifiedAt: null });
  log(`state written to ${join(stateDir, STATE_FILE)}`);
  return 0;
}

async function pauseOrResume(args: Args, stateDir: string, log: Log, nowIso: string) {
  const release = acquireLock(stateDir);
  if (!release) {
    log("a run is in progress, try again");
    return 1;
  }
  try {
    const state = await readState(stateDir);
    if (!state) {
      log("belum di-init");
      return 1;
    }
    if (args.command === "pause" && state.paused) {
      log(`already paused: ${state.paused.reason}`);
      return 0;
    }
    const next =
      args.command === "pause"
        ? { ...state, paused: { reason: args.reason ?? "pause manual", at: nowIso, attempt: null } }
        : applyResume(state, args.sent ? "sent" : args.notSent ? "not-sent" : "plain", nowIso);
    if (typeof next === "string") {
      log(next);
      return 1;
    }
    await writeState(stateDir, next);
    log(describeStatus(next));
    return 0;
  } finally {
    release();
  }
}

type MainDeps = Partial<{ rootDir: string; stateDir: string; envFile: string; now: () => number; fetch: typeof fetch;
  notify: (t: string) => void; log: (t: string) => void }>;

export async function main(argv: string[], deps: MainDeps = {}): Promise<number> {
  const rootDir = deps.rootDir ?? process.cwd();
  const stateDir = deps.stateDir ?? DEFAULT_STATE_DIR;
  const now = deps.now ?? Date.now;
  const fetchImpl = deps.fetch ?? ((url, init) => fetch(url, init));
  const log = deps.log ?? console.log;
  const rawNotify = deps.notify ?? desktopNotify;
  const notify = (text: string) => {
    try {
      rawNotify(text);
    } catch (err) {
      log(`notify failed: ${messageOf(err)}`);
    }
  };

  const args = parseArgs(argv);
  if (typeof args === "string") {
    log(`${args}\n${USAGE}`);
    return 2;
  }
  const nowIso = new Date(now()).toISOString();
  try {
    if (args.command === "init") return await init(args, rootDir, stateDir, fetchImpl, log, nowIso);
    if (args.command === "run") {
      const envFile = deps.envFile ?? DEFAULT_ENV_FILE;
      return await runOnce({ stateDir, envFile, now, fetch: fetchImpl, notify, log, dryRun: args.dryRun });
    }
    if (args.command === "status") {
      const state = await readState(stateDir);
      log(state ? describeStatus(state) : "belum di-init");
      return state ? 0 : 1;
    }
    return await pauseOrResume(args, stateDir, log, nowIso);
  } catch (err) {
    log(`error: ${messageOf(err)}`);
    return 1;
  }
}

if (import.meta.main) main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
