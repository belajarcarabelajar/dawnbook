/**
 * functions/lib/bot-verify.ts
 *
 * Verified search-engine / AI-crawler detection.
 *
 * A matching User-Agent string alone is NOT proof of a bot — anyone can send
 * `User-Agent: Googlebot/2.1`. We therefore require the request's connecting
 * IP to pass a reverse-DNS check with forward confirmation, mirroring Google's
 * published "How to verify Googlebot" method:
 *
 *   1. The PTR record of the IP must resolve to a hostname under a known
 *      crawler domain (e.g. `crawl-66-249-65-1.googlebot.com`).
 *   2. Forward DNS of that hostname must resolve back to the same IP.
 *
 * DNS lookups use Cloudflare's DNS-over-HTTPS JSON API (no extra package, no
 * `nodejs_compat` flag needed). Verdicts are cached per IP and crawler family: 24h for verified,
 * 1h for unverified — so repeated crawls are cheap and a crawl burst does not
 * hammer DNS.
 *
 * Failure policy: FAIL CLOSED. If DNS is unreachable, times out, or the PTR/A
 * chain does not hold, the request is treated as a regular visitor (no gated
 * pass-through). This is the entire point of the fix: an unverifiable bot claim
 * must not bypass authentication.
 */

import { isSearchEngineBot } from "./gating";

const DOH_ENDPOINT = "https://cloudflare-dns.com/dns-query";
const LOOKUP_TIMEOUT_MS = 2500;
const POSITIVE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const NEGATIVE_TTL_MS = 60 * 60 * 1000; // 1h
const CACHE_MAX_ENTRIES = 10_000;

/**
 * Crawler families: a User-Agent pattern and the hostname suffixes that crawler
 * publishes for its PTR records. A PTR host verifies a request only when it
 * ends with a suffix of a family whose pattern matches the request's
 * User-Agent. The patterns use the same tokens as `isSearchEngineBot()`.
 */
interface CrawlerFamily {
  name: string;
  userAgent: RegExp;
  ptrSuffixes: string[];
}

const CRAWLER_FAMILIES: CrawlerFamily[] = [
  {
    name: "google",
    userAgent: /Googlebot|Google-InspectionTool|Google-Extended|Storebot-Google/i,
    ptrSuffixes: [".googlebot.com", ".google.com"],
  },
  {
    name: "bing",
    userAgent: /Bingbot|BingPreview|msnbot/i,
    ptrSuffixes: [".search.msn.com", ".msn.com"],
  },
  { name: "yandex", userAgent: /YandexBot/i, ptrSuffixes: [".yandex.com", ".yandex.net", ".yandex.ru"] },
  { name: "baidu", userAgent: /Baiduspider/i, ptrSuffixes: [".baidu.com", ".baidu.jp"] },
  { name: "duckduckgo", userAgent: /DuckDuckBot/i, ptrSuffixes: [".duckduckgo.com"] },
  { name: "apple", userAgent: /Applebot/i, ptrSuffixes: [".apple.com"] },
  { name: "facebook", userAgent: /facebookexternalhit/i, ptrSuffixes: [".facebook.com"] },
  { name: "twitter", userAgent: /Twitterbot/i, ptrSuffixes: [".twitter.com", ".twttr.com"] },
  { name: "linkedin", userAgent: /LinkedInBot/i, ptrSuffixes: [".linkedin.com"] },
  { name: "openai", userAgent: /GPTBot|ChatGPT-User/i, ptrSuffixes: [".openai.com"] },
  { name: "anthropic", userAgent: /ClaudeBot|Claude-Web|Anthropic/i, ptrSuffixes: [".anthropic.com"] },
  { name: "bytedance", userAgent: /Bytespider/i, ptrSuffixes: [".bytedance.com", ".bytedance.net"] },
  { name: "commoncrawl", userAgent: /CCBot/i, ptrSuffixes: [".commoncrawl.org"] },
  { name: "amazon", userAgent: /Amazonbot/i, ptrSuffixes: [".amazon.com"] },
  { name: "perplexity", userAgent: /PerplexityBot/i, ptrSuffixes: [".perplexity.ai"] },
];

function familiesFor(userAgent: string): CrawlerFamily[] {
  return CRAWLER_FAMILIES.filter((f) => f.userAgent.test(userAgent));
}

interface CacheEntry {
  verified: boolean;
  expires: number;
}

const verdictCache = new Map<string, CacheEntry>();

/** Test hook: clears the verdict cache. */
export function clearBotCache(): void {
  verdictCache.clear();
}

type DnsFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

/**
 * Injectable fetcher used for DoH lookups. Defaults to the global fetch.
 * Tests inject a responder here instead of mutating global.fetch, which would
 * leak across test files running in the same process.
 */
let dnsFetcher: DnsFetcher = (input, init) => fetch(input, init);

