import { expect, test, describe, mock, afterEach, beforeAll, afterAll } from "bun:test";
import { onRequest } from "../../functions/_middleware";
import { createMockEnv, mockRequest, setQueryHandler } from "../helpers/mocks";
import { __setDnsFetcherForTests, clearBotCache } from "../../functions/lib/bot-verify";
import { setPremiumRegistryForTest } from "../../functions/lib/premium";

// Sessions go through the real verifySession on the D1 mock and bots through
// the real bot-verify with a fake DNS fetcher, as middleware.test.ts does, so
// no mock.module is needed and nothing leaks into other test files.

const PRODUCT_URL = "https://belajarcarabelajar.com/product/ebook-a";
const BUNDLE_URL = "https://belajarcarabelajar.com/product/bundle-ebook-bcb";
const SID = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

type LmsMode = "row" | "null" | "throw" | "missing";

function fakeLms(mode: LmsMode) {
  if (mode === "missing") return undefined;
  return {
    prepare: () => ({
      bind: () => ({
        first: async () => {
          if (mode === "throw") throw new Error("D1 down");
          return mode === "row" ? { ok: 1 } : null;
        },
      }),
    }),
  };
}

function makeEnv(opts: { email?: string; lms?: LmsMode } = {}) {
  const env = createMockEnv();
  const lms = fakeLms(opts.lms ?? "null");
  if (lms) env.LMS_DB = lms;
  setQueryHandler(env, "SELECT", (sql) => {
    if (opts.email && sql.includes("sessions")) {
      return [
        {
          s_id: SID,
          s_user_id: "user_1",
          s_expires_at: new Date(Date.now() + 86400000).toISOString(),
          u_id: "user_1",
          u_email: opts.email,
          u_name: "Pembaca",
          u_picture: null,
          u_role: "reader",
        },
      ];
    }
    return [];
  });
  return env;
}

function makeContext(
  url: string,
  env: any,
  opts: { html?: boolean; session?: boolean; bot?: boolean } = {},
) {
  const headers: Record<string, string> = {};
  headers.Accept = opts.html === false ? "application/json" : "text/html,application/xhtml+xml";
  const cookies = ["dawnbook_lang=id"];
  if (opts.session) cookies.push(`session_id=${SID}`);
  headers.Cookie = cookies.join("; ");
  if (opts.bot) {
    headers["User-Agent"] = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
    headers["CF-Connecting-IP"] = "66.249.65.1";
  }
  const next = mock(async () => new Response("<h1>Isi bab</h1>", { status: 200, headers: { "Content-Type": "text/html" } }));
  return { context: { request: mockRequest(url, { headers }), env, next }, next };
}

function verifyGooglebot() {
  __setDnsFetcherForTests(async (urlStr: RequestInfo | URL) => {
    const type = new URL(urlStr as string).searchParams.get("type");
    if (type === "PTR") {
      return new Response(JSON.stringify({ Status: 0, Answer: [{ type: 12, data: "crawl-66-249-65-1.googlebot.com." }] }));
    }
    if (type === "A") {
      return new Response(JSON.stringify({ Status: 0, Answer: [{ type: 1, data: "66.249.65.1" }] }));
    }
    return new Response("{}", { status: 404 });
  });
}

const BOOK = "https://example.com/books/buku-a";
const GATED = `${BOOK}/content/02_x.html`;

