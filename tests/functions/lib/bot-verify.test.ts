import { describe, it, expect, afterEach, mock } from "bun:test";
import {
  isVerifiedBotRequest,
  clearBotCache,
  __setDnsFetcherForTests,
} from "../../../functions/lib/bot-verify";

const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const BINGBOT_UA =
  "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";

/**
 * Builds a DoH JSON responder from a map of "name|TYPE" -> [data values].
 * Unknown lookups return Status 3 (NXDOMAIN) like a real resolver.
 */
function dohResponder(answers: Record<string, string[]>) {
  return async (input: RequestInfo | URL): Promise<Response> => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url
    );
    const name = url.searchParams.get("name") ?? "";
    const type = url.searchParams.get("type") ?? "";
    const data = answers[`${name}|${type}`];
    if (!data) {
      return new Response(JSON.stringify({ Status: 3 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const recordType = type === "PTR" ? 12 : type === "A" ? 1 : 28;
    return new Response(
      JSON.stringify({
        Status: 0,
        Answer: data.map((d) => ({ name, type: recordType, TTL: 3600, data: d })),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };
}

const botRequest = (ip: string, ua: string = GOOGLEBOT_UA) =>
  new Request("https://example.com/books/x/02.html", {
    headers: { "CF-Connecting-IP": ip, "User-Agent": ua },
  });

afterEach(() => {
  __setDnsFetcherForTests(null);
  clearBotCache();
});

describe("isVerifiedBotRequest", () => {
  it("verifies a Googlebot IP (PTR under googlebot.com + matching forward A)", async () => {
    __setDnsFetcherForTests(
      dohResponder({
        "1.65.249.66.in-addr.arpa|PTR": ["crawl-66-249-65-1.googlebot.com."],
        "crawl-66-249-65-1.googlebot.com|A": ["66.249.65.1"],
      })
    );

    expect(await isVerifiedBotRequest(botRequest("66.249.65.1"))).toBe(true);
  });

  it("verifies Bingbot (PTR under search.msn.com + matching forward A)", async () => {
    __setDnsFetcherForTests(
      dohResponder({
        "1.0.55.157.in-addr.arpa|PTR": ["msnbot-157-55-0-1.search.msn.com."],
        "msnbot-157-55-0-1.search.msn.com|A": ["157.55.0.1"],
      })
    );

    expect(await isVerifiedBotRequest(botRequest("157.55.0.1", BINGBOT_UA))).toBe(
      true
    );
  });

  it("rejects a bot User-Agent whose IP is NOT under a known crawler domain", async () => {
    __setDnsFetcherForTests(
      dohResponder({
        "7.0.113.203.in-addr.arpa|PTR": ["203-113-0-7.dynamic.example.com."],
      })
    );

    expect(await isVerifiedBotRequest(botRequest("203.113.0.7"))).toBe(false);
  });

  it("rejects when forward DNS does not confirm the IP (PTR spoof guard)", async () => {
    __setDnsFetcherForTests(
      dohResponder({
        "1.65.249.66.in-addr.arpa|PTR": ["crawl-66-249-65-1.googlebot.com."],
        "crawl-66-249-65-1.googlebot.com|A": ["198.51.100.42"], // different IP
      })
    );

    expect(await isVerifiedBotRequest(botRequest("66.249.65.1"))).toBe(false);
  });

  it("verifies an IPv6 bot IP (nibble PTR name + matching forward AAAA)", async () => {
    // ::1 expands to 0000...0001 (31 zeros + 1); the nibble-reversed PTR name
    // therefore starts with "1." followed by 31 zero nibbles.
    __setDnsFetcherForTests(
      dohResponder({
        "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.ip6.arpa|PTR": [
          "crawler-v6.googlebot.com.",
        ],
        "crawler-v6.googlebot.com|AAAA": ["::1"],
      })
    );

    const req = new Request("https://example.com/books/x/02.html", {
      headers: { "CF-Connecting-IP": "::1", "User-Agent": GOOGLEBOT_UA },
    });
    expect(await isVerifiedBotRequest(req)).toBe(true);
  });

  it("returns false for a non-bot User-Agent without any DNS lookup", async () => {
    let fetchCalled = false;
    __setDnsFetcherForTests(
      mock(async () => {
        fetchCalled = true;
        return new Response("", { status: 500 });
      })
    );

    const res = await isVerifiedBotRequest(
      botRequest("203.0.113.9", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    );
    expect(res).toBe(false);
    expect(fetchCalled).toBe(false);
  });

  it("fails closed (returns false) when DNS is unreachable", async () => {
    __setDnsFetcherForTests(
      mock(async () => {
        throw new Error("network down");
      })
    );

    expect(await isVerifiedBotRequest(botRequest("66.249.65.1"))).toBe(false);
  });

  it("returns false when the CF-Connecting-IP header is missing", async () => {
    __setDnsFetcherForTests(
      mock(async () => {
        throw new Error("should not be called");
      })
    );

    const req = new Request("https://example.com/books/x/02.html", {
      headers: { "User-Agent": GOOGLEBOT_UA },
    });
    expect(await isVerifiedBotRequest(req)).toBe(false);
  });

  it("caches the verdict per IP so repeated crawls skip DNS", async () => {
    const responder = dohResponder({
      "1.65.249.66.in-addr.arpa|PTR": ["crawl-66-249-65-1.googlebot.com."],
      "crawl-66-249-65-1.googlebot.com|A": ["66.249.65.1"],
    });
    let dnsCalls = 0;
    __setDnsFetcherForTests(
      mock(async (input: RequestInfo | URL, init?: RequestInit) => {
        dnsCalls++;
        return responder(input, init);
      })
    );

    expect(await isVerifiedBotRequest(botRequest("66.249.65.1"))).toBe(true);
    expect(await isVerifiedBotRequest(botRequest("66.249.65.1"))).toBe(true);
    expect(dnsCalls).toBe(2); // PTR + A on the first call only
  });
});
