# Security Policy

## Supported Versions

Only the latest commit on the `main` branch receives active security updates and patches.

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| Older   | :x:                |

---

## How to Report a Vulnerability Privately

We take the security of the Dawnbook platform and its users seriously. If you suspect or have identified a security flaw, **please report it privately**.

### Reporting Channels

- **Email:** Send your security findings directly to **`security@dawnbook.belajarcarabelajar.com`** (or **`iwan@dawnbook.belajarcarabelajar.com`**).
- **GitHub Private Security Advisory:** Submit a private vulnerability report via the **Security** tab of this repository under **Advisories > Report a vulnerability**.

> [!CAUTION]
> **Do NOT create public GitHub issues, pull requests, or discussions for security vulnerabilities.** Public exposure before a patch is ready puts the project and its users at risk.

---

## What Information to Include

To help us triage and resolve the issue quickly, please include as much detail as possible:

1. **Vulnerability Summary:** A clear and concise description of the flaw and its potential security impact.
2. **Steps to Reproduce:** Step-by-step instructions to demonstrate the issue (including sample payloads, `curl` commands, or Proof of Concept scripts).
3. **Target Scope:** Affected files, API endpoints, Cloudflare Pages/Functions routes, or dependencies.
4. **Environment & Configuration:** Any specific preconditions or configurations required to trigger the bug.
5. **Remediation Suggestions:** (Optional) Any proposed code changes or mitigation strategies.

---

## Scope

### In-Scope

- Server-side edge authentication and access control bypasses (`functions/_middleware.ts`, `functions/lib/gating.ts`, `functions/lib/auth.ts`).
- Information disclosure or exposed secret keys (`GOOGLE_CLIENT_SECRET`, Cloudflare D1 API tokens, database credentials).
- Session hijacking, cookie tampering (`dawnbook_session`), or token forgery in Google OAuth callback handlers (`functions/api/auth/callback.ts`).
- Injection vulnerabilities (SQL injection in Cloudflare D1 handlers, Stored or Reflected XSS).
- Remote Code Execution (RCE) or privilege escalation within Cloudflare Workers/Pages environments.
- Critical supply-chain vulnerabilities in core project dependencies.

### Out-of-Scope

- Public client-side configuration variables (e.g., `GOOGLE_CLIENT_ID`), which are intended for public client-side authentication flows.
- Publicly accessible static markdown files and open-source codebase visibility (the codebase is intentionally public).
- Denial of Service (DoS/DDoS) reports requiring massive traffic rates.
- Reports of missing HTTP headers without a practical, actionable exploit scenario.
- Theoretical vulnerabilities without a realistic impact or working Proof of Concept.

---

## Response Expectations & Policy

- **Initial Response:** We will acknowledge receipt of your vulnerability report within **48 hours**.
- **Triage & Patching:** We aim to investigate, validate, and issue a patch within **7 to 14 days** depending on severity.
- **Coordinated Disclosure:** We request a **90-day embargo period** from the initial report date before any public disclosure, allowing sufficient time for worldwide deployment of the fix.
- **Credit:** Reporters who follow responsible disclosure guidelines will be publicly acknowledged in release notes (unless anonymity is requested).

