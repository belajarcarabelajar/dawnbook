/**
 * apps/hub/src/scripts/hub-runtime.ts
 *
 * Standalone TypeScript client runtime for the Dawnbook Hub application.
 * Manages theme toggles, local storage, book search/filtering, book pinning,
 * and user session authentication controls.
 */

declare global {
  interface Window {
    applyLocale?: () => void;
    toggleTheme: () => void;
    toggleMenu: () => void;
    togglePin: (e: MouseEvent, slug: string) => void;
    reorderBooks: () => void;
  }
}

interface ServerBook {
  slug: string;
  title?: string;
  created_at?: string;
  subject_label?: string;
  view_count?: number;
  _parsed_created_at?: number;
}

interface AuthUser {
  id: string;
  email?: string;
  name?: string | null;
  picture?: string | null;
  role?: string;
}

function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn("localStorage get error:", error);
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("localStorage set error:", error);
  }
}

function applyTheme(theme: string): void {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
  });
}

function toggleTheme(): void {
  const root = document.documentElement;
  let currentTheme = root.getAttribute("data-theme");
  if (!currentTheme) {
    currentTheme =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
  }
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
  safeStorageSet("theme", newTheme);
  safeStorageSet("mdbook-theme", newTheme === "light" ? "light" : "coal");
}

function toggleMenu(): void {
  const navLinks = document.querySelector(".nav-links");
  if (navLinks) {
    navLinks.classList.toggle("is-open");
  }
}

function getPinned(): string[] {
  try {
    return JSON.parse(safeStorageGet("pinned_books") || "[]");
  } catch (error) {
    console.warn("getPinned parse error:", error);
    return [];
  }
}

function setPinned(arr: string[]): void {
  safeStorageSet("pinned_books", JSON.stringify(arr));
}

function togglePin(e: MouseEvent, slug: string): void {
  e.preventDefault();
  e.stopPropagation();
  let pinned = getPinned();
  if (pinned.includes(slug)) {
    pinned = pinned.filter((p) => p !== slug);
  } else {
    pinned.push(slug);
  }
  setPinned(pinned);
  reorderBooks();
}

let serverBooksData: ServerBook[] = [];

function reorderBooks(): void {
  const container = document.querySelector(".book-masonry");
  if (!container) return;
  const cards = Array.from(
    container.querySelectorAll(".book-card"),
  ) as HTMLElement[];
  const pinned = getPinned();
  const pinnedSet = new Set(pinned);
  const bookDataMap = new Map<string, ServerBook>();

  serverBooksData.forEach((b) => {
    b._parsed_created_at = b.created_at ? new Date(b.created_at).getTime() : 0;
    bookDataMap.set(b.slug, b);
  });

  const sortSelect = document.getElementById(
    "sort-select",
  ) as HTMLSelectElement | null;
  const filterSelect = document.getElementById(
    "subject-filter",
  ) as HTMLSelectElement | null;
  const searchInput = document.getElementById(
    "search-input",
  ) as HTMLInputElement | null;

  const sortVal = sortSelect ? sortSelect.value : "newest";
  const filterVal = filterSelect ? filterSelect.value : "";
  const searchVal = searchInput ? searchInput.value.toLowerCase() : "";

  cards.forEach((card) => {
    const slug = card.getAttribute("data-slug") || "";
    const bData = bookDataMap.get(slug);
    const cardSubject = bData && bData.subject_label ? bData.subject_label : "";
    const titleEl = card.querySelector("h3");
    const titleText = titleEl ? titleEl.innerText.toLowerCase() : "";

    let visible = true;
    if (filterVal && cardSubject !== filterVal) visible = false;
    if (searchVal && !titleText.includes(searchVal)) visible = false;

    card.style.display = visible ? "flex" : "none";
  });

  cards.sort((a, b) => {
    const slugA = a.getAttribute("data-slug") || "";
    const slugB = b.getAttribute("data-slug") || "";
    const aPinned = pinnedSet.has(slugA);
    const bPinned = pinnedSet.has(slugB);

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    const dataA = bookDataMap.get(slugA);
    const dataB = bookDataMap.get(slugB);

    const timeA =
      dataA && dataA._parsed_created_at
        ? dataA._parsed_created_at
        : parseInt(a.getAttribute("data-created-at") || "0", 10) || 0;
    const timeB =
      dataB && dataB._parsed_created_at
        ? dataB._parsed_created_at
        : parseInt(b.getAttribute("data-created-at") || "0", 10) || 0;

    if (sortVal === "popular" && dataA && dataB) {
      const vA = dataA.view_count || 0;
      const vB = dataB.view_count || 0;
      if (vB !== vA) return vB - vA;
    } else if (sortVal === "oldest") {
      return timeA - timeB;
    }
    // Newest default
    return timeB - timeA;
  });

  cards.forEach((card) => {
    const slug = card.getAttribute("data-slug") || "";
    const btn = card.querySelector(".pin-toggle-btn") as HTMLElement | null;
    if (pinnedSet.has(slug)) {
      card.style.borderColor = "var(--color-primary)";
      card.style.background =
        "var(--color-surface-hover, rgba(255,255,255,0.02))";
      if (btn) {
        btn.style.filter = "grayscale(0)";
        btn.style.opacity = "1";
        btn.style.transform = "scale(1.2)";
      }
    } else {
      card.style.borderColor = "";
      card.style.background = "";
      if (btn) {
        btn.style.filter = "grayscale(1)";
        btn.style.opacity = "0.3";
        btn.style.transform = "scale(1)";
      }
    }
    container.appendChild(card);
  });
}

