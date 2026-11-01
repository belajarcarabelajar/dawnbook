import { expect, test, describe, mock, afterEach, beforeAll, afterAll } from "bun:test";
import { onRequest } from "../../functions/_middleware";
import { isAiCrawler, isPublicPath } from "../../functions/lib/gating";
import { createMockEnv, mockRequest, setQueryHandler } from "../helpers/mocks";
import { __setDnsFetcherForTests, clearBotCache } from "../../functions/lib/bot-verify";
import { setPremiumRegistryForTest } from "../../functions/lib/premium";

const GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const GPTBOT_UA =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)";
const GOOGLE_IP = "66.249.65.1";
const OPENAI_IP = "20.171.207.1";
const FREE_GATED = "https://example.com/books/buku-gratis/content/02_x.html";

// Real bot-verify with a fake DoH fetcher: each IP has one PTR host that
// forward-resolves back to it.
function fakeDns(ptrByIp: Record<string, string>) {
  __setDnsFetcherForTests(async (urlStr: RequestInfo | URL) => {
    const url = new URL(urlStr as string);
    const type = url.searchParams.get("type");
    const name = url.searchParams.get("name") ?? "";
    if (type === "PTR") {
      for (const [ip, host] of Object.entries(ptrByIp)) {
        const rev = ip.split(".").reverse().join(".") + ".in-addr.arpa";
        if (name === rev) {
          return new Response(JSON.stringify({ Status: 0, Answer: [{ type: 12, data: `${host}.` }] }));
        }
      }
      return new Response(JSON.stringify({ Status: 3 }));
    }
    if (type === "A") {
      for (const [ip, host] of Object.entries(ptrByIp)) {
        if (name === host) {
          return new Response(JSON.stringify({ Status: 0, Answer: [{ type: 1, data: ip }] }));
        }
      }
      return new Response(JSON.stringify({ Status: 3 }));
    }
    return new Response("{}", { status: 404 });
  });
}

function verifyBoth() {
  fakeDns({
    [GOOGLE_IP]: "crawl-66-249-65-1.googlebot.com",
    [OPENAI_IP]: "crawl-20-171-207-1.gptbot.openai.com",
  });
}

function botContext(url: string, ua: string, ip: string, opts: { html?: boolean; upstreamVary?: string } = {}) {
  const env = createMockEnv();
  setQueryHandler(env, "SELECT", () => []);
  const headers: Record<string, string> = {
    Accept: opts.html === false ? "application/json" : "text/html,application/xhtml+xml",
    "User-Agent": ua,
    "CF-Connecting-IP": ip,
    Cookie: "dawnbook_lang=id",
  };
  const upstreamHeaders: Record<string, string> = { "Content-Type": "text/html" };
  if (opts.upstreamVary) upstreamHeaders.Vary = opts.upstreamVary;
  const next = mock(async () => new Response("<h1>Bab 2</h1>", { status: 200, headers: upstreamHeaders }));
  return { context: { request: mockRequest(url, { headers }), env, next }, next };
}

describe("isAiCrawler", () => {
  const aiAgents = [
    "GPTBot",
    "ChatGPT-User",
    "OAI-SearchBot",
    "ClaudeBot",
    "Claude-Web",
    "Claude-User",
    "anthropic-ai",
    "PerplexityBot",
    "Perplexity-User",
    "CCBot",
    "Bytespider",
    "Applebot-Extended",
    "meta-externalagent",
    "Amazonbot",
  ];
  for (const token of aiAgents) {
    test(`${token} is an AI crawler, in any case`, () => {
      expect(isAiCrawler(`Mozilla/5.0 (compatible; ${token}/1.0; +https://example.org/bot)`)).toBe(true);
      expect(isAiCrawler(token.toLowerCase())).toBe(true);
      expect(isAiCrawler(token.toUpperCase())).toBe(true);
    });
  }

  const others: Array<[string, string | null]> = [
    ["Googlebot", GOOGLEBOT_UA],
    ["Bingbot", "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"],
    ["plain Applebot", "Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 (KHTML, like Gecko) Applebot/0.1"],
    ["facebookexternalhit", "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"],
    ["a browser", "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0"],
    ["an empty string", ""],
    ["null", null],
  ];
  for (const [label, ua] of others) {
    test(`${label} is not an AI crawler`, () => {
      expect(isAiCrawler(ua)).toBe(false);
    });
  }
});

