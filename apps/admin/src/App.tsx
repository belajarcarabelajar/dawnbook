import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useUser, Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import React, { useState, useEffect } from 'react';
import { BookService, type Book } from './services/book-service';
import './components/Dashboard.css';

function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'mdbook-theme') {
        const newTheme = (e.newValue === 'light' || e.newValue === 'rust' || e.newValue === 'ayu') ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        try { localStorage.setItem('theme', newTheme); } catch(err) { console.warn('localStorage setItem error (theme)', err); }
        document.querySelectorAll('.theme-toggle').forEach(btn => btn.setAttribute('aria-pressed', newTheme === 'light' ? 'true' : 'false'));
      }
    };
    window.addEventListener('storage', handleStorage);

    // Initial sync of ARIA state
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    document.querySelectorAll('.theme-toggle').forEach(btn => btn.setAttribute('aria-pressed', currentTheme === 'light' ? 'true' : 'false'));

    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    let currentTheme = root.getAttribute('data-theme');
    if (!currentTheme) currentTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    root.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('theme', newTheme);
      localStorage.setItem('mdbook-theme', newTheme === 'light' ? 'light' : 'coal');
    } catch(err) {
      console.warn('localStorage setItem error (theme)', err);
    }

    document.querySelectorAll('.theme-toggle').forEach(btn => btn.setAttribute('aria-pressed', newTheme === 'light' ? 'true' : 'false'));
  };

  return (
    <div className="dashboard-container">
      <button onClick={toggleTheme} className="theme-toggle-icon theme-toggle" aria-label="Toggle Theme" aria-pressed="false">
        <svg className="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        <svg className="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      </button>
      <aside className="floating-sidebar">
        <h1>Admin Portal</h1>
        <button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? 'Close Menu' : 'Open Menu'}
        </button>
        <nav className={`nav-menu ${menuOpen ? 'is-open' : ''}`} aria-label="Admin Navigation">
          <NavLink to="/" end className={({ isActive }) => `btn ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none', textAlign: 'center' }}>Dashboard</NavLink>
          <NavLink to="/books" className={({ isActive }) => `btn ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none', textAlign: 'center' }}>Manage Books</NavLink>
          <NavLink to="/editor" className={({ isActive }) => `btn ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none', textAlign: 'center' }}>Markdown Editor</NavLink>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-secondary)', margin: 'var(--spacing-md) 0' }} />
          <a href="/" className="btn" style={{ textDecoration: 'none', textAlign: 'center', backgroundColor: 'var(--color-secondary)', color: 'var(--color-text)' }}>Return to Hub</a>
        </nav>
        <div style={{ marginTop: 'var(--spacing-xl)' }}>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <SignInButton mode="modal">
                <button className="btn">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn">Sign Up</button>
              </SignUpButton>
            </div>
          </Show>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function Home() {
  return (
    <>
      <section className="card featured-card">
        <h2>Admin Dashboard</h2>
        <p>Welcome to the educational platform admin dashboard. From here, you can manage books and author new content.</p>
        <input className="input-field" type="text" placeholder="Search resources..." />
      </section>
      <section className="card">
        <h3>Statistics</h3>
        <p>Activity is monitored and visually separated into an asymmetrical layout.</p>
      </section>
    </>
  );
}

function BookManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    BookService.fetchBooks().then(setBooks);
  }, []);

  const handleDelete = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete the book "${slug}"?`)) return;
    const result = await BookService.deleteBook(slug);
    if (result.success) {
      setBooks(books.filter(b => b.slug !== slug));
    } else {
      alert(result.message);
    }
  };

  return (
    <section className="card featured-card">
      <h2>Manage Books</h2>
      <ul style={{ paddingLeft: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        {books.map(book => (
          <li key={book.slug} style={{ marginBottom: 'var(--spacing-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>{book.title}</strong> ({book.slug})</span>
            <button onClick={() => handleDelete(book.slug)} style={{ background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
          </li>
        ))}
      </ul>
      <button className="btn" onClick={() => navigate('/editor', { state: { createNew: true } })}>+ Add New Book</button>
    </section>
  );
}

function MarkdownEditor() {
  const location = useLocation();
  const [content, setContent] = useState('');
  const [selectedBook, setSelectedBook] = useState('new');
  const [newSlug, setNewSlug] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  useEffect(() => {
    BookService.fetchBooks().then(setBooks);
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).createNew) {
      setSelectedBook('new');
      setNewSlug('');
      setContent('');
      setChapterTitle('');
    }
  }, [location.state]);

  useEffect(() => {
    if (selectedBook && selectedBook !== 'new') {
      setIsLoadingContent(true);
      BookService.fetchBook(selectedBook).then(book => {
        setContent(book.content_md || '');
        setChapterTitle(book.title || '');
        setIsLoadingContent(false);
      }).catch(err => {
        console.error(err);
        setContent('');
        setIsLoadingContent(false);
      });
    } else {
      setContent('');
      setChapterTitle('');
      setNewSlug('');
    }
  }, [selectedBook]);

  const handlePublish = async () => {
    const finalSlug = selectedBook === 'new' ? newSlug : selectedBook;
    if (!finalSlug || !chapterTitle) {
      alert("Please provide a Book Slug and Title");
      return;
    }
    setIsPublishing(true);
    const result = await BookService.publishChapter({
      bookSlug: finalSlug,
      chapterTitle,
      markdownContent: content
    });
    alert(result.message);
    setIsPublishing(false);
    if (result.success && selectedBook === 'new') {
      BookService.fetchBooks().then(setBooks);
      setSelectedBook(finalSlug);
    }
  };

  return (
    <section className="card featured-card">
      <h2>Markdown Editor</h2>
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>Select Book: </label>
        <select className="input-field" value={selectedBook} onChange={e => setSelectedBook(e.target.value)}>
          <option value="new">-- Create New Book --</option>
          {books.map(book => (
            <option key={book.slug} value={book.slug}>{book.title}</option>
          ))}
        </select>
      </div>

      {selectedBook === 'new' && (
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>New Book URL Slug: </label>
          <input
            className="input-field"
            type="text"
            placeholder="e.g. my-new-book"
            value={newSlug}
            onChange={e => setNewSlug(e.target.value)}
          />
        </div>
      )}

      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>Book / Chapter Title: </label>
        <input
          className="input-field"
          type="text"
          value={chapterTitle}
          onChange={e => setChapterTitle(e.target.value)}
        />
      </div>
      <textarea
        className="input-field"
        style={{ height: '300px', marginBottom: 'var(--spacing-md)' }}
        value={content}
        onChange={e => setContent(e.target.value)}
        disabled={isLoadingContent}
        placeholder={isLoadingContent ? "Loading content..." : "Write your content here..."}
      />
      <div>
        <button
          className="btn"
          onClick={handlePublish}
          disabled={isPublishing || isLoadingContent}>
          {isPublishing ? 'Publishing...' : 'Publish / Generate'}
        </button>
      </div>
    </section>
  );
}

function NotFound() {
  return (
    <section className="card featured-card" style={{ textAlign: 'center' }}>
      <h2>404 - Not Found</h2>
      <p>The page you are looking for does not exist in the Admin Portal.</p>
      <Link to="/" className="btn" style={{ marginTop: 'var(--spacing-md)', textDecoration: 'none' }}>Return to Dashboard</Link>
    </section>
  );
}

function AdminContent() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <p>Loading...</p>;

  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.id === 'user_3FGEVcEVho4UC4uCE6gs3TfyVwV';

  if (!isAdmin) {
    return (
      <section className="card featured-card" style={{ textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access the admin portal.</p>
        <a href="/" className="btn" style={{ marginTop: 'var(--spacing-md)', textDecoration: 'none' }}>Return to Hub</a>
      </section>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/books" element={<BookManagement />} />
      <Route path="/editor" element={<MarkdownEditor />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <Layout>
        <Show when="signed-out">
          <section className="card featured-card" style={{ textAlign: 'center' }}>
            <h2>Please Sign In</h2>
            <p style={{ marginBottom: 'var(--spacing-md)' }}>You must be authenticated to access the admin dashboard.</p>
            <SignInButton mode="modal">
              <button className="btn">Sign In with Clerk</button>
            </SignInButton>
          </section>
        </Show>
        <Show when="signed-in">
          <AdminContent />
        </Show>
      </Layout>
    </BrowserRouter>
  );
}
