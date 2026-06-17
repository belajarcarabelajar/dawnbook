# Contributing to Educational Books Platform

Thank you for your interest in contributing! This platform is an open-source hub for educational books. All contributions are welcome, provided they follow our guidelines.

## Branch Protection and Review Process

- Direct pushes to the `main` branch are **restricted**.
- All changes must be submitted via a Pull Request (PR) from a fork or a feature branch.
- **Required Reviews**: Every PR requires review and approval from the repository owner before it can be merged. This ensures quality and consistency across all published books.
- Status Checks: Our automated CI workflows must pass before merging. These checks verify that all books build successfully and that any new chapters are properly referenced.

## How to Add a Chapter

1. **Find the Target Book**: Navigate to the `books/` directory and find the folder of the book you want to contribute to (e.g., `books/piaget/`).
2. **Create Markdown File**: Add your new chapter as a Markdown (`.md`) file inside the `src/` directory of that book.
3. **Register in SUMMARY**: Open `src/SUMMARY.md` in that book's folder and add a link to your new chapter. Example:
   ```markdown
   - [My New Chapter](./my-new-chapter.md)
   ```
4. **Test Locally**: Run `bun run build` to ensure your changes build cleanly.
5. **Open a PR**: Fill out the Pull Request template completely, describing your changes and confirming the originality of your work.

## How to Create a New Book

1. **Copy Template**: Copy the `books/_template` directory to `books/<your-new-book-slug>`.
2. **Configure**: Edit `book.toml` in your new directory to set the title and authors.
3. **Write Content**: Replace the `SUMMARY.md` and placeholder content in `src/` with your actual book structure and content.
4. **Open a PR**: Submit a PR to add the new book.

## License and Originality

By contributing, you confirm that your submission is your original work or you have the right to publish it, and you agree to license it under the repository's open-source license.
