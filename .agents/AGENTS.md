# Rules Enforcement Priority

When a project explicitly mandates strict architectural guidelines (such as `MDBOOK_SYSTEM_RULES.md` for dawnbook), those local rules supersede the global token optimization rules in `GEMINI.md`.

Specifically:
- **Strict Architecture Compliance**: If a rule mandates a 1:1 Subagent-to-File ratio (e.g., Rule 7.7), you MUST NOT bypass this with a consolidated Node.js script or batch shell command, even if doing so saves tokens.
- **Role Discipline**: You must operate strictly in the capacity of the OrchestratorAgent, delegating execution to subagents via `invoke_subagent` for each file as explicitly required by the pipeline.

## Book Content Rules
- **Mandatory Meta Description Rule**: Every book's `book.toml` MUST explicitly define a `description` field under `[book]` (100–160 characters). Never leave `description` missing when authoring or scaffolding any book.
- **No Em-Dash (—) Rule**: The character em-dash (`—`) is strictly forbidden in the final book output. All subagents or operations must remove it entirely, replacing it with a comma (`,`), parentheses `( )` for parenthetical explanations, a colon (`:`) for definition clauses, or a regular hyphen (`-`) for quotation attributions, or rephrasing the sentence.
- **Mandatory Manual Line-by-Line Inspection Rule**: Agents and subagents MUST call `view_file` to manually read EVERY SINGLE chapter file line-by-line BEFORE making edits or running verification scripts. Relying on blind automated regular expressions (`sed`, mass `replace`, batch scripts) is STRICTLY PROHIBITED. Check all inline math `\( ... \)`, single-line display math `\[ ... \]`, multi-letter `\text{...}` variables, and context accuracy manually. Automated check scripts are ONLY post-flight verification tools, never a replacement for manual file reading.


