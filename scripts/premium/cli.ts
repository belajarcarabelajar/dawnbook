// Small helpers shared by the premium print scripts (print-pdf.ts, release-pdfs.ts).

/** A bad command line: the caller prints its usage line and exits 2. */
// dup-defs: allow shared by the two premium print scripts; check-heading-colons keeps its own private class
export class UsageError extends Error {}

/** The last `lines` lines of a command's output, for a short error message. */
export function tail(text: string, lines = 20): string {
  return text.trimEnd().split("\n").slice(-lines).join("\n");
}
