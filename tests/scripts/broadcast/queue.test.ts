import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, writeFile, mkdir, utimes } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildQueue, hubReleaseMs, OLD_BOOK_CUTOFF_MS } from "../../../scripts/broadcast/queue";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "broadcast-queue-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function writeBook(slug: string, title: string) {
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

function releaseFrom(dates: Record<string, number>) {
  return async (slug: string) => {
    if (!(slug in dates)) throw new Error(`test has no date for ${slug}`);
    return dates[slug];
  };
}

describe("buildQueue", () => {
  test("sorts old books by release time, ties by slug", async () => {
    for (const slug of ["a", "b", "d"]) await writeBook(slug, slug);
    const queue = await buildQueue({
      rootDir: root,
      liveManifest: { books: ["d", "a", "b"] },
      releaseMs: releaseFrom({ a: 3, b: 1, d: 1 }),
    });
    expect(queue.map((item) => item.slug)).toEqual(["b", "d", "a"]);
  });

  test("drops books released at or after the cutoff", async () => {
    for (const slug of ["sebelum", "tepat", "sesudah"]) await writeBook(slug, slug);
    const queue = await buildQueue({
      rootDir: root,
      liveManifest: { books: ["sebelum", "tepat", "sesudah"] },
      releaseMs: releaseFrom({
        sebelum: OLD_BOOK_CUTOFF_MS - 1,
        tepat: OLD_BOOK_CUTOFF_MS,
        sesudah: OLD_BOOK_CUTOFF_MS + 1,
      }),
    });
    expect(queue.map((item) => item.slug)).toEqual(["sebelum"]);
  });

  test("the cutoff is 2026-10-21 00.00 WIB", () => {
    expect(new Date(OLD_BOOK_CUTOFF_MS).toISOString()).toBe("2026-10-20T17:00:00.000Z");
  });

  test("each item carries the announcement text and the first chapter link", async () => {
    await writeBook("buku-lama", "Buku Lama");
    const queue = await buildQueue({
      rootDir: root,
      liveManifest: { books: ["buku-lama"] },
      releaseMs: releaseFrom({ "buku-lama": 1 }),
    });
    expect(queue).toEqual([
      {
        slug: "buku-lama",
        text: "Bab Satu - Buku Lama\n\nhttps://dawnbook.belajarcarabelajar.com/books/buku-lama/content/01_satu",
        url: "https://dawnbook.belajarcarabelajar.com/books/buku-lama/content/01_satu",
      },
    ]);
  });

  test("throws for an empty books array", async () => {
    await expect(buildQueue({ rootDir: root, liveManifest: { books: [] }, releaseMs: releaseFrom({}) })).rejects.toThrow(
      /no books/,
    );
  });

  test("throws for a manifest without a books key", async () => {
    await expect(buildQueue({ rootDir: root, liveManifest: { chapters: {} }, releaseMs: releaseFrom({}) })).rejects.toThrow(
      /no books/,
    );
  });

  test("throws for a books array with a non-string entry", async () => {
    await writeBook("a", "a");
    await expect(
      buildQueue({ rootDir: root, liveManifest: { books: ["a", 3] }, releaseMs: releaseFrom({ a: 1 }) }),
    ).rejects.toThrow(/no books/);
  });

  test("throws naming a live slug that has no book.toml", async () => {
    await writeBook("a", "a");
    await expect(
      buildQueue({ rootDir: root, liveManifest: { books: ["a", "tidak-ada"] }, releaseMs: releaseFrom({ a: 1, "tidak-ada": 1 }) }),
    ).rejects.toThrow(/tidak-ada/);
  });

  test("throws naming a slug whose release time is 0", async () => {
    await writeBook("a", "a");
    await writeBook("tanpa-tanggal", "Tanpa Tanggal");
    await expect(
      buildQueue({
        rootDir: root,
        liveManifest: { books: ["a", "tanpa-tanggal"] },
        releaseMs: releaseFrom({ a: 1, "tanpa-tanggal": 0 }),
      }),
    ).rejects.toThrow(/tanpa-tanggal/);
  });
});

describe("hubReleaseMs", () => {
  test("falls back to the book.toml file time outside git", async () => {
    await writeBook("buku-uji-antrean", "Buku Uji Antrean");
    const when = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    await utimes(join(root, "books", "buku-uji-antrean", "book.toml"), when, when);
    expect(await hubReleaseMs(root, "buku-uji-antrean")).toBe(Date.UTC(2026, 0, 1, 0, 0, 0));
  });
});
