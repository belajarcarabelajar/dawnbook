import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const WORKFLOW = join(import.meta.dir, "../../.github/workflows/pr-integration.yml");
const ROOT = join(homedir(), ".cache/tmp/dawnbook-scratch/pr-integration-workflow-test");
const BIN = join(ROOT, "bin");
const ARGS_LOG = join(ROOT, "bun-args.txt");

type Step = { name?: string; run?: string; env?: Record<string, string>; shell?: string };

function steps(): Step[] {
  const doc = Bun.YAML.parse(readFileSync(WORKFLOW, "utf8")) as { jobs: { integrate: { steps: Step[] } } };
  return doc.jobs.integrate.steps;
}

const agentStep = () => steps().find((s) => (s.run ?? "").includes("scripts/pr-integration-agent.ts"))!;

beforeAll(() => {
  rmSync(ROOT, { recursive: true, force: true });
  mkdirSync(BIN, { recursive: true });
  // Stand-in for bun: writes one argument per line so the test sees the exact argv.
  writeFileSync(join(BIN, "bun"), `#!/bin/bash\nprintf '%s\\n' "$@" > "${ARGS_LOG}"\n`);
  chmodSync(join(BIN, "bun"), 0o755);
});

afterAll(() => {
  rmSync(ROOT, { recursive: true, force: true });
});

/** Runs the agent step's script the way Actions does, with the step's inputs set through env. */
function runStep(event: string, inputs: { dry_run?: string; author_pattern?: string; pr_number?: string }) {
  rmSync(ARGS_LOG, { force: true });
  const proc = Bun.spawnSync(["bash", "-e", "-c", agentStep().run!], {
    env: {
      PATH: `${BIN}:/usr/bin:/bin`,
      GITHUB_EVENT_NAME: event,
      INPUT_DRY_RUN: inputs.dry_run ?? "",
      INPUT_AUTHOR_PATTERN: inputs.author_pattern ?? "",
      INPUT_PR_NUMBER: inputs.pr_number ?? "",
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  const argv = existsSync(ARGS_LOG) ? readFileSync(ARGS_LOG, "utf8").split("\n").slice(0, -1) : null;
  return { code: proc.exitCode, argv };
}

describe("pr-integration.yml", () => {
  test("no run block expands ${{ inputs.* }}", () => {
    for (const s of steps()) expect(s.run ?? "").not.toContain("${{ inputs.");
  });

  test("the agent step receives its inputs through env", () => {
    const env = agentStep().env ?? {};
    expect(env.INPUT_DRY_RUN).toBe("${{ inputs.dry_run }}");
    expect(env.INPUT_AUTHOR_PATTERN).toBe("${{ inputs.author_pattern }}");
    expect(env.INPUT_PR_NUMBER).toBe("${{ inputs.pr_number }}");
  });

  test("a scheduled run passes --dry-run", () => {
    const r = runStep("schedule", {});
    expect(r.code).toBe(0);
    expect(r.argv).toContain("--dry-run");
  });

  test("a scheduled run passes --dry-run even when dry_run reads false", () => {
    const r = runStep("schedule", { dry_run: "false" });
    expect(r.argv).toContain("--dry-run");
  });

  test("a manual run with dry_run true passes --dry-run", () => {
    expect(runStep("workflow_dispatch", { dry_run: "true" }).argv).toContain("--dry-run");
  });

  test("a manual run with dry_run false runs for real", () => {
    const r = runStep("workflow_dispatch", { dry_run: "false" });
    expect(r.code).toBe(0);
    expect(r.argv).toEqual(["run", "scripts/pr-integration-agent.ts"]);
  });

  test("a numeric pr_number is passed as --pr", () => {
    const r = runStep("workflow_dispatch", { dry_run: "true", pr_number: "123" });
    expect(r.argv).toEqual(["run", "scripts/pr-integration-agent.ts", "--dry-run", "--pr", "123"]);
  });

  test("a non-numeric pr_number exits 1 before the agent runs", () => {
    for (const value of ["12a", "1 2", "1;true", "-1"]) {
      const r = runStep("workflow_dispatch", { dry_run: "true", pr_number: value });
      expect(r.code).toBe(1);
      expect(r.argv).toBeNull();
    }
  });

  test("the author pattern reaches the agent as one argument, unchanged", () => {
    const pattern = `a b"$(x)'`;
    const r = runStep("workflow_dispatch", { dry_run: "true", author_pattern: pattern });
    expect(r.argv).toEqual(["run", "scripts/pr-integration-agent.ts", "--dry-run", "--author-pattern", pattern]);
  });
});
