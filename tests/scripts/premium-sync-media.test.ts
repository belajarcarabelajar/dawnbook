import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { stagePremiumMedia } from "../../scripts/premium/move-media";
import { main, type CfResult } from "../../scripts/premium/sync-media";

const ROOT = join(homedir(), ".cache/tmp/dawnbook-scratch/premium-sync-media-test");
const REPO = join(import.meta.dir, "../..");
const BUCKET = "dawnbook-premium-media";
// MD5 of "abc", the RFC 1321 test vector.
const MD5_ABC = "900150983cd24fb0d6963f7d28e17f72";

function write(path: string, text: string) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text);
}

const outputDir = () => join(ROOT, "output");
const stagingDir = () => join(ROOT, ".premium-media");
const stagedPath = (rel: string) => join(stagingDir(), rel);
const staged = (rel: string, text: string) => write(stagedPath(rel), text);

beforeEach(() => {
  rmSync(ROOT, { recursive: true, force: true });
  mkdirSync(ROOT, { recursive: true });
});

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true });
});

describe("stagePremiumMedia", () => {
  test("moves the images of a premium book out of the Pages output", () => {
    write(join(outputDir(), "books/rahasia/images/peta.svg"), "<svg/>");
    write(join(outputDir(), "books/rahasia/images/public/sampul.png"), "png");
    write(join(outputDir(), "books/rahasia/content/02_x.html"), "<p>x</p>");

    const result = stagePremiumMedia({ outputDir: outputDir(), stagingDir: stagingDir(), slugs: ["rahasia"] });

    expect(result).toEqual({ moved: ["rahasia"] });
    expect(existsSync(join(outputDir(), "books/rahasia/images"))).toBe(false);
    expect(readFileSync(stagedPath("books/rahasia/images/peta.svg"), "utf8")).toBe("<svg/>");
    expect(readFileSync(stagedPath("books/rahasia/images/public/sampul.png"), "utf8")).toBe("png");
    expect(existsSync(join(outputDir(), "books/rahasia/content/02_x.html"))).toBe(true);
  });

  test("leaves the images of a free book in the Pages output", () => {
    write(join(outputDir(), "books/gratis/images/a.png"), "png");

    stagePremiumMedia({ outputDir: outputDir(), stagingDir: stagingDir(), slugs: ["rahasia"] });

    expect(existsSync(join(outputDir(), "books/gratis/images/a.png"))).toBe(true);
    expect(existsSync(stagedPath("books/gratis"))).toBe(false);
  });

  test("a premium book without images is not an error", () => {
    write(join(outputDir(), "books/rahasia/index.html"), "<p></p>");

    const result = stagePremiumMedia({ outputDir: outputDir(), stagingDir: stagingDir(), slugs: ["rahasia"] });

    expect(result).toEqual({ moved: [] });
    expect(existsSync(stagedPath("books"))).toBe(true);
  });

  test("replaces the staging of a previous build", () => {
    staged("books/lama/images/basi.svg", "<svg/>");
    staged("books/rahasia/images/dihapus.svg", "<svg/>");
    write(join(outputDir(), "books/rahasia/images/baru.svg"), "<svg/>");

    stagePremiumMedia({ outputDir: outputDir(), stagingDir: stagingDir(), slugs: ["rahasia"] });

    expect(existsSync(stagedPath("books/lama"))).toBe(false);
    expect(existsSync(stagedPath("books/rahasia/images/dihapus.svg"))).toBe(false);
    expect(existsSync(stagedPath("books/rahasia/images/baru.svg"))).toBe(true);
  });

  test("the build stages premium images after the mdBook builds", () => {
    const build = readFileSync(join(REPO, "scripts/build.ts"), "utf8");
    const mdbook = build.indexOf("buildAllBooks(booksDir");
    expect(mdbook).toBeGreaterThan(0);
    expect(build.indexOf("stagePremiumMedia(")).toBeGreaterThan(mdbook);
  });
});

