#!/usr/bin/env bun
/**
 * pr-integration-agent.ts — Jules PR integration agent
 * Steps: intake (oldest first) → safety assessment → merge of SAFE, mergeable PRs → batch summary.
 * Hard rules: never merge UNSAFE, never resolve conflicts or write git history itself, merge only the
 * assessed head commit, at most MAX_MERGES_PER_RUN merges per run, default SKIP+LOG.
 */

import { listJulesPrs, getPrDiff, getDefaultBranch, getMergeStrategy, mergePr, checkGhAuth, waitForMergeable } from "./lib/gh-client";
import { assessSafety } from "./lib/pr-safety";
import { mkdirSync, appendFileSync, writeFileSync } from "fs";

export const MAX_MERGES_PER_RUN = 3;

type Strategy = "squash" | "merge" | "rebase";

export type AgentDeps = {
  getDiff: (prNumber: number) => string;
  merge: (prNumber: number, strategy: Strategy, headSha: string) => string;
  refreshMergeable: (prNumber: number) => string;
};

const defaultDeps: AgentDeps = {
  getDiff: getPrDiff,
  merge: (prNumber, strategy, headSha) => mergePr(prNumber, strategy, headSha),
  refreshMergeable: (prNumber) => waitForMergeable(prNumber),
};

// --- Hard-rule guard (static + runtime) ---
function guardNoForcePush(args: string[]) {
  if (args.some((a) => a.includes("--force") || a === "-f")) {
    throw new Error("HARD RULE VIOLATION: force-push to main is forbidden");
  }
}

type ResultRow = {
  prId: number;
  title: string;
  status: "Merged" | "Skipped" | "Flagged";
  conflict: string;
  resolutionMethod: string;
  reason: string;
  hash: string;
  timestamp: string;
};

/** A scheduled run never merges, whatever the flags say. */
export function resolveDryRun(dryRunFlag: boolean, env: Record<string, string | undefined> = process.env): boolean {
  return dryRunFlag || env.GITHUB_EVENT_NAME === "schedule";
}

function parseArgs(argv: string[]) {
  const dryRun = resolveDryRun(argv.includes("--dry-run"));
  const help = argv.includes("--help") || argv.includes("-h");
  const prIdx = argv.indexOf("--pr");
  const prRaw = prIdx !== -1 ? argv[prIdx + 1] : undefined;
  const authorIdx = argv.indexOf("--author-pattern");
  const authorPattern = authorIdx !== -1 ? argv[authorIdx + 1] : undefined;
  return { dryRun, help, prRaw, authorPattern };
}

function resultRow(pr: any, status: ResultRow["status"], fields: Partial<ResultRow> = {}): ResultRow {
  return {
    prId: pr.number,
    title: pr.title,
    status,
    conflict: pr.mergeable === "CONFLICTING" ? "Yes" : "No",
    resolutionMethod: "-",
    reason: "",
    hash: "",
    timestamp: new Date().toISOString(),
    ...fields,
  };
}

async function processOnePr(pr: any, strategy: Strategy, dryRun: boolean, deps: AgentDeps, capReached: boolean): Promise<ResultRow> {
  const diff = deps.getDiff(pr.number);
  const assessment = assessSafety({ number: pr.number, title: pr.title, body: pr.body ?? "", files: pr.files ?? [], diff });

  if (assessment.verdict === "UNSAFE") {
    return resultRow(pr, "Skipped", { reason: `UNSAFE: ${assessment.reasons.join("; ")}` });
  }

  if (pr.mergeable === "CONFLICTING") {
    return resultRow(pr, "Flagged", { reason: "SAFE but conflicting: needs manual resolution" });
  }

  if (pr.mergeable !== "MERGEABLE") {
    return resultRow(pr, "Skipped", { reason: `mergeable state is ${pr.mergeable}, not MERGEABLE` });
  }

  if (dryRun) {
    return resultRow(pr, "Flagged", { resolutionMethod: `dry-run: would merge via --${strategy}`, reason: "DRY RUN - no merge performed" });
  }

  if (capReached) {
    return resultRow(pr, "Skipped", { reason: `merge cap reached (${MAX_MERGES_PER_RUN} per run)` });
  }

  if (typeof pr.headRefOid !== "string" || pr.headRefOid === "") {
    return resultRow(pr, "Skipped", { reason: "no head commit sha to match, not merged" });
  }

  guardNoForcePush([`gh pr merge ${pr.number} --${strategy}`]);
  const hash = deps.merge(pr.number, strategy, pr.headRefOid);
  return resultRow(pr, "Merged", { resolutionMethod: strategy, hash });
}

