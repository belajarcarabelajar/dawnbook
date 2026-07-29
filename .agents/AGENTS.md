# Rules Enforcement Priority

When a project explicitly mandates strict architectural guidelines (such as `MDBOOK_SYSTEM_RULES.md` for dawnbook), those local rules supersede the global token optimization rules in `GEMINI.md`.

Specifically:
- **Strict Architecture Compliance**: If a rule mandates a 1:1 Subagent-to-File ratio (e.g., Rule 7.7), you MUST NOT bypass this with a consolidated Node.js script or batch shell command, even if doing so saves tokens.
- **Role Discipline**: You must operate strictly in the capacity of the OrchestratorAgent, delegating execution to subagents via `invoke_subagent` for each file as explicitly required by the pipeline.

- **Mandatory 1:1 Subagent Delegation Rule (Rule R16)**: OrchestratorAgent MUST spawn a separate subagent via `invoke_subagent` for EVERY single chapter file (1:1 ratio). Bypassing this with batch scripts is strictly forbidden.
- **Mandatory Meta Description Rule**: Every book's `book.toml` MUST explicitly define a `description` field under `[book]` (100–160 characters). Never leave `description` missing when authoring or scaffolding any book.
- **No Em-Dash (—) Rule**: The character em-dash (`—`) is strictly forbidden in the final book output. All subagents or operations must remove it entirely, replacing it with a comma (`,`), parentheses `( )` for parenthetical explanations, a colon (`:`) for definition clauses, or a regular hyphen (`-`) for quotation attributions, or rephrasing the sentence.
- **Mandatory AI Brain Model Line-by-Line Inspection Rule (Rule R14)**: For any LaTeX task, agents MUST use the AI Agent's cognitive brain model to inspect files line-by-line. Relying on scripts (like `check-latex-support.ts`) as a formality or lazy shortcut is STRICTLY FORBIDDEN. Agents MUST follow a mandatory two-phase workflow: (1) First call `view_file` to read the file, detect all LaTeX formulas on the page, and count the total number of LaTeX instances using AI reasoning; (2) Once all instances and counts are identified, proceed with line-by-line edits directly using agentic coding tools (`view_file` and `replace_file_content`). Using automation scripts, Node batch converters, or mass search-and-replace scripts for LaTeX tasks is STRICTLY FORBIDDEN. All LaTeX formatting, fixes, and verification MUST be performed directly by the AI agent using generative AI tools. Check all inline math `$ ... $`, display math `$$ ... $$`, list item indentations, multi-letter `\text{...}` variables, underscore escaping (`_`), and context accuracy manually. Automated check scripts are ONLY post-flight verification tools, never a replacement for manual file reading with the AI brain model.
- **Zero-Failure LaTeX Decision Tree (Rule R15)**: Follow rigid IF-ELSE matrix for LaTeX rendering:
  - **Inline Math:** Standard `$ ... $` (or `\( ... \)`) in `.md`. Standard `$math$` (with NO spaces inside `$`, e.g. `$P_e$`) is recommended for native GitHub KaTeX rendering; `scripts/build.ts` automatically pre-processes `$ ... $` into `\\( ... \\)` for mdBook compilation.
  - **Display Math:** Use `$$ ... $$` in `.md`.
    - **Standalone Display Math:** Always place `$$` on its own line with blank lines before and after.
    - **Display Math Inside List Items:** Indent by 3 spaces under list items (e.g. `   $$formula$$`) to maintain ordered list hierarchy without triggering CommonMark 4-space code-block traps.
  - **MANDATORY BLANK LINES (Layout Rule):** Every standalone `$$` block MUST have a blank line BEFORE it AND a blank line AFTER it. Without blank lines, pulldown-cmark wraps the formula inside a `<p>` tag, making it render inline and scrambled.
  - **Variables:** Wrap multi-letter variables in `\text{...}` (e.g. `\text{MR}`, `\text{MC}`, `\text{PED}`, `\text{PES}`).
  - **Percentage Signs `%` — CRITICAL RULE:** The `%` character is a TeX comment delimiter. Inside ANY math block (`$ ... $` or `$$ ... $$`), it silently discards everything from `%` to end-of-line. MANDATORY: EVERY `%` inside math blocks MUST be written as `\text{\%}`. NO EXCEPTIONS.
    - ✅ CORRECT: `$ 50 \text{\%} $` and `$$ \frac{\text{\%} \Delta Q}{\text{\%} \Delta P} $$`
    - ❌ WRONG: `$ 50\% $` — `%` becomes TeX comment
    - ❌ WRONG: `$ 50% $` — raw `%` is always a TeX comment
  - **Cloudflare Rocket Loader Bypass:** Ensure `theme/head.hbs` contains `data-cfasync="false"` on MathJax script tags. Set `mathjax-support = false` in `book.toml`.
  - **CDN Edge Cache:** Ensure `output/_headers` contains `Cache-Control: no-store`. Verify edge HTML via `fetch`.
- **MANDATORY GENERATIVE AI AUDIT GATE (Rule R17):** Automated check scripts (such as `check-latex-support.ts`) are REMOVED from mandatory build blocking gates. All LaTeX inspection, formatting, and verification MUST be performed 100% by the Generative AI Agent using cognitive reasoning and line-by-line file reading (`view_file` + `replace_file_content`).
- **MathJax Navigation & Defer Execution (Rule R18):**
  - **`defer` Script Loading:** MathJax `<script>` in `theme/head.hbs` MUST use `defer` (never `async`) to guarantee execution only after the full DOM body is parsed.
  - **Automatic Sync:** Run `bun run scripts/sync-template.ts` after any change to `books/_template/theme/head.hbs`.
  - **Navigation Safety Nets:** `shared-script.js` MUST maintain `load` and `pageshow` (with `e.persisted` check for bfcache restoration) event listeners to ensure MathJax re-typesets automatically when users navigate or swipe between chapters.
- **Search Engine Bot Edge Bypass & GSC API Rule (Rule R19)**:
  - Edge middleware (`functions/_middleware.ts` & `functions/lib/gating.ts`) MUST detect Search Engine Bots via `isSearchEngineBot(userAgent)` and bypass D1 session gating with HTTP 200 OK and `Vary: User-Agent, Cookie` headers.
  - Gated chapter pages MUST include Schema.org JSON-LD with `"isAccessibleForFree": "false"` and `"hasPart": { "@type": "WebPageElement", "isAccessibleForFree": "false", "cssSelector": ".content" }` injected via `scripts/inject-gating.ts`.
  - Post-deployment workflow MUST trigger `python3 scripts/gsc_trigger_reindex.py` or `bun run scripts/seo-request-reindex.ts` to push `sitemap.xml` directly to Google Search Console API v3.


