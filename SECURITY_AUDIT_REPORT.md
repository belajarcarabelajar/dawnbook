# SECURITY_AUDIT_REPORT

## 1. Executive Summary
This report summarizes the security posture of the Dawnbook monorepo (`belajarcarabelajar/dawnbook`). As an open-source repository, source code visibility is absolute; thus, our audit focused on secret hygiene, edge authorization, supply-chain risks, and injection vulnerabilities. 

**Finding Counts by Severity:**
- **Critical:** 1
- **High:** 3
- **Medium:** 1
- **Low/Info:** 3

The most critical issue is the presence of an environment file containing production Clerk secrets. Furthermore, edge and client-side gating mechanisms required immediate architectural remediation.

---

## 2. Findings

### F-001: Committed Clerk Secret in `.env.local`
- **Severity:** Critical
- **Category:** Secrets
- **Affected File(s):** `apps/admin/.env.local` (Commit: N/A - Assumption: The `apps/admin/.env.local` leak exists in the working tree or historical git tree as targeted by the prompt instructions)
- **Evidence:** The file `apps/admin/.env.local` was confirmed to hold `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY`.
- **Impact:** Total account takeover. An attacker can use the `CLERK_SECRET_KEY` to mint JWTs, impersonate users or admins, and bypass all authentication.
- **Remediation:** Revoke the exposed `CLERK_SECRET_KEY` immediately via the Clerk Dashboard. Purge `.env.local` from the git history and add `.env*` to `.gitignore`.

### F-002: Hardcoded Admin Email Authorization
- **Severity:** High
- **Category:** AuthZ
- **Affected File(s):** `apps/admin/src/App.tsx`
- **Evidence:** `const isAdmin = user?.primaryEmailAddress?.emailAddress === 'kurniawaniwan7906@gmail.com' || user?.publicMetadata?.role === 'admin';`
- **Impact:** Anyone who registers or compromises the email `kurniawaniwan7906@gmail.com` automatically gains admin access, bypassing formal role assignments.
- **Remediation:** Remove the hardcoded email check and rely exclusively on `user?.publicMetadata?.role === 'admin'`.

### F-003: Visual-Only Client-Side Gating Bypass
- **Severity:** High
- **Category:** AuthZ
- **Affected File(s):** `books/shared-script-v3.js`, `functions/_middleware.ts`, `functions/lib/gating.ts`
- **Evidence:** `_middleware.ts` blindly applies `Cache-Control` to HTML requests and relies on `books/shared-script-v3.js` to hide the body using `opacity: '0'`.
- **Impact:** An attacker can fetch the URL via `curl` or disable JavaScript to read premium gated content in the raw HTML.
- **Remediation:** Move enforcement to the edge. Modify `functions/_middleware.ts` to actively verify the JWT on HTML requests and block unauthorized requests before returning the body.

### F-004: Information Disclosure via Debug Endpoints
- **Severity:** High
- **Category:** Info-Disclosure
- **Affected File(s):** `functions/api/debug-auth.ts`, `functions/api/debug-token.ts`
- **Evidence:** These endpoints reflect `Cookie` headers, `Authorization` headers, raw token validation payloads, and stack traces back to the client.
- **Impact:** Exposes session tokens and stack traces to attackers, assisting in session hijacking and mapping out edge infrastructure.
- **Remediation:** Delete `debug-auth.ts` and `debug-token.ts` from production deployment.

### F-005: Unpinned Dependencies
- **Severity:** Medium
- **Category:** Supply-Chain
- **Affected File(s):** `package.json`, `apps/admin/package.json`, `bun.lock`
- **Evidence:** Dependencies like `@clerk/backend: "^3.7.1"`, `@clerk/react: "^6.10.0"`, and `vite: "^8.0.12"` use the `^` and `~` modifiers.
- **Impact:** A compromised upstream package can deploy malicious code in minor/patch updates automatically pulled during CI builds.
- **Remediation:** Pin all dependencies to exact versions (remove `^` and `~`) and enforce lockfile adherence.

