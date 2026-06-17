# Dawnbook - Educational Books Platform

Platform open-source untuk kolaborasi dan publikasi buku edukasi berbasis Markdown dan mdBook.

Welcome to Dawnbook! This is an open-source hub where many contributors can submit and publish educational books. The platform aggregates multiple books into a central hub, currently hosting texts such as **Teori Perkembangan Kognitif Piaget** and **Metakognisi**.

## Features & Architecture

This repository is a "monorepo" hosting a complete end-to-end publishing pipeline:
- **Books Directory**: The `books/` directory contains individual books (e.g., `books/piaget/`). Each book uses its own `book.toml` metadata and Markdown chapters (`src/`).
- **Generator**: Uses **mdBook** to compile Markdown chapters into HTML.
- **Edge Architecture**: Hosted on Cloudflare Pages. It uses Cloudflare Pages Functions (`functions/`) and edge middleware (`functions/_middleware.ts`) for dynamic content serving and authentication.
- **Authentication & Gating**: Integrated with **Clerk**. Chapters are dynamically gated: the first chapter is a free public preview, while subsequent chapters require a verified Clerk session.
- **Database**: Uses **Cloudflare D1** SQLite (`dawnbook-db`) to store book metadata and publishing status.
- **Automated SEO**: Includes a robust SEO validation pipeline (`scripts/check-seo.ts`), automated `sitemap.xml` generation, dynamic `X-Robots-Tag: noindex` header injection for gated chapters, and anti-FOUC loading fallbacks.
- **Admin Dashboard**: An internal SPA (`apps/admin`) built with Vite and React for managing content.

## Prerequisites

To run this platform locally, you need:
- [Bun](https://bun.sh/) (JavaScript runtime and package manager)
- [mdBook](https://rust-lang.github.io/mdBook/guide/installation.html) (Ensure the `mdbook` binary is available in your PATH)
- A [Clerk](https://clerk.com/) account for authentication keys
- A [Cloudflare](https://dash.cloudflare.com/) account for D1 database and deployment

## Local Setup

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/dawnbook.git
   cd dawnbook
   ```

2. **Environment Variables:**
   Create a `.env.local` file in the root directory and populate it with your keys:
   ```env
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   CLOUDFLARE_ACCOUNT_ID=...
   CLOUDFLARE_API_TOKEN=...
   ```

3. **Install dependencies:**
   ```sh
   bun install
   ```

4. **Initialize Local D1 Database (Optional for local testing):**
   ```sh
   npx wrangler d1 execute dawnbook-db --local --file=db/migrations/0001_init.sql
   ```

5. **Run the unified build:**
   ```sh
   bun run build
   ```
   This command discovers all books, runs LaTeX and media validation checks, builds the HTML via mdBook, generates the central Hub homepage, builds the Admin dashboard, and runs the SEO validation suite. Output is saved to the `output/` directory.

6. **View the site:**
   Run the site using Wrangler to simulate the Cloudflare Pages environment (including middleware and functions):
   ```sh
   npx wrangler pages dev output
   ```

## How to Add a New Book

1. **Scaffold the Book:**
   Copy the `books/_template` directory and give it a new name (a short, URL-friendly slug).
   ```sh
   cp -r books/_template books/my-new-book
   ```
2. **Update Metadata:**
   Open `books/my-new-book/book.toml` and change the title and authors. **Do not remove** the `additional-css` and `additional-js` fields.
3. **Write Content:**
   Add your chapters as Markdown (`.md`) files inside `books/my-new-book/src/content/`. Filenames must start with a two-digit number (e.g. `01_Pengantar.md`).
4. **Update the Table of Contents:**
   List your new chapters in `books/my-new-book/src/SUMMARY.md` so mdBook knows how to navigate them. Do not use emojis in the SUMMARY.md.

## Deployment

Deployments are handled via the deployment script which builds the project, runs D1 migrations, and pushes to Cloudflare Pages:

```sh
bash scripts/deploy-website.sh
```

Post-deployment, you can run live verification of SEO and gating rules:
```sh
bash scripts/check-seo-live.sh https://dawnbook.belajarcarabelajar.com
```

## Contributing

We use a strict GitHub-based workflow to ensure quality. Direct pushes to the `main` branch are blocked.

1. **Branch:** Create a feature branch (`git checkout -b add-chapter`).
2. **Commit:** Save your edits and run `bun run build` locally to verify they compile and pass SEO checks.
3. **Pull Request (PR):** Submit your PR to the main repository. 
4. **Review & Publish:** Once approved and merged into `main`, a CI deployment workflow automatically publishes the new site to Cloudflare Pages.
