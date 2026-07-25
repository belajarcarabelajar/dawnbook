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

function escapeJson(unsafe: string): string {
  return JSON.stringify(unsafe).replace(/</g, "\\u003c");
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

  describe("escapeJson", () => {
    test("escapes angle brackets to prevent script breakout in JSON-LD", () => {
      const input = 'Title with <script>tag</script>';
      const output = escapeJson(input);
      expect(output).toContain('\\u003cscript>tag\\u003c/script>');
      expect(output).not.toContain('<script>');
    });

    test("returns valid JSON string encoding", () => {
      const input = 'Line 1\nLine "2"';
      const output = escapeJson(input);
      expect(JSON.parse(output)).toBe(input);
    });
  });

  describe("injected anti-FOUC script syntax", () => {
    test("injected anti-FOUC inline script is valid JavaScript syntax", () => {
      const scriptCode = '!function(){var e=window.location.pathname,t=null;try{t=sessionStorage.getItem("free_chapter_viewed")}catch(e){}if(t&&t!==e){document.documentElement.style.opacity="0",document.documentElement.style.visibility="hidden"}else{try{sessionStorage.setItem("free_chapter_viewed",e)}catch(e){}}}();';
      expect(() => new Function(scriptCode)).not.toThrow();
    });
  });
});