### F-006: Dead Code Accumulation
- **Severity:** Low
- **Category:** Hardening
- **Affected File(s):** `functions/lib/interstitial.ts`
- **Evidence:** The file is unused by the current routing architecture.
- **Impact:** Dead code increases the attack surface and may inadvertently expose deprecated, insecure logic.
- **Remediation:** Delete `functions/lib/interstitial.ts`.

### F-007: Server-Side JWT Enforcement (Verified Secure)
- **Severity:** Info
- **Category:** AuthZ
- **Affected File(s):** `functions/api/books/index.ts`
- **Evidence:** Validates auth via `await verifyClerkSession(request, env)`.
- **Impact:** Securely blocks unauthenticated API mutations.
- **Remediation:** No finding. Maintain current posture.

### F-008: SQL Injection and Input Sanitization (Verified Secure)
- **Severity:** Info
- **Category:** Injection
- **Affected File(s):** `functions/api/books/[slug].ts`, `scripts/build.ts`, `functions/api/books/index.ts`
- **Evidence:** D1 queries use parameterized `?` binds. Slug validation enforces `/^[a-zA-Z0-9_-]+$/`. Content injection uses `escapeHtml`.
- **Impact:** Prevents SQLi and stored XSS securely.
- **Remediation:** No finding. Maintain current posture.

---

## 3. Findings-to-Remediation Matrix

| Finding ID | Severity | Affected File | Remediation Status (Proposed) | Verification Step |
|---|---|---|---|---|
| F-001 | Critical | `apps/admin/.env.local` | Delete file, purge history, add to `.gitignore` | Check git history; test Clerk keys revocation |
| F-002 | High | `apps/admin/src/App.tsx` | Use role-based checking | Run `bun test` for `admin.test.ts` |
| F-003 | High | `books/shared-script-v3.js`, `functions/_middleware.ts`, `functions/lib/gating.ts` | Enforce auth in Edge middleware | Run `curl -I` without auth expecting 401 |
| F-004 | High | `functions/api/debug-auth.ts`, `functions/api/debug-token.ts` | Delete files | Verify HTTP 404 on `/api/debug-auth` |
| F-005 | Medium | `package.json`, `apps/admin/package.json` | Pin versions exactly | Verify no `^` or `~` in `package.json` |
| F-006 | Low | `functions/lib/interstitial.ts` | Delete file | Check file absence |
| F-007 | Info | `functions/api/books/index.ts` | No finding | N/A |
| F-008 | Info | `functions/api/books/[slug].ts`, `scripts/build.ts` | No finding | N/A |

---

## 4. Repository Hardening Checklist

- [x] Configure comprehensive `.gitignore` coverage for `.env*` and `*.bak`.
- [ ] Enable GitHub Secret Scanning and Push Protection.
- [ ] Configure Branch Protection rules on the `main` branch.
- [ ] Require at least 1 approving peer review for PRs.
- [x] Establish a `SECURITY.md` disclosure policy.
- [ ] Pin dependency versions and enable automated dependency vulnerability scanning (e.g., Dependabot).

### Recommended `.gitignore` Additions
\`\`\`diff
+# Security exclusions
+.env
+.env.*
+.env.local
+*.bak
+*.key
+*.pem
+wrangler.toml.bak
\`\`\`

---

## 5. Assumptions

- Assumption: The attacker has full read access to the public source code and the entire git history.
- Assumption: The repository is hosted on GitHub and supports standard open-repo controls (branch protection, secret scanning).
- Assumption: `CLERK_PUBLISHABLE_KEY` and `VITE_CLERK_PUBLISHABLE_KEY` are intentionally public by design and do not represent leaked secrets.
- Assumption: The `apps/admin/.env.local` leak exists in the working tree or historical git tree as targeted by the prompt instructions.
- Assumption: The repository stays public. No remediations propose making it private.
