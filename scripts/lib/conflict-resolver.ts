/**
 * conflict-resolver.ts — additive-preservation conflict resolution (priority 1-4)
 * Priority:
 *  1 whitespace-only → auto-resolve preserve functional code
 *  2 additive non-overlapping → merge both
 *  3 overlapping same function/block → preserve more complete/recent + integrate unique logic
 *  4 undetermined → preserve BOTH with inline markers, flag MANUAL REVIEW SUGGESTED
 */

export type ConflictType = "whitespace" | "additive" | "overlapping" | "undetermined";
export type Resolution = {
  type: ConflictType;
  confidence: number;
  resolvedContent: string;
  method: string;
  needsManualReview: boolean;
};

function isWhitespaceOnlyChange(a: string, b: string): boolean {
  return a.replace(/\s+/g, "") === b.replace(/\s+/g, "") && a !== b;
}

function parseConflictHunks(content: string): Array<{ base: string; main: string; pr: string; raw: string }> {
  // Handles both zdiff3 and standard markers: <<<<<<<, |||||||, =======, >>>>>>>
  const hunks: Array<{ base: string; main: string; pr: string; raw: string }> = [];
  const lines = content.split("\n");
  let i = 0;
  while (i < lines.length) {
    if (lines[i].startsWith("<<<<<<<")) {
      const start = i;
      let mainLines: string[] = [];
      let baseLines: string[] = [];
      let prLines: string[] = [];
      i++;
      // Collect main until ||||||| or =======
      let section: "main" | "base" | "pr" = "main";
      while (i < lines.length && !lines[i].startsWith(">>>>>>>")) {
        if (lines[i].startsWith("|||||||")) {
          section = "base";
          i++;
          continue;
        }
        if (lines[i].startsWith("=======") ) {
          section = "pr";
          i++;
          continue;
        }
        if (section === "main") mainLines.push(lines[i]);
        else if (section === "base") baseLines.push(lines[i]);
        else prLines.push(lines[i]);
        i++;
      }
      // Include closing marker
      if (i < lines.length && lines[i].startsWith(">>>>>>>")) i++;
      const raw = lines.slice(start, i).join("\n");
      hunks.push({ base: baseLines.join("\n"), main: mainLines.join("\n"), pr: prLines.join("\n"), raw });
    } else {
      i++;
    }
  }
  return hunks;
}

function classifyHunk(main: string, pr: string, base: string): ConflictType {
  const m = main.trim();
  const p = pr.trim();
  const b = base.trim();

  if (!m && !p) return "whitespace";
  if (isWhitespaceOnlyChange(m, p)) return "whitespace";

  // Additive: both add non-overlapping logic vs base
  // Heuristic: main and pr each contain lines not in base, and main lines not in pr and vice versa, and no shared modified line
  if (b.length === 0) {
    // Base empty — both add new blocks at same location
    // If main and pr are disjoint functions (different names), treat as additive
    const mainFns = (m.match(/function\s+\w+|const\s+\w+\s*=/g) ?? []).map((s) => s.trim());
    const prFns = (p.match(/function\s+\w+|const\s+\w+\s*=/g) ?? []).map((s) => s.trim());
    if (mainFns.length && prFns.length && !mainFns.some((f) => prFns.includes(f))) return "additive";
    // If both are single-line additions different, additive
    if (m.split("\n").length === 1 && p.split("\n").length === 1 && m !== p) return "additive";
  }

  const mainAddsNotInBase = m.split("\n").filter((l) => l.trim() && !b.includes(l.trim()));
  const prAddsNotInBase = p.split("\n").filter((l) => l.trim() && !b.includes(l.trim()));
  const hasUniqueMain = mainAddsNotInBase.some((l) => !p.includes(l));
  const hasUniquePr = prAddsNotInBase.some((l) => !m.includes(l));
  if (hasUniqueMain && hasUniquePr && mainAddsNotInBase.length + prAddsNotInBase.length < 10) {
    // Likely additive non-overlapping
    // But if they modify same line, it's overlapping
    const mainLinesSet = new Set(m.split("\n").map((l) => l.trim()).filter(Boolean));
    const prLinesSet = new Set(p.split("\n").map((l) => l.trim()).filter(Boolean));
    const overlap = [...mainLinesSet].filter((l) => prLinesSet.has(l)).length;
    if (overlap / Math.max(mainLinesSet.size, prLinesSet.size) < 0.3) return "additive";
  }

  if (m.length > 0 && p.length > 0 && m !== p) {
    // Both modify same area
    // Check if one is clearly superset (more complete)
    if ((m.length > p.length * 1.5 || p.length > m.length * 1.5) && (m.includes(p.slice(0, 20)) || p.includes(m.slice(0, 20)))) {
      return "overlapping";
    }
    // Default overlapping for same function edits
    if (/function\s+\w+/.test(m) && /function\s+\w+/.test(p)) return "overlapping";
    return "overlapping";
  }

  return "undetermined";
}

