import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runOnce, applyResume, describeStatus } from "../../../scripts/broadcast/run";
import { acquireLock, writeState, readState, STATE_FILE, type BroadcastState, type QueueItem } from "../../../scripts/broadcast/state";

const TOKEN = "123456:fake-token";
const CHAT = "-1001234567890";
const AT_1859 = Date.UTC(2026, 9, 30, 11, 59);
const AT_1900 = Date.UTC(2026, 9, 30, 12, 0);
const AT_2000 = Date.UTC(2026, 9, 30, 13, 0);
const AT_2159 = Date.UTC(2026, 9, 30, 14, 59);
const AT_2200 = Date.UTC(2026, 9, 30, 15, 0);
const NEXT_DAY_1900 = Date.UTC(2026, 9, 31, 12, 0);
const SEND_URL = "https://api.telegram.org/bot123456:fake-token/sendMessage";

function item(slug: string, title: string): QueueItem {
  const url = `https://dawnbook.example.test/books/${slug}/content/01_satu`;
  return { slug, text: `${title}\n\n${url}`, url };
}

const A = item("buku-a", "Bab Satu - Buku A");
const B = item("buku-b", "Bab Satu - Buku B");

function baseState(over: Partial<BroadcastState> = {}): BroadcastState {
  return {
    version: 1,
    createdAt: "2026-10-29T00:00:00.000Z",
    queue: [A, B],
    sent: [],
    inFlight: null,
    paused: null,
    doneNotifiedAt: null,
    ...over,
  };
}

type Call = { url: string; method: string; redirect?: string; body?: any };
interface Fake { link?: number | "throw"; telegram?: "ok" | "fail" | "timeout"; onPost?: () => void }

function fakeFetch(calls: Call[], fake: Fake) {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = input.toString();
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method: init?.method ?? "GET", redirect: init?.redirect, body });
    if (url.startsWith("https://api.telegram.org/")) {
      fake.onPost?.();
      if (fake.telegram === "timeout") throw new DOMException("timeout", "TimeoutError");
      if (fake.telegram === "fail") {
        return new Response(JSON.stringify({ ok: false, description: `chat not found ${TOKEN}` }), { status: 400 });
      }
      return new Response(JSON.stringify({ ok: true, result: { message_id: 7 } }), { status: 200 });
    }
    if (fake.link === "throw") throw new TypeError("fetch failed");
    const status = fake.link ?? 200;
    return new Response(status === 200 ? "ok" : null, { status });
  }) as typeof fetch;
}

let root: string;
let stateDir: string;
let envFile: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "broadcast-run-"));
  stateDir = join(root, "state");
  envFile = join(root, ".env");
  await writeFile(envFile, `TELEGRAM_BOT_TOKEN=${TOKEN}\nDAWNBOOK_TELEGRAM_CHAT_ID=${CHAT}\n`);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function run(now: number, fake: Fake & { dryRun?: boolean } = {}) {
  const calls: Call[] = [];
  const notes: string[] = [];
  const logs: string[] = [];
  const code = await runOnce({
    stateDir,
    envFile,
    now: () => now,
    fetch: fakeFetch(calls, fake),
    notify: (text) => notes.push(text),
    log: (text) => logs.push(text),
    dryRun: fake.dryRun,
  });
  return { code, calls, notes, logs, posts: calls.filter((c) => c.method === "POST") };
}

const stateText = () => readFile(join(stateDir, STATE_FILE), "utf8");

describe("runOnce window", () => {
  beforeEach(() => writeState(stateDir, baseState()));

  test("does nothing at 18.59 WIB", async () => {
    const r = await run(AT_1859);
    expect([r.code, r.calls.length]).toEqual([0, 0]);
  });

  test("does nothing at 22.00 WIB", async () => {
    const r = await run(AT_2200);
    expect([r.code, r.calls.length]).toEqual([0, 0]);
  });

  test("sends at 19.00 WIB", async () => {
    const r = await run(AT_1900);
    expect([r.code, r.posts.length]).toEqual([0, 1]);
  });

  test("sends at 21.59 WIB", async () => {
    const r = await run(AT_2159);
    expect([r.code, r.posts.length]).toEqual([0, 1]);
  });
});