describe("premium e-book gate in functions/_middleware.ts", () => {
  beforeAll(() => {
    setPremiumRegistryForTest({ "buku-a": { products: ["P-A"], productUrl: PRODUCT_URL } });
  });
  afterAll(() => {
    setPremiumRegistryForTest(null);
  });
  afterEach(() => {
    __setDnsFetcherForTests(null);
    clearBotCache();
  });

  test("free book chapter 2 keeps the old gate: anonymous 302, session 200 without an LMS lookup", async () => {
    const anon = makeContext("https://example.com/books/buku-gratis/content/02_x.html", makeEnv());
    const r1 = await onRequest(anon.context as any);
    expect(r1.status).toBe(302);
    expect(anon.next).not.toHaveBeenCalled();

    const env = makeEnv({ email: "pembaca@x.com", lms: "throw" });
    const authed = makeContext("https://example.com/books/buku-gratis/content/02_x.html", env, { session: true });
    const r2 = await onRequest(authed.context as any);
    expect(r2.status).toBe(200);
    expect(authed.next).toHaveBeenCalledTimes(1);
  });

  // images/public/ is no longer here: premium images come from R2 (see the describe below).
  for (const path of ["/", "/index.html", "/toc.html", "/content/01_intro.html", "/book-1234.js"]) {
    test(`premium public page ${path} passes without a session`, async () => {
      const { context, next } = makeContext(`${BOOK}${path}`, makeEnv({ lms: "missing" }));
      const res = await onRequest(context as any);
      expect(res.status).toBe(200);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.headers.get("Vary")).toContain("User-Agent");
      expect(res.headers.get("Cache-Control")).toBeNull();
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });
  }

  test("anonymous HTML request to a gated premium chapter redirects to sign-in", async () => {
    const { context, next } = makeContext(GATED, makeEnv());
    const res = await onRequest(context as any);
    expect(res.status).toBe(302);
    const location = res.headers.get("Location") ?? "";
    expect(location).toContain("/sign-in");
    expect(location).toContain("redirect_url=https%3A%2F%2Fexample.com%2Fbooks%2Fbuku-a%2Fcontent%2F02_x.html");
    expect(next).not.toHaveBeenCalled();
  });

  test("anonymous fetch to a gated premium chapter gets 401 JSON", async () => {
    const { context, next } = makeContext(GATED, makeEnv(), { html: false });
    const res = await onRequest(context as any);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
    expect(next).not.toHaveBeenCalled();
  });

  test("verified bot without a session gets no bypass on a premium chapter", async () => {
    verifyGooglebot();
    const html = makeContext(GATED, makeEnv(), { bot: true });
    const r1 = await onRequest(html.context as any);
    expect(r1.status).toBe(302);
    expect(html.next).not.toHaveBeenCalled();

    const api = makeContext(GATED, makeEnv(), { bot: true, html: false });
    const r2 = await onRequest(api.context as any);
    expect(r2.status).toBe(401);
    expect(api.next).not.toHaveBeenCalled();
  });

  test("verified bot with a refused session gets 403", async () => {
    verifyGooglebot();
    const { context, next } = makeContext(GATED, makeEnv({ email: "bot@x.com", lms: "null" }), { bot: true, session: true });
    const res = await onRequest(context as any);
    expect(res.status).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("refused session gets the 403 page with purchase links and the escaped email", async () => {
    const { context, next } = makeContext(GATED, makeEnv({ email: "a<b@x.com", lms: "null" }), { session: true });
    const res = await onRequest(context as any);
    expect(res.status).toBe(403);
    expect(next).not.toHaveBeenCalled();
    expect(res.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("Content-Security-Policy")).not.toBeNull();
    const body = await res.text();
    expect(body).toContain("Belum punya akses");
    expect(body).toContain("a&lt;b@x.com");
    expect(body).not.toContain("a<b@x.com");
    expect(body).toContain(`href="${PRODUCT_URL}"`);
    expect(body).toContain(`href="${BUNDLE_URL}"`);
    expect(body).toContain("Beli e-book ini");
    expect(body).toContain("Lihat Bundle E-book");
    expect(body).toContain("Masuk dengan akun lain");
    expect(body).toContain('href="/sign-in?redirect_url=https%3A%2F%2Fexample.com%2Fbooks%2Fbuku-a%2Fcontent%2F02_x.html"');
    expect(body).toContain('href="/"');
    expect(body).toContain("Kembali ke Dawnbook");
  });

  test("refused session on a fetch gets 403 JSON", async () => {
    const { context, next } = makeContext(GATED, makeEnv({ email: "c@x.com", lms: "null" }), { session: true, html: false });
    const res = await onRequest(context as any);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Forbidden");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(next).not.toHaveBeenCalled();
  });

  test("allowed session reads the chapter with private, no-store", async () => {
    const { context, next } = makeContext(GATED, makeEnv({ email: "beli@x.com", lms: "row" }), { session: true });
    const res = await onRequest(context as any);
    expect(res.status).toBe(200);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(res.headers.get("Vary")).toBe("Cookie");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(await res.text()).toBe("<h1>Isi bab</h1>");
  });

  for (const mode of ["missing", "throw"] as const) {
    test(`LMS_DB ${mode} gives 503 and never serves the chapter`, async () => {
      const { context, next } = makeContext(GATED, makeEnv({ email: "beli@x.com", lms: mode }), { session: true });
      const res = await onRequest(context as any);
      expect(res.status).toBe(503);
      expect(res.headers.get("Cache-Control")).toBe("private, no-store");
      expect(await res.text()).toContain("Sedang ada gangguan, coba lagi beberapa saat lagi.");
      expect(next).not.toHaveBeenCalled();

      const api = makeContext(GATED, makeEnv({ email: "beli@x.com", lms: mode }), { session: true, html: false });
      const r2 = await onRequest(api.context as any);
      expect(r2.status).toBe(503);
      expect(api.next).not.toHaveBeenCalled();
    });
  }

  for (const raw of [
    "https://example.com//books/buku-a/content/02_x.html",
    "https://example.com/books/buku-a//content/02_x.html",
    "https://example.com/books/buku-a/%2Fcontent%2F02_x.html",
  ]) {
    test(`double slash ${new URL(raw).pathname} stays behind the premium gate`, async () => {
      const refused = makeContext(raw, makeEnv({ email: "c@x.com", lms: "null" }), { session: true });
      const r1 = await onRequest(refused.context as any);
      expect(r1.status).toBe(403);
      expect(refused.next).not.toHaveBeenCalled();

      const anon = makeContext(raw, makeEnv());
      const r2 = await onRequest(anon.context as any);
      expect(r2.status).toBe(302);
      expect(anon.next).not.toHaveBeenCalled();
    });
  }

  test("single decode: a free book path with %25 is gated, not a 400", async () => {
    const { context, next } = makeContext("https://example.com/books/x/100%25.html", makeEnv());
    const res = await onRequest(context as any);
    expect(res.status).toBe(302);
    expect(next).not.toHaveBeenCalled();
  });

  test("single decode: a double-encoded slash in a premium chapter stays behind the purchase check", async () => {
    const { context, next } = makeContext(`${BOOK}/content/02%252Fx.html`, makeEnv({ email: "c@x.com", lms: "null" }), { session: true });
    const res = await onRequest(context as any);
    expect(res.status).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  for (const path of ["/images/x.png", "/searchindex-x.js"]) {
    test(`premium ${path} is gated`, async () => {
      const { context, next } = makeContext(`${BOOK}${path}`, makeEnv(), { html: false });
      const res = await onRequest(context as any);
      expect(res.status).toBe(401);
      expect(next).not.toHaveBeenCalled();

      const refused = makeContext(`${BOOK}${path}`, makeEnv({ email: "c@x.com", lms: "null" }), { session: true, html: false });
      const r2 = await onRequest(refused.context as any);
      expect(r2.status).toBe(403);
      expect(refused.next).not.toHaveBeenCalled();
    });
  }
});

// The `/books/*` rule of _headers (GEMINI.md section 3).
const ZERO_CACHE = "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";

type StoredImage = { body: string; contentType?: string };

// Stands in for the PREMIUM_MEDIA R2 binding and records every key read, so a
// test can prove that a path never reached the bucket.
function fakeBucket(objects: Record<string, StoredImage> = {}) {
  const reads: string[] = [];
  const bucket = {
    async get(key: string) {
      reads.push(key);
      if (!Object.hasOwn(objects, key)) return null;
      const stored = objects[key];
      return {
        key,
        body: new Response(stored.body).body,
        httpMetadata: stored.contentType ? { contentType: stored.contentType } : {},
      };
    },
  };
  return { bucket, reads };
}

function mediaEnv(opts: { email?: string; lms?: LmsMode; media?: ReturnType<typeof fakeBucket> }) {
  const env = makeEnv(opts);
  if (opts.media) env.PREMIUM_MEDIA = opts.media.bucket;
  return env;
}

const IMG = `${BOOK}/images/peta.webp`;
const IMG_KEY = "books/buku-a/images/peta.webp";
const PUBLIC_IMG = `${BOOK}/images/public/sampul.png`;
const PUBLIC_KEY = "books/buku-a/images/public/sampul.png";

describe("premium images from R2 in functions/_middleware.ts", () => {
  beforeAll(() => {
    setPremiumRegistryForTest({ "buku-a": { products: ["P-A"], productUrl: PRODUCT_URL } });
  });
  afterAll(() => {
    setPremiumRegistryForTest(null);
  });

  test("entitled reader gets a gated image from R2 with its stored content type and private, no-store", async () => {
    const media = fakeBucket({ [IMG_KEY]: { body: "webp-bytes", contentType: "image/webp" } });
    const { context, next } = makeContext(IMG, mediaEnv({ email: "beli@x.com", lms: "row", media }), { session: true, html: false });
    const res = await onRequest(context as any);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(await res.text()).toBe("webp-bytes");
    expect(media.reads).toEqual([IMG_KEY]);
    expect(next).not.toHaveBeenCalled();
  });

  test("anonymous visitor gets 401 (302 for HTML) for a gated image and the bucket is never read", async () => {
    const media = fakeBucket({ [IMG_KEY]: { body: "webp-bytes", contentType: "image/webp" } });
    const api = makeContext(IMG, mediaEnv({ media }), { html: false });
    const r1 = await onRequest(api.context as any);
    expect(r1.status).toBe(401);

    const html = makeContext(IMG, mediaEnv({ media }));
    const r2 = await onRequest(html.context as any);
    expect(r2.status).toBe(302);

    expect(media.reads).toEqual([]);
    expect(api.next).not.toHaveBeenCalled();
    expect(html.next).not.toHaveBeenCalled();
  });

  test("anonymous visitor gets an images/public/ image from R2 with the zero-cache policy", async () => {
    const media = fakeBucket({ [PUBLIC_KEY]: { body: "png-bytes", contentType: "image/png" } });
    const { context, next } = makeContext(PUBLIC_IMG, mediaEnv({ lms: "missing", media }), { html: false });
    const res = await onRequest(context as any);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toBe(ZERO_CACHE);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(await res.text()).toBe("png-bytes");
    expect(media.reads).toEqual([PUBLIC_KEY]);
    expect(next).not.toHaveBeenCalled();
  });

  test("refused entitlement gets 403 for a gated image and the bucket is never read", async () => {
    const media = fakeBucket({ [IMG_KEY]: { body: "webp-bytes", contentType: "image/webp" } });
    const { context, next } = makeContext(IMG, mediaEnv({ email: "c@x.com", lms: "null", media }), { session: true, html: false });
    const res = await onRequest(context as any);
    expect(res.status).toBe(403);
    expect(media.reads).toEqual([]);
    expect(next).not.toHaveBeenCalled();
  });

  test("a key missing from the bucket gives 404 with private, no-store", async () => {
    const gated = fakeBucket();
    const r1 = await onRequest(
      makeContext(IMG, mediaEnv({ email: "beli@x.com", lms: "row", media: gated }), { session: true, html: false }).context as any,
    );
    expect(r1.status).toBe(404);
    expect(r1.headers.get("Cache-Control")).toBe("private, no-store");
    expect(gated.reads).toEqual([IMG_KEY]);

    const open = fakeBucket();
    const r2 = await onRequest(makeContext(PUBLIC_IMG, mediaEnv({ media: open }), { html: false }).context as any);
    expect(r2.status).toBe(404);
    expect(r2.headers.get("Cache-Control")).toBe("private, no-store");
    expect(open.reads).toEqual([PUBLIC_KEY]);
  });

  test("a missing PREMIUM_MEDIA binding gives 503 for gated and public images", async () => {
    const gated = makeContext(IMG, mediaEnv({ email: "beli@x.com", lms: "row" }), { session: true, html: false });
    const r1 = await onRequest(gated.context as any);
    expect(r1.status).toBe(503);
    expect(r1.headers.get("Cache-Control")).toBe("private, no-store");
    expect(gated.next).not.toHaveBeenCalled();

    const open = makeContext(PUBLIC_IMG, mediaEnv({}), { html: false });
    const r2 = await onRequest(open.context as any);
    expect(r2.status).toBe(503);
    expect(open.next).not.toHaveBeenCalled();
  });

  test("without stored metadata the content type comes from the file extension", async () => {
    const media = fakeBucket({
      "books/buku-a/images/alur.svg": { body: "<svg/>" },
      "books/buku-a/images/foto.JPG": { body: "jpg" },
      "books/buku-a/images/data.xyz": { body: "?" },
    });
    const types: string[] = [];
    for (const name of ["alur.svg", "foto.JPG", "data.xyz"]) {
      const { context } = makeContext(`${BOOK}/images/${name}`, mediaEnv({ email: "beli@x.com", lms: "row", media }), { session: true, html: false });
      const res = await onRequest(context as any);
      expect(res.status).toBe(200);
      types.push(res.headers.get("Content-Type") ?? "");
    }
    expect(types).toEqual(["image/svg+xml", "image/jpeg", "application/octet-stream"]);
  });

  const everyKey = {
    "books/buku-a/images/y.png": { body: "y" },
    "books/buku-a/images/a/b.png": { body: "ab" },
    "books/buku-a/images/public/a.png": { body: "a" },
    "books/buku-a/content/02_x.html": { body: "bab" },
  };
  for (const path of [
    "/images/x%2F..%2Fy.png",
    "/images/..%2Fcontent%2F02_x.html",
    "/images/a%2Fb.png",
    "/images/a%5Cb.png",
    "/images/public%2Fa.png",
    "/images/%2573ecret.png",
  ]) {
    test(`media path ${path} with a dot segment or encoded slash never reaches the bucket`, async () => {
      const media = fakeBucket(everyKey);
      await onRequest(makeContext(`${BOOK}${path}`, mediaEnv({ email: "beli@x.com", lms: "row", media }), { session: true, html: false }).context as any);
      await onRequest(makeContext(`${BOOK}${path}`, mediaEnv({ media }), { html: false }).context as any);
      expect(media.reads).toEqual([]);
    });
  }

  test("a free book image still comes from Pages and never reads the bucket", async () => {
    const media = fakeBucket({ "books/buku-gratis/images/x.png": { body: "x" } });
    const { context, next } = makeContext("https://example.com/books/buku-gratis/images/x.png", mediaEnv({ media }), { html: false });
    const res = await onRequest(context as any);
    expect(res.status).toBe(200);
    expect(next).toHaveBeenCalledTimes(1);
    expect(media.reads).toEqual([]);
  });
});
