## 1. Scope and Method
- **HUB**: Evaluated using **built bundle** output (`output/index.html` etc.) and **source inference** via `scripts/build.ts`.
- **BOOK**: Evaluated using **built bundle** output (`output/books/piaget/`) and **source inference**.
- **ADMIN**: Evaluated using **source inference** of the React/Vite application code in `apps/admin/src/`.
- **BUILD**: Evaluated using **source inference** of `scripts/build.ts`.
- **DEPLOY**: Evaluated using **source inference** of `scripts/deploy-website.sh` and `wrangler.toml.bak`.
- **OUTPUT**: Evaluated using **built bundle** output inspection of the final `output/` directory ready for edge deployment.

## 2. Threat Model Summary
The `dawnbook` application operates as a static frontend deployed to Cloudflare Pages.
- **Trust Boundaries**: The primary trust boundary lies between the unauthenticated public internet and the Cloudflare Edge. Since there is no traditional backend server, all application code executed by users runs fully within their browser.
- **Authentication Model**: The Admin dashboard utilizes a **client-side-only** authentication model via Clerk (`<Show when="signed-in">`). There is no server enforcing access controls; authorization is strictly visual/UI-based.
- **Static Hosting Exposure**: Given the static deployment, all JavaScript bundles, assets, and routes are inherently public. Any hardcoded secrets, sensitive metadata, or privileged business logic bundled into the frontend will be exposed to all visitors, regardless of their authentication state.

## 3. Findings

### HUB
*(No specific findings originated solely from the generated Hub HTML that were not captured in BUILD).*

### BOOK
*(No specific findings originated solely from the generated Book HTML that were not captured in BUILD).*

### ADMIN
**ID:** F-ADMIN-001
**Surface:** ADMIN
**Criterion:** S1
**Severity:** Medium
**OWASP:** A01:2021 - Broken Access Control
**CWE:** CWE-284
**Evidence:** `apps/admin/src/App.tsx:53`
**Impact:** Protected components are hidden only via client-side `<Show when="signed-in">` rendering. Static JS bundles and routes remain publicly accessible. Any sensitive business logic embedded in the client bundle can be extracted by unauthenticated users.
**Recommendation:** Ensure no sensitive data or critical logic resides in the front-end bundle. Use the frontend solely for presentation, and enforce strict authorization on backend APIs.

**ID:** F-ADMIN-002
**Surface:** ADMIN
**Criterion:** S2
**Severity:** Low
**OWASP:** A05:2021 - Security Misconfiguration
**CWE:** CWE-312
**Evidence:** `apps/admin/.env.local:1`
**Impact:** Committing the `.env.local` file stores configuration values (like `VITE_CLERK_PUBLISHABLE_KEY`) directly in version control. While public keys are generally safe, this practice risks leaking future secrets such as secret API keys.
**Recommendation:** Add `.env.local` to the global `.gitignore` file and distribute environment variables via secure vaults or CI/CD secrets.

### BUILD
**ID:** F-BUILD-001
**Surface:** BUILD
**Criterion:** S3
**Severity:** High
**OWASP:** A03:2021 - Injection
**CWE:** CWE-79
**Evidence:** `scripts/build.ts:118`
**Impact:** Unescaped string interpolation (e.g., `${b.title}` and `${b.desc}`) is used to generate the Hub HTML. Malicious metadata from a book's folder or toml file will be rendered as raw HTML, resulting in a Stored XSS vulnerability.
**Recommendation:** Implement an HTML escaping utility function and wrap all interpolated user-controlled data before injecting it into the HTML strings.

**ID:** F-BUILD-002
**Surface:** BUILD
**Criterion:** S4
**Severity:** Medium
**OWASP:** A03:2021 - Injection
**CWE:** CWE-88
**Evidence:** `scripts/build.ts:35`
**Impact:** Passing directory names (`bookPath`) directly into the child process execution (`` $`mdbook build ...` ``) without sanitization poses an Argument Injection risk if a folder is maliciously named starting with a dash (e.g., `-h`).
**Recommendation:** Validate the directory name against a strict regex (e.g., `/^[a-zA-Z0-9_-]+$/`) before processing it in the build loop.

### DEPLOY
**ID:** F-DEPLOY-001
**Surface:** DEPLOY
**Criterion:** S2
**Severity:** High
**OWASP:** A07:2021 - Identification and Authentication Failures
**CWE:** CWE-798
**Evidence:** `scripts/deploy-website.sh:14`
**Impact:** The `CLOUDFLARE_ACCOUNT_ID` is hardcoded directly in the deployment shell script. Anyone with read access to the repository can use this identifier, increasing the risk of targeted attacks against the Cloudflare account.
**Recommendation:** Remove the hardcoded account ID. Inject it via the CI/CD environment or a securely managed local `.env` file.

