import { expect, test, describe } from "bun:test";
import { spawnSync } from "node:child_process";

// discover -s loads each file as a top-level module; `-m unittest <path>` would import it as
// tests.scripts.*, which fails on Python 3.13 because tests/ has no __init__.py.
function runPythonTests(pattern: string) {
  const result = spawnSync(
    "python3",
    ["-m", "unittest", "discover", "-s", import.meta.dir, "-p", pattern],
    { encoding: "utf-8", cwd: process.cwd(), env: process.env },
  );
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

describe("GSC Python scripts use the TULIS OAuth token and fail loudly", () => {
  test("scripts/gsc_trigger_reindex.py", () => {
    const { status, output } = runPythonTests("test_gsc_trigger_reindex.py");
    expect(output).toContain("Ran 5 tests");
    expect(output).toContain("OK");
    expect(status).toBe(0);
  });

  test("scripts/gsc_seo_insights.py", () => {
    const { status, output } = runPythonTests("test_gsc_seo_insights.py");
    expect(output).toContain("Ran 5 tests");
    expect(output).toContain("OK");
    expect(status).toBe(0);
  });
});
