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
 * Retrieves the Clerk session token for authenticated requests.
 * Clerk's `@clerk/react` exposes `useAuth().getToken()`, but since this
 * service is called outside React hooks, we read the token from Clerk's
 * session management via the global Clerk instance.
 */
async function getAuthToken(): Promise<string | null> {
  try {
    interface ClerkWindow extends Window {
      Clerk?: {
        session?: {
          getToken(): Promise<string>;
        };
      };
    }
    const clerk = (window as ClerkWindow).Clerk;
    if (clerk?.session) {
      return await clerk.session.getToken();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Service to manage book operations via the D1-backed API.
 */
export const BookService = {
  /**
   * Fetches all books from the API.
   */
  async fetchBooks(): Promise<Book[]> {
    try {
      const base = getApiBase();
      const response = await fetch(`${base}/api/books`);

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
   * Fetches a specific book including its full markdown content.
   */
  async fetchBook(slug: string): Promise<Book> {
    try {
      const base = getApiBase();
      const response = await fetch(`${base}/api/books/${slug}`);

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
   * Deletes a book via the API.
   * Requires an authenticated Clerk session.
   */
  async deleteBook(slug: string): Promise<{ success: boolean; message: string }> {
    try {
      const base = getApiBase();
      const token = await getAuthToken();

      if (!token) {
        return { success: false, message: "Authentication required. Please sign in." };
      }

      const response = await fetch(`${base}/api/books/${slug}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        return { success: false, message: "Unauthorized. Please sign in again." };
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
   * Publishes a chapter by sending the payload to the API.
   * Requires an authenticated Clerk session.
   */
  async publishChapter(payload: PublishPayload): Promise<{ success: boolean; message: string }> {
    try {
      const base = getApiBase();
      const token = await getAuthToken();

      if (!token) {
        return { success: false, message: "Authentication required. Please sign in." };
      }

      const response = await fetch(`${base}/api/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        return { success: false, message: "Unauthorized. Please sign in again." };
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
