# Spec: Premium follow-ups (bcb sign-in hand-off, AI crawler policy, small hardening)

- **Status:** Draft
- **Date:** 2026-11-01
- **Path:** Architectural (a new sign-in path that spans two repositories and a shared secret)
- **Related:** `docs/code-plan/specs/2026-11-01-dawnbook-premium-ebooks-design.md`, its debt list D2, D4, D5, D11 and review note N3

## Problem Statement

Premium Dawnbooks open for buyers who sign in with Google using their purchase email. Buyers whose purchase email is not a Google account cannot read what they paid for. Separately, verified AI crawlers read every gated chapter of the free books, which the owner does not want, and three small hardening findings from the premium reviews are still open.

## Solution

A second sign-in button on Dawnbook, "Masuk lewat akun belajarcarabelajar.com", sends the reader to the store, which already signs buyers in by email code or Google. The store hands the verified email back to Dawnbook in a short-lived signed token, and Dawnbook starts a normal session for that email, so the premium check works as before. AI crawlers are treated like anonymous visitors on gated chapters; search engines keep their access. The small fixes close the remaining review notes.

## User Stories

1. As a buyer whose purchase email is not a Google account, I want to sign in to Dawnbook through my belajarcarabelajar.com account, so that I can read the premium books I bought.
2. As a buyer already signed in on belajarcarabelajar.com, I want the hand-off to skip the store login, so that one click brings me back to the chapter.
3. As a buyer who first used the store hand-off and later signs in with Google under the same email, I want both to reach the same Dawnbook account, so that my reading progress stays in one place.
4. As a reader on the 403 "Belum punya akses" page, I want the store sign-in offered there too, so that I can retry with my purchase email.
5. As the owner, I want a hand-off token to be useless after two minutes or after one use, so that a leaked URL cannot sign anyone in.
6. As the owner, I want the store to redirect only to Dawnbook paths, so that the new route is not an open redirect.
7. As the owner, I want the hand-off to fail closed with a clear message when the shared secret is missing, so that a misconfiguration never signs in the wrong person.
8. As the owner, I want verified AI crawlers to see only chapter 1 of free books, so that gated chapters are not harvested for AI training.
9. As the owner, I want search engines to keep indexing gated free chapters, so that search traffic does not drop.
10. As a maintainer, I want the API data layer, the path policy and the bot response headers to hold even if a caller is careless, so that the earlier leak fixes do not regress.

## Implementation Decisions

- **Modules:**
  - Store (bcb `apps/situs`): a hand-off route that requires the store session and redirects to Dawnbook with a token; a pure token helper next to the existing signed download links.
  - Dawnbook: a hand-off endpoint that verifies the token, matches or creates the user by email, records the token as used, and starts a session; the sign-in page and the premium 403 page gain the store button; the Google callback links an account that the hand-off created.
  - Dawnbook gating: an AI-crawler classifier used by the middleware's bot pass-through.
- **Interfaces:** token text `base64url(email).exp.nonce.signature`; the signature is HMAC-SHA256 over `dawnbook-sso|<email>|<exp>|<nonce>` with the shared secret; `exp` is Unix seconds at most 120 seconds ahead; `nonce` is 16 random bytes in base64url.
- **Schema:** no migration. A user created by the hand-off gets `google_sub = "bcb:<email>"` (the column is NOT NULL UNIQUE). Used nonces are rows in the existing `rate_limits` table with an expiry.
- **Contracts:**
  - Store route `GET /masuk-dawnbook?next=<path>`: without a store session it redirects to `/login?next=/masuk-dawnbook?next=...` (the existing validator accepts it); with a session it answers 303 to `https://dawnbook.belajarcarabelajar.com/api/auth/bcb?t=<token>&next=<path>`; `next` must be a same-site path by the store's `jalurKembaliAman` rules or it becomes `/`; without the secret it answers 503.
  - Dawnbook `GET /api/auth/bcb?t=&next=`: valid, fresh, unused token gives a session cookie and 302 to the safe `next`; anything else gives 302 to `/sign-in?error=<code>` (`sso_unavailable` without the secret, `sso_invalid` otherwise). All responses `no-store`.
  - Google callback: when no user has the Google `sub` but a user has the email with `google_sub` starting `bcb:`, that row is linked (its `google_sub` becomes the Google `sub`); an email held by another Google `sub` is refused with `account_conflict`.
  - AI crawlers: a verified bot whose user agent matches the AI list does not get the pass-through.
- **Architecture:** the hand-off reuses the store's proven email-code and Google sign-in instead of adding email sending to Dawnbook. The token is short-lived, single-use and bound to one email; the redirect target is fixed in code. The secret is entered by the owner on both sides (`DAWNBOOK_SSO_RAHASIA` in the store Worker, `BCB_SSO_SECRET` in Dawnbook Pages), at least 32 characters.

## Testing Decisions

- **What a good test is here:** it drives the route or function with a request and checks status, headers and the resulting session or user row, so it fails when a wrong person is signed in or a right person is refused.

| Seam | What it catches | What it misses |
|---|---|---|
| Store token helper (pure) | wrong signature, expiry, email normalisation | cross-repo format drift; covered by a shared fixture token checked on both sides |
| Store route handler | no session, bad `next`, missing secret, redirect target | real login flow; covered by the owner's live test |
| Dawnbook hand-off endpoint with fake D1 | bad, expired, reused token; new vs existing user; safe `next`; missing secret | real D1; covered by the live test |
| Google callback with fake D1 | linking a `bcb:` user, conflict on another sub | real Google; unchanged |
| Middleware with a verified AI bot | pass-through denied for AI, kept for search engines | real reverse DNS; unchanged |

- **Prior art:** bcb `packages/data/src/akun/tautan-unduh.ts` and its tests; Dawnbook `tests/functions/middleware.test.ts`, `tests/functions/api/auth/*`.

## Glossary

- **Store hand-off:** signing in to Dawnbook through a belajarcarabelajar.com session, carried by a short-lived signed token.
- **Hand-off token:** the signed, single-use, two-minute token that names one verified email.
- **AI crawler:** a bot that collects pages for AI models or AI answers, identified by its user agent (GPTBot, ClaudeBot, PerplexityBot, CCBot, Bytespider and the like), as opposed to a search-engine crawler.

## Out of Scope

- Email sending from Dawnbook itself.
- Changing `robots.txt`.
- Merging the two user tables of the store and Dawnbook.

## Further Notes

- The owner enters the shared secret in both places; deploys of both projects and merges are the owner's request.
- A shared fixture (one token signed with a test secret) is checked by both repositories' tests so the two implementations cannot drift.

## Approval

| Gate | Answer | Date |
|---|---|---|
| Login OTP | Via belajarcarabelajar.com | 2026-11-01 |
| Crawler AI | AI crawlers: chapter 1 only | 2026-11-01 |
| `Intent` | Lock intent | 2026-11-01 |
| `Section` 1 to 3 | Approve | 2026-11-01 |
| `Spec` | pending | |
