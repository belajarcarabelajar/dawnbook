import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile, readFile, stat, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  readState,
  writeState,
  acquireLock,
  readTelegramEnv,
  wibClock,
  STATE_FILE,
  LOCK_FILE,
  type BroadcastState,
} from "../../../scripts/broadcast/state";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "broadcast-state-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function sampleState(slug = "buku-lama"): BroadcastState {
  return {
    version: 1,
    createdAt: "2026-10-30T12:00:00.000Z",
    queue: [{ slug, text: "Bab Satu - Buku Lama", url: "https://example.test/books/buku-lama/content/01_satu" }],
    sent: [{ slug: "buku-terkirim", at: "2026-10-29T12:00:00.000Z", messageId: 42 }],
    inFlight: null,
    paused: null,
    doneNotifiedAt: null,
  };
}

describe("readState", () => {
  test("returns null when the state file is missing", async () => {
    expect(await readState(join(root, "state"))).toBeNull();
  });

  test("reads back what writeState wrote", async () => {
    const dir = join(root, "state");
    await writeState(dir, sampleState());
    expect(await readState(dir)).toEqual(sampleState());
  });

  test("throws on invalid JSON", async () => {
    await writeFile(join(root, STATE_FILE), "{not json");
    await expect(readState(root)).rejects.toThrow();
  });

  test("throws on version 2", async () => {
    await writeFile(join(root, STATE_FILE), JSON.stringify({ ...sampleState(), version: 2 }));
    await expect(readState(root)).rejects.toThrow(/version/);
  });

  test("throws when queue is not an array", async () => {
    await writeFile(join(root, STATE_FILE), JSON.stringify({ ...sampleState(), queue: {} }));
    await expect(readState(root)).rejects.toThrow(/queue/);
  });

  test("throws when sent is not an array", async () => {
    const { sent: _sent, ...rest } = sampleState();
    await writeFile(join(root, STATE_FILE), JSON.stringify(rest));
    await expect(readState(root)).rejects.toThrow(/sent/);
  });
});

describe("writeState", () => {
  test("creates the folder with mode 700 and the file with mode 600", async () => {
    const dir = join(root, "nested", "state");
    await writeState(dir, sampleState());
    expect((await stat(dir)).mode & 0o777).toBe(0o700);
    expect((await stat(join(dir, STATE_FILE))).mode & 0o777).toBe(0o600);
  });

  test("tightens an existing folder to mode 700", async () => {
    const { chmod } = await import("node:fs/promises");
    await chmod(root, 0o755);
    await writeState(root, sampleState());
    expect((await stat(root)).mode & 0o777).toBe(0o700);
  });

  test("leaves no state.json.tmp behind", async () => {
    await writeState(root, sampleState());
    expect(await readdir(root)).toEqual([STATE_FILE]);
  });

  test("writes pretty JSON with a trailing newline", async () => {
    await writeState(root, sampleState());
    const text = await readFile(join(root, STATE_FILE), "utf8");
    expect(text.endsWith("}\n")).toBe(true);
    expect(text).toContain('\n  "version": 1,');
  });

  test("a second write replaces the first", async () => {
    await writeState(root, sampleState("pertama"));
    await writeState(root, sampleState("kedua"));
    const state = await readState(root);
    expect(state?.queue.map((q) => q.slug)).toEqual(["kedua"]);
  });
});

describe("acquireLock", () => {
  const alive = () => true;
  const dead = () => false;

  test("takes a free lock and writes the pid into it", () => {
    const release = acquireLock(root, 4242, alive);
    expect(typeof release).toBe("function");
    expect(readFileSync(join(root, LOCK_FILE), "utf8").trim()).toBe("4242");
  });

  test("creates a missing folder with mode 700", async () => {
    const dir = join(root, "state");
    expect(acquireLock(dir, 4242, alive)).not.toBeNull();
    expect((await stat(dir)).mode & 0o777).toBe(0o700);
  });

  test("returns null while the holder is alive", () => {
    acquireLock(root, 4242, alive);
    expect(acquireLock(root, 5555, alive)).toBeNull();
    expect(readFileSync(join(root, LOCK_FILE), "utf8").trim()).toBe("4242");
  });

  test("takes over a stale lock whose holder is dead", () => {
    acquireLock(root, 4242, alive);
    const release = acquireLock(root, 5555, dead);
    expect(typeof release).toBe("function");
    expect(readFileSync(join(root, LOCK_FILE), "utf8").trim()).toBe("5555");
  });

  test("takes over a lock with garbage content", async () => {
    await writeFile(join(root, LOCK_FILE), "bukan-pid\n");
    const release = acquireLock(root, 5555, alive);
    expect(typeof release).toBe("function");
    expect(readFileSync(join(root, LOCK_FILE), "utf8").trim()).toBe("5555");
  });

  test("release removes the lock file", () => {
    const release = acquireLock(root, 4242, alive);
    release!();
    expect(existsSync(join(root, LOCK_FILE))).toBe(false);
  });

  test("release ignores a lock file that is already gone", async () => {
    const release = acquireLock(root, 4242, alive);
    await rm(join(root, LOCK_FILE));
    expect(() => release!()).not.toThrow();
  });
});

