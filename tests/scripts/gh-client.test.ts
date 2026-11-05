import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { isJulesPR, listJulesPrs, mergePr } from "../../scripts/lib/gh-client";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const FOOTER =
  "*PR created automatically by Jules for task [12345678901234567890](https://jules.google.com/task/12345678901234567890) started by @belajarcarabelajar*";

function pr(overrides: Record<string, unknown> = {}) {
  return {
    number: 7,
    title: "fix: typo",
    body: `Fix a typo.\n\n---\n${FOOTER}`,
    author: { login: "belajarcarabelajar" },
    isCrossRepository: false,
    ...overrides,
  };
}

let savedPattern: string | undefined;
beforeEach(() => {
  savedPattern = process.env.JULES_AUTHOR_PATTERN;
  delete process.env.JULES_AUTHOR_PATTERN;
});
afterEach(() => {
  if (savedPattern === undefined) delete process.env.JULES_AUTHOR_PATTERN;
  else process.env.JULES_AUTHOR_PATTERN = savedPattern;
});

describe("isJulesPR", () => {
  test("accepts an owner PR from this repository with a Jules task link", () => {
    expect(isJulesPR(pr())).toBe(true);
  });

  test("refuses a PR whose title or body only mentions Jules", () => {
    expect(isJulesPR(pr({ title: "Jules: fix typo", body: "Made by Jules" }))).toBe(false);
    expect(isJulesPR(pr({ body: "see jules.google.com/task for details" }))).toBe(false);
  });

  test("refuses a PR from a fork even with the owner login and the footer", () => {
    expect(isJulesPR(pr({ isCrossRepository: true }))).toBe(false);
  });

  test("refuses a PR when isCrossRepository is missing", () => {
    expect(isJulesPR(pr({ isCrossRepository: undefined }))).toBe(false);
  });

  test("refuses another author with the footer", () => {
    expect(isJulesPR(pr({ author: { login: "someone-else" } }))).toBe(false);
    expect(isJulesPR(pr({ author: { login: "jules" } }))).toBe(false);
  });

  test("the author pattern is matched against the login only", () => {
    expect(isJulesPR(pr({ author: { login: "jules-bot" } }), "^jules-bot$")).toBe(true);
    expect(isJulesPR(pr({ author: { login: "someone-else" }, title: "jules-bot" }), "jules-bot")).toBe(false);
    expect(isJulesPR(pr({ author: { login: "someone-else" } }), "task")).toBe(false);
  });

  test("the author pattern does not lift the same-repository and footer rules", () => {
    expect(isJulesPR(pr({ author: { login: "jules-bot" }, isCrossRepository: true }), "jules-bot")).toBe(false);
    expect(isJulesPR(pr({ author: { login: "jules-bot" }, body: "no footer" }), "jules-bot")).toBe(false);
  });

  test("JULES_AUTHOR_PATTERN from the environment is matched against the login only", () => {
    process.env.JULES_AUTHOR_PATTERN = "Jules";
    expect(isJulesPR(pr({ author: { login: "someone-else" } }))).toBe(false);
    expect(isJulesPR(pr({ author: { login: "jules-app" } }))).toBe(true);
  });
});

describe("listJulesPrs", () => {
  test("asks gh for the head sha and the cross-repository flag, and keeps only Jules PRs oldest first", () => {
    const seen: string[][] = [];
    const listed = [
      { ...pr({ number: 2, createdAt: "2026-11-02T00:00:00Z" }), headRefOid: SHA },
      { ...pr({ number: 1, createdAt: "2026-11-01T00:00:00Z" }), headRefOid: SHA },
      { ...pr({ number: 3, createdAt: "2026-10-01T00:00:00Z", isCrossRepository: true }), headRefOid: SHA },
    ];
    const out = listJulesPrs({
      run: (args) => {
        seen.push(args);
        return JSON.stringify(listed);
      },
    });

    const fields = seen[0]![seen[0]!.indexOf("--json") + 1]!.split(",");
    expect(fields).toContain("headRefOid");
    expect(fields).toContain("isCrossRepository");
    expect(out.map((p) => p.number)).toEqual([1, 2]);
  });
});

describe("mergePr", () => {
  test("passes --match-head-commit with the assessed sha", () => {
    const seen: string[][] = [];
    mergePr(7, "squash", SHA, {
      run: (args) => {
        seen.push(args);
        return args[1] === "view" ? JSON.stringify({ mergeCommit: { oid: "abc" } }) : "";
      },
    });

    const merge = seen.find((a) => a[1] === "merge")!;
    expect(merge).toBeDefined();
    expect(merge[merge.indexOf("--match-head-commit") + 1]).toBe(SHA);
    expect(merge).toContain("--squash");
  });

  test("refuses to merge without a head sha and calls no gh", () => {
    const seen: string[][] = [];
    const run = (args: string[]) => {
      seen.push(args);
      return "";
    };
    expect(() => mergePr(7, "squash", "", { run })).toThrow();
    expect(() => mergePr(7, "squash", undefined as unknown as string, { run })).toThrow();
    expect(() => mergePr(7, "squash", "main", { run })).toThrow();
    expect(seen).toEqual([]);
  });
});
