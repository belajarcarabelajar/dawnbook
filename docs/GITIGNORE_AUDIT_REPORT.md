# Gitignore Audit Report

## Summary
- **Critical (Secrets)**: 1 Gap (Missing `.dev.vars` rule)
- **High (Tracked cruft)**: 0 Gaps (No tracked logs, backups, or archives)
- **Medium (Missing standard ignores)**: 4 Gaps (Missing `.vscode/`, `.idea/`, `coverage/`, and `.nyc_output/` at the root level)
- **Low (Redundant/Shadowed/Unsafe)**: 13 Gaps (Duplicates and shadowed rules in the root and admin `.gitignore` files)

## Existing Rules

### `/.gitignore`
- `node_modules/`: Kept
- `output/`: Kept
- `.wrangler/`: Kept
- `book/`: Kept
- `dist/`: Kept
- `.DS_Store`: Kept
- `.env`: Kept
- `.env.*`: Kept
- `*.log`: Kept (Line 9), Redundant duplicate (Line 24)
- `*.bak`: Kept (Line 10), Redundant duplicate (Line 25)
- `*.zip`: Kept (Line 11), Redundant duplicate (Line 26)
- `*.key`: Kept
- `*.pem`: Kept
- `wrangler.toml.bak`: Shadowed by `*.bak` and duplicated (Line 14, 30)
- `.agents/`: Kept
- `skills-lock.json`: Kept
- `test-clerk.js`: Kept (Line 19), Redundant duplicate (Line 34)
- `MDBOOK_SYSTEM_RULES.md`: Kept
- `test_fix.js`: Kept (Line 21), Redundant duplicate (Line 32)
- `deploy.log`: Shadowed by `*.log`
- `debug.log`: Shadowed by `*.log`
- `list.log`: Shadowed by `*.log`
- `site.zip`: Shadowed by `*.zip`
- `test.md`: Kept
- `parse_headings.js`: Kept

### `/apps/admin/.gitignore`
- `logs`: Kept (Will be moved to root)
- `*.log`: Redundant (Already in root)
- `npm-debug.log*`: Kept (Will be moved to root)
- `yarn-debug.log*`: Kept (Will be moved to root)
- `yarn-error.log*`: Kept (Will be moved to root)
- `pnpm-debug.log*`: Kept (Will be moved to root)
- `lerna-debug.log*`: Kept (Will be moved to root)
- `node_modules`: Redundant (Already in root as `node_modules/`)
- `dist`: Redundant (Already in root as `dist/`)
- `dist-ssr`: Kept (Will be moved to root)
- `*.local`: Kept (Will be moved to root)
- `.vscode/*`: Kept (Will be moved to root)
- `!.vscode/extensions.json`: Kept (Will be moved to root)
- `.idea`: Kept (Will be moved to root)
- `.DS_Store`: Redundant (Already in root)
- `*.suo`, `*.ntvs*`, `*.njsproj`, `*.sln`, `*.sw?`: Kept (Will be moved to root)

## Findings

| ID | Path or Pattern | Gap Type | Severity | Currently Tracked? | Fix | Reason |
|---|---|---|---|---|---|---|
| 1 | `.dev.vars` | Missing rule | Critical | No | Add rule | Protects Cloudflare Pages local secrets from being committed. |
| 2 | `coverage/`, `.nyc_output/` | Missing rule | Medium | No | Add rule | Standard testing caches are currently missing. |
| 3 | `.vscode/`, `.idea/` | Missing rule | Medium | No | Add rule to root | IDE configurations are currently only ignored in `apps/admin/`. |
| 4 | `*.log` | Redundant | Low | No | Remove duplicate | Rule is duplicated on line 9 and 24 in root. |
| 5 | `*.bak` | Redundant | Low | No | Remove duplicate | Rule is duplicated on line 10 and 25 in root. |
| 6 | `*.zip` | Redundant | Low | No | Remove duplicate | Rule is duplicated on line 11 and 26 in root. |
| 7 | `test_fix.js`, `test-clerk.js` | Redundant | Low | No | Remove duplicate | Ad-hoc test scripts are duplicated in root. |
| 8 | `deploy.log`, `debug.log`, `list.log` | Shadowed | Low | No | Remove rule | Perfectly shadowed by the broader `*.log` rule. |
| 9 | `wrangler.toml.bak` | Shadowed | Low | No | Remove rule | Perfectly shadowed by the broader `*.bak` rule. |
| 10 | `site.zip` | Shadowed | Low | No | Remove rule | Perfectly shadowed by the broader `*.zip` rule. |
| 11 | `apps/admin/` duplicates | Redundant | Low | No | Consolidate | `node_modules`, `dist`, `.DS_Store`, `*.log` duplicate root rules. |

## Remediation Commands

Because a previous cleanup removed the accidental `book/` directory from Git tracking, **there are currently zero tracked files that violate the ignore rules**. 

No `git rm --cached` commands are required.

To apply the proposed configuration:
1. Replace `/.gitignore` with the contents of `.gitignore.proposed`.
2. Delete `/apps/admin/.gitignore` as it has been fully consolidated into the root file.

## Limitations
- Adding a rule to `.gitignore` does NOT untrack a file that is already committed (though none were found in this audit).
- This report does not rewrite history, delete file contents, or change deploy configurations.
- Commit and push must be executed manually.