describe("runOnce send", () => {
  beforeEach(() => writeState(stateDir, baseState()));

  test("checks the link with one GET before one POST", async () => {
    const r = await run(AT_1900);
    expect(r.calls.map((c) => [c.method, c.url, c.redirect])).toEqual([
      ["GET", A.url, "manual"],
      ["POST", SEND_URL, undefined],
    ]);
  });

  test("posts the item text to the chat", async () => {
    const r = await run(AT_1900);
    expect(r.posts[0].body).toEqual({ chat_id: CHAT, text: A.text });
  });

  test("records inFlight before the POST", async () => {
    let during: unknown;
    await run(AT_1900, { onPost: () => (during = JSON.parse(readFileSync(join(stateDir, STATE_FILE), "utf8")).inFlight) });
    expect(during).toEqual({ slug: "buku-a", at: "2026-10-30T12:00:00.000Z" });
  });

  test("records the message id and clears inFlight", async () => {
    await run(AT_1900);
    const state = await readState(stateDir);
    expect(state?.sent).toEqual([{ slug: "buku-a", at: "2026-10-30T12:00:00.000Z", messageId: 7 }]);
    expect(state?.inFlight).toBeNull();
  });

  test("prefixes every log line", async () => {
    const r = await run(AT_1900);
    expect(r.logs.length).toBeGreaterThan(0);
    expect(r.logs.every((l) => l.startsWith("broadcast-old-books: "))).toBe(true);
  });

  test("releases the lock afterwards", async () => {
    await run(AT_1900);
    const release = acquireLock(stateDir);
    expect(typeof release).toBe("function");
    release!();
  });

  test("a second run on the same WIB day sends nothing", async () => {
    await run(AT_1900);
    const r = await run(AT_2000);
    expect([r.code, r.calls.length]).toEqual([0, 0]);
  });

  test("the next WIB day sends the next item", async () => {
    await run(AT_1900);
    await run(NEXT_DAY_1900);
    expect((await readState(stateDir))?.sent.map((s) => s.slug)).toEqual(["buku-a", "buku-b"]);
  });
});

