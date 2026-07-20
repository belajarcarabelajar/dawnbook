import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// App already wraps its tree in <AuthProvider>; no top-level auth provider
// needed now that Clerk has been removed. The session is bootstrapped from
// the session_id cookie via /api/auth/me.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
