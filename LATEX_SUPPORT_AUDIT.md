# LATEX_SUPPORT_AUDIT.md

## Audit Report

| File | Mechanism | Status (PASS/FAIL) | Evidence | Remediation |
|---|---|---|---|---|
| `books/_template/book.toml` | mdBook Config | FAIL | Missing `mathjax-support = true` | Added `mathjax-support = true` to `[output.html]` |
| `books/piaget/book.toml` | mdBook Config | FAIL | Missing `mathjax-support = true` | Added `mathjax-support = true` to `[output.html]` |
| `books/shared-header-v3.css` | Shared Asset | PASS | No rules hiding `.MathJax` or `.katex` nodes | None needed |
| `books/shared-script-v3.js` | Shared Asset | PASS | Gating logic doesn't strip or defer the math renderer | None needed |
| `scripts/build.ts` | Build Orchestration | PASS | Copies files properly, preserves DOM | None needed |
| `scripts/inject-gating.ts` | Post-build mutation | PASS | Head `<script>` injection doesn't block MathJax `<script>` | None needed |
| `functions/_middleware.ts` | Edge Delivery | PASS | Sets `Cache-Control: private, no-store` properly without stripping rendering scripts | None needed |
| `scripts/build.ts` (_headers CSP) | Edge Delivery | FAIL | `script-src` missing `cdnjs.cloudflare.com` and `cdn.jsdelivr.net` | Whitelisted MathJax CDNs in `script-src` of `_headers` output |
| `books/piaget/src/*.md` | Math Usage | PASS | Inline math `$ V = p \times l \times t $` properly supported by MathJax | None needed |

## Open Questions

- Should we transition to `mdbook-katex` for faster offline build rendering instead of relying on client-side MathJax fetching from CDN?
- Given that mdBook MathJax evaluates math client-side, do we want to implement server-side Math rendering via a Bun preprocessor to remove the CDN dependency completely?

## Verification

To verify the build and the LaTeX guardrail:

```bash
bun run scripts/check-latex-support.ts
bun run build
```

Expected output:
\`\`\`
✅ [PASS] _template has LaTeX support enabled.
✅ [PASS] piaget has LaTeX support enabled.
✅ [PASS] CSP _headers permits MathJax CDNs.
✅ All LaTeX support checks passed.
\`\`\`

You can manually verify rendered math by serving the output and opening:
`http://localhost:XXXX/books/piaget/Peran%20Lingkungan%20Fisik%20dalam%20Perkembangan.html`
*(Look for the $ V = p \times l \times t $ formula correctly rendered as MathJax)*