describe("readTelegramEnv", () => {
  async function envFrom(text: string) {
    const path = join(root, ".env");
    await writeFile(path, text);
    return readTelegramEnv(path);
  }

  test("returns an empty object when the file is missing", async () => {
    expect(await readTelegramEnv(join(root, "missing.env"))).toEqual({});
  });

  test("reads plain KEY=value lines", async () => {
    const env = await envFrom("TELEGRAM_BOT_TOKEN=123456:fake-token\nDAWNBOOK_TELEGRAM_CHAT_ID=-1001234567890\n");
    expect(env).toEqual({ token: "123456:fake-token", chatId: "-1001234567890" });
  });

  test("reads export lines with leading whitespace", async () => {
    const env = await envFrom("  export TELEGRAM_BOT_TOKEN=123456:fake-token\nexport DAWNBOOK_TELEGRAM_CHAT_ID=-100\n");
    expect(env).toEqual({ token: "123456:fake-token", chatId: "-100" });
  });

  test("strips double quotes", async () => {
    const env = await envFrom('TELEGRAM_BOT_TOKEN="123456:fake-token"\n');
    expect(env.token).toBe("123456:fake-token");
  });

  test("strips single quotes", async () => {
    const env = await envFrom("DAWNBOOK_TELEGRAM_CHAT_ID='-1001234567890'\n");
    expect(env.chatId).toBe("-1001234567890");
  });

  test("ignores comments, blank lines and every other key", async () => {
    const env = await envFrom(
      "# komentar\n\nCLOUDFLARE_API_TOKEN=x\nCF_API_TOKEN=y\nTELEGRAM_BOT_TOKEN=123456:fake-token\n# TELEGRAM_BOT_TOKEN=commented\n",
    );
    expect(Object.keys(env).sort()).toEqual(["token"]);
    expect(env.token).toBe("123456:fake-token");
  });

  test("treats an empty value as missing", async () => {
    const env = await envFrom('TELEGRAM_BOT_TOKEN=\nDAWNBOOK_TELEGRAM_CHAT_ID=""\n');
    expect(env.token).toBeUndefined();
    expect(env.chatId).toBeUndefined();
  });
});

describe("wibClock", () => {
  test("11.59 UTC is 18.00 hour on the same WIB date", () => {
    expect(wibClock(Date.UTC(2026, 9, 30, 11, 59))).toEqual({ date: "2026-10-30", hour: 18 });
  });

  test("12.00 UTC is hour 19 WIB", () => {
    expect(wibClock(Date.UTC(2026, 9, 30, 12, 0)).hour).toBe(19);
  });

  test("16.59 UTC is hour 23 WIB", () => {
    expect(wibClock(Date.UTC(2026, 9, 30, 16, 59))).toEqual({ date: "2026-10-30", hour: 23 });
  });

  test("17.00 UTC is hour 0 of the next WIB date", () => {
    expect(wibClock(Date.UTC(2026, 9, 30, 17, 0))).toEqual({ date: "2026-10-31", hour: 0 });
  });

  describe("does not depend on process.env.TZ", () => {
    const saved = process.env.TZ;
    afterEach(() => {
      if (saved === undefined) delete process.env.TZ;
      else process.env.TZ = saved;
    });

    test("TZ=UTC", () => {
      process.env.TZ = "UTC";
      expect(wibClock(Date.UTC(2026, 9, 30, 17, 0))).toEqual({ date: "2026-10-31", hour: 0 });
    });

    test("TZ=America/New_York", () => {
      process.env.TZ = "America/New_York";
      expect(wibClock(Date.UTC(2026, 9, 30, 17, 0))).toEqual({ date: "2026-10-31", hour: 0 });
    });
  });
});