// In-memory stand-in for `cf r2 objects list|put|delete`. `pageCap` makes a list page
// shorter than --per-page asked for, which R2 may also do, so callers must page on.
function fakeCf(objects: Record<string, string>, opts: { pageCap?: number; fail?: (cmd: string[]) => boolean } = {}) {
  const bucket = new Map(Object.entries(objects));
  const calls: string[][] = [];
  const run = async (cmd: string[]): Promise<CfResult> => {
    calls.push(cmd);
    if (opts.fail?.(cmd)) return { exitCode: 1, stdout: "", stderr: "fake cf failure" };
    const flag = (name: string) => flagOf(cmd, name);
    const verb = cmd[3];
    if (verb === "list") {
      const prefix = flag("--prefix") ?? "";
      const after = flag("--start-after");
      const size = Math.min(Number(flag("--per-page") ?? 1000), opts.pageCap ?? 1000);
      const page = [...bucket.keys()]
        .sort()
        .filter((k) => k.startsWith(prefix) && (after === undefined || k > after))
        .slice(0, size)
        .map((key) => ({ key, etag: bucket.get(key), size: 3 }));
      return { exitCode: 0, stdout: JSON.stringify(page, null, 2), stderr: "" };
    }
    if (verb === "put") {
      bucket.set(cmd[4]!, createHash("md5").update(readFileSync(flag("--file")!)).digest("hex"));
      return { exitCode: 0, stdout: "{}", stderr: "" };
    }
    if (verb === "delete") {
      bucket.delete(cmd[4]!);
      return { exitCode: 0, stdout: "{}", stderr: "" };
    }
    return { exitCode: 2, stdout: "", stderr: `fake cf: unexpected ${cmd.join(" ")}` };
  };
  const of = (verb: string) => calls.filter((c) => c[3] === verb);
  return { run, calls, bucket, of };
}

function flagOf(cmd: string[], name: string): string | undefined {
  const i = cmd.indexOf(name);
  return i >= 0 ? cmd[i + 1] : undefined;
}

async function sync(argv: string[], cf: ReturnType<typeof fakeCf>, dir = stagingDir()) {
  const out: string[] = [];
  const err: string[] = [];
  const code = await main(argv, {
    run: cf.run,
    stagingDir: dir,
    log: (line) => out.push(line),
    error: (line) => err.push(line),
  });
  return { code, out: out.join("\n"), err: err.join("\n") };
}

const byKey = (a: string[], b: string[]) => (a[4]! < b[4]! ? -1 : 1);
const put = (key: string, type: string) => [
  "cf", "r2", "objects", "put", key, "--bucket-name", BUCKET, "--file", stagedPath(key), "--content-type", type,
];

