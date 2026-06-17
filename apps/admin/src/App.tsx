import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import React, { useState } from 'react';

// STUB: Replace with your actual Clerk Publishable Key
const PUBLISHABLE_KEY = "pk_test_placeholder_key_here";

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
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton />
          </SignedOut>
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
  // STUB: In a real implementation, this would fetch the list of books from an API or filesystem
  const dummyBooks = [
    { slug: 'piaget', title: 'Teori Perkembangan Kognitif Piaget' },
    { slug: 'new-book', title: 'A New Educational Book' }
  ];

  return (
    <div>
      <h1>Manage Books</h1>
      <ul>
        {dummyBooks.map(book => (
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

  const handlePublish = () => {
    // TODO: Implement real backend action to save markdown, update SUMMARY.md, and trigger build
    console.log(`Publishing to book: ${bookSlug}`);
    console.log(`Content: ${content}`);
    alert("STUB: Publish action triggered! Check console. In the future, this will save to the filesystem and run mdbook build.");
  };

  return (
    <div>
      <h1>Markdown Editor</h1>
      <div style={{ marginBottom: '1rem' }}>
        <label>Select Book: </label>
        <select value={bookSlug} onChange={e => setBookSlug(e.target.value)}>
          <option value="piaget">Teori Perkembangan Kognitif Piaget</option>
          <option value="new-book">A New Educational Book</option>
        </select>
      </div>
      <textarea 
        style={{ width: '100%', height: '300px', marginBottom: '1rem' }}
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <div>
        <button onClick={handlePublish} style={{ padding: '0.5rem 1rem', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px' }}>
          Publish / Generate
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <Layout>
          <SignedOut>
            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
              <h2>Please Sign In</h2>
              <p>You must be authenticated to access the admin dashboard.</p>
              <SignInButton mode="modal">
                <button style={{ padding: '0.5rem 1rem' }}>Sign In with Clerk</button>
              </SignInButton>
            </div>
          </SignedOut>
          <SignedIn>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/books" element={<BookManagement />} />
              <Route path="/editor" element={<MarkdownEditor />} />
            </Routes>
          </SignedIn>
        </Layout>
      </BrowserRouter>
    </ClerkProvider>
  );
}
