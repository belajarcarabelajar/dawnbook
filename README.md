# Dawnbook - Educational Books Platform

An open-source platform for collaborating on and publishing educational books based on Markdown and mdBook.

Welcome to Dawnbook! This is an open-source hub where contributors can submit and publish educational books. The platform aggregates over 29 books into a central hub, hosting texts such as **Teori Perkembangan Kognitif Piaget**, **Metakognisi**, **Filosofi Stoikisme**, **Digital Minimalisme**, and **Quarter Life Crisis**.

## Features & Architecture

This repository is a monorepo hosting a complete end-to-end publishing pipeline:
- **Books Directory**: The `books/` directory contains individual books (e.g., `books/piaget/`). Each book uses its own `book.toml` metadata and Markdown chapters under `src/content/`.
- **Generator**: Uses **mdBook** to compile Markdown chapters into HTML.
- **Edge Architecture**: Hosted on Cloudflare Pages. It uses Cloudflare Pages Functions (`functions/`) and edge middleware (`functions/_middleware.ts`) for dynamic content serving, caching optimization, and authentication.
- **Authentication & Gating**: Self-hosted via **Cloudflare D1** + **Google OAuth**. Chapters are dynamically gated: the first chapter is a free public preview, while subsequent chapters require a verified D1 session. Visitors sign in with Google; the OAuth callback writes a `users` row (upserted on `google_sub`) and a server-side `sessions` row, then sets an HttpOnly `session_id` cookie. Unauthenticated edge requests for gated content are intercepted and redirected via `functions/_middleware.ts` to prevent bypass.
- **Database**: Uses **Cloudflare D1** SQLite (`dawnbook-db`) to store book metadata, reading progress checkpoints, completed paths per user, and the auth tables (`users`, `sessions`).
- **Automated SEO**: Includes a robust SEO validation pipeline (`scripts/check-seo.ts`), automated `sitemap.xml` generation, dynamic `X-Robots-Tag: noindex` header injection for gated chapters, and structured JSON-LD schemas.
- **Admin Dashboard**: An internal SPA (`apps/admin`) built with Vite and React for managing content.
- **Hub Site**: A vanilla JS frontend (`apps/hub`) serving as the central landing page. It features an integrated **i18n** localization system (`en` and `id`) and a dedicated `/contribute` page to honor main contributors.
- **Documentation & Audits**: The `docs/` directory contains all architectural guidelines, design requirements, and system audit reports.

## Prerequisites

To run this platform locally, you need:
- [Bun](https://bun.sh/) (JavaScript runtime and package manager)
- [mdBook](https://rust-lang.github.io/mdBook/guide/installation.html) (Ensure the `mdbook` binary is available in your PATH)
- A [Google Cloud Console](https://console.cloud.google.com/) OAuth 2.0 Client (for the "Sign in with Google" button). The authorized redirect URI must be `https://dawnbook.belajarcarabelajar.com/api/auth/callback` (and `http://localhost:8788/api/auth/callback` for local dev).
- A [Cloudflare](https://dash.cloudflare.com/) account for D1 database and deployment

## Local Setup

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/dawnbook.git
   cd dawnbook
   ```

2. **Environment Variables:**
   Auth and OAuth are configured through a single source of truth. Create a root-level `.env` file (git-ignored) for local development, and mirror the values in `.env.example`:
   
   - **Root `.env`** (used by `functions/` Pages Functions and `scripts/build.ts`):
     ```env
     GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=GOCSPX-...
     CLOUDFLARE_ACCOUNT_ID=...
     CF_API_TOKEN=...   # optional, only needed to push secrets to Cloudflare
     ```
   
   - **Cloudflare Pages dashboard** → Settings → Environment variables → Production: mirror `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` so Pages Functions can read them at the edge.
   
   See `.env.example` for the full tracked template. **Never commit your real `.env` — it is git-ignored.**

3. **Install dependencies:**
   ```sh
   bun install
   ```

4. **Initialize Local D1 Database (Optional for local testing):**
   ```sh
   npx wrangler d1 migrations apply dawnbook-db --local
   ```

5. **Run the unified build:**
   ```sh
   bun run build
   ```
   This command synchronizes configurations from the master template, runs LaTeX and media validation checks, builds HTML via mdBook for all books, generates the Hub site index pages, builds the Admin dashboard, and runs the SEO validation suite. Output is saved to the `output/` directory.

6. **View the site:**
   Run Wrangler local server to simulate the Cloudflare Pages environment (including middleware, D1 database, and pages functions):
   ```sh
   npx wrangler pages dev output
   ```

## How to Add a New Book

To maintain consistency and avoid duplicate builds, always adhere to the following workflow:

1. **Scaffold the Book:**
   Copy the `books/_template` directory and give it a new name (a short, URL-friendly kebab-case slug).
   ```sh
   cp -r books/_template books/my-new-book
   ```
2. **Update Metadata:**
   Open `books/my-new-book/book.toml` and change the title and authors. **Do not modify** the `additional-css` and `additional-js` fields directly; they are synchronized automatically from the master template `books/_template/book.toml` during the build.
3. **Write Content:**
   Add your chapters as Markdown (`.md`) files inside `books/my-new-book/src/content/`. 
   - Filenames must be zero-padded kebab-case (e.g. `01_memahami-piaget.md`, `02_konsep-dasar.md`).
   - **Important**: Delete any temporary or raw markdown files (e.g. `1.md`, `draft.md`) from the root of `src/` or `src/content/` to prevent mdBook from compiling duplicates.
4. **Update Table of Contents:**
   List your new chapters in `books/my-new-book/src/SUMMARY.md` for mdBook navigation.
   - Do not use emojis in `SUMMARY.md` headers or links.
   - Keep paths relative to `src/` (e.g., `[Chapter 1](content/01_memahami-piaget.md)`).

## Deployment

Deployments are handled via the deployment script which builds the project, runs remote D1 migrations, and publishes to Cloudflare Pages:

```sh
bash scripts/deploy-website.sh
```

Post-deployment, you can run live verification of SEO and gating rules:
```sh
bash scripts/check-seo-live.sh https://dawnbook.belajarcarabelajar.com
```

## Contributing & Pull Request Checklist

We enforce a strict workflow to guarantee quality and avoid regressions. Direct pushes to the `main` branch are blocked.

Before submitting a Pull Request, please ensure you satisfy this checklist:
1. **Builds & Compiles**: Run `bun run build` locally to verify that all books compile without errors and that SEO checks pass.
2. **All Tests Pass**: Run `bun run test:audit` to ensure all test suites pass.
3. **No Tracked Secrets**: Ensure you have not committed `.env.local` or `.dev.vars` files. Verify via `git status`.
4. **File Cleanup**: Confirm that raw or temporary draft files are removed from the books' `src/` directories.
5. **No Direct Template Edits**: Individual book configurations must remain synced with `books/_template/book.toml`.
