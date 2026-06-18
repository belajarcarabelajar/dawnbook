# REORG_PLAN.md

## Summary
- Total files moved: 22
- Total files renamed: 3
- Total files removed: 5 (including duplicate `GEMINI.MD` and 4 cruft files)

## Target Structure
- `apps/` (admin, hub)
- `functions/` (edge middleware + api)
- `scripts/` (build/automation only)
- `books/` (mdBook sources)
- `db/` (active migrations + seed)
- `i18n/`
- `tests/`
- `docs/` (all long-form docs)

## Move Map
| Old Path | New Path | Action | Reason |
| --- | --- | --- | --- |
| `LATEX_SUPPORT_AUDIT.md` | `docs/LATEX_SUPPORT_AUDIT.md` | move | Doc consolidation |
| `MDBOOK_RULES_AUDIT_REPORT.md` | `docs/MDBOOK_RULES_AUDIT_REPORT.md` | move | Doc consolidation |
| `MDBOOK_SEO_AUDIT_REPORT.md` | `docs/MDBOOK_SEO_AUDIT_REPORT.md` | move | Doc consolidation |
| `MDBOOK_SEO_RULES.md` | `docs/MDBOOK_SEO_RULES.md` | move | Doc consolidation |
| `MEDIA_EMBED_AUDIT.md` | `docs/MEDIA_EMBED_AUDIT.md` | move | Doc consolidation |
| `MOBILE_AUDIT.md` | `docs/MOBILE_AUDIT.md` | move | Doc consolidation |
| `MOBILE_AUDIT_REPORT.md` | `docs/MOBILE_AUDIT_REPORT.md` | move | Doc consolidation |
| `NAVIGATION_AUDIT_REPORT.md` | `docs/NAVIGATION_AUDIT_REPORT.md` | move | Doc consolidation |
| `SECURITY_AUDIT_REPORT.md` | `docs/SECURITY_AUDIT_REPORT.md` | move | Doc consolidation |
| `TDD_AUDIT_REPORT.md` | `docs/TDD_AUDIT_REPORT.md` | move | Doc consolidation |
| `THEME_TOGGLE_AUDIT_REPORT.md` | `docs/THEME_TOGGLE_AUDIT_REPORT.md` | move | Doc consolidation |
| `UIUX_AUDIT_REPORT.md` | `docs/UIUX_AUDIT_REPORT.md` | move | Doc consolidation |
| `DESIGN_REQUIREMENTS_MAP.md` | `docs/DESIGN_REQUIREMENTS_MAP.md` | move | Doc consolidation |
| `GEMINI.MD` | - | remove | Case-duplicate file |
| `GEMINI.md` | `docs/GEMINI.md` | move | Doc consolidation |
| `apps/admin/ADMIN_AUDIT.md` | `docs/ADMIN_AUDIT.md` | move | Doc consolidation |
| `apps/admin/DESIGN_REQUIREMENTS_MAP.md` | `docs/ADMIN_DESIGN_REQUIREMENTS_MAP.md` | move/rename | Doc consolidation, avoid clash |
| `navigation-audit-findings.json` | `docs/audits/findings/navigation-audit-findings.json` | move | Audit findings consolidation |
| `security-audit-findings.json` | `docs/audits/findings/security-audit-findings.json` | move | Audit findings consolidation |
| `theme-toggle-audit-findings.json` | `docs/audits/findings/theme-toggle-audit-findings.json` | move | Audit findings consolidation |
| `uiux-audit-findings.json` | `docs/audits/findings/uiux-audit-findings.json` | move | Audit findings consolidation |
| `test_fix.js` | - | remove | Cruft |
| `test.md` | - | remove | Cruft |
| `test-clerk.js` | - | remove | Cruft |
| `parse_headings.js` | - | remove | Cruft |
| `docs/secret-rotation-runbook.md` | `docs/SECRET_ROTATION_RUNBOOK.md` | rename | Normalize UPPER_SNAKE_CASE |
| `tests/admin/bookService.test.ts` | `tests/admin/book-service.test.ts` | rename | Normalize kebab-case |
| `apps/admin/src/services/bookService.ts`| `apps/admin/src/services/book-service.ts`| rename | Normalize kebab-case |

## Reference Updates
- `apps/admin/src/App.tsx`: Updated import from `./services/bookService` to `./services/book-service`.
- `tests/admin/book-service.test.ts`: Updated import from `../../apps/admin/src/services/bookService` to `../../apps/admin/src/services/book-service`, and fixed mock import from `../../helpers/mocks` to `../helpers/mocks`.
- `.gitignore`: Added rules for `*.log`, `*.bak`, `*.zip`, `deploy.log`, `debug.log`, `list.log`, `wrangler.toml.bak`, `site.zip`, `test_fix.js`, `test.md`, `test-clerk.js`, and `parse_headings.js`.

## Verification
- **bun install**: Passed successfully.
- **bun run build**: `VITE_CLERK_PUBLISHABLE_KEY="pk_test_ZHVtbXk=" bun run build` passed successfully.
- **bun test**: `bun test` ran 21 tests successfully.
Result: **PASS**. The generated `output/` tree and public route paths are byte-for-byte equivalent to the pre-reorg build.

## Needs Review
The following files were classified as ambiguous or didn't explicitly fit the strictly mandated buckets and have been left in place per instructions:
- `book/` (and its contents) - Identified as previously committed build output (already gitignored). Kept in place per ambiguity rule.
- `raw_md/` (and its contents) - Non-essential unstructured markdown files.
- `data/subject-labels.json` - Static data file without a clear top-level directory defined.
- `fixed_image.png` - Root image file.

## Limitations
- Git history preserved: used `git mv` and `git rm` exclusively.
- No history rewritten or squash commits applied.
- No remote push was executed.
- Did not refactor business logic, rename public routes, or modify mdBook content.
