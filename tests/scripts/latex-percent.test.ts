import { describe, expect, test } from "bun:test";
import { isProtectedDisplay, percentViolation } from "../../scripts/lib/latex-percent";

// GEMINI.md section 9: ordinary Markdown math needs \text{\%} (mdBook strips the
// backslash of \%), a protected display block needs \% (nothing is stripped there,
// so \text{\%} prints a literal "\%").

describe("percentViolation in ordinary math", () => {
  test("accepts \\text{\\%}", () => {
    expect(percentViolation("50 \\text{\\%}", "ordinary")).toBeNull();
  });
  test("flags \\% and a raw %", () => {
    expect(percentViolation("50\\%", "ordinary")).not.toBeNull();
    expect(percentViolation("50%", "ordinary")).not.toBeNull();
  });
  test("ignores math without a percent sign", () => {
    expect(percentViolation("x^2 + 1", "ordinary")).toBeNull();
  });
});

describe("percentViolation in a protected block", () => {
  test("accepts \\%", () => {
    expect(percentViolation("E_d = \\frac{\\% \\Delta Q}{\\% \\Delta P}", "protected")).toBeNull();
  });
  test("flags \\text{\\%}, which prints a literal backslash", () => {
    expect(percentViolation("50 \\text{\\%}", "protected")).toContain("\\%");
  });
  test("flags a raw %", () => {
    expect(percentViolation("50%", "protected")).not.toBeNull();
  });
});

function locate(content: string): [number, number] {
  const open = content.indexOf("$$");
  const close = content.indexOf("$$", open + 2) + 2;
  return [open, close];
}

describe("isProtectedDisplay", () => {
  test("true for <div>, $$, formula, $$, </div> with no blank line", () => {
    const c = "Teks.\n\n<div>\n$$\nx = 50 \\%\n$$\n</div>\n\nLanjut.";
    expect(isProtectedDisplay(c, ...locate(c))).toBe(true);
  });
  test("true when the block is indented inside a list item", () => {
    const c = "1. Cari MC:\n\n   <div>\n   $$\n   x = 1\n   $$\n   </div>\n";
    expect(isProtectedDisplay(c, ...locate(c))).toBe(true);
  });
  test("false for a bare $$ block", () => {
    const c = "Teks.\n\n$$\nx = 1\n$$\n\nLanjut.";
    expect(isProtectedDisplay(c, ...locate(c))).toBe(false);
  });
  test("false when a blank line sits inside the <div>", () => {
    const c = "<div>\n$$\nx = 1\n\n$$\n</div>\n";
    expect(isProtectedDisplay(c, ...locate(c))).toBe(false);
  });
  test("false for $$ on one line inside a paragraph", () => {
    const c = "<div>\nTeks $$x = 1$$ teks\n</div>\n";
    expect(isProtectedDisplay(c, ...locate(c))).toBe(false);
  });
});
