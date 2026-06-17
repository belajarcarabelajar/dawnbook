# Security Policy

## Supported Versions

Currently, only the `main` branch (latest release) is actively supported with security updates. 

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| older   | :x:                |

## Reporting a Vulnerability

We take the security of Dawnbook seriously. If you discover a vulnerability or a security flaw in the repository, please adhere to the following coordinated disclosure process.

### Contact Information

Please report any security findings by emailing `security@dawnbook.belajarcarabelajar.com` directly. Do **not** open a public issue on GitHub for security vulnerabilities, as this exposes the project to premature exploitation.

### What to Include

When reporting an issue, please include:
- A detailed description of the vulnerability and its impact.
- Steps to reproduce the issue (including any relevant POCs or curl commands).
- Affected files, dependencies, or endpoints.
- Any potential remediation strategies you suggest.

### Scope

**In Scope:**
- Server-side edge authentication bypass (`functions/_middleware.ts`).
- Information disclosure or leaked secrets (`CLERK_SECRET_KEY`, etc.).
- Supply-chain vulnerabilities in our dependencies.
- Injection flaws (SQLi in D1 endpoints, Stored XSS).

**Out of Scope:**
- Publishable keys (`VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_PUBLISHABLE_KEY`). These are public by design.
- The open-source visibility of our codebase (it is intended to be public).

### Response Expectations

We will acknowledge receipt of your vulnerability report within 48 hours and strive to provide a timeline for triage and remediation. We request a 90-day embargo period before public disclosure to give our maintainers sufficient time to remediate the issue globally.
