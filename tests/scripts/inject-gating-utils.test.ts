import { expect, test, describe } from "bun:test";

// Re-export or test the exact escaping logic used in scripts/inject-gating.ts
function escapeHtml(unsafe: string): string {
  return unsafe.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return m;
    }
  });
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
}

describe("Inject Gating XSS Prevention Utilities", () => {
  describe("escapeHtml", () => {
    test("replaces dangerous HTML characters with safe entities", () => {
      const input = '<script>alert("XSS & test\'s")</script>';
      const output = escapeHtml(input);
      expect(output).toBe('&lt;script&gt;alert(&quot;XSS &amp; test&#39;s&quot;)&lt;/script&gt;');
    });

    test("leaves plain alphanumeric strings untouched", () => {
      const input = "Dawnbook Educational Series 2026";
      expect(escapeHtml(input)).toBe(input);
    });
  });

  describe("serializeJsonLd", () => {
    test("escapes angle brackets to prevent script breakout in JSON-LD", () => {
      const payload = {
        title: "Title with <script>alert(1)</script>",
        url: "https://dawnbook.belajarcarabelajar.com/test",
      };
      const output = serializeJsonLd(payload);
      expect(output).toContain('\\u003cscript>alert(1)\\u003c/script>');
      expect(output).not.toContain('<script>');
      const parsed = JSON.parse(output);
      expect(parsed.title).toBe("Title with <script>alert(1)</script>");
      expect(parsed.url).toBe("https://dawnbook.belajarcarabelajar.com/test");
    });

    test("does not double-quote string values in serialized JSON-LD object", () => {
      const payload = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Bab 1: Pendahuluan",
        url: "https://dawnbook.belajarcarabelajar.com/books/sample/content/01_intro",
      };
      const output = serializeJsonLd(payload);
      const parsed = JSON.parse(output);
      expect(parsed.headline).toBe("Bab 1: Pendahuluan");
      expect(parsed.url).toBe("https://dawnbook.belajarcarabelajar.com/books/sample/content/01_intro");
      expect(output).not.toContain('"\\"Bab 1: Pendahuluan\\""');
    });
  });

  describe("injected anti-FOUC script syntax", () => {
    test("injected anti-FOUC inline script is valid JavaScript syntax", () => {
      const scriptCode = '!function(){var e=window.location.pathname,t=null;try{t=sessionStorage.getItem("free_chapter_viewed")}catch(e){}if(t&&t!==e){document.documentElement.style.opacity="0",document.documentElement.style.visibility="hidden"}else{try{sessionStorage.setItem("free_chapter_viewed",e)}catch(e){}}}();';
      expect(() => new Function(scriptCode)).not.toThrow();
    });
  });
});
