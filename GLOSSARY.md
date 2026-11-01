# Glossary

Terms used in Dawnbook plans, specs, rules and tests. Meanings only; decisions live in `GEMINI.md` and the specs under `docs/code-plan/specs/`.

- **Diagram block:** a fenced code block in chapter Markdown whose info string starts with `mermaid`.
- **Diagram cache:** the committed per-book folder of rendered SVG files, one per distinct diagram, named by content hash.
- **Render config:** the locked Mermaid configuration plus the theme stylesheet that every diagram render uses; part of the cache key.
- **Grounded diagram:** a diagram whose every node, edge, label and number can be traced to lines of the same chapter.
- **Finding:** one candidate problem from the 2026-10-24 batch audit, identified as `<request id>:<index>`.
- **Decision file:** the per-book record of what to do with each finding and the exact edit, written during triage.
- **Triage:** the read-only stage in which an agent reads a unit's chapters and decides every finding.
- **Exact-diff guard:** the check that the files in the worktree equal the files the valid decisions predict.
- **Ledger:** the committed record of the outcome of every finding.
- **Old book:** a Dawnbook book that was live before 2026-10-21, when the new-book announcement started, and so was never announced in the Telegram group.
- **Old-book broadcast:** the daily posting of old books to the Dawnbook Telegram group, one per day, until each has been posted once.
- **Frozen queue:** the ordered list of old-book messages written once at `init` and never rebuilt by later runs.
- **In-flight send:** the record written just before a Telegram send and cleared after it; one left behind means the outcome is unknown.
- **Premium book:** a Dawnbook book listed in the premium registry; its chapters after the first open only for readers with a purchase right.
- **Premium registry:** the public file that lists premium slugs, the store product ids that unlock each, and the product page link.
- **Purchase right:** a non-revoked store entitlement of kind `unduhan` for the book's product or of kind `member` for any product, or a course allowlist row, for the reader's email.
- **Store database:** the D1 database `bcbacademy-lms`, owned by the bcb repository.
- **Private source:** the private repository that holds the premium book folders and the raw markitdown output.
- **Verbatim proof:** the token comparison between the PDF text and the joined chapters, with every allowed difference listed.
- **Store hand-off:** signing in to Dawnbook through a belajarcarabelajar.com session, carried by a short-lived signed token.
- **Hand-off token:** the signed, single-use, two-minute token that names one verified email.
- **AI crawler:** a bot that collects pages for AI models or AI answers, identified by its user agent, as opposed to a search-engine crawler.
