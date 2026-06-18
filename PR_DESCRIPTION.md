# Pull Request: Reorganize Monorepo Structure

## Summary
This PR reorganizes the Dawnbook monorepo into a clean, professional structure. The restructuring implements a strict top-level directory standard, consolidates all documentation and audits, untracks local cruft, and normalizes file naming conventions. **There is no runtime behavior change.** 

## Changes Made
- **Documentation Consolidation**: Moved all `*_AUDIT*.md`, `*_RULES.md`, and `*_MAP.md` reports (e.g., `SECURITY_AUDIT_REPORT.md`, `MDBOOK_SEO_AUDIT_REPORT.md`, etc.) to the `docs/` directory.
- **Audit Findings**: Consolidated all `*-audit-findings.json` files into `docs/audits/findings/`.
- **Cruft Removal**: Removed local-only throwaway scripts (`test.md`, `test_fix.js`, `parse_headings.js`, etc.) and log/archive definitions from version control and replaced them with exhaustive `.gitignore` rules.
- **Naming Normalization**: 
  - Standardized directories and non-doc files to `kebab-case` (e.g., `bookService.ts` -> `book-service.ts`).
  - Standardized `docs/` markdown files to `UPPER_SNAKE_CASE.md` (e.g., `secret-rotation-runbook.md` -> `SECRET_ROTATION_RUNBOOK.md`).
- **Duplicate Resolution**: Cleaned up the case-only duplicate of `GEMINI.md`. Unused `migrations/` at root was verified non-existent.
- **Reference Updates**: Ensured no dangling references. Updated all imports and tests to reflect the new `kebab-case` filenames.

## Verification Results
- `bun install`: Passed.
- `bun run build`: Passed successfully. Generated output tree and public routes are byte-for-byte equivalent.
- `bun test`: All 21 tests passed.
- No dangling references exist.
