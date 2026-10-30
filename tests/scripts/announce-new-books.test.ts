import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  findNewSlugs,
  formatAnnouncement,
  readBookInfo,
  chapterUrl,
  main,
  sendMessage,
  MAX_ANNOUNCEMENTS,
  SITE_URL,
} from "../../scripts/announce-new-books";

const TOKEN = "123456:secret-token-value";
const CHAT = "-1001234567890";

async function writeBook(root: string, slug: string, title: string) {
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
}

function manifest(slugs: string[]) {
  return JSON.stringify({ books: slugs, chapters: {} });
}

type Call = { url: string; body: any };

function fakeFetch(calls: Call[], reply: object = { ok: true, result: {} }) {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: url.toString(), body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify(reply), { status: (reply as any).ok ? 200 : 400 });
  }) as typeof fetch;
}

describe("findNewSlugs", () => {
  test("returns slugs present after the deploy but not before, in build order", () => {
    const before = { books: ["a", "b"] };
    const after = { books: ["a", "c", "b", "d"] };
    expect(findNewSlugs(before, after)).toEqual(["c", "d"]);
  });

  test("refuses a baseline without books, so a failed snapshot never announces the whole shelf", () => {
    expect(() => findNewSlugs({}, { books: ["a"] })).toThrow(/baseline/);
    expect(() => findNewSlugs({ books: [] }, { books: ["a"] })).toThrow(/baseline/);
    expect(() => findNewSlugs(null, { books: ["a"] })).toThrow(/baseline/);
  });

  test("refuses a build manifest without a books array", () => {
    expect(() => findNewSlugs({ books: ["a"] }, { chapters: {} })).toThrow(/build manifest/);
  });
});

describe("formatAnnouncement", () => {
  test("is the first chapter's page title, a blank line, and its link", () => {
    const text = formatAnnouncement({
      slug: "peluruhan-beta",
      bookTitle: "Peluruhan Beta (Beta Decay)",
      chapterTitle: "Pendahuluan Peluruhan Beta",
      url: "https://dawnbook.belajarcarabelajar.com/books/peluruhan-beta/content/01_pendahuluan-peluruhan-beta",
    });
    expect(text).toBe(
      "Pendahuluan Peluruhan Beta - Peluruhan Beta (Beta Decay)\n\n" +
        "https://dawnbook.belajarcarabelajar.com/books/peluruhan-beta/content/01_pendahuluan-peluruhan-beta",
    );
  });
});

describe("chapterUrl", () => {
  test("drops ./ and .md, and keeps the content/ path", () => {
    expect(chapterUrl("x", "./content/01_a.md")).toBe(`${SITE_URL}/books/x/content/01_a`);
    expect(chapterUrl("x", "content/01_a.md")).toBe(`${SITE_URL}/books/x/content/01_a`);
  });

  test("maps a README or index first page to the book root", () => {
    expect(chapterUrl("x", "./README.md")).toBe(`${SITE_URL}/books/x/`);
    expect(chapterUrl("x", "index.md")).toBe(`${SITE_URL}/books/x/`);
  });
});

describe("readBookInfo", () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "announce-book-"));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  test("reads the [book] title and the first SUMMARY.md chapter", async () => {
    await writeBook(root, "buku-baru", "Buku Baru");
    const info = await readBookInfo(root, "buku-baru");
    expect(info).toEqual({
      slug: "buku-baru",
      bookTitle: "Buku Baru",
      chapterTitle: "Bab Satu",
      url: `${SITE_URL}/books/buku-baru/content/01_satu`,
    });
  });

  test("throws for a SUMMARY.md without a chapter link", async () => {
    await writeBook(root, "kosong", "Kosong");
    await writeFile(join(root, "books", "kosong", "src", "SUMMARY.md"), "# Summary\n");
    await expect(readBookInfo(root, "kosong")).rejects.toThrow(/chapter link/);
  });

  test("throws for a slug without book.toml", async () => {
    await expect(readBookInfo(root, "tidak-ada")).rejects.toThrow(/book\.toml/);
  });
});

