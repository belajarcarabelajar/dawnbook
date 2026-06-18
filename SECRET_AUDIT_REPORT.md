# Secret Audit Report

## Summary
- **Critical**: 1
- **High**: 0
- **Medium**: 1
- **Info**: 4
- **Total Findings**: 6

*Categories:*
- **credential**: 5
- **build-artifact**: 1
- **log**: 0

## Methodology
- **Working-Tree Scan**: Executed `git ls-files` to inventory the working tree, followed by `git grep -nIE "CLERK_SECRET_KEY|CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|CLERK_PUBLISHABLE_KEY|VITE_CLERK_PUBLISHABLE_KEY|sk_live_|sk_test_|pk_live_|pk_test_|-----BEGIN|eyJ"` for credentials. Executed `git ls-files | grep -E "\.log$|\.bak$|\.zip$|test-clerk\.js|test_fix\.js|\.env|\.dev\.vars"` for build artifacts and logs.
- **History Scan**: Executed `git log -G "<patterns>" -p --all` to search all branches and deleted commits for any historical presence of credentials or secrets that were subsequently removed.
- **Gitignore Cross-Check**: Reviewed the `.gitignore` contents to identify if any flagged artifacts or paths were missing from the ignore list.

## Findings
| ID | Path | Category | Severity | Evidence | Location | Recommended Action |
|---|---|---|---|---|---|---|
| F-001 | `scripts/deploy-website.sh` | credential | Critical | line 17 (`export CLOUDFLARE_ACCOUNT_ID=...`) | both | Remove hardcoded value, inject via env var. Remove from Git history. |
| F-002 | `books/shared-script.js` | credential | Info | line 22 (`pk_test_...`) | both | Extract to environment variable/meta tag. |
| F-003 | `functions/lib/auth.ts` | credential | Info | line 69 (`pk_test_...`) | both | Extract to environment variable. |
| F-004 | `scripts/build.ts` | credential | Info | line 125 (`pk_test_...`) | both | Extract to environment variable. |
| F-005 | `tests/helpers/mocks.ts` | credential | Info | line 16 (`pk_test_...`) | both | Replace with a placeholder string. |
| F-006 | `test_fix.js` | build-artifact | Medium | `test_fix.js` file | both | Delete file, add to `.gitignore`, purge from history. |

## Remediation Plan

### Critical
**F-001 (`scripts/deploy-website.sh`)**
- **Manual Operator Action**: Rotate the credential in the Cloudflare dashboard if applicable, and remove the hardcoded string from the script.
- **History-Removal Command**: `git filter-repo --replace-text <(echo '1ec5420a78a852fd25bc2dd915740a71==>REDACTED')`
- **.gitignore Line to Add**: N/A

### Medium
**F-006 (`test_fix.js`)**
- **Manual Operator Action**: Delete the file from the local repository and commit the deletion.
- **History-Removal Command**: `git filter-repo --invert-paths --path test_fix.js`
- **.gitignore Line to Add**: `test_fix.js`

### Info
**F-002, F-003, F-004, F-005 (Clerk Publishable Keys)**
- **Manual Operator Action**: Move the hardcoded `pk_test_` keys into `.env.local` and load them securely at runtime/build-time. No rotation is necessary for publishable keys as they are public by design.
- **History-Removal Command**: None required for Info severity.
- **.gitignore Line to Add**: N/A

## Limitations & Out-of-Scope
- **Technical Limitations**: This audit was performed using read-only access. It cannot rotate credentials in Clerk or Cloudflare dashboards, cannot rewrite remote Git history or force-push, and cannot reach external systems to verify token validity. All history-rewrite commands must be performed by an operator.
- **Out-of-Scope**: The following directories and file types were strictly excluded from the scan: `node_modules/`, `.git/` internals, `output/`, `book/`, `.wrangler/`, and binary image assets (`.png`, `.svg`).
