'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { setSyncUser } from '@/lib/syncClient';
import { clearAuthCache, syncSettingsFromDb } from '@/lib/storageService';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const syncedSettingsFor = useRef<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      const newUser = data.user || null;
      setSyncUser(newUser?.id || null);
      setUser(newUser);
      clearAuthCache();

      // When a user logs in (or is already logged in on mount), sync all
      // settings from DB → localStorage once per user session. After this,
      // every page just reads from localStorage and gets the right values
      // — no per-page auth checks needed.
      if (newUser && syncedSettingsFor.current !== newUser.id) {
        syncedSettingsFor.current = newUser.id;
        syncSettingsFromDb().catch((e) => console.warn('Settings sync failed:', e));
      }
      if (!newUser) {
        syncedSettingsFor.current = null;
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth on mount AND whenever the route changes
  useEffect(() => {
    refreshUser();
  }, [refreshUser, pathname]);

  useEffect(() => {
    const refresh = () => { void refreshUser(); };
    window.addEventListener('online', refresh);
    return () => window.removeEventListener('online', refresh);
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setSyncUser(null);
    setUser(null);
    clearAuthCache();
    syncedSettingsFor.current = null;
  }, []);

  const value = {
    user,
    loading,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