describe("main", () => {
  let root: string;
  let logs: string[];
  const log = (m: string) => logs.push(m);

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "announce-main-"));
    logs = [];
    await writeBook(root, "lama", "Buku Lama");
    await writeBook(root, "baru", "Buku Baru");
    await writeFile(join(root, "before.json"), manifest(["lama"]));
    await writeFile(join(root, "after.json"), manifest(["lama", "baru"]));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  const ciArgs = () => ["--before", join(root, "before.json"), "--after", join(root, "after.json")];

  test("sends one plain-text message per new book to the configured chat", async () => {
    const calls: Call[] = [];
    const code = await main(ciArgs(), {
      rootDir: root,
      env: { TELEGRAM_BOT_TOKEN: TOKEN, DAWNBOOK_TELEGRAM_CHAT_ID: CHAT },
      fetch: fakeFetch(calls),
      log,
    });
    expect(code).toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`https://api.telegram.org/bot${TOKEN}/sendMessage`);
    expect(calls[0].body.chat_id).toBe(CHAT);
    expect(calls[0].body.parse_mode).toBeUndefined();
    expect(calls[0].body.text).toBe(`Bab Satu - Buku Baru\n\n${SITE_URL}/books/baru/content/01_satu`);
  });

  test("skips without sending when the token or chat id is missing", async () => {
    const calls: Call[] = [];
    const code = await main(ciArgs(), {
      rootDir: root,
      env: { TELEGRAM_BOT_TOKEN: TOKEN },
      fetch: fakeFetch(calls),
      log,
    });
    expect(code).toBe(0);
    expect(calls).toHaveLength(0);
    expect(logs.join("\n")).toContain("DAWNBOOK_TELEGRAM_CHAT_ID");
  });

  test("exits 0 without sending when no book is new", async () => {
    await writeFile(join(root, "before.json"), manifest(["lama", "baru"]));
    const calls: Call[] = [];
    const code = await main(ciArgs(), {
      rootDir: root,
      env: { TELEGRAM_BOT_TOKEN: TOKEN, DAWNBOOK_TELEGRAM_CHAT_ID: CHAT },
      fetch: fakeFetch(calls),
      log,
    });
    expect(code).toBe(0);
    expect(calls).toHaveLength(0);
  });

  test("fails without sending when the baseline snapshot is missing", async () => {
    const calls: Call[] = [];
    const code = await main(["--before", join(root, "missing.json"), "--after", join(root, "after.json")], {
      rootDir: root,
      env: { TELEGRAM_BOT_TOKEN: TOKEN, DAWNBOOK_TELEGRAM_CHAT_ID: CHAT },
      fetch: fakeFetch(calls),
      log,
    });
    expect(code).toBe(1);
    expect(calls).toHaveLength(0);
    expect(logs.join("\n")).toContain("--slug");
  });

  test(`fails without sending when more than ${MAX_ANNOUNCEMENTS} books look new`, async () => {
    const slugs = Array.from({ length: MAX_ANNOUNCEMENTS + 1 }, (_, i) => `b${i}`);
    for (const s of slugs) await writeBook(root, s, s);
    await writeFile(join(root, "after.json"), manifest(["lama", ...slugs]));
    const calls: Call[] = [];
    const code = await main(ciArgs(), {
      rootDir: root,
      env: { TELEGRAM_BOT_TOKEN: TOKEN, DAWNBOOK_TELEGRAM_CHAT_ID: CHAT },
      fetch: fakeFetch(calls),
      log,
    });
    expect(code).toBe(1);
    expect(calls).toHaveLength(0);
  });

  test("reports a Telegram error without leaking the token", async () => {
    const calls: Call[] = [];
    const code = await main(ciArgs(), {
      rootDir: root,
      env: { TELEGRAM_BOT_TOKEN: TOKEN, DAWNBOOK_TELEGRAM_CHAT_ID: CHAT },
      fetch: fakeFetch(calls, { ok: false, error_code: 400, description: "Bad Request: chat not found" }),
      log,
    });
    expect(code).toBe(1);
    const out = logs.join("\n");
    expect(out).toContain("chat not found");
    expect(out).not.toContain(TOKEN);
  });

  test("redacts the token from a network error message", async () => {
    const code = await main(ciArgs(), {
      rootDir: root,
      env: { TELEGRAM_BOT_TOKEN: TOKEN, DAWNBOOK_TELEGRAM_CHAT_ID: CHAT },
      fetch: (async (url: string | URL | Request) => {
        throw new Error(`Unable to connect to ${url.toString()}`);
      }) as typeof fetch,
      log,
    });
    expect(code).toBe(1);
    expect(logs.join("\n")).not.toContain(TOKEN);
  });

  test("--slug announces the named book by hand, without a baseline", async () => {
    const calls: Call[] = [];
    const code = await main(["--slug", "lama"], {
      rootDir: root,
      env: { TELEGRAM_BOT_TOKEN: TOKEN, DAWNBOOK_TELEGRAM_CHAT_ID: CHAT },
      fetch: fakeFetch(calls),
      log,
    });
    expect(code).toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0].body.text).toContain("Bab Satu - Buku Lama");
  });

  test("--dry-run prints the message and sends nothing, even without credentials", async () => {
    const calls: Call[] = [];
    const code = await main([...ciArgs(), "--dry-run"], {
      rootDir: root,
      env: {},
      fetch: fakeFetch(calls),
      log,
    });
    expect(code).toBe(0);
    expect(calls).toHaveLength(0);
    expect(logs.join("\n")).toContain("Bab Satu - Buku Baru");
  });

  test("rejects an unknown flag", async () => {
    const code = await main(["--sluggg", "x"], { rootDir: root, env: {}, fetch: fakeFetch([]), log });
    expect(code).toBe(2);
  });
});

describe("sendMessage", () => {
  test("sendMessage returns the message id", async () => {
    const calls: Call[] = [];
    const id = await sendMessage(TOKEN, CHAT, "halo", fakeFetch(calls, { ok: true, result: { message_id: 42 } }));
    expect(id).toBe(42);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`https://api.telegram.org/bot${TOKEN}/sendMessage`);
    expect(calls[0].body).toEqual({ chat_id: CHAT, text: "halo" });
  });

  test("sendMessage returns null without a message id", async () => {
    const id = await sendMessage(TOKEN, CHAT, "halo", fakeFetch([], { ok: true, result: {} }));
    expect(id).toBeNull();
  });

  test("sendMessage redacts the token on failure", async () => {
    const reply = { ok: false, description: `Bad Request: ${TOKEN}` };
    let message = "";
    try {
      await sendMessage(TOKEN, CHAT, "halo", fakeFetch([], reply));
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).not.toBe("");
    expect(message).not.toContain(TOKEN);
    expect(message).toContain("<token>");
  });
});