/** Assesses each PR in order and merges at most MAX_MERGES_PER_RUN of them. */
export async function processPrs(
  prs: any[],
  opts: { strategy: Strategy; dryRun: boolean; deps?: AgentDeps; log?: (line: string) => void },
): Promise<ResultRow[]> {
  const deps = opts.deps ?? defaultDeps;
  const log = opts.log ?? (() => {});
  const results: ResultRow[] = [];
  let merged = 0;
  for (const pr of prs) {
    if (pr.mergeable === "UNKNOWN") pr.mergeable = deps.refreshMergeable(pr.number);
    log(`\n--- Processing PR #${pr.number}: ${pr.title} [${pr.mergeable}] ---`);
    let r: ResultRow;
    try {
      r = await processOnePr(pr, opts.strategy, opts.dryRun, deps, merged >= MAX_MERGES_PER_RUN);
    } catch (e: any) {
      r = resultRow(pr, "Skipped", { reason: `Error: ${String(e?.message ?? e).slice(0, 300)}` });
    }
    if (r.status === "Merged") merged++;
    log(`Result: ${r.status} | Conflict: ${r.conflict} | Method: ${r.resolutionMethod} | Reason: ${r.reason} | Hash: ${r.hash}`);
    results.push(r);
  }
  return results;
}

function renderTable(rows: ResultRow[]): string {
  const header = "| PR ID | Title | Status | Conflict? | Resolution Method | Reason |";
  const sep = "|---|---|---|---|---|---|---|";
  const body = rows
    .map((r) => {
      const safeTitle = r.title.replace(/\|/g, "\\|").slice(0, 80);
      const safeReason = r.reason.replace(/\|/g, "\\|").replace(/\n/g, " ").slice(0, 150);
      const safeMethod = r.resolutionMethod.replace(/\|/g, "\\|").slice(0, 80);
      return `| ${r.prId} | ${safeTitle} | ${r.status} | ${r.conflict} | ${safeMethod} | ${safeReason} |`;
    })
    .join("\n");
  return [header, sep, body].join("\n");
}

function writeLogs(rows: ResultRow[]) {
  const date = new Date().toISOString().slice(0, 10);
  mkdirSync("logs", { recursive: true });
  for (const r of rows) {
    const line = JSON.stringify({ ...r, timestamp: new Date().toISOString() });
    appendFileSync(`logs/pr-integration-${date}.jsonl`, line + "\n");
    appendFileSync(`logs/pr-integration.jsonl`, line + "\n");
  }
  const md = `# PR Integration Report ${date}\n\n${renderTable(rows)}\n\n_Generated: ${new Date().toISOString()}_\n`;
  writeFileSync(`logs/pr-integration-${date}.md`, md);
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n## PR Integration Report\n\n${renderTable(rows)}\n`);
    } catch { /* ignore */ }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: bun run scripts/pr-integration-agent.ts [--dry-run] [--pr <number>] [--author-pattern <regex>] [--help]
  --dry-run           Do not merge, only assess and log (always on for scheduled runs)
  --pr <n>            Process single PR only
  --author-pattern    Override the Jules author login regex (env JULES_AUTHOR_PATTERN)
  --help              Show this help`);
    process.exit(0);
  }

  let prFilter: number | undefined;
  if (args.prRaw !== undefined) {
    if (!/^[0-9]+$/.test(args.prRaw)) {
      console.error(`--pr expects a PR number, got ${JSON.stringify(args.prRaw)}`);
      process.exit(1);
    }
    prFilter = Number(args.prRaw);
  }

  const strategy = getMergeStrategy();
  console.log(`[pr-integration-agent] Starting — dryRun=${args.dryRun} strategy=${strategy} branch=${getDefaultBranch()} ghAuth=${checkGhAuth()} mergeCap=${MAX_MERGES_PER_RUN}`);

  let prs: any[];
  try {
    prs = listJulesPrs({ authorPattern: args.authorPattern });
  } catch (e: any) {
    console.error(`Failed to list PRs: ${e.message}`);
    process.exit(1);
  }

  if (prFilter !== undefined) prs = prs.filter((p: any) => p.number === prFilter);
  if (prs.length === 0) {
    console.log("No open Jules PRs found.");
    console.log(renderTable([]));
    writeLogs([]);
    process.exit(0);
  }

  console.log(`[pr-integration-agent] Found ${prs.length} Jules PR(s): ${prs.map((p: any) => `#${p.number} (${p.mergeable})`).join(", ")} — oldest first`);

  const results = await processPrs(prs, { strategy, dryRun: args.dryRun, log: (line) => console.log(line) });

  const table = renderTable(results);
  console.log("\n## Batch Summary\n");
  console.log(table);
  writeLogs(results);

  const hasFailures = results.some((r) => r.status === "Skipped" && r.reason.includes("HARD RULE"));
  if (hasFailures) process.exit(2);
}

if (import.meta.main && !process.argv.includes("--check")) {
  main().catch((e) => {
    console.error(`Fatal: ${e.message}\n${e.stack}`);
    process.exit(1);
  });
}
