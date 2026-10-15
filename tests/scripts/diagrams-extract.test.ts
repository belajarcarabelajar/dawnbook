import { describe, expect, test } from "bun:test";
import { type DiagramBlock, findDiagramBlocks, replaceDiagramBlocks } from "../../scripts/diagrams/extract";

const fakeSvg = (source: string) => `<svg data-src="${source.split("\n")[0]}"></svg>`;
const wrap = (block: DiagramBlock) => `<div class="dawnbook-diagram">${fakeSvg(block.source)}</div>`;
const lf = (...lines: string[]) => lines.join("\n");
const crlf = (...lines: string[]) => lines.join("\r\n");

describe("ported spike cases", () => {
  test("replaces a plain backtick mermaid fence with a one-line diagram between blank lines", () => {
    const input = lf("Intro text.", "```mermaid", "flowchart LR", "  A --> B", "```", "After text.", "");
    expect(replaceDiagramBlocks(input, wrap)).toBe(
      lf("Intro text.", "", '<div class="dawnbook-diagram"><svg data-src="flowchart LR"></svg></div>', "", "After text.", ""),
    );
    expect(findDiagramBlocks(input)).toEqual([
      { source: "flowchart LR\n  A --> B", info: "mermaid", startLine: 2, endLine: 5, indent: "" },
    ]);
  });

  test("replaces a tilde mermaid fence", () => {
    const input = lf("~~~mermaid", "flowchart TD", "~~~", "");
    expect(replaceDiagramBlocks(input, wrap)).toBe(
      lf('<div class="dawnbook-diagram"><svg data-src="flowchart TD"></svg></div>', ""),
    );
    expect(findDiagramBlocks(input)).toEqual([
      { source: "flowchart TD", info: "mermaid", startLine: 1, endLine: 3, indent: "" },
    ]);
  });

  test("a longer fence is not closed by a shorter inner fence line and keeps an info string after the language", () => {
    const input = lf("````mermaid title=x", "flowchart TD", "```", "A", "`````", "Tail.");
    expect(replaceDiagramBlocks(input, wrap)).toBe(
      lf('<div class="dawnbook-diagram"><svg data-src="flowchart TD"></svg></div>', "", "Tail."),
    );
    expect(findDiagramBlocks(input)).toEqual([
      { source: "flowchart TD\n```\nA", info: "mermaid title=x", startLine: 1, endLine: 5, indent: "" },
    ]);
  });

  test("leaves non-mermaid fences alone, including a mermaid example inside a longer markdown fence", () => {
    const input = lf("```js", "const a = 1;", "```", "", "````markdown", "```mermaid", "flowchart LR", "```", "````", "");
    expect(replaceDiagramBlocks(input, wrap)).toBe(input);
    expect(findDiagramBlocks(input)).toEqual([]);
  });

  test("leaves an unclosed mermaid fence alone, and it swallows later fences as CommonMark does", () => {
    const input = lf("Text.", "", "```mermaid", "flowchart LR", "  A --> B", "", "~~~mermaid", "flowchart TD", "~~~", "");
    expect(replaceDiagramBlocks(input, wrap)).toBe(input);
    expect(findDiagramBlocks(input)).toEqual([]);
  });

  test("a fence inside a list item keeps the item indentation and de-indents the source", () => {
    const input = lf("1. Step one", "", "   ```mermaid", "   flowchart LR", "     A --> B", "   ```", "2. Step two", "");
    expect(replaceDiagramBlocks(input, wrap)).toBe(
      lf(
        "1. Step one",
        "",
        '   <div class="dawnbook-diagram"><svg data-src="flowchart LR"></svg></div>',
        "",
        "2. Step two",
        "",
      ),
    );
    expect(findDiagramBlocks(input)).toEqual([
      { source: "flowchart LR\n  A --> B", info: "mermaid", startLine: 3, endLine: 6, indent: "   " },
    ]);
  });

  test("a fence inside a nested list item at four spaces is still a fence", () => {
    const input = lf("- Outer", "  - Inner", "", "    ```mermaid", "    flowchart LR", "    ```", "");
    expect(replaceDiagramBlocks(input, wrap)).toBe(
      lf("- Outer", "  - Inner", "", '    <div class="dawnbook-diagram"><svg data-src="flowchart LR"></svg></div>', ""),
    );
    expect(findDiagramBlocks(input)).toEqual([
      { source: "flowchart LR", info: "mermaid", startLine: 4, endLine: 6, indent: "    " },
    ]);
  });

  test("a mermaid fence inside a top-level four-space indented code block is code, not a fence", () => {
    const input = lf("Paragraph.", "", "    ```mermaid", "    flowchart LR", "    ```", "");
    expect(replaceDiagramBlocks(input, wrap)).toBe(input);
    expect(findDiagramBlocks(input)).toEqual([]);
  });

  test("two diagrams in one file are rendered once each in document order", () => {
    const calls: string[] = [];
    const counting = (block: DiagramBlock) => {
      calls.push(block.source);
      return `<svg id="d${calls.length}"></svg>`;
    };
    const input = lf("# Title", "", "```mermaid", "flowchart LR", "```", "", "Middle.", "", "```mermaid", "pie", "```", "");
    expect(replaceDiagramBlocks(input, counting)).toBe(
      lf("# Title", "", '<svg id="d1"></svg>', "", "Middle.", "", '<svg id="d2"></svg>', ""),
    );
    expect(calls).toEqual(["flowchart LR", "pie"]);
    expect(findDiagramBlocks(input).map((b) => [b.source, b.startLine, b.endLine])).toEqual([
      ["flowchart LR", 3, 5],
      ["pie", 9, 11],
    ]);
  });

  test("multi-line renderer output is joined onto one line so no blank line can end the HTML block", () => {
    const multiLine = () => "<svg>\n<style>a{}</style>\n\n<g></g>\r\n</svg>\n";
    const input = lf("```mermaid", "pie", "```", "");
    expect(replaceDiagramBlocks(input, multiLine)).toBe(lf("<svg> <style>a{}</style> <g></g> </svg>", ""));
  });

  test("leaves a fence inside a blockquote alone", () => {
    const input = lf("> ```mermaid", "> flowchart LR", "> ```", "");
    expect(replaceDiagramBlocks(input, wrap)).toBe(input);
    expect(findDiagramBlocks(input)).toEqual([]);
  });
});

