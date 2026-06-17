export interface Book {
  slug: string;
  title: string;
}

export interface PublishPayload {
  bookSlug: string;
  chapterTitle: string;
  markdownContent: string;
}

/**
 * Service to manage book operations.
 * Currently stubbed out with explicit TODO markers for future backend integration.
 */
export const BookService = {
  /**
   * Discovers and lists all available books in the repository.
   * TODO: Wire this to read the filesystem `books/` directory or a backend API.
   */
  async fetchBooks(): Promise<Book[]> {
    console.log("[STUB] BookService.fetchBooks called");
    // Returning mock data for now
    return [
      { slug: 'piaget', title: 'Teori Perkembangan Kognitif Piaget' },
      { slug: 'new-book', title: 'A New Educational Book (Lorem Ipsum)' }
    ];
  },

  /**
   * Writes the assembled Markdown to the correct book folder, updates that book's SUMMARY.md,
   * and triggers an mdBook build.
   * TODO: Implement real filesystem write, SUMMARY.md parsing/updating, and GitHub integration.
   */
  async publishChapter(payload: PublishPayload): Promise<{ success: boolean; message: string }> {
    console.log(`[STUB] BookService.publishChapter called for book: ${payload.bookSlug}`);
    console.log(`[STUB] Target chapter: ${payload.chapterTitle}`);
    console.log(`[STUB] Markdown payload length: ${payload.markdownContent.length} chars`);
    
    // Simulate a network/file system delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      message: `Successfully generated and saved "${payload.chapterTitle}" to ${payload.bookSlug} (STUB)`
    };
  }
};
