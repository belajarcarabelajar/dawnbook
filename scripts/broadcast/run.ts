/**
 * One guarded run of the old-book broadcast (GEMINI.md section 28): at most one
 * old Dawnbook book per WIB day goes to the Telegram group, between 19.00 and
 * 21.59 WIB, after its link answers 200.
 *
 * Every brake returns before the send. The state records `inFlight` before the
 * Telegram call, so a crash or an unclear reply turns into a pause that a human
 * resolves with `resume --sent` or `resume --not-sent`, never into a duplicate.
 * With `dryRun` the run writes no state, sends no notification and posts nothing.
 */
import { sendMessage } from "../announce-new-books";
import {
  acquireLock,
  readState,
  readTelegramEnv,
  wibClock,
  writeState,
  type BroadcastState,
  type QueueItem,
} from "./state";

export const WINDOW_FIRST_HOUR = 19;
export const WINDOW_LAST_HOUR = 21;
const LINK_TIMEOUT_MS = 20_000;

export interface RunDeps {
  stateDir: string;
  envFile: string;
  now: () => number;
  fetch: typeof fetch;
  notify: (text: string) => void;
  log: (text: string) => void;
  dryRun?: boolean;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function nextItem(state: BroadcastState): QueueItem | undefined {
  const sent = new Set(state.sent.map((s) => s.slug));
  return state.queue.find((q) => !sent.has(q.slug));
}

async function linkStatus(fetchImpl: typeof fetch, url: string): Promise<number | string> {
  try {
    const res = await fetchImpl(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(LINK_TIMEOUT_MS) });
    return res.status;
  } catch (err) {
    return messageOf(err);
  }
}

export async function runOnce(deps: RunDeps): Promise<number> {
  const say = (text: string) => deps.log(`broadcast-old-books: ${text}`);
  const secret = { token: "" };
  const redact = (text: string) => (secret.token ? text.split(secret.token).join("<token>") : text);
  let release: (() => void) | null = null;
  try {
    release = acquireLock(deps.stateDir);
    if (!release) {
      say("another run holds the lock");
      return 0;
    }
    return await guardedRun(deps, say, secret);
  } catch (err) {
    const message = redact(messageOf(err));
    say(`unexpected error: ${message}`);
    if (!deps.dryRun) deps.notify(`Dawnbook broadcast gagal: ${message}`);
    return 1;
  } finally {
    release?.();
  }
}

async function guardedRun(deps: RunDeps, say: (text: string) => void, secret: { token: string }): Promise<number> {
  const { stateDir, dryRun } = deps;
  const nowIso = () => new Date(deps.now()).toISOString();
  const alert = (text: string) => {
    say(`${dryRun ? "would notify" : "notify"}: ${text}`);
    if (!dryRun) deps.notify(text);
  };
  const save = async (next: BroadcastState) => {
    if (!dryRun) await writeState(stateDir, next);
  };

  const state = await readState(stateDir);
  if (!state) {
    alert("Dawnbook broadcast belum di-init. Jalankan: bun run scripts/broadcast-old-books.ts init");
    return 1;
  }
  if (state.paused) {
    say(`paused: ${state.paused.reason}`);
    return 0;
  }
  if (state.inFlight) {
    const slug = state.inFlight.slug;
    await save({ ...state, inFlight: null, paused: { reason: "status kirim tidak pasti", at: state.inFlight.at, attempt: slug } });
    alert(`Dawnbook broadcast di-pause: status kirim ${slug} tidak pasti. Cek grup, lalu resume --sent atau --not-sent.`);
    return 1;
  }

  const today = wibClock(deps.now());
  if (today.hour < WINDOW_FIRST_HOUR || today.hour > WINDOW_LAST_HOUR) {
    say(`outside the window (WIB hour ${today.hour})`);
    return 0;
  }
  if (state.sent.some((s) => wibClock(Date.parse(s.at)).date === today.date)) {
    say(`already sent on ${today.date} WIB`);
    return 0;
  }

  const item = nextItem(state);
  if (!item) {
    if (state.doneNotifiedAt) {
      say("every old book has been sent");
      return 0;
    }
    await save({ ...state, doneNotifiedAt: nowIso() });
    alert("Semua buku lama Dawnbook sudah dikirim ke grup. Broadcast berhenti.");
    return 0;
  }

  const { token, chatId } = await readTelegramEnv(deps.envFile);
  if (!token || !chatId) {
    say("TELEGRAM_BOT_TOKEN or DAWNBOOK_TELEGRAM_CHAT_ID is not set; nothing sent");
    return 0;
  }
  secret.token = token;

  const status = await linkStatus(deps.fetch, item.url);
  if (status !== 200) {
    alert(`Dawnbook broadcast: tautan ${item.slug} membalas ${status}, tidak dikirim.`);
    return 1;
  }
  if (dryRun) {
    say(`would send ${item.slug}:\n${item.text}`);
    return 0;
  }

  const at = nowIso();
  await writeState(stateDir, { ...state, inFlight: { slug: item.slug, at } });
  let messageId: number | null;
  try {
    messageId = await sendMessage(token, chatId, item.text, deps.fetch);
  } catch (err) {
    const reason = messageOf(err).split(token).join("<token>");
    await writeState(stateDir, { ...state, inFlight: null, paused: { reason, at, attempt: item.slug } });
    alert(`Dawnbook broadcast di-pause: kirim ${item.slug} gagal (${reason}). Cek grup, lalu resume --sent atau --not-sent.`);
    return 1;
  }
  await writeState(stateDir, { ...state, inFlight: null, sent: [...state.sent, { slug: item.slug, at, messageId }] });
  say(`sent ${item.slug}`);
  return 0;
}

export function applyResume(
  state: BroadcastState,
  mode: "plain" | "sent" | "not-sent",
  _nowIso: string,
): BroadcastState | string {
  const paused = state.paused;
  if (!paused) return "tidak sedang pause";
  if (paused.attempt !== null && mode === "plain") return "pakai --sent atau --not-sent";
  if (paused.attempt === null && mode !== "plain") return "tidak ada percobaan kirim; pakai resume tanpa opsi";
  const sent = [...state.sent];
  if (mode === "sent" && paused.attempt !== null) sent.push({ slug: paused.attempt, at: paused.at, messageId: null });
  return { ...state, sent, paused: null };
}

export function describeStatus(state: BroadcastState): string {
  const next = nextItem(state);
  const lines = [
    `Terkirim ${state.sent.length}/${state.queue.length}`,
    `Berikutnya: ${next ? next.text.split("\n")[0] : "selesai"}`,
  ];
  if (state.paused) lines.push(`Pause: ${state.paused.reason}`);
  return lines.join("\n");
}
