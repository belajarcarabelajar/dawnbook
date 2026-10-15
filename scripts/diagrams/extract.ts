export interface DiagramBlock {
  source: string;
  info: string;
  startLine: number;
  endLine: number;
  indent: string;
}

interface Opener {
  indent: string;
  containerCol: number;
  char: string;
  length: number;
  info: string;
}

const OPENER = /^( *)(`{3,}|~{3,})(.*)$/;
const CLOSER = /^( *)(`+|~+)[ \t]*$/;
const LIST_MARKER = /^( *)([-*+]|\d{1,9}[.)])( {1,4})(?=\S)/;

function isBlank(line: string): boolean {
  return line.trim() === "";
}

function stripCr(line: string): string {
  return line.endsWith("\r") ? line.slice(0, -1) : line;
}

// Tabs advance to the next multiple of 4, as in CommonMark, so a tab-led body line inside a
// list fence is not mistaken for a line that leaves the list item.
function indentWidth(line: string): number {
  let col = 0;
  for (const ch of line) {
    if (ch === " ") col++;
    else if (ch === "\t") col += 4 - (col % 4);
    else break;
  }
  return col;
}

// Content column of the list item that holds line i, read from the nearest less-indented
// non-blank line only, so a fence indented deeper than a later paragraph of the same item, or
// inside a deeper nested item, can be misread. Blockquote containers are not modelled: a
// "> " prefix never matches OPENER, so blockquoted fences are left alone.
function containerColumn(lines: string[], i: number, indent: number): number {
  if (indent === 0) return 0;
  for (let j = i - 1; j >= 0; j--) {
    if (isBlank(lines[j])) continue;
    if (indentWidth(lines[j]) >= indent) continue;
    const m = LIST_MARKER.exec(lines[j]);
    return m && m[0].length <= indent ? m[0].length : 0;
  }
  return 0;
}

function parseOpener(lines: string[], i: number): Opener | null {
  const m = OPENER.exec(lines[i]);
  if (!m) return null;
  const containerCol = containerColumn(lines, i, m[1].length);
  if (m[1].length - containerCol > 3) return null;
  const char = m[2][0];
  const info = m[3].trim();
  // CommonMark: a backtick fence whose info string holds a backtick is inline code, not a fence.
  if (char === "`" && info.includes("`")) return null;
  return { indent: m[1], containerCol, char, length: m[2].length, info };
}

function isCloser(line: string, opener: Opener): boolean {
  const m = CLOSER.exec(line);
  if (!m) return false;
  const rel = m[1].length - opener.containerCol;
  return rel >= 0 && rel <= 3 && m[2][0] === opener.char && m[2].length >= opener.length;
}

// Index of the closing fence line, or -1 when the fence never closes. `resume` is where parsing
// continues: past the closer, at the line that ends the enclosing list item, or at the end.
function findClose(lines: string[], i: number, opener: Opener): { close: number; resume: number } {
  for (let j = i + 1; j < lines.length; j++) {
    if (isCloser(lines[j], opener)) return { close: j, resume: j + 1 };
    // Inside a fenced block there is no lazy continuation, so a less-indented line ends the list
    // item and the fence with it.
    if (opener.containerCol > 0 && !isBlank(lines[j]) && indentWidth(lines[j]) < opener.containerCol) {
      return { close: -1, resume: j };
    }
  }
  return { close: -1, resume: lines.length };
}

const COMMENT_OPEN = /^( *)<!--/;

// Last line of the HTML comment block that starts at line i, or null when none starts there.
// CommonMark ends that block at the first line holding -->, which may be a mermaid arrow line,
// and an unclosed comment runs to the end of the document.
function commentEnd(lines: string[], i: number): number | null {
  const m = COMMENT_OPEN.exec(lines[i]);
  if (!m || m[1].length - containerColumn(lines, i, m[1].length) > 3) return null;
  if (lines[i].includes("-->", m[0].length)) return i;
  for (let j = i + 1; j < lines.length; j++) if (lines[j].includes("-->")) return j;
  return lines.length - 1;
}

function isMermaid(info: string): boolean {
  return /^mermaid(?:\s|$)/.test(info);
}

function stripIndent(line: string, max: number): string {
  let n = 0;
  while (n < max && line[n] === " ") n++;
  return line.slice(n);
}

function scan(lines: string[]): DiagramBlock[] {
  const blocks: DiagramBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const opener = parseOpener(lines, i);
    if (!opener) {
      const end = commentEnd(lines, i);
      i = end === null ? i + 1 : end + 1;
      continue;
    }
    // Every fence is skipped whole, so a mermaid example inside a longer non-mermaid fence stays
    // text, and an unclosed fence swallows everything up to its resume point.
    const { close, resume } = findClose(lines, i, opener);
    if (close !== -1 && isMermaid(opener.info)) {
      blocks.push({
        source: lines
          .slice(i + 1, close)
          .map((l) => stripIndent(l, opener.indent.length))
          .join("\n"),
        info: opener.info,
        startLine: i + 1,
        endLine: close + 1,
        indent: opener.indent,
      });
    }
    i = resume;
  }
  return blocks;
}

export function findDiagramBlocks(markdown: string): DiagramBlock[] {
  return scan(markdown.split("\n").map(stripCr));
}

export function replaceDiagramBlocks(markdown: string, toHtml: (block: DiagramBlock) => string): string {
  const raw = markdown.split("\n");
  const blocks = scan(raw.map(stripCr));
  if (blocks.length === 0) return markdown;
  const out: string[] = [];
  let next = 0;
  for (const block of blocks) {
    const open = block.startLine - 1;
    const close = block.endLine - 1;
    out.push(...raw.slice(next, open));
    // Each kept line carries its own "\r", so inserted lines copy the fence's line ending.
    const openCr = raw[open].endsWith("\r") ? "\r" : "";
    const closeCr = raw[close].endsWith("\r") ? "\r" : "";
    if (out.length > 0 && !isBlank(out[out.length - 1])) out.push(openCr);
    // An HTML block ends at the first blank line, so the markup must stay on one line.
    const html = toHtml(block).trim().replace(/[ \t]*[\r\n][ \t\r\n]*/g, " ");
    out.push(block.indent + html + closeCr);
    if (close + 1 < raw.length && !isBlank(raw[close + 1])) out.push(closeCr);
    next = close + 1;
  }
  out.push(...raw.slice(next));
  return out.join("\n");
}