function loadBookMetadata(): void {
  fetch("/api/books?content=false")
    .then((res) => res.json())
    .then((data: { books?: ServerBook[] }) => {
      if (data && data.books) {
        serverBooksData = data.books;
        const subjects = new Set<string>();
        data.books.forEach((b) => {
          if (b.subject_label) subjects.add(b.subject_label);
          const card = document.querySelector(
            `.book-card[data-slug="${b.slug}"]`,
          );
          if (card) {
            const viewBadge = card.querySelector(
              ".view-count-badge",
            ) as HTMLElement | null;
            const subjectWrapper = card.querySelector(
              ".subject-label-wrapper",
            ) as HTMLElement | null;
            const subjectChip = card.querySelector(
              ".subject-label-chip",
            ) as HTMLElement | null;
            if (viewBadge) {
              viewBadge.innerText = "👁 " + (b.view_count || 0);
              viewBadge.style.display = "inline-block";
            }
            if (subjectWrapper && subjectChip && b.subject_label) {
              subjectChip.innerText = b.subject_label;
              subjectWrapper.style.display = "inline-block";
              subjectWrapper.style.cursor = "pointer";
              subjectWrapper.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const filter = document.getElementById(
                  "subject-filter",
                ) as HTMLSelectElement | null;
                if (filter) {
                  filter.value = b.subject_label || "";
                  reorderBooks();
                }
              };
            }
          }
        });
        const subjectFilter = document.getElementById(
          "subject-filter",
        ) as HTMLSelectElement | null;
        if (subjectFilter) {
          const sortedSubjects = Array.from(subjects).sort();
          const frag = document.createDocumentFragment();
          sortedSubjects.forEach((sub) => {
            const opt = document.createElement("option");
            opt.value = sub;
            opt.innerText = sub;
            frag.appendChild(opt);
          });
          subjectFilter.appendChild(frag);
          subjectFilter.addEventListener("change", reorderBooks);
        }
        const sortSelect = document.getElementById("sort-select");
        if (sortSelect) sortSelect.addEventListener("change", reorderBooks);
        const searchInput = document.getElementById("search-input");
        if (searchInput) searchInput.addEventListener("input", reorderBooks);
        reorderBooks();
      }
    })
    .catch((err) => {
      console.error(err);
      reorderBooks();
    })
    .finally(() => {
      const container = document.querySelector(
        ".book-masonry",
      ) as HTMLElement | null;
      if (container) container.style.opacity = "1";
    });
}

