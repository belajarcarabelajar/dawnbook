/**
 * gh-client.ts — thin wrapper over gh CLI + GitHub REST API for PR integration.
 * Verified against: gh v2.97.0, origin belajarcarabelajar/dawnbook, default branch main.
 */

export type PR = {
  number: number;
  title: string;
  body: string;
  author: string;
  baseRefName: string;
  headRefName: string;
  createdAt: string;
  mergeable: string; // MERGEABLE | CONFLICTING | UNKNOWN
  files: { path: string; additions: number; deletions: number; changeType: string }[];
  additions: number;
  deletions: number;
  url: string;
};

const REPO = "belajarcarabelajar/dawnbook";
const JULES_MARKER_RE = /jules\.google\.com\/task|Jules/i;

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

function isJulesPR(pr: { author: { login: string }; body?: string; title?: string }, authorPattern?: string): boolean {
  const pattern = authorPattern || process.env.JULES_AUTHOR_PATTERN;
  if (pattern) {
    try {
      const re = new RegExp(pattern, "i");
      if (re.test(pr.author.login) || re.test(pr.body || "") || re.test(pr.title || "")) return true;
    } catch { /* invalid regex, fall through */ }
  }
  if (pr.author.login.toLowerCase() === "jules") return true;
  // Primary heuristic: body contains Jules marker (verified for PRs 120-123)
  if (JULES_MARKER_RE.test(pr.body || "")) return true;
  if (JULES_MARKER_RE.test(pr.title || "")) return true;
  return false;
}

export function listJulesPrs(opts: { authorPattern?: string; limit?: number } = {}): PR[] {
  const limit = opts.limit ?? 100;
  const raw = runGh([
    "pr", "list",
    "--repo", REPO,
    "--state", "open",
    "--limit", String(limit),
    "--json", "number,title,body,author,baseRefName,headRefName,createdAt,mergeable,url,additions,deletions,files",
  ]);
  const prs: PR[] = JSON.parse(raw);

  const filtered = prs.filter((pr: any) => isJulesPR(pr, opts.authorPattern));
  filtered.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return filtered as PR[];
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

export function mergePr(prNumber: number, strategy: "squash" | "merge" | "rebase", deleteBranch = false): string {
  const flag = strategy === "squash" ? "--squash" : strategy === "merge" ? "--merge" : "--rebase";
  const args = ["pr", "merge", String(prNumber), "--repo", REPO, flag, "--body", "Automated merge by pr-integration-agent (SAFE)"];
  if (deleteBranch) args.push("--delete-branch");
  else args.push("--delete-branch=false");
  runGh(args);
  // Fetch merge commit
  try {
    const out = runGh(["pr", "view", String(prNumber), "--repo", REPO, "--json", "mergeCommit"]);
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