describe("sync-media upload", () => {
  test("puts new and changed images with their content type and skips unchanged ones", async () => {
    staged("books/rahasia/images/sama.svg", "abc");
    staged("books/rahasia/images/ubah.png", "png baru");
    staged("books/rahasia/images/public/a.jpg", "jpg");
    staged("books/kedua/images/b.JPEG", "jpeg");
    staged("books/kedua/images/c.gif", "gif");
    staged("books/kedua/images/d.webp", "webp");
    staged("books/kedua/images/e.svg", "svg");
    staged("books/kedua/images/f.avif", "avif");
    const cf = fakeCf({ "books/rahasia/images/sama.svg": MD5_ABC, "books/rahasia/images/ubah.png": MD5_ABC });

    const r = await sync(["upload"], cf);

    expect(r.code).toBe(0);
    expect(cf.of("put").sort(byKey)).toEqual([
      put("books/kedua/images/b.JPEG", "image/jpeg"),
      put("books/kedua/images/c.gif", "image/gif"),
      put("books/kedua/images/d.webp", "image/webp"),
      put("books/kedua/images/e.svg", "image/svg+xml"),
      put("books/kedua/images/f.avif", "image/avif"),
      put("books/rahasia/images/public/a.jpg", "image/jpeg"),
      put("books/rahasia/images/ubah.png", "image/png"),
    ]);
    const list = cf.of("list")[0]!;
    expect(flagOf(list, "--bucket-name")).toBe(BUCKET);
    expect(flagOf(list, "--prefix")).toBe("books/");
  });

  test("reads every page of the bucket listing before deciding what changed", async () => {
    const keys = [1, 2, 3, 4, 5].map((n) => `books/rahasia/images/${n}.svg`);
    for (const key of keys) staged(key, "abc");
    const cf = fakeCf(Object.fromEntries(keys.map((k) => [k, MD5_ABC])), { pageCap: 2 });

    const r = await sync(["upload"], cf);

    expect(r.code).toBe(0);
    expect(cf.of("put")).toEqual([]);
    expect(flagOf(cf.of("list")[1]!, "--start-after")).toBe("books/rahasia/images/2.svg");
  });

  test("--dry-run prints the plan and puts nothing", async () => {
    staged("books/rahasia/images/baru.svg", "abc");
    const cf = fakeCf({});

    const r = await sync(["upload", "--dry-run"], cf);

    expect(r.code).toBe(0);
    expect(cf.of("put")).toEqual([]);
    expect(r.out).toContain("books/rahasia/images/baru.svg");
  });

  test("a failed listing exits 1 and puts nothing", async () => {
    staged("books/rahasia/images/baru.svg", "abc");
    const cf = fakeCf({}, { fail: (c) => c[3] === "list" });

    const r = await sync(["upload"], cf);

    expect(r.code).toBe(1);
    expect(cf.of("put")).toEqual([]);
  });

  test("a failed put exits 1, names the key and still puts the other images", async () => {
    staged("books/rahasia/images/a.svg", "a");
    staged("books/rahasia/images/b.svg", "b");
    const cf = fakeCf({}, { fail: (c) => c[3] === "put" && c[4] === "books/rahasia/images/a.svg" });

    const r = await sync(["upload"], cf);

    expect(r.code).toBe(1);
    expect(r.err).toContain("books/rahasia/images/a.svg");
    expect(cf.bucket.has("books/rahasia/images/b.svg")).toBe(true);
  });

  test("a file type without a known content type stops the upload before any put", async () => {
    staged("books/rahasia/images/a.svg", "a");
    staged("books/rahasia/images/catatan.txt", "t");
    const cf = fakeCf({});

    const r = await sync(["upload"], cf);

    expect(r.code).toBe(1);
    expect(r.err).toContain("books/rahasia/images/catatan.txt");
    expect(cf.of("put")).toEqual([]);
  });

  test("exits 1 without calling cf when the staging folder is missing", async () => {
    const cf = fakeCf({});

    const r = await sync(["upload"], cf, join(ROOT, "tidak-ada"));

    expect(r.code).toBe(1);
    expect(cf.calls).toEqual([]);
  });

  test("an empty staging folder uploads nothing and calls no cf", async () => {
    mkdirSync(stagedPath("books"), { recursive: true });
    const cf = fakeCf({});

    const r = await sync(["upload"], cf);

    expect(r.code).toBe(0);
    expect(cf.calls).toEqual([]);
  });
});

describe("sync-media prune", () => {
  test("deletes every listed key that is not staged, on every page", async () => {
    staged("books/rahasia/images/a.svg", "abc");
    staged("books/rahasia/images/public/b.svg", "abc");
    const cf = fakeCf(
      {
        "books/hilang/images/x.png": MD5_ABC,
        "books/rahasia/images/a.svg": MD5_ABC,
        "books/rahasia/images/lama.svg": MD5_ABC,
        "books/rahasia/images/public/b.svg": MD5_ABC,
        "books/rahasia/images/zz.webp": MD5_ABC,
      },
      { pageCap: 2 },
    );

    const r = await sync(["prune"], cf);

    expect(r.code).toBe(0);
    expect(cf.of("delete").sort(byKey)).toEqual(
      ["books/hilang/images/x.png", "books/rahasia/images/lama.svg", "books/rahasia/images/zz.webp"].map((key) => [
        "cf", "r2", "objects", "delete", key, "--bucket-name", BUCKET, "--force",
      ]),
    );
    expect([...cf.bucket.keys()].sort()).toEqual(["books/rahasia/images/a.svg", "books/rahasia/images/public/b.svg"]);
  });

  test("refuses to run when the staging folder is missing", async () => {
    const cf = fakeCf({ "books/rahasia/images/a.svg": MD5_ABC });

    const r = await sync(["prune"], cf, join(ROOT, "tidak-ada"));

    expect(r.code).toBe(1);
    expect(cf.calls).toEqual([]);
  });

  test("refuses to run when the staging folder holds no files", async () => {
    mkdirSync(stagedPath("books/rahasia/images"), { recursive: true });
    const cf = fakeCf({ "books/rahasia/images/a.svg": MD5_ABC });

    const r = await sync(["prune"], cf);

    expect(r.code).toBe(1);
    expect(cf.calls).toEqual([]);
  });

  test("--dry-run prints the keys it would delete and deletes nothing", async () => {
    staged("books/rahasia/images/a.svg", "abc");
    const cf = fakeCf({ "books/rahasia/images/a.svg": MD5_ABC, "books/rahasia/images/lama.svg": MD5_ABC });

    const r = await sync(["prune", "--dry-run"], cf);

    expect(r.code).toBe(0);
    expect(cf.of("delete")).toEqual([]);
    expect(r.out).toContain("books/rahasia/images/lama.svg");
  });
});

