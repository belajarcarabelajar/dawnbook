/**
 * apps/admin/src/auth/AuthProvider.tsx
 *
 * Replaces @clerk/react's ClerkProvider. Maintains the current user in a
 * React context, fetched from /api/auth/me (which reads the session_id
 * cookie). Exposes a `useAuth()` hook with the same shape we use across
 * the admin app: `{ user, isLoaded, isSignedIn, isAdmin, signIn, signOut }`.
 *
 * Initial load shows `isLoaded: false` and `isSignedIn: false`. Once the
 * /api/auth/me call settles, the context updates. A 401 response is
 * treated as "not signed in" and never throws.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: 'reader' | 'admin';
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  /** Force a refresh of the user state from /api/auth/me. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(): Promise<AuthUser | null> {
  try {
    const r = await fetch('/api/auth/me', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data || typeof data.id !== 'string') return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name ?? null,
      picture: data.picture ?? null,
      role: data.role === 'admin' ? 'admin' : 'reader',
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const u = await fetchMe();
    setUser(u);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(() => {
    // 302 to Google via the new auth flow. The redirect_url is where the
    // user lands after a successful login; default to /admin.
    const here = window.location.pathname + window.location.search;
    const redirect = here.startsWith('/admin') ? here : '/admin';
    window.location.href = `/api/auth/login?redirect_url=${encodeURIComponent(redirect)}`;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoaded,
      isSignedIn: user != null,
      isAdmin: user?.role === 'admin',
      signIn,
      signOut,
      refresh,
    }),
    [user, isLoaded, signIn, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
