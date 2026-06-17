# Dawnbook AI Assistant Guidelines (GEMINI)

This file contains critical architectural decisions and strict rules for the Dawnbook platform. Any AI assistant working on this repository **MUST** adhere to these rules to prevent regressions and maintain system consistency.

## 1. Centralized mdBook Templating
- **Master Template:** The file `books/_template/book.toml` is the absolute source of truth for all mdBook configurations.
- **Auto-Sync:** The `scripts/sync-template.ts` script automatically forces all other `book.toml` files to inherit configurations (like `additional-css`, `additional-js`, and `mathjax-support`) from the master template during the build process.
- **Rule:** **NEVER** manually modify `book.toml` files of individual books. If a global config change is needed, modify `books/_template/book.toml` and the build script will handle the rest.

## 2. Typography and Theme Consistency
- **Custom Fonts:** Dawnbook uses custom fonts (`Syne` for display, `Epilogue` for body) injected via `../../apps/hub/src/styles/typography.css`.
- **NO Strict Tokens:** We **DO NOT** include `tokens.css` inside the mdBook templates. `tokens.css` is strictly for the Hub app and admin dashboard. Injecting it into mdBooks will destroy the native theme capabilities (Light, Rust, Coal, Ayu, Navy) by forcing strict black/white colors.
- **Floating Header:** The `.menu-bar` floating header MUST NOT be transparent. It must seamlessly adopt the native `var(--bg)` background color dictated by the active mdBook theme.

## 3. Caching and Versioning (Disabled)
- **Zero Cache Tolerance:** The platform requires real-time updates. Cloudflare CDN caching is aggressively and permanently disabled via `_headers` using `no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0`.
- **No Cache Busting:** Because caching is disabled at the CDN level, **DO NOT** rename or version shared asset files (e.g., no `shared-header-v2.css`). Use static names (`shared-header.css` and `shared-script.js`) consistently across the project.

## 4. Spacing and Aesthetics
- **Header Spacing:** The distance between the floating header and the first title of any chapter is precisely set to `1cm` (`margin-top: 0.8cm` and `padding-top: 0.2cm`). Do not arbitrarily increase or decrease this without explicit user consent.

---
**Last Updated:** Ensure you read this file before making sweeping changes to CSS or mdBook configurations to avoid returning the project to "factory defaults" or introducing caching regressions.
