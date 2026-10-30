/**
 * Storage layer of the old-book broadcast (GEMINI.md section 28): a laptop
 * timer posts one old Dawnbook book a day to the Telegram group.
 *
 * Holds the state file (`state.json`, written atomically, mode 600 in a mode
 * 700 folder), the run lock (a kernel `flock` on `run.lock`, released when the
 * holding process exits, even after a crash), the reader for the two Telegram
 * values in the env file, and the WIB clock that decides the window.
 */
import { dlopen, FFIType } from "bun:ffi";
import { chmodSync, closeSync, ftruncateSync, mkdirSync, openSync, writeSync } from "node:fs";
import { open, readFile, rename } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export interface QueueItem { slug: string; text: string; url: string }
export interface SentItem { slug: string; at: string; messageId: number | null }
export interface Pause { reason: string; at: string; attempt: string | null }
export interface BroadcastState {
  version: 1;
  createdAt: string;
  queue: QueueItem[];
  sent: SentItem[];
  inFlight: { slug: string; at: string } | null;
  paused: Pause | null;
  doneNotifiedAt: string | null;
}

export const DEFAULT_STATE_DIR = join(homedir(), ".local", "state", "dawnbook-broadcast");
export const DEFAULT_ENV_FILE = join(homedir(), "cloudflare", ".env");
export const STATE_FILE = "state.json";
export const LOCK_FILE = "run.lock";

function errorCode(err: unknown): string | undefined {
  return (err as NodeJS.ErrnoException | null)?.code;
}

function ensurePrivateDir(dir: string): void {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
}

export async function readState(dir: string): Promise<BroadcastState | null> {
  const path = join(dir, STATE_FILE);
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (err) {
    if (errorCode(err) === "ENOENT") return null;
    throw err;
  }
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error(`${path} is not valid JSON: ${(err as Error).message}`);
  }
  if (data?.version !== 1) throw new Error(`${path} has version ${data?.version}, expected 1`);
  if (!Array.isArray(data.queue)) throw new Error(`${path} has no queue array`);
  if (!Array.isArray(data.sent)) throw new Error(`${path} has no sent array`);
  return data as BroadcastState;
}

export async function writeState(dir: string, state: BroadcastState): Promise<void> {
  ensurePrivateDir(dir);
  const tmp = join(dir, `${STATE_FILE}.tmp`);
  const handle = await open(tmp, "w", 0o600);
  try {
    await handle.writeFile(`${JSON.stringify(state, null, 2)}\n`);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(tmp, join(dir, STATE_FILE));
}

const LOCK_EX_NB = 6;
const LOCK_UN = 8;
let flockSymbol: ((fd: number, operation: number) => number) | null = null;

// Loaded on first use so importing this module never opens libc.
function flock(fd: number, operation: number): number {
  flockSymbol ??= dlopen("libc.so.6", {
    flock: { args: [FFIType.i32, FFIType.i32], returns: FFIType.i32 },
  }).symbols.flock as (fd: number, operation: number) => number;
  return flockSymbol(fd, operation);
}

// The file is never deleted: a new inode would let a second run lock it while
// the first still holds the old one. The pid inside is for people only.
export function acquireLock(dir: string): (() => void) | null {
  ensurePrivateDir(dir);
  const fd = openSync(join(dir, LOCK_FILE), "a+", 0o600);
  if (flock(fd, LOCK_EX_NB) !== 0) {
    closeSync(fd);
    return null;
  }
  ftruncateSync(fd, 0);
  writeSync(fd, `${process.pid}\n`, 0);
  let held = true;
  return () => {
    if (!held) return;
    held = false;
    flock(fd, LOCK_UN);
    closeSync(fd);
  };
}

const ENV_KEYS: Record<string, "token" | "chatId"> = {
  TELEGRAM_BOT_TOKEN: "token",
  DAWNBOOK_TELEGRAM_CHAT_ID: "chatId",
};

export async function readTelegramEnv(path: string): Promise<{ token?: string; chatId?: string }> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (err) {
    if (errorCode(err) === "ENOENT") return {};
    throw err;
  }
  const result: { token?: string; chatId?: string } = {};
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!match || !Object.hasOwn(ENV_KEYS, match[1])) continue;
    const raw = match[2].trim();
    const quoted = /^(["'])(.*?)\1(?:\s+#.*)?$/.exec(raw);
    const value = quoted ? quoted[2] : match[2].replace(/\s+#.*$/, "").trim();
    const key = ENV_KEYS[match[1]];
    if (value === "") delete result[key];
    else result[key] = value;
  }
  return result;
}

const WIB_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
});

export function wibClock(nowMs: number): { date: string; hour: number } {
  const parts: Record<string, string> = {};
  for (const part of WIB_FORMAT.formatToParts(nowMs)) parts[part.type] = part.value;
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}