describe("AI crawlers at the edge (functions/_middleware.ts)", () => {
  afterEach(() => {
    __setDnsFetcherForTests(null);
    clearBotCache();
  });

  test("verified GPTBot on a gated free chapter is redirected like an anonymous visitor", async () => {
    verifyBoth();
    const { context, next } = botContext(FREE_GATED, GPTBOT_UA, OPENAI_IP);
    const res = await onRequest(context as any);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/sign-in");
    expect(next).not.toHaveBeenCalled();
  });

  test("verified GPTBot on a gated free chapter without an HTML Accept gets 401", async () => {
    verifyBoth();
    const { context, next } = botContext(FREE_GATED, GPTBOT_UA, OPENAI_IP, { html: false });
    const res = await onRequest(context as any);
    expect(res.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("spoofed GPTBot (not verified) is redirected", async () => {
    fakeDns({});
    const { context, next } = botContext(FREE_GATED, GPTBOT_UA, "203.0.113.9");
    const res = await onRequest(context as any);
    expect(res.status).toBe(302);
    expect(next).not.toHaveBeenCalled();
  });

  test("verified GPTBot still gets a public page", async () => {
    verifyBoth();
    const { context, next } = botContext("https://example.com/books/buku-gratis/content/01_x.html", GPTBOT_UA, OPENAI_IP);
    const res = await onRequest(context as any);
    expect(res.status).toBe(200);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("verified Googlebot on a gated free chapter still passes with private, no-store", async () => {
    verifyBoth();
    const { context, next } = botContext(FREE_GATED, GOOGLEBOT_UA, GOOGLE_IP);
    const res = await onRequest(context as any);
    expect(res.status).toBe(200);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await res.text()).toBe("<h1>Bab 2</h1>");
  });

  test("bot pass-through keeps the upstream Vary and adds Cookie and User-Agent once", async () => {
    verifyBoth();
    const { context } = botContext(FREE_GATED, GOOGLEBOT_UA, GOOGLE_IP, { upstreamVary: "Accept-Encoding, cookie" });
    const res = await onRequest(context as any);
    expect(res.status).toBe(200);
    const parts = (res.headers.get("Vary") ?? "").split(",").map((p) => p.trim().toLowerCase());
    expect(parts).toContain("accept-encoding");
    expect(parts).toContain("cookie");
    expect(parts).toContain("user-agent");
    expect(parts.filter((p) => p === "cookie")).toHaveLength(1);
    expect(parts).toHaveLength(3);
  });
});

describe("isPublicPath refuses dot segments", () => {
  test("an encoded ../ that climbs out of a free chapter is not public", () => {
    expect(isPublicPath("/books/x/content/01_a%2F..%2F02_b.html")).toBe(false);
  });

  test("a ./ or ../ segment is not public even where the target would be", () => {
    expect(isPublicPath("/books/x/./02_a.html")).toBe(false);
    expect(isPublicPath("/books/x/content/01_a/../01_b.html")).toBe(false);
    expect(isPublicPath("/books/x/content/01_a/%2E%2E/02_b.css")).toBe(false);
    expect(isPublicPath("/books/x/content/./01_a.html")).toBe(false);
  });

  test("normal pages are unaffected", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/index.html")).toBe(true);
    expect(isPublicPath("/.nojekyll")).toBe(true);
    expect(isPublicPath("/books/x/")).toBe(true);
    expect(isPublicPath("/books/x/content/01_a.html")).toBe(true);
    expect(isPublicPath("/books/x/book-1.js")).toBe(true);
    expect(isPublicPath("/manifest.json")).toBe(true);
    expect(isPublicPath("/books/x/content/02_a.html")).toBe(false);
  });
});

describe("premium 403 page links to the store sign-in", () => {
  const SID = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  beforeAll(() => {
    setPremiumRegistryForTest({
      "buku-a": { products: ["P-A"], productUrl: "https://belajarcarabelajar.com/product/ebook-a" },
    });
  });
  afterAll(() => {
    setPremiumRegistryForTest(null);
  });

  test("refused reader sees 'Masuk lewat akun belajarcarabelajar.com' with the path and query as next", async () => {
    const env = createMockEnv();
    env.LMS_DB = { prepare: () => ({ bind: () => ({ first: async () => null }) }) };
    setQueryHandler(env, "SELECT", (sql: string) =>
      sql.includes("sessions")
        ? [
            {
              s_id: SID,
              s_user_id: "user_1",
              s_expires_at: new Date(Date.now() + 86400000).toISOString(),
              u_id: "user_1",
              u_email: "pembaca@x.com",
              u_name: "Pembaca",
              u_picture: null,
              u_role: "reader",
            },
          ]
        : [],
    );
    const req = mockRequest("https://example.com/books/buku-a/content/02_x.html?a=1&b=2", {
      headers: { Accept: "text/html", Cookie: `dawnbook_lang=id; session_id=${SID}` },
    });
    const next = mock(async () => new Response("isi"));
    const res = await onRequest({ request: req, env, next } as any);
    expect(res.status).toBe(403);
    const body = await res.text();
    // encodeURIComponent already turns & into %26, so the HTML escape leaves the href as is.
    const href = "https://belajarcarabelajar.com/masuk-dawnbook?next=%2Fbooks%2Fbuku-a%2Fcontent%2F02_x.html%3Fa%3D1%26b%3D2";
    expect(body).toContain(
      `Masuk dengan akun lain</a></li><li><a href="${href}">Masuk lewat akun belajarcarabelajar.com</a></li>`,
    );
  });
});
