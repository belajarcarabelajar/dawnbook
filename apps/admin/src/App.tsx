import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import React, { useState, useEffect } from 'react';
import { BookService, type Book } from './services/bookService';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Link to="/" style={{ marginRight: '1rem' }}>Dashboard</Link>
          <Link to="/books" style={{ marginRight: '1rem' }}>Manage Books</Link>
          <Link to="/editor">Markdown Editor</Link>
        </div>
        <div>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton />
            <SignUpButton />
          </Show>
        </div>
      </header>
      <main style={{ padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}

function Home() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome to the educational platform admin dashboard. From here, you can manage books and author new content.</p>
    </div>
  );
}

function BookManagement() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    // STUB: Calls the service function to fetch books
    BookService.fetchBooks().then(setBooks);
  }, []);

  return (
    <div>
      <h1>Manage Books</h1>
      <ul>
        {books.map(book => (
          <li key={book.slug}>
            <strong>{book.title}</strong> ({book.slug})
          </li>
        ))}
      </ul>
      <button>+ Add New Book (Stub)</button>
    </div>
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
    <div>
      <h1>Markdown Editor</h1>
      <div style={{ marginBottom: '1rem' }}>
        <label>Select Book: </label>
        <select value={bookSlug} onChange={e => setBookSlug(e.target.value)}>
          {books.map(book => (
            <option key={book.slug} value={book.slug}>{book.title}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label>Chapter Title: </label>
        <input 
          type="text" 
          value={chapterTitle} 
          onChange={e => setChapterTitle(e.target.value)} 
          style={{ width: '300px' }}
        />
      </div>
      <textarea 
        style={{ width: '100%', height: '300px', marginBottom: '1rem' }}
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <div>
        <button 
          onClick={handlePublish} 
          disabled={isPublishing}
          style={{ padding: '0.5rem 1rem', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px' }}>
          {isPublishing ? 'Publishing...' : 'Publish / Generate'}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <Layout>
        <Show when="signed-out">
          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <h2>Please Sign In</h2>
            <p>You must be authenticated to access the admin dashboard.</p>
            <SignInButton mode="modal">
              <button style={{ padding: '0.5rem 1rem' }}>Sign In with Clerk</button>
            </SignInButton>
          </div>
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
