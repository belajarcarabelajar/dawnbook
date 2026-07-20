export interface Book {
  slug: string;
  title: string;
  content_md?: string;
}

export interface PublishPayload {
  bookSlug: string;
  chapterTitle: string;
  markdownContent: string;
}

/**
 * Determines the base URL for API calls.
 * In production, the Pages Functions are served from the same origin.
 * In development, Vite's proxy or a local wrangler dev server can be used.
 */
function getApiBase(): string {
  return "";  // Same-origin; Pages Functions handle /api/* routes
}

/**
 * Service to manage book operations via the D1-backed API.
 *
 * Authentication is via the `session_id` cookie set by /api/auth/callback.
 * All authenticated fetches must use `credentials: 'same-origin'` so the
 * cookie is sent on cross-tab navigations from the admin app to the API.
 */
export const BookService = {
  /**
   * Fetches all books from the API. Public — no auth required.
   */
  async fetchBooks(): Promise<Book[]> {
    try {
      const base = getApiBase();
      const response = await fetch(`${base}/api/books`, {
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { books: Array<{ slug: string; title: string }> };
      return data.books.map((b) => ({ slug: b.slug, title: b.title }));
    } catch (err) {
      console.error("fetchBooks network error:", err);
      throw err;
    }
  },

  /**
   * Fetches a specific book including its full markdown content. Public.
   */
  async fetchBook(slug: string): Promise<Book> {
    try {
      const base = getApiBase();
      const response = await fetch(`${base}/api/books/${slug}`, {
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch book: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { book: Book };
      return data.book;
    } catch (err) {
      console.error(`fetchBook network error for ${slug}:`, err);
      throw err;
    }
  },

  /**
   * Deletes a book via the API. Requires an authenticated session with
   * admin role. The server reads the session_id cookie and rejects with
   * 401/403 if the caller is unauthenticated / unauthorized.
   */
  async deleteBook(slug: string): Promise<{ success: boolean; message: string }> {
    try {
      const base = getApiBase();
      const response = await fetch(`${base}/api/books/${slug}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (response.status === 401) {
        return { success: false, message: "Unauthorized. Please sign in." };
      }
      if (response.status === 403) {
        return { success: false, message: "Forbidden. Administrator access required." };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        return { success: false, message: errorData.error || `Request failed: ${response.status}` };
      }

      const result = await response.json() as { success: boolean; message: string };
      return { success: result.success, message: result.message };
    } catch (err) {
      console.error(`deleteBook network error for ${slug}:`, err);
      return { success: false, message: "Network error or server is unreachable." };
    }
  },


  /**
   * Publishes a chapter by sending the payload to the API. Requires an
   * authenticated session with admin role.
   */
  async publishChapter(payload: PublishPayload): Promise<{ success: boolean; message: string }> {
    try {
      const base = getApiBase();
      const response = await fetch(`${base}/api/books`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        return { success: false, message: "Unauthorized. Please sign in." };
      }
      if (response.status === 403) {
        return { success: false, message: "Forbidden. Administrator access required." };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        return { success: false, message: errorData.error || `Request failed: ${response.status}` };
      }

      const result = await response.json() as { success: boolean; message: string };
      return { success: result.success, message: result.message };
    } catch (err) {
      console.error("publishChapter network error:", err);
      return { success: false, message: "Network error or server is unreachable." };
    }
  },
};
