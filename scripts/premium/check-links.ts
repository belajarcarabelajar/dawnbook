#!/usr/bin/env bun
/**
 * Finds dead links in the Markdown of a books folder.
 *
 * Usage:
 *   bun run scripts/premium/check-links.ts <dir>
 *
 * Each link is asked with HEAD first. When HEAD fails or answers 400 or more, it is asked with
 * GET, and a GET that times out or hits a network error is asked once more with GET, so a link
 * gets at most three requests.
 * A link is dead when its final status is 400 or more (404, 410, 5xx and so on), or when it
 * redirects to another host that looks like a parked domain or a gambling site (expired domains
 * of old references often end up there and still answer 200).
 * A link is unverified instead when its final status is 401, 403 or 429, or when the GET retry
 * still times out or fails (the reason ends with "(after retry)"): many publishers refuse or
 * drop scripted requests while the page opens fine in a browser, so those links need a check by
 * other means (a person or a fetch tool).
 * Exit codes: 0 no dead link (unverified links allowed), 1 at least one dead link, 2 usage error.
 */
import fs from "node:fs";
import path from "node:path";

export type FetchLike = (
  url: string,
  init: { method: string; redirect: "follow"; signal: AbortSignal },
) => Promise<{ status: number; url: string }>;

export interface DeadLink {
  file: string;
  line: number;
  url: string;
  reason: string;
  kind: "dead" | "unverified";
}

export interface CheckLinksOptions {
  timeoutMs?: number;
  concurrency?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_CONCURRENCY = 8;
// Statuses a server sends to refuse a scripted request rather than to say the page is gone.
const UNVERIFIED_STATUSES = new Set([401, 403, 429]);

// Matched anywhere in the host.
const DENY_HOST_WORDS = ["togel", "slot", "gacor", "4d.", "pos4d", "permen4d", "judi", "casino", "parking"];
// Matched as the host or a parent domain only, because "dan.com" is also the end of "jordan.com".
const DENY_DOMAINS = ["sedoparking.com", "hugedomains.com", "dan.com", "afternic.com", "bodis.com"];

export function deniedHost(host: string): boolean {
  const h = host.toLowerCase();
  return DENY_HOST_WORDS.some((w) => h.includes(w)) || DENY_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`));
}

const TRAILING = new Set([".", ",", ";", ":", "!", "?", "'", '"', "*", "_", "]", "}"]);

function trimUrl(raw: string): string {
  let url = raw;
  for (;;) {
    const last = url.at(-1);
    if (last === undefined) return url;
    if (TRAILING.has(last)) {
      url = url.slice(0, -1);
    } else if (last === ")" && url.split("(").length < url.split(")").length) {
      url = url.slice(0, -1);
    } else {
      return url;
    }
  }
}

/** Returns the http(s) links of a Markdown text with their 1-based line numbers, in order. */
export function extractLinks(text: string): { line: number; url: string }[] {
  const out: { line: number; url: string }[] = [];
  text.split("\n").forEach((content, i) => {
    const found: { at: number; url: string }[] = [];
    let rest = content;
    // Markdown link targets first, with balanced parentheses so a Wikipedia URL keeps its "(...)".
    for (let start = rest.indexOf("]("); start !== -1; start = rest.indexOf("](", start + 2)) {
      let j = start + 2;
      while (rest[j] === " " || rest[j] === "<") j += 1;
      let depth = 0;
      let end = j;
      for (; end < rest.length; end += 1) {
        const c = rest[end];
        if (c === " " || c === ">") break;
        if (c === "(") depth += 1;
        if (c === ")") {
          if (depth === 0) break;
          depth -= 1;
        }
      }
      const target = rest.slice(j, end);
      if (/^https?:\/\//i.test(target)) found.push({ at: j, url: target });
      // Blank the target so the bare-URL scan below does not report it a second time.
      rest = rest.slice(0, j) + " ".repeat(end - j) + rest.slice(end);
    }
    // "[" and "]" end a bare URL, so a URL used as link text stops before the "](" of its target.
    for (const m of rest.matchAll(/https?:\/\/[^\s<>"'`[\]]+/gi)) {
      found.push({ at: m.index, url: trimUrl(m[0]) });
    }
    found.sort((a, b) => a.at - b.at);
    const seen = new Set<string>();
    for (const f of found) {
      if (seen.has(f.url)) continue;
      seen.add(f.url);
      out.push({ line: i + 1, url: f.url });
    }
  });
  return out;
}

function markdownFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...markdownFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

type Attempt = { status: number; url: string } | { error: string };

async function attempt(fetchFn: FetchLike, url: string, method: string, timeoutMs: number): Promise<Attempt> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  // The race also covers a fetch that ignores the abort signal.
  const timeout = new Promise<Attempt>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve({ error: `timeout after ${timeoutMs} ms` });
    }, timeoutMs);
  });
  const request = fetchFn(url, { method, redirect: "follow", signal: controller.signal }).then(
    (res): Attempt => ({ status: res.status, url: res.url || url }),
    (err: unknown): Attempt => ({ error: `network error: ${err instanceof Error ? err.message : String(err)}` }),
  );
  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

type Verdict = { reason: string; kind: DeadLink["kind"] };

/** Returns why a URL is dead or unverified, or null when it is alive. */
async function probe(fetchFn: FetchLike, url: string, timeoutMs: number): Promise<Verdict | null> {
  let result = await attempt(fetchFn, url, "HEAD", timeoutMs);
  // Many servers answer HEAD with 404, 405 or 406 while GET returns the page.
  if ("error" in result || result.status >= 400) {
    result = await attempt(fetchFn, url, "GET", timeoutMs);
    // Hosts that time out or reset a scripted connection often open fine a moment later or in a
    // browser, so one more GET is tried and a second failure is left for a person to check.
    if ("error" in result) {
      result = await attempt(fetchFn, url, "GET", timeoutMs);
      if ("error" in result) return { reason: `${result.error} (after retry)`, kind: "unverified" };
    }
  }
  if (result.status >= 400) {
    return { reason: `HTTP ${result.status}`, kind: UNVERIFIED_STATUSES.has(result.status) ? "unverified" : "dead" };
  }
  let from: string;
  let to: string;
  try {
    from = new URL(url).hostname;
    to = new URL(result.url).hostname;
  } catch {
    return null;
  }
  if (to !== from && deniedHost(to)) return { reason: `redirected to denylisted host ${to}`, kind: "dead" };
  return null;
}

export async function checkLinks(dir: string, fetchFn: FetchLike, opts: CheckLinksOptions = {}): Promise<DeadLink[]> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const concurrency = opts.concurrency ?? DEFAULT_CONCURRENCY;
  const occurrences = new Map<string, { file: string; line: number }[]>();
  for (const file of markdownFiles(dir)) {
    for (const { line, url } of extractLinks(fs.readFileSync(file, "utf-8"))) {
      const list = occurrences.get(url) ?? [];
      list.push({ file, line });
      occurrences.set(url, list);
    }
  }

  const urls = [...occurrences.keys()];
  const reasons = new Map<string, Verdict>();
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      const url = urls[next];
      next += 1;
      const reason = await probe(fetchFn, url, timeoutMs);
      if (reason !== null) reasons.set(url, reason);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));

  const dead: DeadLink[] = [];
  for (const [url, { reason, kind }] of reasons) {
    for (const { file, line } of occurrences.get(url) ?? []) dead.push({ file, line, url, reason, kind });
  }
  return dead.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.url.localeCompare(b.url));
}

const realFetch: FetchLike = async (url, init) => {
  const res = await fetch(url, init);
  // Only the status matters; cancelling the body stops a GET from downloading the whole page.
  await res.body?.cancel().catch(() => {});
  return { status: res.status, url: res.url };
};

async function main(argv: string[]): Promise<number> {
  const [dir, ...extra] = argv;
  if (dir === undefined || extra.length > 0 || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error("usage: bun run scripts/premium/check-links.ts <dir>");
    return 2;
  }
  const found = await checkLinks(dir, realFetch);
  const dead = found.filter((d) => d.kind === "dead");
  const unverified = found.filter((d) => d.kind === "unverified");
  for (const d of dead) console.log(`${d.file}:${d.line} ${d.url} ${d.reason}`);
  for (const d of unverified) console.log(`unverified ${d.file}:${d.line} ${d.url} ${d.reason}`);
  console.log(`${dead.length} dead link${dead.length === 1 ? "" : "s"}, ${unverified.length} unverified`);
  return dead.length > 0 ? 1 : 0;
}

if (import.meta.main) {
  process.exit(await main(process.argv.slice(2)));
}