export function resolveHunk(main: string, pr: string, base: string, prMeta: { number: number; title: string }): Resolution {
  const type = classifyHunk(main, pr, base);
  const prLabel = `PR #${prMeta.number} (${prMeta.title.slice(0, 40)})`;

  if (type === "whitespace") {
    // Preserve functional code from both: choose longer (more whitespace explicit) but normalize?
    const resolved = main.length >= pr.length ? main : pr;
    return { type, confidence: 0.95, resolvedContent: resolved, method: "whitespace: preserve functional code", needsManualReview: false };
  }

  if (type === "additive") {
    // Merge both additions; order: main first (base branch) then pr
    const merged = [main.trimEnd(), pr.trimEnd()].filter(Boolean).join("\n");
    return { type, confidence: 0.9, resolvedContent: merged, method: "additive: merge both additions", needsManualReview: false };
  }

  if (type === "overlapping") {
    // Preserve more complete/recent: longer is more complete heuristic; integrate unique logic from other as supplementary
    const mainLonger = main.length >= pr.length;
    const primary = mainLonger ? main : pr;
    const secondary = mainLonger ? pr : main;
    const secondaryLines = secondary.split("\n").filter((l) => l.trim() && !primary.includes(l.trim()));
    const supplementary = secondaryLines.length ? `\n// Integrated from ${mainLonger ? prLabel : "main"} (unique logic):\n${secondaryLines.join("\n")}` : "";
    const resolved = primary.trimEnd() + supplementary;
    return { type, confidence: 0.7, resolvedContent: resolved, method: "overlapping: preserve more complete + integrate unique", needsManualReview: false };
  }

  // undetermined
  const resolved = `// <<< MAIN\n${main}\n// === ${prLabel}\n${pr}\n// >>> END CONFLICT (MANUAL REVIEW SUGGESTED - PR #${prMeta.number})`;
  return { type: "undetermined", confidence: 0.4, resolvedContent: resolved, method: "undetermined: preserve both with markers (MANUAL REVIEW SUGGESTED)", needsManualReview: true };
}

export function resolveFileContent(contentWithMarkers: string, prMeta: { number: number; title: string }): { resolved: string; hunks: Resolution[]; needsManualReview: boolean } {
  const hunks = parseConflictHunks(contentWithMarkers);
  if (hunks.length === 0) return { resolved: contentWithMarkers, hunks: [], needsManualReview: false };

  let resolved = contentWithMarkers;
  const resolutions: Resolution[] = [];
  let needsManualReview = false;

  for (const h of hunks) {
    const r = resolveHunk(h.main, h.pr, h.base, prMeta);
    resolutions.push(r);
    if (r.needsManualReview) needsManualReview = true;
    resolved = resolved.replace(h.raw, r.resolvedContent);
  }

  // Ensure additive preservation: resolved length >= max(main, pr) lengths
  // Already guaranteed by resolver strategies

  return { resolved, hunks: resolutions, needsManualReview };
}

export function _testExports() {
  return { isWhitespaceOnlyChange, classifyHunk, parseConflictHunks };
}