/** Test hook: replace the DoH fetcher (null restores the real one). */
export function __setDnsFetcherForTests(
  fetcher: DnsFetcher | null
): void {
  dnsFetcher = fetcher ?? ((input, init) => fetch(input, init));
}

interface DnsAnswer {
  name: string;
  type: number;
  data: string;
}

interface DnsJsonResponse {
  Status: number;
  Answer?: DnsAnswer[];
}

/**
 * Returns whether the request's IP verifiably belongs to a crawler whose
 * User-Agent claims bot status. Never throws — any failure resolves to false
 * (fail closed).
 */
export async function isVerifiedBotRequest(request: Request): Promise<boolean> {
  const userAgent = request.headers.get("User-Agent");
  if (!isSearchEngineBot(userAgent)) return false;

  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  if (!ip) return false;

  const families = familiesFor(userAgent ?? "");
  if (families.length === 0) return false;
  const suffixes = families.flatMap((f) => f.ptrSuffixes);

  // Keyed by IP and family so a verdict for one crawler is never reused for
  // a request that claims to be another.
  const cacheKey = ip + "|" + families.map((f) => f.name).join(",");
  const cached = verdictCache.get(cacheKey);
  if (cached) {
    if (cached.expires > Date.now()) return cached.verified;
    verdictCache.delete(cacheKey);
  }

  let verified = false;
  try {
    const ptrNameValue = ptrName(ip);
    if (ptrNameValue) {
      const ptrRecords = await dnsQuery(ptrNameValue, "PTR");
      const host = ptrRecords
        .map((h) => h.toLowerCase().replace(/\.$/, "")) // DoH PTR data has a trailing dot
        .find((h) => suffixes.some((suffix) => h.endsWith(suffix)));
      if (host) {
        // Forward confirmation: the hostname must resolve back to this IP.
        const forward = await dnsQuery(host, ip.includes(":") ? "AAAA" : "A");
        verified = forward.some((addr) => addr === ip);
      }
    }
  } catch (err) {
    // Fail closed: DNS outage or timeout must not re-open the spoofing hole.
    console.warn(
      "[bot-verify] DNS verification failed for " + ip + "; treating as not verified:",
      err
    );
    verified = false;
  }

  if (verdictCache.size >= CACHE_MAX_ENTRIES) verdictCache.clear();
  verdictCache.set(cacheKey, {
    verified,
    expires: Date.now() + (verified ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS),
  });
  return verified;
}

/**
 * Performs a DNS lookup through Cloudflare's DoH JSON API. Throws on HTTP
 * errors; returns the raw answer data values (e.g. PTR hostnames or A
 * addresses) on success.
 */
async function dnsQuery(name: string, type: "PTR" | "A" | "AAAA"): Promise<string[]> {
  const url = `${DOH_ENDPOINT}?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await dnsFetcher(url, {
    headers: { Accept: "application/dns-json" },
    signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`DoH ${type} lookup failed for ${name}: HTTP ${res.status}`);
  const data = (await res.json()) as DnsJsonResponse;
  if (data.Status !== 0 || !data.Answer) return [];
  const wantedType = type === "PTR" ? 12 : type === "A" ? 1 : 28;
  return data.Answer.filter((a) => a.type === wantedType).map((a) => a.data);
}

/**
 * Builds the PTR lookup name for an IPv4 or IPv6 address, or null for
 * malformed/unsupported input.
 */
function ptrName(ip: string): string | null {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    const octets = ip.split(".").map(Number);
    if (octets.some((o) => o < 0 || o > 255)) return null;
    return `${octets.reverse().join(".")}.in-addr.arpa`;
  }
  if (ip.includes(":")) {
    const expanded = expandIPv6(ip);
    if (!expanded) return null;
    const nibbles = expanded.split("").reverse().join(".");
    return `${nibbles}.ip6.arpa`;
  }
  return null;
}

/**
 * Expands an IPv6 address to its 32-hex-digit form (no colons), handling `::`
 * compression. Returns null for malformed input.
 */
function expandIPv6(ip: string): string | null {
  if (!/^[0-9a-fA-F:]+$/.test(ip) || !ip.includes(":")) return null;
  const doubleColon = ip.indexOf("::");
  let groups: string[];
  if (doubleColon !== -1) {
    const head = doubleColon === 0 ? [] : ip.slice(0, doubleColon).split(":");
    const tail = doubleColon >= ip.length - 2 ? [] : ip.slice(doubleColon + 2).split(":");
    const missing = 8 - head.length - tail.length;
    if (missing < 1 || head.some((g) => !/^[0-9a-fA-F]{1,4}$/.test(g)) || tail.some((g) => !/^[0-9a-fA-F]{1,4}$/.test(g))) {
      return null;
    }
    groups = [...head, ...Array(missing).fill("0"), ...tail];
  } else {
    groups = ip.split(":");
    if (groups.length !== 8) return null;
  }
  if (groups.length !== 8) return null;
  return groups.map((g) => g.padStart(4, "0")).join("");
}
