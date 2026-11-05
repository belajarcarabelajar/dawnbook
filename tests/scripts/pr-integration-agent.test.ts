import { afterEach, describe, it, expect, spyOn } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { assessSafety } from "../../scripts/lib/pr-safety";
import { MAX_MERGES_PER_RUN, processPrs, resolveDryRun, type AgentDeps } from "../../scripts/pr-integration-agent";

const REPO = join(import.meta.dir, "../..");
const SHA = "0123456789abcdef0123456789abcdef01234567";
const SAFE_DIFF = `diff --git a/docs/intro.md b/docs/intro.md
-Introduciton
+Introduction
`;

function pr(number: number, overrides: Record<string, unknown> = {}) {
  return {
    number,
    title: "fix: typo in docs",
    body: "Fix typo in docs/intro.md",
    files: [{ path: "docs/intro.md", additions: 1, deletions: 1, changeType: "MODIFIED" }],
    mergeable: "MERGEABLE",
    headRefOid: SHA,
    ...overrides,
  };
}

function fakeDeps(diff = SAFE_DIFF) {
  const merges: { number: number; strategy: string; sha: string }[] = [];
  const deps: AgentDeps = {
    getDiff: () => diff,
    merge: (number, strategy, sha) => {
      merges.push({ number, strategy, sha });
      return `merged-${number}`;
    },
    refreshMergeable: () => "MERGEABLE",
  };
  return { deps, merges };
}

const spies: { mockRestore: () => void }[] = [];
afterEach(() => {
  while (spies.length) spies.pop()!.mockRestore();
});

describe("pr-integration-agent", () => {
  it("SAFE assessment for a docs typo", () => {
    expect(assessSafety({ number: 999, ...pr(999), diff: SAFE_DIFF } as any).verdict).toBe("SAFE");
  });

  it("merges a SAFE mergeable PR with the head sha that was assessed", async () => {
    const { deps, merges } = fakeDeps();
    const rows = await processPrs([pr(10)], { strategy: "squash", dryRun: false, deps });

    expect(merges).toEqual([{ number: 10, strategy: "squash", sha: SHA }]);
    expect(rows[0]!.status).toBe("Merged");
    expect(rows[0]!.hash).toBe("merged-10");
  });

  it(`merges at most ${MAX_MERGES_PER_RUN} PRs per run and skips the rest with the cap as reason`, async () => {
    const { deps, merges } = fakeDeps();
    const rows = await processPrs([1, 2, 3, 4, 5].map((n) => pr(n)), { strategy: "squash", dryRun: false, deps });

    expect(MAX_MERGES_PER_RUN).toBe(3);
    expect(merges.map((m) => m.number)).toEqual([1, 2, 3]);
    expect(rows.map((r) => r.status)).toEqual(["Merged", "Merged", "Merged", "Skipped", "Skipped"]);
    expect(rows[3]!.reason).toContain("merge cap reached");
    expect(rows[4]!.reason).toContain("merge cap reached");
  });

  it("flags a conflicting SAFE PR for manual resolution without merging or running any process", async () => {
    const spawnSync = spyOn(Bun, "spawnSync");
    const spawn = spyOn(Bun, "spawn");
    spies.push(spawnSync, spawn);
    const { deps, merges } = fakeDeps();

    const rows = await processPrs([pr(20, { mergeable: "CONFLICTING" })], { strategy: "squash", dryRun: false, deps });

    expect(rows[0]!.status).toBe("Flagged");
    expect(rows[0]!.reason).toContain("needs manual resolution");
    expect(merges).toEqual([]);
    expect(spawnSync).not.toHaveBeenCalled();
    expect(spawn).not.toHaveBeenCalled();
  });

  it("skips an UNSAFE PR and never merges it", async () => {
    const { deps, merges } = fakeDeps(`diff --git a/.github/workflows/deploy.yml b/.github/workflows/deploy.yml
+  run: curl example.invalid
`);
    const rows = await processPrs(
      [pr(30, { files: [{ path: ".github/workflows/deploy.yml", additions: 1, deletions: 0, changeType: "MODIFIED" }] })],
      { strategy: "squash", dryRun: false, deps },
    );

    expect(rows[0]!.status).toBe("Skipped");
    expect(rows[0]!.reason).toContain("UNSAFE");
    expect(merges).toEqual([]);
  });

  it("a dry run merges nothing", async () => {
    const { deps, merges } = fakeDeps();
    const rows = await processPrs([pr(40), pr(41, { mergeable: "CONFLICTING" })], { strategy: "squash", dryRun: true, deps });

    expect(merges).toEqual([]);
    expect(rows.map((r) => r.status)).toEqual(["Flagged", "Flagged"]);
  });

  it("skips a PR without a head sha instead of merging it", async () => {
    const { deps, merges } = fakeDeps();
    const rows = await processPrs([pr(50, { headRefOid: undefined })], { strategy: "squash", dryRun: false, deps });

    expect(merges).toEqual([]);
    expect(rows[0]!.status).toBe("Skipped");
  });

  it("a PR whose mergeable state stays unknown is skipped, not merged", async () => {
    const { deps, merges } = fakeDeps();
    deps.refreshMergeable = () => "UNKNOWN";
    const rows = await processPrs([pr(60, { mergeable: "UNKNOWN" })], { strategy: "squash", dryRun: false, deps });

    expect(merges).toEqual([]);
    expect(rows[0]!.status).toBe("Skipped");
  });
});

describe("resolveDryRun", () => {
  it("a scheduled run is always a dry run", () => {
    expect(resolveDryRun(false, { GITHUB_EVENT_NAME: "schedule" })).toBe(true);
  });

  it("follows the flag outside a scheduled run", () => {
    expect(resolveDryRun(false, { GITHUB_EVENT_NAME: "workflow_dispatch" })).toBe(false);
    expect(resolveDryRun(true, {})).toBe(true);
    expect(resolveDryRun(false, {})).toBe(false);
  });
});

describe("agent source", () => {
  it("runs no git command and the conflict resolver is gone", () => {
    const code = readFileSync(join(REPO, "scripts/pr-integration-agent.ts"), "utf8");

    expect(code).not.toMatch(/spawn(Sync)?\(\s*\[\s*"git"/);
    expect(code).not.toContain("conflict-resolver");
    expect(existsSync(join(REPO, "scripts/lib/conflict-resolver.ts"))).toBe(false);
  });
});
