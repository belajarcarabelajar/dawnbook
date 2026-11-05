/**
 * gh-client.ts — thin wrapper over gh CLI + GitHub REST API for PR integration.
 * Verified against: gh v2.97.0, origin belajarcarabelajar/dawnbook, default branch main.
 */

export type PR = {
  number: number;
  title: string;
  body: string;
  author: { login: string };
  baseRefName: string;
  headRefName: string;
  headRefOid: string;
  isCrossRepository: boolean;
  createdAt: string;
  mergeable: string; // MERGEABLE | CONFLICTING | UNKNOWN
  files: { path: string; additions: number; deletions: number; changeType: string }[];
  additions: number;
  deletions: number;
  url: string;
};

export type GhRunner = (args: string[]) => string;

const REPO = "belajarcarabelajar/dawnbook";
// Jules opens its PRs under the repository owner account, so the login alone does not identify them.
const JULES_OWNER_LOGIN = "belajarcarabelajar";
const JULES_TASK_LINK_RE = /https:\/\/jules\.google\.com\/task\/\d+/;
const HEAD_SHA_RE = /^[0-9a-f]{40}$/;
const PR_LIST_FIELDS =
  "number,title,body,author,baseRefName,headRefName,headRefOid,isCrossRepository,createdAt,mergeable,url,additions,deletions,files";

function runGh(args: string[]): string {
  const proc = Bun.spawnSync(["gh", ...args], { stdout: "pipe", stderr: "pipe" });
  const out = proc.stdout.toString();
  const err = proc.stderr.toString();
  if (proc.exitCode !== 0) {
    throw new Error(`gh ${args.join(" ")} failed (exit ${proc.exitCode}): ${err || out}`);
  }
  return out;
}

export function getDefaultBranch(): string {
  try {
    const out = runGh(["api", `repos/${REPO}`, "--jq", ".default_branch"]);
    return out.trim() || "main";
  } catch {
    return "main";
  }
}

export function getMergeStrategy(): "squash" | "merge" | "rebase" {
  const env = process.env.MERGE_STRATEGY;
  if (env === "squash" || env === "merge" || env === "rebase") return env;

  // Detect via gh api; if unavailable, fallback to sampling git log
  try {
    const out = runGh(["api", `repos/${REPO}`, "--jq", "{m: .merge_commit_allowed, s: .squash_allowed, r: .rebase_allowed}"]);
    const parsed = JSON.parse(out.trim());
    // Prefer squash per spec default, but if merge_commit explicitly true and squash false, use merge
    if (parsed.s === true) return "squash";
    if (parsed.m === true) return "merge";
    if (parsed.r === true) return "rebase";
  } catch { /* fall through */ }

  // Sample git log for merge commits (evidence: Merges exist)
  try {
    const proc = Bun.spawnSync(["git", "log", "--merges", "--oneline", "-20"], { stdout: "pipe" });
    const log = proc.stdout.toString();
    if (log.includes("Merge pull request")) return "merge";
  } catch { /* ignore */ }

  return "squash"; // spec default
}

/**
 * A Jules PR comes from the owner login, from a branch of this repository (never a fork),
 * and carries a Jules task link in its body. An author pattern replaces the login check only.
 */
export function isJulesPR(
  pr: { author: { login: string }; body?: string; isCrossRepository?: boolean },
  authorPattern?: string,
): boolean {
  if (pr.isCrossRepository !== false) return false;
  if (!JULES_TASK_LINK_RE.test(pr.body || "")) return false;
  const pattern = authorPattern || process.env.JULES_AUTHOR_PATTERN;
  if (pattern) {
    try {
      return new RegExp(pattern, "i").test(pr.author.login);
    } catch {
      return false;
    }
  }
  return pr.author.login === JULES_OWNER_LOGIN;
}

export function listJulesPrs(opts: { authorPattern?: string; limit?: number; run?: GhRunner } = {}): PR[] {
  const limit = opts.limit ?? 100;
  const run = opts.run ?? runGh;
  const raw = run([
    "pr", "list",
    "--repo", REPO,
    "--state", "open",
    "--limit", String(limit),
    "--json", PR_LIST_FIELDS,
  ]);
  const prs: PR[] = JSON.parse(raw);

  const filtered = prs.filter((pr) => isJulesPR(pr, opts.authorPattern));
  filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return filtered;
}

export function getPrDiff(prNumber: number): string {
  return runGh(["pr", "diff", String(prNumber), "--repo", REPO]);
}

export function getPrFiles(prNumber: number): PR["files"] {
  const out = runGh(["pr", "view", String(prNumber), "--repo", REPO, "--json", "files"]);
  const parsed = JSON.parse(out);
  return parsed.files ?? [];
}

export function getMergeableStatus(prNumber: number): string {
  const out = runGh(["pr", "view", String(prNumber), "--repo", REPO, "--json", "mergeable"]);
  const parsed = JSON.parse(out);
  return parsed.mergeable as string;
}

export function waitForMergeable(prNumber: number, timeoutMs = 30000): string {
  const start = Date.now();
  let status = getMergeableStatus(prNumber);
  while (status === "UNKNOWN" && Date.now() - start < timeoutMs) {
    Bun.sleepSync(5000);
    status = getMergeableStatus(prNumber);
  }
  return status;
}

/** Merges only if the PR head is still the commit that was assessed (gh --match-head-commit). */
export function mergePr(
  prNumber: number,
  strategy: "squash" | "merge" | "rebase",
  headSha: string,
  opts: { deleteBranch?: boolean; run?: GhRunner } = {},
): string {
  if (typeof headSha !== "string" || !HEAD_SHA_RE.test(headSha)) {
    throw new Error(`refusing to merge PR #${prNumber}: no assessed head commit sha`);
  }
  const run = opts.run ?? runGh;
  const flag = strategy === "squash" ? "--squash" : strategy === "merge" ? "--merge" : "--rebase";
  const args = [
    "pr", "merge", String(prNumber), "--repo", REPO, flag,
    "--match-head-commit", headSha,
    "--body", "Automated merge by pr-integration-agent (SAFE)",
  ];
  args.push(opts.deleteBranch ? "--delete-branch" : "--delete-branch=false");
  run(args);
  // Fetch merge commit
  try {
    const out = run(["pr", "view", String(prNumber), "--repo", REPO, "--json", "mergeCommit"]);
    const parsed = JSON.parse(out);
    return parsed.mergeCommit?.oid ?? "";
  } catch {
    return "";
  }
}

export function checkGhAuth(): boolean {
  const proc = Bun.spawnSync(["gh", "auth", "status"], { stdout: "pipe", stderr: "pipe" });
  return proc.exitCode === 0;
}
