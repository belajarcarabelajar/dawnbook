import { expect, test, describe } from "bun:test";
import { spawnSync } from "node:child_process";

describe("GSC Batch Indexing Ping (scripts/gsc_batch_indexing_ping.py)", () => {
  test("runs Python unit tests successfully", () => {
    // discover -s loads the file as a top-level module; `-m unittest <path>` imports it as
    // tests.scripts.*, which fails on Python 3.13 because tests/ has no __init__.py.
    const result = spawnSync(
      "python3",
      ["-m", "unittest", "discover", "-s", import.meta.dir, "-p", "test_gsc_batch_indexing_ping.py"],
      { encoding: "utf-8", cwd: process.cwd(), env: process.env },
    );
    // unittest writes its summary to stderr.
    const output = `${result.stdout}${result.stderr}`;
    expect(output).toContain("Ran 6 tests");
    expect(output).toContain("OK");
    expect(result.status).toBe(0);
  });
});
