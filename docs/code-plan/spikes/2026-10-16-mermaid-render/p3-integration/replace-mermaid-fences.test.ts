// Question: which mermaid fences does replaceMermaidFences swap for inline SVG, and which does it leave alone?
import { describe, expect, test } from "bun:test";
import { replaceMermaidFences } from "./replace-mermaid-fences";

const fakeSvg = (source: string) => `<svg data-src="${source.split("\n")[0]}"></svg>`;

describe("replaceMermaidFences", () => {
  test("replaces a plain backtick mermaid fence with a one-line diagram div between blank lines", () => {
    const input = ["Intro text.", "```mermaid", "flowchart LR", "  A --> B", "```", "After text.", ""].join("\n");
    const result = replaceMermaidFences(input, fakeSvg);
    expect(result.markdown).toBe(
      [
        "Intro text.",
        "",
        '<div class="dawnbook-diagram"><svg data-src="flowchart LR"></svg></div>',
        "",
        "After text.",
        "",
      ].join("\n"),
    );
    expect(result.blocks).toEqual([{ source: "flowchart LR\n  A --> B", startLine: 2 }]);
  });

  test("replaces a tilde mermaid fence", () => {
    const input = ["~~~mermaid", "flowchart TD", "~~~", ""].join("\n");
    const result = replaceMermaidFences(input, fakeSvg);
    expect(result.markdown).toBe(['<div class="dawnbook-diagram"><svg data-src="flowchart TD"></svg></div>', ""].join("\n"));
    expect(result.blocks).toEqual([{ source: "flowchart TD", startLine: 1 }]);
  });

  test("a longer fence is not closed by a shorter inner fence line and accepts an info string after the language", () => {
    const input = ["````mermaid title=x", "flowchart TD", "```", "A", "`````", "Tail."].join("\n");
    const result = replaceMermaidFences(input, fakeSvg);
    expect(result.markdown).toBe(
      ['<div class="dawnbook-diagram"><svg data-src="flowchart TD"></svg></div>', "", "Tail."].join("\n"),
    );
    expect(result.blocks).toEqual([{ source: "flowchart TD\n```\nA", startLine: 1 }]);
  });

  test("leaves non-mermaid fences alone, including a mermaid example shown inside a longer markdown fence", () => {
    const input = ["```js", "const a = 1;", "```", "", "````markdown", "```mermaid", "flowchart LR", "```", "````", ""].join("\n");
    const result = replaceMermaidFences(input, fakeSvg);
    expect(result.markdown).toBe(input);
    expect(result.blocks).toEqual([]);
  });

  test("leaves an unclosed mermaid fence alone, and it swallows later fences as CommonMark does", () => {
    const input = ["Text.", "", "```mermaid", "flowchart LR", "  A --> B", "", "~~~mermaid", "flowchart TD", "~~~", ""].join("\n");
    const result = replaceMermaidFences(input, fakeSvg);
    expect(result.markdown).toBe(input);
    expect(result.blocks).toEqual([]);
  });

  test("a fence inside a list item keeps the item indentation and de-indents the source", () => {
    const input = ["1. Step one", "", "   ```mermaid", "   flowchart LR", "     A --> B", "   ```", "2. Step two", ""].join("\n");
    const result = replaceMermaidFences(input, fakeSvg);
    expect(result.markdown).toBe(
      [
        "1. Step one",
        "",
        '   <div class="dawnbook-diagram"><svg data-src="flowchart LR"></svg></div>',
        "",
        "2. Step two",
        "",
      ].join("\n"),
    );
    expect(result.blocks).toEqual([{ source: "flowchart LR\n  A --> B", startLine: 3 }]);
  });

  test("a fence inside a nested list item at four spaces is still a fence", () => {
    const input = ["- Outer", "  - Inner", "", "    ```mermaid", "    flowchart LR", "    ```", ""].join("\n");
    const result = replaceMermaidFences(input, fakeSvg);
    expect(result.markdown).toBe(
      ["- Outer", "  - Inner", "", '    <div class="dawnbook-diagram"><svg data-src="flowchart LR"></svg></div>', ""].join("\n"),
    );
    expect(result.blocks).toEqual([{ source: "flowchart LR", startLine: 4 }]);
  });

  test("a mermaid fence inside a top-level four-space indented code block is code, not a fence", () => {
    const input = ["Paragraph.", "", "    ```mermaid", "    flowchart LR", "    ```", ""].join("\n");
    const result = replaceMermaidFences(input, fakeSvg);
    expect(result.markdown).toBe(input);
    expect(result.blocks).toEqual([]);
  });

  test("two diagrams in one file are rendered once each in document order", () => {
    const calls: string[] = [];
    const counting = (source: string) => {
      calls.push(source);
      return `<svg id="d${calls.length}"></svg>`;
    };
    const input = ["# Title", "", "```mermaid", "flowchart LR", "```", "", "Middle.", "", "```mermaid", "pie", "```", ""].join("\n");
    const result = replaceMermaidFences(input, counting);
    expect(calls).toEqual(["flowchart LR", "pie"]);
    expect(result.markdown).toBe(
      [
        "# Title",
        "",
        '<div class="dawnbook-diagram"><svg id="d1"></svg></div>',
        "",
        "Middle.",
        "",
        '<div class="dawnbook-diagram"><svg id="d2"></svg></div>',
        "",
      ].join("\n"),
    );
    expect(result.blocks).toEqual([
      { source: "flowchart LR", startLine: 3 },
      { source: "pie", startLine: 9 },
    ]);
  });

  test("multi-line renderer output is joined onto one line so no blank line can end the HTML block", () => {
    const multiLine = () => "<svg>\n<style>a{}</style>\n\n<g></g>\r\n</svg>\n";
    const input = ["```mermaid", "pie", "```", ""].join("\n");
    const result = replaceMermaidFences(input, multiLine);
    expect(result.markdown).toBe(['<div class="dawnbook-diagram"><svg> <style>a{}</style> <g></g> </svg></div>', ""].join("\n"));
  });

  test("leaves a fence inside a blockquote alone (prototype scope decision)", () => {
    const input = ["> ```mermaid", "> flowchart LR", "> ```", ""].join("\n");
    const result = replaceMermaidFences(input, fakeSvg);
    expect(result.markdown).toBe(input);
    expect(result.blocks).toEqual([]);
  });
});