describe("sync-media usage", () => {
  test("a missing or unknown command or flag exits 2 without calling cf", async () => {
    const cf = fakeCf({});

    for (const argv of [[], ["sync"], ["upload", "--force"], ["upload", "prune"]]) {
      expect((await sync(argv, cf)).code).toBe(2);
    }
    expect(cf.calls).toEqual([]);
  });
});

// Runs the real deploy script with bun, bunx and curl replaced by stubs that only log
// their arguments, so no build, upload or deploy happens.
describe("deploy-website.sh premium media steps", () => {
  const STUB = `#!/bin/sh
echo "$(basename "$0") $*" >> "$FAKE_LOG"
if [ -n "$FAKE_FAIL" ]; then
  case "$*" in *"$FAKE_FAIL"*) exit 1 ;; esac
fi
exit 0
`;

  function deploy(fail = "") {
    const dir = join(ROOT, "deploy");
    const bin = join(dir, "bin");
    mkdirSync(bin, { recursive: true });
    for (const name of ["bun", "bunx", "curl"]) {
      writeFileSync(join(bin, name), STUB);
      chmodSync(join(bin, name), 0o755);
    }
    const log = join(dir, "calls.log");
    const proc = Bun.spawnSync([Bun.which("bash") ?? "/bin/bash", join(REPO, "scripts/deploy-website.sh")], {
      cwd: dir,
      env: {
        PATH: `${bin}:/usr/bin:/bin`,
        HOME: dir,
        TMPDIR: dir,
        CLOUDFLARE_ACCOUNT_ID: "test-account",
        FAKE_LOG: log,
        FAKE_FAIL: fail,
      },
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });
    const calls = existsSync(log) ? readFileSync(log, "utf8").trim().split("\n") : [];
    return { code: proc.exitCode, calls, output: proc.stdout.toString() + proc.stderr.toString() };
  }

  const at = (calls: string[], needle: string) => calls.findIndex((c) => c.includes(needle));

  test("uploads before the Pages deploy, then releases the PDFs and prunes", () => {
    const r = deploy();

    expect(r.code).toBe(0);
    const guard = at(r.calls, "check-premium-output.ts");
    const upload = at(r.calls, "sync-media.ts upload");
    const pages = at(r.calls, "wrangler pages deploy");
    const release = at(r.calls, "release-pdfs.ts");
    const prune = at(r.calls, "sync-media.ts prune");
    expect(guard).toBeGreaterThan(-1);
    expect(upload).toBeGreaterThan(guard);
    expect(pages).toBeGreaterThan(upload);
    expect(release).toBeGreaterThan(pages);
    expect(prune).toBeGreaterThan(release);
    expect(r.output).not.toContain("release-pdfs.ts");
    expect(r.output).not.toContain("sync-media.ts prune");
  });

  test("a failed upload aborts before the Pages deploy", () => {
    const r = deploy("sync-media.ts upload");

    expect(r.code).not.toBe(0);
    expect(at(r.calls, "sync-media.ts upload")).toBeGreaterThan(-1);
    expect(at(r.calls, "wrangler pages deploy")).toBe(-1);
    expect(at(r.calls, "sync-media.ts prune")).toBe(-1);
  });

  test("a failed PDF release still prunes, names the step and exits non-zero", () => {
    const r = deploy("release-pdfs.ts");

    expect(r.code).not.toBe(0);
    expect(at(r.calls, "sync-media.ts prune")).toBeGreaterThan(at(r.calls, "release-pdfs.ts"));
    expect(r.output).toContain("release-pdfs.ts");
  });

  test("a failed prune names the step and exits non-zero", () => {
    const r = deploy("sync-media.ts prune");

    expect(r.code).not.toBe(0);
    expect(r.output).toContain("sync-media.ts prune");
  });
});