**ID:** F-DEPLOY-002
**Surface:** DEPLOY
**Criterion:** S9
**Severity:** Medium
**OWASP:** A05:2021 - Security Misconfiguration
**CWE:** CWE-276
**Evidence:** `scripts/deploy-website.sh:15`
**Impact:** Manual deployment via `scripts/deploy-website.sh` using `--commit-dirty=true` allows unreviewed, untracked code to reach production, bypassing peer review and automated security scans entirely due to the absence of CI/CD workflows.
**Recommendation:** Remove manual deploy scripts and configure GitHub Actions (`.github/workflows/`) to enforce automated SAST testing and controlled, audited production deployments.

**ID:** F-DEPLOY-003
**Surface:** DEPLOY
**Criterion:** S5
**Severity:** Low
**OWASP:** A06:2021 - Vulnerable and Outdated Components
**CWE:** CWE-829
**Evidence:** `scripts/deploy-website.sh:15`
**Impact:** The deployment script uses `npx wrangler`, which dynamically fetches dependencies. This circumvents the `bun.lock` file, opening the deployment pipeline to supply-chain attacks if an unpinned package is compromised.
**Recommendation:** Use `bun run wrangler` to ensure execution is locked to the verified dependency graph.

### OUTPUT
**ID:** F-OUTPUT-001
**Surface:** OUTPUT
**Criterion:** S6
**Severity:** Medium
**OWASP:** A05:2021 - Security Misconfiguration
**CWE:** CWE-693
**Evidence:** Missing `_headers` file in `output/`
**Impact:** The deployed static assets lack protective HTTP headers such as `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, and `X-Content-Type-Options`, exposing users to Clickjacking and MITM threats.
**Recommendation:** Generate a Cloudflare Pages `_headers` file during the build process to strictly enforce modern security transport headers.

## 4. Risk Register
1. **F-BUILD-001** (High) - BUILD - A03:2021 - Injection
2. **F-DEPLOY-001** (High) - DEPLOY - A07:2021 - Identification and Authentication Failures
3. **F-ADMIN-001** (Medium) - ADMIN - A01:2021 - Broken Access Control
4. **F-BUILD-002** (Medium) - BUILD - A03:2021 - Injection
5. **F-DEPLOY-002** (Medium) - DEPLOY - A05:2021 - Security Misconfiguration
6. **F-OUTPUT-001** (Medium) - OUTPUT - A05:2021 - Security Misconfiguration
7. **F-ADMIN-002** (Low) - ADMIN - A05:2021 - Security Misconfiguration
8. **F-DEPLOY-003** (Low) - DEPLOY - A06:2021 - Vulnerable and Outdated Components

## 5. Prioritized Remediation Plan
1. **[F-BUILD-001]** Immediately import or implement an HTML-escape function in `scripts/build.ts` to sanitize `${b.title}` and `${b.desc}` before template string interpolation to prevent Stored XSS.
2. **[F-DEPLOY-001]** Delete the hardcoded `CLOUDFLARE_ACCOUNT_ID` in `scripts/deploy-website.sh` and transition its supply to a managed `.env` file or CI secrets vault.
3. **[F-OUTPUT-001]** Update `scripts/build.ts` to append a valid Cloudflare `_headers` file establishing a strong CSP and HSTS baseline for the `output/` directory.
4. **[F-ADMIN-001]** Perform an architectural review to ensure that `bookService.ts` and future logic never hardcodes sensitive keys or logic within the statically served Vite bundles.
5. **[F-BUILD-002]** Add a regex validation step `if (!/^[a-zA-Z0-9_-]+$/.test(entry)) continue;` in `scripts/build.ts` to neutralize argument injection risks against the `mdbook` binary.
6. **[F-DEPLOY-002]** Deprecate local bash-based deployments. Scaffold a standard `.github/workflows/deploy.yml` pipeline that strictly audits the code before deploying via Wrangler.
7. **[F-ADMIN-002]** Execute `git rm --cached apps/admin/.env.local`, commit the deletion, and append `.env.local` to the root and admin `.gitignore` files.
8. **[F-DEPLOY-003]** Replace `npx wrangler pages deploy` with `bun run wrangler pages deploy` in the deployment script to respect the `bun.lock` integrity.

## 6. Coverage Statement
*(Assumption: Evaluation was fully conducted manually across all criteria.)*

| Surface | S1 Auth | S2 Secrets | S3 XSS | S4 Injection | S5 Supply Chain | S6 Headers | S7 Exposure | S8 Storage | S9 Pipeline |
|---|---|---|---|---|---|---|---|---|---|
| **HUB** | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated |
| **BOOK** | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated |
| **ADMIN** | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated |
| **BUILD** | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated |
| **DEPLOY**| Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated |
| **OUTPUT**| Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated |
