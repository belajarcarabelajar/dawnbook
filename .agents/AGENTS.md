# Rules Enforcement Priority

When a project explicitly mandates strict architectural guidelines (such as `MDBOOK_SYSTEM_RULES.md` for dawnbook), those local rules supersede the global token optimization rules in `GEMINI.md`.

Specifically:
- **Strict Architecture Compliance**: If a rule mandates a 1:1 Subagent-to-File ratio (e.g., Rule 7.7), you MUST NOT bypass this with a consolidated Node.js script or batch shell command, even if doing so saves tokens.
- **Role Discipline**: You must operate strictly in the capacity of the OrchestratorAgent, delegating execution to subagents via `invoke_subagent` for each file as explicitly required by the pipeline.

- **Mandatory 1:1 Subagent Delegation Rule (Rule R16)**: OrchestratorAgent MUST spawn a separate subagent via `invoke_subagent` for EVERY single chapter file (1:1 ratio). Bypassing this with batch scripts is strictly forbidden.
- **Mandatory Meta Description Rule**: Every book's `book.toml` MUST explicitly define a `description` field under `[book]` (100–160 characters). Never leave `description` missing when authoring or scaffolding any book.
- **No Em-Dash (—) Rule**: The character em-dash (`—`) is strictly forbidden in the final book output. All subagents or operations must remove it entirely, replacing it with a comma (`,`), parentheses `( )` for parenthetical explanations, a colon (`:`) for definition clauses, or a regular hyphen (`-`) for quotation attributions, or rephrasing the sentence.
- **Mandatory Manual Line-by-Line Inspection Rule (Rule R14)**: Agents and subagents MUST call `view_file` to manually read EVERY SINGLE chapter file line-by-line BEFORE making edits or running verification scripts. Relying on blind automated regular expressions (`sed`, mass `replace`, batch scripts) is STRICTLY PROHIBITED. Check all inline math `\( ... \)`, single-line display math `\[ ... \]`, multi-letter `\text{...}` variables, and context accuracy manually. Automated check scripts are ONLY post-flight verification tools, never a replacement for manual file reading.
- **Zero-Failure LaTeX Decision Tree (Rule R15)**: Follow rigid IF-ELSE matrix for LaTeX rendering:
  - **Inline Math:** Double-backslash `\\( ... \\)` in `.md` (escapes pulldown-cmark parenthesis stripping).
  - **Display Math:** Single-line `\\[ \text{formula} \\]` ONLY. Never multi-line split `\\[`. Never use `\begin{aligned}` with `\\` (breaks pulldown-cmark backslashes). Use separate single-line `\\[ ... \\]` equations instead. Never use `$$ ... $$` delimiters.
  - **MANDATORY BLANK LINES (Layout Rule):** Every `\\[ ... \\]` block MUST have a blank line BEFORE it AND a blank line AFTER it. Without blank lines, pulldown-cmark wraps the formula inside a `<p>` tag, making it render inline and scrambled. NO EXCEPTIONS, even after headings or list items.
  - **Variables:** Wrap multi-letter variables in `\text{...}` (e.g. `\text{MR}`, `\text{MC}`, `\text{PED}`, `\text{PES}`).
  - **Percentage Signs `%` — CRITICAL RULE (Learned from Production Bug):** The `%` character is a TeX comment delimiter. Inside ANY math block, it silently discards everything from `%` to end-of-line, including closing `\]`, causing the ENTIRE formula to be invisible on the page. No error is shown. The formula simply disappears. MANDATORY: EVERY `%` inside `\\( ... \\)` or `\\[ ... \\]` MUST be written as `\text{\%}`. NO EXCEPTIONS.
    - ✅ CORRECT: `\\( 50 \text{\%} \\)` and `\\[ \frac{\text{\%} \Delta Q}{\text{\%} \Delta P} \\]`
    - ❌ WRONG: `\\( 50\% \\)` — mdBook strips backslash, `%` becomes TeX comment
    - ❌ WRONG: `\\( 50\\% \\)` — becomes `\%` in HTML, still a TeX comment
    - ❌ WRONG: `\\( 50% \\)` — raw `%` is always a TeX comment
  - **Cloudflare Rocket Loader Bypass:** Ensure `theme/head.hbs` contains `data-cfasync="false"` on MathJax script tags. Set `mathjax-support = false` in `book.toml`.
  - **CDN Edge Cache:** Ensure `output/_headers` contains `Cache-Control: no-store`. Verify edge HTML via `fetch`.
- **MANDATORY AUDIT GATE (Rule R17):** `bun run scripts/check-latex-support.ts` MUST exit with code 0 BEFORE running `bun run build` or `bash scripts/deploy-website.sh`. If the audit fails, stop immediately, fix every `❌ [FAIL]` line manually using `view_file` + `replace_file_content`, and re-run the audit. Deploying with a failing audit is strictly forbidden.
- **MathJax Navigation & Defer Execution (Rule R18):**
  - **`defer` Script Loading:** MathJax `<script>` in `theme/head.hbs` MUST use `defer` (never `async`) to guarantee execution only after the full DOM body is parsed.
  - **Automatic Sync:** Run `bun run scripts/sync-template.ts` after any change to `books/_template/theme/head.hbs`.
  - **Navigation Safety Nets:** `shared-script.js` MUST maintain `load` and `pageshow` (with `e.persisted` check for bfcache restoration) event listeners to ensure MathJax re-typesets automatically when users navigate or swipe between chapters.


