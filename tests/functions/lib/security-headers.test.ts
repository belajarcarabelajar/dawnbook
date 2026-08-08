import { expect, test, describe } from "bun:test";
import { CONTENT_SECURITY_POLICY } from "../../../functions/lib/security-headers";

describe("functions/lib/security-headers.ts", () => {
  test("CONTENT_SECURITY_POLICY is a correctly formatted string", () => {
    expect(typeof CONTENT_SECURITY_POLICY).toBe("string");
    expect(CONTENT_SECURITY_POLICY.length).toBeGreaterThan(0);

    // It should not end with a semicolon or space
    expect(CONTENT_SECURITY_POLICY.endsWith(";")).toBe(false);
    expect(CONTENT_SECURITY_POLICY.endsWith(" ")).toBe(false);

    // It should contain multiple directives separated by "; "
    expect(CONTENT_SECURITY_POLICY.includes("; ")).toBe(true);
  });

  test("CONTENT_SECURITY_POLICY contains expected CSP directives", () => {
    // Basic structural checks for expected directives
    const directives = CONTENT_SECURITY_POLICY.split("; ").map(d => d.split(" ")[0]);

    expect(directives).toContain("default-src");
    expect(directives).toContain("script-src");
    expect(directives).toContain("style-src");
    expect(directives).toContain("font-src");
    expect(directives).toContain("img-src");
    expect(directives).toContain("media-src");
    expect(directives).toContain("connect-src");
    expect(directives).toContain("frame-src");
    expect(directives).toContain("worker-src");
    expect(directives).toContain("object-src");
    expect(directives).toContain("base-uri");
    expect(directives).toContain("frame-ancestors");
  });

  test("CONTENT_SECURITY_POLICY enforces 'self' for core directives", () => {
    // Check that core directives start with 'self'
    const policyMap = new Map();
    CONTENT_SECURITY_POLICY.split("; ").forEach(directive => {
      const parts = directive.split(" ");
      policyMap.set(parts[0], parts.slice(1));
    });

    expect(policyMap.get("default-src")).toContain("'self'");
    expect(policyMap.get("script-src")).toContain("'self'");
    expect(policyMap.get("style-src")).toContain("'self'");
  });

  test("CONTENT_SECURITY_POLICY restricts potentially dangerous features", () => {
    const policyMap = new Map();
    CONTENT_SECURITY_POLICY.split("; ").forEach(directive => {
      const parts = directive.split(" ");
      policyMap.set(parts[0], parts.slice(1));
    });

    expect(policyMap.get("object-src")).toEqual(["'none'"]);
    expect(policyMap.get("frame-ancestors")).toEqual(["'none'"]);
  });
});