describe("runOnce brakes", () => {
  test("a sent entry from resume --sent today blocks a send", async () => {
    await writeState(stateDir, baseState({ sent: [{ slug: "buku-a", at: "2026-10-30T11:30:00.000Z", messageId: null }] }));
    const r = await run(AT_1900);
    expect([r.code, r.calls.length]).toEqual([0, 0]);
  });

  test("a send at 00.30 WIB today (17.30 UTC yesterday) counts as today", async () => {
    await writeState(stateDir, baseState({ sent: [{ slug: "buku-a", at: "2026-10-29T17:30:00.000Z", messageId: 3 }] }));
    const r = await run(AT_1900);
    expect([r.code, r.calls.length]).toEqual([0, 0]);
  });

  test("no state asks for init", async () => {
    const r = await run(AT_1900);
    expect([r.code, r.calls.length]).toEqual([1, 0]);
    expect(r.notes).toEqual(["Dawnbook broadcast belum di-init. Jalankan: bun run scripts/broadcast-old-books.ts init"]);
  });

  test("a paused state sends nothing", async () => {
    await writeState(stateDir, baseState({ paused: { reason: "uji", at: "2026-10-29T12:00:00.000Z", attempt: null } }));
    const r = await run(AT_1900);
    expect([r.code, r.calls.length, r.notes.length]).toEqual([0, 0, 0]);
  });

  test("a leftover inFlight becomes a pause", async () => {
    await writeState(stateDir, baseState({ inFlight: { slug: "buku-a", at: "2026-10-29T12:00:00.000Z" } }));
    const r = await run(AT_2000);
    expect([r.code, r.calls.length]).toEqual([1, 0]);
    const state = await readState(stateDir);
    expect(state?.paused).toEqual({ reason: "status kirim tidak pasti", at: "2026-10-29T12:00:00.000Z", attempt: "buku-a" });
    expect(state?.inFlight).toBeNull();
    expect(r.notes).toEqual([
      "Dawnbook broadcast di-pause: status kirim buku-a tidak pasti. Cek grup, lalu resume --sent atau --not-sent.",
    ]);
  });

  test("resume --sent after a leftover inFlight does not block the next WIB day", async () => {
    await writeState(stateDir, baseState({ inFlight: { slug: "buku-a", at: "2026-10-30T12:00:00.000Z" } }));
    expect((await run(NEXT_DAY_1900)).code).toBe(1);
    const resumed = applyResume((await readState(stateDir))!, "sent", "2026-10-31T12:30:00.000Z") as BroadcastState;
    expect(resumed.sent).toEqual([{ slug: "buku-a", at: "2026-10-30T12:00:00.000Z", messageId: null }]);
    await writeState(stateDir, resumed);
    const r = await run(Date.UTC(2026, 9, 31, 13, 0));
    expect([r.code, r.posts.length]).toEqual([0, 1]);
    expect((await readState(stateDir))?.sent.map((s) => s.slug)).toEqual(["buku-a", "buku-b"]);
  });

  test("a link answering 404 is not sent", async () => {
    await writeState(stateDir, baseState());
    const before = await stateText();
    const r = await run(AT_1900, { link: 404 });
    expect([r.code, r.posts.length]).toEqual([1, 0]);
    expect(await stateText()).toBe(before);
    expect(r.notes).toEqual(["Dawnbook broadcast: tautan buku-a membalas 404, tidak dikirim."]);
  });

  test("a link answering 301 is not sent", async () => {
    await writeState(stateDir, baseState());
    const before = await stateText();
    const r = await run(AT_1900, { link: 301 });
    expect([r.code, r.posts.length]).toEqual([1, 0]);
    expect(await stateText()).toBe(before);
    expect(r.notes).toEqual(["Dawnbook broadcast: tautan buku-a membalas 301, tidak dikirim."]);
  });

  test("a link check that throws is not sent", async () => {
    await writeState(stateDir, baseState());
    const r = await run(AT_1900, { link: "throw" });
    expect([r.code, r.posts.length]).toEqual([1, 0]);
    expect(r.notes).toEqual(["Dawnbook broadcast: tautan buku-a membalas fetch failed, tidak dikirim."]);
  });

  test("a Telegram 400 pauses with the attempt", async () => {
    await writeState(stateDir, baseState());
    const r = await run(AT_1900, { telegram: "fail" });
    expect(r.code).toBe(1);
    const state = await readState(stateDir);
    expect(state?.paused).toEqual({
      reason: "Telegram 400: chat not found <token>",
      at: "2026-10-30T12:00:00.000Z",
      attempt: "buku-a",
    });
    expect([state?.inFlight, state?.sent]).toEqual([null, []]);
    expect(r.notes).toEqual([
      "Dawnbook broadcast di-pause: kirim buku-a gagal (Telegram 400: chat not found <token>). Cek grup, lalu resume --sent atau --not-sent.",
    ]);
  });

  test("a Telegram 400 never writes or notifies the token", async () => {
    await writeState(stateDir, baseState());
    const r = await run(AT_1900, { telegram: "fail" });
    expect(await stateText()).not.toContain(TOKEN);
    expect(r.notes.join("\n")).not.toContain(TOKEN);
    expect(r.logs.join("\n")).not.toContain(TOKEN);
  });

  test("a Telegram timeout pauses with the attempt", async () => {
    await writeState(stateDir, baseState());
    const r = await run(AT_1900, { telegram: "timeout" });
    expect(r.code).toBe(1);
    const state = await readState(stateDir);
    expect(state?.paused).toEqual({ reason: "timeout", at: "2026-10-30T12:00:00.000Z", attempt: "buku-a" });
    expect(state?.inFlight).toBeNull();
  });

  test("an exhausted queue notifies once over two runs", async () => {
    const sent = [
      { slug: "buku-a", at: "2026-10-27T12:00:00.000Z", messageId: 1 },
      { slug: "buku-b", at: "2026-10-28T12:00:00.000Z", messageId: 2 },
    ];
    await writeState(stateDir, baseState({ sent }));
    const first = await run(AT_1900);
    const second = await run(NEXT_DAY_1900);
    expect([first.code, second.code, first.calls.length + second.calls.length]).toEqual([0, 0, 0]);
    expect([...first.notes, ...second.notes]).toEqual(["Semua buku lama Dawnbook sudah dikirim ke grup. Broadcast berhenti."]);
    expect((await readState(stateDir))?.doneNotifiedAt).toBe("2026-10-30T12:00:00.000Z");
  });

  test("a missing token sends nothing", async () => {
    await writeState(stateDir, baseState());
    await writeFile(envFile, `DAWNBOOK_TELEGRAM_CHAT_ID=${CHAT}\n`);
    const r = await run(AT_1900);
    expect([r.code, r.calls.length]).toEqual([0, 0]);
  });

  test("a held lock sends nothing", async () => {
    await writeState(stateDir, baseState());
    const held = acquireLock(stateDir)!;
    const r = await run(AT_1900);
    held();
    expect([r.code, r.calls.length]).toEqual([0, 0]);
  });

  test("an unexpected error notifies and returns 1", async () => {
    await writeState(stateDir, baseState({ sent: [{ slug: "buku-a", at: "bukan tanggal", messageId: 1 }] }));
    const r = await run(AT_1900);
    expect([r.code, r.notes.length]).toEqual([1, 1]);
    expect(r.notes[0].startsWith("Dawnbook broadcast gagal: ")).toBe(true);
  });
});

