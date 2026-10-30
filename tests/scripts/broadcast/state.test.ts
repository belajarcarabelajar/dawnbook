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
  const STATE_TS = join(import.meta.dir, "..", "..", "..", "scripts", "broadcast", "state.ts");

  test("takes a free lock", () => {
    const release = acquireLock(root);
    expect(typeof release).toBe("function");
    release!();
  });

  test("creates a missing folder with mode 700", async () => {
    const dir = join(root, "state");
    const release = acquireLock(dir);
    expect(release).not.toBeNull();
    expect((await stat(dir)).mode & 0o777).toBe(0o700);
    release!();
  });

  test("refuses a second lock while the first is held", () => {
    const first = acquireLock(root);
    expect(acquireLock(root)).toBeNull();
    first!();
  });

  test("takes the lock again after release", () => {
    acquireLock(root)!();
    const again = acquireLock(root);
    expect(typeof again).toBe("function");
    again!();
  });

  test("takes a lock file naming a live pid that nobody holds", async () => {
    await writeFile(join(root, LOCK_FILE), `${process.pid}\n`);
    const release = acquireLock(root);
    expect(typeof release).toBe("function");
    release!();
  });

  test("a holder that exits without releasing does not block", () => {
    const script = `import { acquireLock } from ${JSON.stringify(STATE_TS)};\n` +
      `console.log(acquireLock(${JSON.stringify(root)}) ? "held" : "busy");`;
    const child = Bun.spawnSync([process.execPath, "-e", script]);
    expect(child.stdout.toString().trim()).toBe("held");
    const release = acquireLock(root);
    expect(typeof release).toBe("function");
    release!();
  });

  test("release twice does not throw", () => {
    const release = acquireLock(root)!;
    release();
    expect(() => release()).not.toThrow();
  });

  test("keeps the lock file with a pid line after release", () => {
    acquireLock(root)!();
    expect(existsSync(join(root, LOCK_FILE))).toBe(true);
    expect(readFileSync(join(root, LOCK_FILE), "utf8")).toBe(`${process.pid}\n`);
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

  test("drops an inline comment after an unquoted value", async () => {
    const env = await envFrom("TELEGRAM_BOT_TOKEN=123456:fake-token # note\n");
    expect(env.token).toBe("123456:fake-token");
  });

  test("drops an inline comment after a quoted value", async () => {
    const env = await envFrom('TELEGRAM_BOT_TOKEN="123456:fake-token" # note\n');
    expect(env.token).toBe("123456:fake-token");
  });

  test("treats a value that is only a comment as missing", async () => {
    const env = await envFrom("TELEGRAM_BOT_TOKEN= # belum diisi\n");
    expect(env.token).toBeUndefined();
  });

  test("keeps a hash that starts an unquoted value", async () => {
    const env = await envFrom("DAWNBOOK_TELEGRAM_CHAT_ID=#1\n");
    expect(env.chatId).toBe("#1");
  });

  test("keeps a hash inside quotes", async () => {
    const env = await envFrom('DAWNBOOK_TELEGRAM_CHAT_ID="-100#1"\n');
    expect(env.chatId).toBe("-100#1");
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
