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
 * `nodejs_compat` flag needed). Verdicts are cached per IP — 24h for verified,
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
 * Hostname suffixes that identify legit crawler infrastructure. A PTR record
 * must end in one of these (after stripping the trailing dot). The list covers
 * the crawlers in `isSearchEngineBot()`; entries are intentionally narrow and
 * the forward-confirmation check prevents suffix spoofing.
 */
const VERIFIED_PTR_SUFFIXES = [
  // Google
  ".googlebot.com",
  ".google.com",
  // Microsoft Bing
  ".search.msn.com",
  ".msn.com",
  // Yandex
  ".yandex.com",
  ".yandex.net",
  ".yandex.ru",
  // Baidu
  ".baidu.com",
  ".baidu.jp",
  // DuckDuckGo
  ".duckduckgo.com",
  // Apple
  ".apple.com",
  // Meta
  ".facebook.com",
  // X / Twitter
  ".twitter.com",
  ".twttr.com",
  // LinkedIn
  ".linkedin.com",
  // AI crawlers
  ".openai.com",
  ".anthropic.com",
  ".bytedance.com",
  ".bytedance.net",
  ".commoncrawl.org",
  ".amazon.com",
  ".amazonaws.com",
  ".perplexity.ai",
];

interface CacheEntry {
  verified: boolean;
  expires: number;
}

const verdictCache = new Map<string, CacheEntry>();

/** Test hook: clears the per-IP verdict cache. */
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

  const cached = verdictCache.get(ip);
  if (cached) {
    if (cached.expires > Date.now()) return cached.verified;
    verdictCache.delete(ip);
  }

  let verified = false;
  try {
    const ptrNameValue = ptrName(ip);
    if (ptrNameValue) {
      const ptrRecords = await dnsQuery(ptrNameValue, "PTR");
      const host = ptrRecords
        .map((h) => h.toLowerCase().replace(/\.$/, "")) // DoH PTR data has a trailing dot
        .find((h) => VERIFIED_PTR_SUFFIXES.some((suffix) => h.endsWith(suffix)));
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
  verdictCache.set(ip, {
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
