import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import React, { useState, useEffect } from 'react';
import { BookService, type Book } from './services/bookService';
import './components/Dashboard.css';

function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const mdTheme = localStorage.getItem('mdbook-theme');
    let saved = localStorage.getItem('theme');
    if (mdTheme) {
      saved = (mdTheme === 'light' || mdTheme === 'rust') ? 'light' : 'dark';
      localStorage.setItem('theme', saved);
    }
    if (saved) document.documentElement.setAttribute('data-theme', saved);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'mdbook-theme') {
        const newTheme = (e.newValue === 'light' || e.newValue === 'rust') ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    localStorage.setItem('mdbook-theme', newTheme === 'light' ? 'light' : 'coal');
  };

  return (
    <div className="dashboard-container">
      <aside className="floating-sidebar">
        <h1>Admin Portal</h1>
        <button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? 'Close Menu' : 'Open Menu'}
        </button>
        <nav className={`nav-menu ${menuOpen ? 'is-open' : ''}`}>
          <Link to="/" className="btn" style={{ textDecoration: 'none', textAlign: 'center' }}>Dashboard</Link>
          <Link to="/books" className="btn" style={{ textDecoration: 'none', textAlign: 'center' }}>Manage Books</Link>
          <Link to="/editor" className="btn" style={{ textDecoration: 'none', textAlign: 'center' }}>Markdown Editor</Link>
          <button onClick={toggleTheme} className="btn" style={{ marginTop: '2rem' }}>Toggle Theme</button>
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

  useEffect(() => {
    // STUB: Calls the service function to fetch books
    BookService.fetchBooks().then(setBooks);
  }, []);

  return (
    <section className="card featured-card">
      <h2>Manage Books</h2>
      <ul style={{ paddingLeft: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        {books.map(book => (
          <li key={book.slug} style={{ marginBottom: 'var(--spacing-xs)' }}>
            <strong>{book.title}</strong> ({book.slug})
          </li>
        ))}
      </ul>
      <button className="btn">+ Add New Book (Stub)</button>
    </section>
  );
}

function MarkdownEditor() {
  const [content, setContent] = useState('# New Chapter\n\nWrite your content here...');
  const [bookSlug, setBookSlug] = useState('piaget');
  const [chapterTitle, setChapterTitle] = useState('New Chapter');
  const [books, setBooks] = useState<Book[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    BookService.fetchBooks().then(setBooks);
  }, []);

  const handlePublish = async () => {
    setIsPublishing(true);
    const result = await BookService.publishChapter({
      bookSlug,
      chapterTitle,
      markdownContent: content
    });
    alert(result.message);
    setIsPublishing(false);
  };

  return (
    <section className="card featured-card">
      <h2>Markdown Editor</h2>
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>Select Book: </label>
        <select className="input-field" value={bookSlug} onChange={e => setBookSlug(e.target.value)}>
          {books.map(book => (
            <option key={book.slug} value={book.slug}>{book.title}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>Chapter Title: </label>
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
      />
      <div>
        <button 
          className="btn"
          onClick={handlePublish} 
          disabled={isPublishing}>
          {isPublishing ? 'Publishing...' : 'Publish / Generate'}
        </button>
      </div>
    </section>
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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/books" element={<BookManagement />} />
            <Route path="/editor" element={<MarkdownEditor />} />
          </Routes>
        </Show>
      </Layout>
    </BrowserRouter>
  );
}
