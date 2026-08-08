import { expect, test, describe } from "bun:test";
import { escapeHtml, minifyJs, minifyCss } from "../../scripts/builder/template-engine";

describe("scripts/builder/template-engine.ts", () => {
  describe("escapeHtml", () => {
    test("escapes ampersands", () => {
      expect(escapeHtml("a & b")).toBe("a &amp; b");
    });
    test("escapes less than", () => {
      expect(escapeHtml("a < b")).toBe("a &lt; b");
    });
    test("escapes greater than", () => {
      expect(escapeHtml("a > b")).toBe("a &gt; b");
    });
    test("escapes double quotes", () => {
      expect(escapeHtml('a " b')).toBe("a &quot; b");
    });
    test("escapes single quotes", () => {
      expect(escapeHtml("a ' b")).toBe("a &#039; b");
    });
    test("escapes all HTML special characters simultaneously", () => {
      expect(escapeHtml("<script>alert('xss' & \"hack\");</script>")).toBe("&lt;script&gt;alert(&#039;xss&#039; &amp; &quot;hack&quot;);&lt;/script&gt;");
    });
    test("returns the same string if no special characters exist", () => {
      expect(escapeHtml("hello world")).toBe("hello world");
    });
    test("returns empty string when input is empty", () => {
      expect(escapeHtml("")).toBe("");
    });
  });

  describe("minifyJs", () => {
    test("removes multi-line comments", () => {
      expect(minifyJs("/* this is a comment */ const a = 1;")).toBe("const a = 1;");
      expect(minifyJs("const a = 1; /* inline */ const b = 2;")).toBe("const a = 1; const b = 2;");
    });
    test("removes single-line comments", () => {
      expect(minifyJs("// this is a comment\nconst a = 1;")).toBe("const a = 1;");
      expect(minifyJs("const a = 1;\n// another comment\nconst b = 2;")).toBe("const a = 1; const b = 2;");
    });
    test("collapses multiple spaces and newlines into a single space", () => {
      expect(minifyJs("const   a  =  \n 1;")).toBe("const a = 1;");
    });
    test("trims leading and trailing whitespace", () => {
      expect(minifyJs("  const a = 1;  ")).toBe("const a = 1;");
    });
    test("returns empty string for only comments and whitespace", () => {
      expect(minifyJs(" /* comment */ \n // another \n ")).toBe("");
    });
  });

  describe("minifyCss", () => {
    test("removes multi-line comments", () => {
      expect(minifyCss("/* this is a comment */ .cls { color: red; }")).toBe(".cls{color:red;}");
    });
    test("collapses multiple spaces and newlines into a single space", () => {
      expect(minifyCss(".cls   {  color:  \n red;  }")).toBe(".cls{color:red;}");
    });
    test("removes spaces around brackets, colons, semicolons, and commas", () => {
      expect(minifyCss(".cls { color : red ; padding : 10px , 20px ; }")).toBe(".cls{color:red;padding:10px,20px;}");
    });
    test("trims leading and trailing whitespace", () => {
      expect(minifyCss("  .cls { color: red; }  ")).toBe(".cls{color:red;}");
    });
    test("returns empty string for only comments and whitespace", () => {
      expect(minifyCss(" /* comment */ \n  \n ")).toBe("");
    });
  });
});
