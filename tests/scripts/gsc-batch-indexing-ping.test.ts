import { expect, test, describe } from "bun:test";
import { execSync } from "node:child_process";
import { relative } from "node:path";

describe("GSC Batch Indexing Ping (scripts/gsc_batch_indexing_ping.py)", () => {
  test("runs Python unit tests successfully", () => {
    const relPath = relative(process.cwd(), `${import.meta.dir}/test_gsc_batch_indexing_ping.py`);
    const output = execSync(`python3 -m unittest "${relPath}" 2>&1`, {
      encoding: "utf-8",
      cwd: process.cwd(),
      env: process.env
    });
    expect(output.toString()).toContain("OK");
  });
});