function mountUserControls(user: AuthUser | null): void {
  const desktopEl = document.getElementById("desktop-user-controls");
  const mobileEl = document.getElementById("mobile-user-controls");

  function createSignInBtn(): HTMLElement {
    const btn = document.createElement("a");
    btn.href = "/sign-in";
    btn.style.cssText =
      "display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0 12px;border-radius:4px;border:1px solid var(--color-secondary);color:var(--color-text);text-decoration:none;font-size:0.85rem;font-weight:600;transition:background 0.15s;white-space:nowrap;";
    btn.setAttribute("data-i18n", "hub.signin");
    btn.textContent = "Sign In";
    btn.onmouseenter = () => {
      btn.style.background = "var(--color-surface)";
    };
    btn.onmouseleave = () => {
      btn.style.background = "transparent";
    };
    return btn;
  }

  function createUserPill(container: HTMLElement, showName: boolean): void {
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:relative;display:inline-block;";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.style.cssText = showName
      ? "display:inline-flex;align-items:center;gap:0.5rem;height:32px;padding:0 10px;border-radius:16px;border:1px solid var(--color-secondary);background:transparent;color:var(--color-text);cursor:pointer;font:inherit;font-size:0.85rem;font-weight:600;"
      : "display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border-radius:50%;border:1px solid var(--color-secondary);background:transparent;color:var(--color-text);cursor:pointer;font:inherit;font-size:0.85rem;font-weight:600;";

    const nameText =
      user && user.name
        ? user.name
        : user && user.email
          ? user.email.split("@")[0]
          : "Account";
    if (user && user.picture) {
      const img = document.createElement("img");
      img.src = user.picture;
      img.alt = showName ? "" : nameText;
      img.style.cssText =
        "width:24px;height:24px;border-radius:50%;object-fit:cover;";
      btn.appendChild(img);
    } else {
      const initial = document.createElement("span");
      initial.textContent = nameText.charAt(0).toUpperCase();
      initial.style.cssText =
        "width:24px;height:24px;border-radius:50%;background:var(--color-primary);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:0.8rem;";
      btn.appendChild(initial);
    }

    if (showName) {
      const lbl = document.createElement("span");
      lbl.textContent = nameText;
      btn.appendChild(lbl);
    }

    const menu = document.createElement("div");
    menu.style.cssText =
      "position:absolute;top:calc(100% + 6px);right:0;min-width:180px;background:var(--color-surface);border:1px solid var(--color-secondary);border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.1);padding:0.5rem 0;display:none;z-index:50;";
    menu.setAttribute("role", "menu");

    const link = document.createElement("a");
    link.href = "/appreciation.html";
    link.textContent = "Appreciation";
    link.style.cssText =
      "display:block;padding:0.5rem 0.9rem;color:var(--color-text);text-decoration:none;font-size:0.9rem;";
    menu.appendChild(link);

    const sep = document.createElement("div");
    sep.style.cssText =
      "height:1px;background:var(--color-secondary);margin:0.25rem 0;";
    menu.appendChild(sep);

    const out = document.createElement("button");
    out.type = "button";
    out.textContent = "Sign Out";
    out.style.cssText =
      "display:block;width:100%;text-align:left;padding:0.5rem 0.9rem;background:transparent;border:0;color:var(--color-text);cursor:pointer;font:inherit;font-size:0.9rem;";
    out.addEventListener("click", () => {
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      }).finally(() => {
        window.location.href = "/";
      });
    });
    menu.appendChild(out);

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === "block" ? "none" : "block";
    });
    document.addEventListener("click", () => {
      menu.style.display = "none";
    });

    wrap.appendChild(btn);
    wrap.appendChild(menu);
    container.appendChild(wrap);
  }

  if (user && user.id) {
    if (desktopEl) createUserPill(desktopEl, true);
    if (mobileEl) createUserPill(mobileEl, false);
  } else {
    if (desktopEl) desktopEl.appendChild(createSignInBtn());
    if (mobileEl) mobileEl.appendChild(createSignInBtn());
    if (typeof window.applyLocale === "function") window.applyLocale();
  }
}

function initUserControls(): void {
  fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((user) => {
      mountUserControls(user);
    })
    .catch((error) => {
      console.warn("initUserControls fetch error:", error);
      mountUserControls(null);
    });
}

// Initial theme setup on script execute
(function initTheme() {
  const mdTheme = safeStorageGet("mdbook-theme");
  let saved = safeStorageGet("theme");
  if (mdTheme) {
    saved =
      mdTheme === "light" || mdTheme === "rust" || mdTheme === "ayu"
        ? "light"
        : "dark";
    safeStorageSet("theme", saved);
  }
  if (
    !saved &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    saved = "light";
  }
  if (saved) document.documentElement.setAttribute("data-theme", saved);
})();

window.addEventListener("storage", (e) => {
  if (e.key === "mdbook-theme") {
    const newTheme =
      e.newValue === "light" || e.newValue === "rust" || e.newValue === "ayu"
        ? "light"
        : "dark";
    applyTheme(newTheme);
    safeStorageSet("theme", newTheme);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(currentTheme);
  reorderBooks();
  loadBookMetadata();
  initUserControls();
});

// Bind window global helpers for inline event listeners
window.toggleTheme = toggleTheme;
window.toggleMenu = toggleMenu;
window.togglePin = togglePin;
window.reorderBooks = reorderBooks;
