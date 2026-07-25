import { expect, test, describe, mock, beforeEach, afterEach } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("Shared Script Client-Side Logic Execution", () => {
  let scriptContent: string;
  let originalGlobalFetch: typeof global.fetch;

  beforeEach(() => {
    scriptContent = readFileSync(join(import.meta.dir, "../../books/shared-script.js"), "utf-8");
    originalGlobalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalGlobalFetch;
    delete (global as any).window;
    delete (global as any).document;
    delete (global as any).sessionStorage;
  });

  function setupMockWindow(pathname: string, sessionStorageData: Record<string, string> = {}) {
    const storage = new Map(Object.entries(sessionStorageData));
    const domElement = {
      style: { opacity: "1", visibility: "visible" },
      classList: { remove: mock(), add: mock() },
    };

    const createdElements: any[] = [];

    const mockDoc = {
      head: { appendChild: mock() },
      body: { appendChild: mock() },
      documentElement: domElement,
      querySelector: mock((selector: string) => {
        if (selector.includes("link")) return null;
        if (selector === ".right-buttons") return { appendChild: mock() };
        if (selector === ".sidebar") return null;
        return null;
      }),
      querySelectorAll: mock(() => []),
      createElement: mock((tag: string) => {
        const el = { tag, style: {}, classList: { add: mock(), remove: mock() }, appendChild: mock(), setAttribute: mock() };
        createdElements.push(el);
        return el;
      }),
      addEventListener: mock(),
    };

    const mockWin: any = {
      location: {
        pathname: pathname,
        href: `https://example.com${pathname}`,
        search: "",
        replace: mock(),
      },
      sessionStorage: {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => storage.set(k, v),
      },
      document: mockDoc,
      addEventListener: mock(),
      pageYOffset: 0,
    };

    (global as any).window = mockWin;
    (global as any).document = mockDoc;
    (global as any).sessionStorage = mockWin.sessionStorage;

    return { mockWin, mockDoc, createdElements, storage };
  }

  test("hides documentElement when page is gated and free_chapter_viewed is not set", async () => {
    const { mockDoc } = setupMockWindow("/books/my-book/chapter-2.html");

    global.fetch = mock(async () => new Response(JSON.stringify({ id: "user_1" }), { status: 200 }));

    // Execute script
    Function(scriptContent)();

    expect(mockDoc.documentElement.style.opacity).toBe("0");
    expect(mockDoc.documentElement.style.visibility).toBe("hidden");
  });

  test("does NOT hide documentElement when page is root index.html", async () => {
    const { mockDoc } = setupMockWindow("/books/my-book/index.html");

    global.fetch = mock(async () => new Response(JSON.stringify(null), { status: 401 }));

    Function(scriptContent)();

    expect(mockDoc.documentElement.style.opacity).toBe("1");
    expect(mockDoc.documentElement.style.visibility).toBe("visible");
  });

  test("redirects to /sign-in when user is unauthenticated on a gated page", async () => {
    const { mockWin } = setupMockWindow("/books/my-book/chapter-2.html");

    let fetchCalled = false;
    global.fetch = mock(async (url: string) => {
      if (url.includes("/api/auth/me")) {
        fetchCalled = true;
        return new Response(JSON.stringify(null), { status: 401 });
      }
      return new Response("OK");
    });

    Function(scriptContent)();

    // Allow promise microtask queue to run
    await new Promise((r) => setTimeout(r, 10));

    expect(fetchCalled).toBe(true);
    expect(mockWin.location.href).toBe("/sign-in?redirect_url=%2Fbooks%2Fmy-book%2Fchapter-2.html");
  });

  test("reveals page and calls handleCheckpoint when user is authenticated", async () => {
    const { mockWin, mockDoc } = setupMockWindow("/books/my-book/index.html");

    const fetchedUrls: string[] = [];
    global.fetch = mock(async (url: string) => {
      fetchedUrls.push(url.toString());
      if (url.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ id: "user_123" }), { status: 200 });
      }
      if (url.includes("/api/books/my-book/view")) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      if (url.includes("/api/progress")) {
        return new Response(JSON.stringify({ completed_paths: [] }), { status: 200 });
      }
      return new Response("{}");
    });

    Function(scriptContent)();

    await new Promise((r) => setTimeout(r, 10));

    expect(mockDoc.documentElement.style.opacity).toBe("1");
    expect(fetchedUrls.some((u) => u.includes("/api/auth/me"))).toBe(true);
    expect(fetchedUrls.some((u) => u.includes("/api/books/my-book/view"))).toBe(true);
  });

  test("saveProgress sends POST request to /api/progress with bookSlug and path", async () => {
    const { mockWin } = setupMockWindow("/books/my-book/chapter-1.html");

    let postPayload: any = null;
    global.fetch = mock(async (url: string, init?: RequestInit) => {
      if (url.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ id: "user_1" }));
      }
      if (url.includes("/api/progress") && init?.method === "POST") {
        postPayload = JSON.parse(init.body as string);
        return new Response(JSON.stringify({ completed_paths: ["/books/my-book/chapter-1.html"] }));
      }
      return new Response(JSON.stringify({ completed_paths: [] }));
    });

    Function(scriptContent)();

    await new Promise((r) => setTimeout(r, 10));

    expect(typeof mockWin.saveProgress).toBe("function");

    mockWin.saveProgress(true);

    await new Promise((r) => setTimeout(r, 10));

    expect(postPayload).toEqual({
      bookSlug: "my-book",
      path: "/books/my-book/chapter-1.html",
      completed_path: "/books/my-book/chapter-1.html",
    });
  });

  test("saveProgress normalizes non-.html chapter paths to .html extension", async () => {
    const { mockWin } = setupMockWindow("/books/my-book/content/01_intro");

    let postPayload: any = null;
    global.fetch = mock(async (url: string, init?: RequestInit) => {
      if (url.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ id: "user_1" }));
      }
      if (url.includes("/api/progress") && init?.method === "POST") {
        postPayload = JSON.parse(init.body as string);
        return new Response(JSON.stringify({ completed_paths: [] }));
      }
      return new Response(JSON.stringify({ completed_paths: [] }));
    });

    Function(scriptContent)();

    await new Promise((r) => setTimeout(r, 10));

    mockWin.saveProgress();

    await new Promise((r) => setTimeout(r, 10));

    expect(postPayload.path).toBe("/books/my-book/content/01_intro.html");
  });

  test("handleCheckpoint normalizes target redirect path with .html extension", async () => {
    const { mockWin } = setupMockWindow("/books/my-book/index.html");

    global.fetch = mock(async (url: string) => {
      if (url.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ id: "user_1" }));
      }
      if (url.includes("/api/books/my-book/view")) {
        return new Response(JSON.stringify({ success: true }));
      }
      if (url.includes("/api/progress")) {
        return new Response(JSON.stringify({
          path: "/books/my-book/content/02_chapter",
          completed_paths: []
        }));
      }
      return new Response("{}");
    });

    Function(scriptContent)();

    await new Promise((r) => setTimeout(r, 10));

    expect(mockWin.location.replace).toHaveBeenCalledWith("/books/my-book/content/02_chapter.html?redirected=true");
  });
});