describe("line numbers and info string", () => {
  test("startLine and endLine are the 1-based lines of the opening and closing fence", () => {
    const input = lf("# T", "", "Para.", "", "~~~~ mermaid", "a", "", "b", "~~~~~~", "", "End.");
    const [block] = findDiagramBlocks(input);
    expect(block.startLine).toBe(5);
    expect(block.endLine).toBe(9);
    expect(block.source).toBe("a\n\nb");
  });

  test("info keeps the whole trimmed info string after the fence characters", () => {
    const input = lf("```   mermaid  {#rtb .wide}   ", "sequenceDiagram", "```", "");
    expect(findDiagramBlocks(input).map((b) => b.info)).toEqual(["mermaid  {#rtb .wide}"]);
  });

  test("only an info string whose first word is exactly mermaid counts", () => {
    const input = lf("```mermaidjs", "a", "```", "", "```Mermaid", "b", "```", "", "```text mermaid", "c", "```", "");
    expect(findDiagramBlocks(input)).toEqual([]);
  });

  test("a backtick fence whose info string holds a backtick is inline code, not a fence", () => {
    const input = lf("``` mermaid `x`", "flowchart LR", "```", "");
    expect(findDiagramBlocks(input)).toEqual([]);
    expect(replaceDiagramBlocks(input, wrap)).toBe(input);
  });
});

describe("list item boundaries", () => {
  test("a list fence ends with its item when a body line drops below the item column, and parsing resumes there", () => {
    const input = lf("- Item", "  ```mermaid", "  flowchart LR", "Outside the list.", "", "```mermaid", "pie", "```", "");
    expect(findDiagramBlocks(input)).toEqual([{ source: "pie", info: "mermaid", startLine: 6, endLine: 8, indent: "" }]);
    expect(replaceDiagramBlocks(input, wrap)).toBe(
      lf(
        "- Item",
        "  ```mermaid",
        "  flowchart LR",
        "Outside the list.",
        "",
        '<div class="dawnbook-diagram"><svg data-src="pie"></svg></div>',
        "",
      ),
    );
  });

  test("a body line led by a tab reaches the item column, so the list fence stays open", () => {
    const input = lf("1. Step", "   ```mermaid", "   flowchart LR", "\tA --> B", "   ```", "2. Next", "");
    expect(findDiagramBlocks(input).map((b) => [b.startLine, b.endLine])).toEqual([[2, 5]]);
  });
});

describe("CRLF input", () => {
  test("finds blocks in CRLF text with a LF-joined source and no carriage returns", () => {
    const input = crlf("Intro.", "```mermaid", "flowchart LR", "  A --> B", "```", "After.", "");
    expect(findDiagramBlocks(input)).toEqual([
      { source: "flowchart LR\n  A --> B", info: "mermaid", startLine: 2, endLine: 5, indent: "" },
    ]);
  });

  test("replacement keeps CRLF line endings, including inserted blank lines", () => {
    const input = crlf("Intro.", "```mermaid", "flowchart LR", "```", "After.", "");
    expect(replaceDiagramBlocks(input, wrap)).toBe(
      crlf("Intro.", "", '<div class="dawnbook-diagram"><svg data-src="flowchart LR"></svg></div>', "", "After.", ""),
    );
  });
});

describe("blank lines around the replacement", () => {
  test("existing blank lines are kept and not doubled", () => {
    const input = lf("Intro.", "", "```mermaid", "pie", "```", "", "After.");
    expect(replaceDiagramBlocks(input, () => "<x></x>")).toBe(lf("Intro.", "", "<x></x>", "", "After."));
  });

  test("a whitespace-only blank line counts as blank and stays byte-identical", () => {
    const input = lf("Intro.", "   ", "```mermaid", "pie", "```", "\t", "After.");
    expect(replaceDiagramBlocks(input, () => "<x></x>")).toBe(lf("Intro.", "   ", "<x></x>", "\t", "After."));
  });

  test("two adjacent diagrams get exactly one blank line between them", () => {
    const input = lf("```mermaid", "a", "```", "```mermaid", "b", "```");
    expect(replaceDiagramBlocks(input, (b) => `<${b.source}/>`)).toBe(lf("<a/>", "", "<b/>"));
  });

  test("no blank line is added before the first line or after the last line of the file", () => {
    expect(replaceDiagramBlocks(lf("```mermaid", "pie", "```"), () => "<x></x>")).toBe("<x></x>");
  });
});

describe("a file with zero diagram blocks", () => {
  test("is returned unchanged and toHtml is never called", () => {
    const input = crlf("# Bab", "", "Teks biasa.", "", "```python", "print(1)", "```", "");
    let called = 0;
    expect(
      replaceDiagramBlocks(input, () => {
        called++;
        return "";
      }),
    ).toBe(input);
    expect(called).toBe(0);
    expect(findDiagramBlocks(input)).toEqual([]);
  });
});
