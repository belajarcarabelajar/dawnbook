import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile, mkdir, readFile, utimes } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { main } from "../../scripts/broadcast-old-books";
import { acquireLock, readState, writeState, STATE_FILE } from "../../scripts/broadcast/state";

// 10.00 WIB, outside the 19.00 to 21.59 window.
const NOW = Date.UTC(2026, 9, 30, 3, 0);
const LIVE_URL = "https://dawnbook.belajarcarabelajar.com/manifest.json";
const TEXT_A = "Bab Satu - Buku Uji A\n\nhttps://dawnbook.belajarcarabelajar.com/books/buku-uji-cli-a/content/01_satu";
const TEXT_B = "Bab Satu - Buku Uji B\n\nhttps://dawnbook.belajarcarabelajar.com/books/buku-uji-cli-b/content/01_satu";
const MANIFEST = { books: ["buku-uji-cli-b", "buku-uji-cli-baru", "buku-uji-cli-a"], chapters: {} };

let root: string;
let stateDir: string;

async function writeBook(slug: string, title: string, releasedAt: number | null) {
  const dir = join(root, "books", slug);
  await mkdir(join(dir, "src"), { recursive: true });
  await writeFile(
    join(dir, "book.toml"),
    `[book]\ntitle = "${title}"\nauthors = ["Kania Salsabila"]\n\n[output.html]\ntitle = "bukan judul buku"\n`,
  );
  await writeFile(
    join(dir, "src", "SUMMARY.md"),
    "# Summary\n\n- [Bab Satu](content/01_satu.md)\n- [Bab Dua](content/02_dua.md)\n",
  );
  await writeFile(join(dir, "icon.txt"), "B\n");
  if (releasedAt !== null) await utimes(join(dir, "book.toml"), new Date(releasedAt), new Date(releasedAt));
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "broadcast-cli-"));
  stateDir = join(root, "state");
  await writeFile(join(root, "release-dates.json"), "{}\n");
  await writeBook("buku-uji-cli-a", "Buku Uji A", Date.UTC(2026, 0, 1));
  await writeBook("buku-uji-cli-b", "Buku Uji B", Date.UTC(2026, 1, 1));
  await writeBook("buku-uji-cli-baru", "Buku Uji Baru", null);
  await writeFile(join(root, "m.json"), JSON.stringify(MANIFEST));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

type Deps = NonNullable<Parameters<typeof main>[1]>;

async function cli(argv: string[], over: Deps = {}) {
  const logs: string[] = [];
  const notes: string[] = [];
  const calls: string[] = [];
  const code = await main(argv, {
    rootDir: root,
    stateDir,
    envFile: join(root, "missing.env"),
    now: () => NOW,
    fetch: (async (url: string | URL | Request) => {
      calls.push(url.toString());
      throw new Error("fetch must not be called in this test");
    }) as typeof fetch,
    notify: (text) => notes.push(text),
    log: (text) => logs.push(text),
    ...over,
  });
  return { code, logs, notes, calls };
}

const stateText = () => readFile(join(stateDir, STATE_FILE), "utf8");

describe("init", () => {
  test("--dry-run logs every old book and the count without writing", async () => {
    const r = await cli(["init", "--dry-run", "--manifest", "m.json"]);
    expect(r.code).toBe(0);
    expect(r.logs).toContain(`1. ${TEXT_A}\n\n2. ${TEXT_B}`);
    expect(r.logs).toContain("2 books queued");
    expect(r.logs).toContain("dry run: nothing written");
    expect(existsSync(join(stateDir, STATE_FILE))).toBe(false);
  });

  test("writes the frozen queue with nothing sent", async () => {
    const r = await cli(["init", "--manifest", "m.json"]);
    expect(r.code).toBe(0);
    const state = await readState(stateDir);
    expect(state?.queue.map((q) => q.slug)).toEqual(["buku-uji-cli-a", "buku-uji-cli-b"]);
    expect([state?.sent, state?.createdAt, state?.paused, state?.inFlight]).toEqual([[], "2026-10-30T03:00:00.000Z", null, null]);
  });

  test("refuses a second init and keeps the state", async () => {
    await cli(["init", "--manifest", "m.json"]);
    const before = await stateText();
    const r = await cli(["init", "--manifest", "m.json"]);
    expect(r.code).toBe(1);
    expect(await stateText()).toBe(before);
  });

  test("returns 2 outside the repository root", async () => {
    await rm(join(root, "release-dates.json"));
    const r = await cli(["init", "--dry-run", "--manifest", "m.json"]);
    expect(r.code).toBe(2);
  });

  test("returns 1 on a manifest without books and writes nothing", async () => {
    await writeFile(join(root, "m.json"), JSON.stringify({ books: [], chapters: {} }));
    const r = await cli(["init", "--manifest", "m.json"]);
    expect(r.code).toBe(1);
    expect(existsSync(join(stateDir, STATE_FILE))).toBe(false);
  });

  test("fetches the live manifest once without --manifest", async () => {
    const calls: string[] = [];
    const fetchLive = (async (url: string | URL | Request) => {
      calls.push(url.toString());
      return new Response(JSON.stringify(MANIFEST), { status: 200 });
    }) as typeof fetch;
    const r = await cli(["init", "--dry-run"], { fetch: fetchLive });
    expect(r.code).toBe(0);
    expect(calls).toEqual([LIVE_URL]);
  });

  test("returns 1 when the live manifest does not answer 200", async () => {
    const fetchDown = (async () => new Response("down", { status: 503 })) as typeof fetch;
    const r = await cli(["init", "--dry-run"], { fetch: fetchDown });
    expect(r.code).toBe(1);
  });
});

