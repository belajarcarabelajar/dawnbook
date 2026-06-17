# Dawnbook - Educational Books Platform

Platform open-source untuk kolaborasi dan publikasi buku edukasi berbasis Markdown dan mdBook.

Welcome to Dawnbook! This is an open-source hub where many contributors can submit and publish educational books. The platform aggregates multiple books into a central hub, currently hosting the primary text: **Teori Perkembangan Kognitif Piaget**.

## How the Platform Works

This repository is a "monorepo", meaning it holds multiple books at once.
- The `books/` directory contains all individual books.
- Each book lives in its own folder (e.g., `books/piaget/`) and has its own `src/` folder for Markdown chapters and a `book.toml` for metadata.
- A central hub website is automatically generated to link all these books together.
- We use **mdBook** to turn your Markdown chapters into a beautiful reading experience.

## Cloning and Running Locally

To run this platform on your own computer, you need:
- [Bun](https://bun.sh/) (JavaScript runtime and package manager)
- [mdBook](https://rust-lang.github.io/mdBook/guide/installation.html) (Ensure the `mdbook` binary is available in your PATH)

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/dawnbook.git
   cd dawnbook
   ```

2. **Install dependencies:**
   ```sh
   bun install
   ```

3. **Run the unified build:**
   ```sh
   bun run build
   ```
   This command will discover all books, build them into the `output/books/` directory, and generate the central Hub homepage at `output/index.html`.

4. **View the site:**
   Open `output/index.html` in your web browser, or use a local static server like `npx serve output`.

## How to Add a New Book

1. **Scaffold the Book:**
   Copy the `books/_template` directory and give it a new name (a short, URL-friendly slug).
   ```sh
   cp -r books/_template books/my-new-book
   ```
2. **Update Metadata:**
   Open `books/my-new-book/book.toml` and change the title and authors.
3. **Write Content:**
   Add your chapters as Markdown (`.md`) files inside `books/my-new-book/src/`.
4. **Update the Table of Contents:**
   List your new chapters in `books/my-new-book/src/SUMMARY.md` so mdBook knows how to navigate them.

## Opening a Contribution (Review-to-Publish Flow)

We use a strict GitHub-based workflow to ensure quality. Direct pushes to the `main` branch are blocked.

1. **Fork or Branch:** Create a feature branch for your changes (`git checkout -b add-chapter`).
2. **Commit:** Save your Markdown edits and run `bun run build` locally to verify they compile.
3. **Open a Pull Request (PR):** Submit your PR to the main repository. Fill out the provided PR template.
4. **Validation:** Our automated GitHub Actions will instantly verify that all books build without errors and that your chapters are correctly linked.
5. **Review:** The repository owner (via `CODEOWNERS`) will review your submission.
6. **Publish:** Once approved and merged into `main`, a deployment workflow automatically publishes the new site to Cloudflare Pages.

## Admin Dashboard

A foundational Admin Dashboard application is located in `apps/admin`. It is built with Vite, React, and TypeScript, and includes stubs for Clerk authentication and a Markdown editor.
To run the dashboard:
```sh
cd apps/admin
bun dev
```

For more details on contributing, please see [CONTRIBUTING.md](CONTRIBUTING.md).