describe("runOnce dry run", () => {
  test("logs the text without writing, notifying or posting", async () => {
    await writeState(stateDir, baseState());
    const before = await stateText();
    const r = await run(AT_1900, { dryRun: true });
    expect([r.code, r.notes.length, r.posts.length]).toEqual([0, 0, 0]);
    expect(await stateText()).toBe(before);
    expect(r.logs.join("\n")).toContain(A.text);
  });

  test("a leftover inFlight is not written as a pause", async () => {
    await writeState(stateDir, baseState({ inFlight: { slug: "buku-a", at: "2026-10-29T12:00:00.000Z" } }));
    const before = await stateText();
    const r = await run(AT_1900, { dryRun: true });
    expect([r.code, r.notes.length, r.calls.length]).toEqual([1, 0, 0]);
    expect(await stateText()).toBe(before);
  });

  test("no state returns 1 without notifying or creating a state", async () => {
    const r = await run(AT_1900, { dryRun: true });
    expect([r.code, r.notes.length]).toEqual([1, 0]);
    expect(existsSync(join(stateDir, STATE_FILE))).toBe(false);
  });

  test("an exhausted queue does not record the notification", async () => {
    const sent = [
      { slug: "buku-a", at: "2026-10-27T12:00:00.000Z", messageId: 1 },
      { slug: "buku-b", at: "2026-10-28T12:00:00.000Z", messageId: 2 },
    ];
    await writeState(stateDir, baseState({ sent }));
    const before = await stateText();
    const r = await run(AT_1900, { dryRun: true });
    expect([r.code, r.notes.length]).toEqual([0, 0]);
    expect(await stateText()).toBe(before);
  });
});

describe("applyResume", () => {
  const NOW = "2026-10-30T14:00:00.000Z";
  const pausedWith = (attempt: string | null) =>
    baseState({
      sent: [{ slug: "buku-x", at: "2026-10-28T12:00:00.000Z", messageId: 5 }],
      paused: { reason: "uji", at: "2026-10-29T12:00:00.000Z", attempt },
    });

  test("refuses a state that is not paused", () => {
    expect(applyResume(baseState(), "plain", NOW)).toBe("tidak sedang pause");
  });

  test("refuses plain resume after a send attempt", () => {
    expect(applyResume(pausedWith("buku-a"), "plain", NOW)).toBe("pakai --sent atau --not-sent");
  });

  test("refuses --sent without a send attempt", () => {
    expect(applyResume(pausedWith(null), "sent", NOW)).toBe("tidak ada percobaan kirim; pakai resume tanpa opsi");
  });

  test("refuses --not-sent without a send attempt", () => {
    expect(applyResume(pausedWith(null), "not-sent", NOW)).toBe("tidak ada percobaan kirim; pakai resume tanpa opsi");
  });

  test("plain resume clears the pause and keeps sent", () => {
    const next = applyResume(pausedWith(null), "plain", NOW) as BroadcastState;
    expect(next.paused).toBeNull();
    expect(next.sent).toEqual([{ slug: "buku-x", at: "2026-10-28T12:00:00.000Z", messageId: 5 }]);
  });

  test("--sent records the attempt at the pause time", () => {
    const next = applyResume(pausedWith("buku-a"), "sent", NOW) as BroadcastState;
    expect(next.paused).toBeNull();
    expect(next.sent).toEqual([
      { slug: "buku-x", at: "2026-10-28T12:00:00.000Z", messageId: 5 },
      { slug: "buku-a", at: "2026-10-29T12:00:00.000Z", messageId: null },
    ]);
  });

  test("--not-sent clears the pause and keeps sent", () => {
    const next = applyResume(pausedWith("buku-a"), "not-sent", NOW) as BroadcastState;
    expect(next.paused).toBeNull();
    expect(next.sent).toEqual([{ slug: "buku-x", at: "2026-10-28T12:00:00.000Z", messageId: 5 }]);
  });

  test("does not mutate its input", () => {
    const input = pausedWith("buku-a");
    const copy = structuredClone(input);
    applyResume(input, "sent", NOW);
    expect(input).toEqual(copy);
  });
});

describe("describeStatus", () => {
  test("shows the count and the next title", () => {
    const state = baseState({ sent: [{ slug: "buku-a", at: "2026-10-29T12:00:00.000Z", messageId: 1 }] });
    expect(describeStatus(state)).toBe("Terkirim 1/2\nBerikutnya: Bab Satu - Buku B");
  });

  test("shows selesai and the pause reason", () => {
    const state = baseState({
      sent: [
        { slug: "buku-a", at: "2026-10-28T12:00:00.000Z", messageId: 1 },
        { slug: "buku-b", at: "2026-10-29T12:00:00.000Z", messageId: 2 },
      ],
      paused: { reason: "status kirim tidak pasti", at: "2026-10-30T12:00:00.000Z", attempt: "buku-b" },
    });
    expect(describeStatus(state)).toBe("Terkirim 2/2\nBerikutnya: selesai\nPause: status kirim tidak pasti");
  });
});
