// Percent-sign rule for math in chapter Markdown (GEMINI.md section 9).
// Ordinary Markdown math (inline math, or a $$ block that is not protected) loses the
// backslash of \% to mdBook, so it needs \text{\%}. Inside a protected display block
// (<div>, $$, formula, $$, </div> with no blank line inside) nothing is stripped, so
// \% is right and \text{\%} prints a literal "\%".

export type MathContext = "ordinary" | "protected";

/** Why the percent signs in `math` are wrong for `context`, or null when they are fine. */
export function percentViolation(math: string, context: MathContext): string | null {
  if (context === "protected") {
    if (math.includes("\\text{\\%}")) {
      return "inside a protected block write '\\%'; '\\text{\\%}' prints a literal \\%";
    }
    if (/(?<!\\)%/.test(math)) return "raw '%' starts a TeX comment; write '\\%' inside a protected block";
    return null;
  }
  if (/(?<!\\text\{[^}]*)%/.test(math) && !math.includes("\\text{\\%}")) {
    return "unescaped percentage symbol; ordinary Markdown math must use '\\text{\\%}'";
  }
  return null;
}

/**
 * True when the $$ block from `openIdx` (its first $) to `closeEnd` (just past its
 * last $) is a protected display block: each $$ alone on its line, a <div> line right
 * before, a </div> line right after, and no blank line in between.
 */
export function isProtectedDisplay(content: string, openIdx: number, closeEnd: number): boolean {
  const before = content.slice(0, openIdx).split("\n");
  if (before[before.length - 1].trim() !== "") return false;
  if (before.length < 2 || before[before.length - 2].trim() !== "<div>") return false;
  const after = content.slice(closeEnd).split("\n");
  if (after[0].trim() !== "") return false;
  if (after.length < 2 || after[1].trim() !== "</div>") return false;
  return !/\n[ \t]*\n/.test(content.slice(openIdx, closeEnd));
}