describe("status", () => {
  test("returns 1 before init", async () => {
    const r = await cli(["status"]);
    expect(r.code).toBe(1);
    expect(r.logs).toEqual(["belum di-init"]);
  });

  test("shows the sent count after init", async () => {
    await cli(["init", "--manifest", "m.json"]);
    const r = await cli(["status"]);
    expect(r.code).toBe(0);
    expect(r.logs).toEqual(["Terkirim 0/2\nBerikutnya: Bab Satu - Buku Uji A"]);
  });
});

describe("pause and resume", () => {
  beforeEach(async () => {
    await cli(["init", "--manifest", "m.json"]);
  });

  test("pause --reason shows in status", async () => {
    expect((await cli(["pause", "--reason", "libur"])).code).toBe(0);
    expect((await cli(["status"])).logs).toEqual(["Terkirim 0/2\nBerikutnya: Bab Satu - Buku Uji A\nPause: libur"]);
  });

  test("pause without a reason records pause manual", async () => {
    await cli(["pause"]);
    expect((await readState(stateDir))?.paused).toEqual({ reason: "pause manual", at: "2026-10-30T03:00:00.000Z", attempt: null });
  });

  test("a second pause returns 0 and keeps the first", async () => {
    await cli(["pause", "--reason", "pertama"]);
    const before = await stateText();
    expect((await cli(["pause", "--reason", "kedua"])).code).toBe(0);
    expect(await stateText()).toBe(before);
  });

  test("plain resume clears a plain pause", async () => {
    await cli(["pause"]);
    expect((await cli(["resume"])).code).toBe(0);
    expect((await readState(stateDir))?.paused).toBeNull();
  });

  test("resume --sent refuses a plain pause", async () => {
    await cli(["pause"]);
    const r = await cli(["resume", "--sent"]);
    expect(r.code).toBe(1);
    expect(r.logs).toEqual(["tidak ada percobaan kirim; pakai resume tanpa opsi"]);
  });

  test("plain resume refuses a pause with a send attempt", async () => {
    const state = (await readState(stateDir))!;
    await writeState(stateDir, { ...state, paused: { reason: "uji", at: "2026-10-29T12:00:00.000Z", attempt: "buku-uji-cli-a" } });
    const r = await cli(["resume"]);
    expect(r.code).toBe(1);
    expect(r.logs).toEqual(["pakai --sent atau --not-sent"]);
  });

  test("resume --sent counts the attempt as sent", async () => {
    const state = (await readState(stateDir))!;
    await writeState(stateDir, { ...state, paused: { reason: "uji", at: "2026-10-29T12:00:00.000Z", attempt: "buku-uji-cli-a" } });
    expect((await cli(["resume", "--sent"])).code).toBe(0);
    expect((await cli(["status"])).logs).toEqual(["Terkirim 1/2\nBerikutnya: Bab Satu - Buku Uji B"]);
  });

  test("pause returns 1 while a run holds the lock", async () => {
    const held = acquireLock(stateDir)!;
    const before = await stateText();
    const r = await cli(["pause"]);
    held();
    expect(r.code).toBe(1);
    expect(r.logs).toEqual(["a run is in progress, try again"]);
    expect(await stateText()).toBe(before);
  });
});

describe("usage", () => {
  test("resume with both --sent and --not-sent returns 2", async () => {
    expect((await cli(["resume", "--sent", "--not-sent"])).code).toBe(2);
  });

  test("an unknown command returns 2", async () => {
    expect((await cli(["bogus"])).code).toBe(2);
  });

  test("no command returns 2", async () => {
    expect((await cli([])).code).toBe(2);
  });

  test("--manifest without a value returns 2", async () => {
    expect((await cli(["init", "--manifest"])).code).toBe(2);
  });

  test("a flag of another command returns 2", async () => {
    expect((await cli(["status", "--dry-run"])).code).toBe(2);
  });

  test("a flag before the command returns 2", async () => {
    expect((await cli(["--dry-run", "run"])).code).toBe(2);
  });
});

describe("run", () => {
  test("--dry-run outside the window touches neither fetch nor notify", async () => {
    await cli(["init", "--manifest", "m.json"]);
    const r = await cli(["run", "--dry-run"]);
    expect([r.code, r.calls.length, r.notes.length]).toEqual([0, 0, 0]);
    expect(r.logs).toEqual(["broadcast-old-books: outside the window (WIB hour 10)"]);
  });

  test("a throwing notify does not make run reject", async () => {
    const r = await cli(["run"], {
      notify: () => {
        throw new Error("notify-send is missing");
      },
    });
    expect(r.code).toBe(1);
    expect(r.logs).toContain("notify failed: notify-send is missing");
    expect(r.logs.filter((l) => l.startsWith("error:"))).toEqual([]);
  });
});
