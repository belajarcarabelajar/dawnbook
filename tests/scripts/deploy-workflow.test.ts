import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const WORKFLOW = join(import.meta.dir, "../../.github/workflows/deploy.yml");

type Step = { name?: string; uses?: string; run?: string };

function steps(): Step[] {
  const doc = Bun.YAML.parse(readFileSync(WORKFLOW, "utf8")) as { jobs: { deploy: { steps: Step[] } } };
  return doc.jobs.deploy.steps;
}

describe("deploy.yml premium output guard", () => {
  test("runs check-premium-output.ts after the build and before the Pages deploy", () => {
    const all = steps();
    const build = all.findIndex((s) => s.name === "Build Platform");
    const guard = all.findIndex((s) => (s.run ?? "").trim() === "bun run scripts/check-premium-output.ts");
    const deploy = all.findIndex((s) => s.name === "Deploy to Cloudflare Pages");

    expect(build).toBeGreaterThanOrEqual(0);
    expect(deploy).toBeGreaterThanOrEqual(0);
    expect(guard).toBeGreaterThan(build);
    expect(guard).toBeLessThan(deploy);
  });

  test("the guard step is not allowed to fail silently", () => {
    const guard = steps().find((s) => (s.run ?? "").includes("check-premium-output.ts")) as Record<string, unknown> | undefined;

    expect(guard).toBeDefined();
    expect(guard!["continue-on-error"]).toBeUndefined();
    expect(guard!.if).toBeUndefined();
  });
});
