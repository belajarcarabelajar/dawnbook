#!/usr/bin/env bun
/**
 * Finds dead links in the Markdown of a books folder.
 *
 * Usage:
 *   bun run scripts/premium/check-links.ts <dir>
 *
 * A link is dead when its final status is 400 or more, when it times out or fails after one
 * retry, or when it redirects to another host that looks like a parked domain or a gambling
 * site (expired domains of old references often end up there and still answer 200).
 * Exit codes: 0 no dead link, 1 at least one dead link, 2 usage error.
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
}

export interface CheckLinksOptions {
  timeoutMs?: number;
  concurrency?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_CONCURRENCY = 8;
// Statuses some servers send to HEAD only, so the link is asked again with GET.
const RETRY_WITH_GET = new Set([403, 405, 501]);

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
    for (const m of rest.matchAll(/https?:\/\/[^\s<>"'`]+/gi)) {
      found.push({ at: m.index, url: trimUrl(m[0]) });
    }
    found.sort((a, b) => a.at - b.at);
    for (const f of found) out.push({ line: i + 1, url: f.url });
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

/** Returns the reason a URL is dead, or null when it is alive. */
async function probe(fetchFn: FetchLike, url: string, timeoutMs: number): Promise<string | null> {
  let result = await attempt(fetchFn, url, "HEAD", timeoutMs);
  if ("error" in result || RETRY_WITH_GET.has(result.status)) {
    result = await attempt(fetchFn, url, "GET", timeoutMs);
  }
  if ("error" in result) return result.error;
  if (result.status >= 400) return `HTTP ${result.status}`;
  let from: string;
  let to: string;
  try {
    from = new URL(url).hostname;
    to = new URL(result.url).hostname;
  } catch {
    return null;
  }
  if (to !== from && deniedHost(to)) return `redirected to denylisted host ${to}`;
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
  const reasons = new Map<string, string>();
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
  for (const [url, reason] of reasons) {
    for (const { file, line } of occurrences.get(url) ?? []) dead.push({ file, line, url, reason });
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
  const dead = await checkLinks(dir, realFetch);
  for (const d of dead) console.log(`${d.file}:${d.line} ${d.url} ${d.reason}`);
  console.log(`${dead.length} dead link${dead.length === 1 ? "" : "s"}`);
  return dead.length > 0 ? 1 : 0;
}

if (import.meta.main) {
  process.exit(await main(process.argv.slice(2)));
}
