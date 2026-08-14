'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthChange, signInWithGoogle, signOutUser } from '@/lib/firebase';
import { api, setAccessToken, getErrorMessage } from '@/lib/axios';
import type { User } from '@/types';

const REF_KEY = 'yo1_pending_ref';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authError: string;
  clearAuthError: () => void;
  loginWithGoogle: () => Promise<void>;
  setPendingReferral: (code: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function takePendingReferral(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const code = localStorage.getItem(REF_KEY);
  if (code) localStorage.removeItem(REF_KEY);
  return code || undefined;
}

async function exchangeToken(idToken: string, method: string): Promise<void> {
  const referralCode = takePendingReferral();
  const res = await api.post('/auth/firebase', { idToken, method, referralCode });
  const { accessToken, refreshToken } = res.data.data.tokens;
  setAccessToken(accessToken);
  localStorage.setItem('yo1_access_token', accessToken);
  localStorage.setItem('yo1_refresh_token', refreshToken);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const loadUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
      setAuthError('');
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setAccessToken(localStorage.getItem('yo1_access_token'));

    const unsub = onAuthChange(async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          const method = fbUser.phoneNumber ? 'phone' : 'google';
          await exchangeToken(idToken, method);
          await loadUser();
        } catch (err) {
          setAuthError(getErrorMessage(err));
          setUser(null);
          setLoading(false);
        }
      } else {
        setAccessToken(null);
        localStorage.removeItem('yo1_access_token');
        localStorage.removeItem('yo1_refresh_token');
        setUser(null);
        setLoading(false);
      }
    });

    const fallback = setTimeout(() => {
      if (loading) {
        const token = localStorage.getItem('yo1_access_token');
        if (token) loadUser();
        else setLoading(false);
      }
    }, 1500);

    return () => {
      unsub();
      clearTimeout(fallback);
    };
  }, [loadUser]);

  const loginWithGoogle = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const setPendingReferral = useCallback((code: string) => {
    if (typeof window !== 'undefined' && code) localStorage.setItem(REF_KEY, code);
  }, []);

  const clearAuthError = useCallback(() => setAuthError(''), []);

  const logout = useCallback(async () => {
    await signOutUser();
    setAccessToken(null);
    localStorage.removeItem('yo1_access_token');
    localStorage.removeItem('yo1_refresh_token');
    setUser(null);
    setAuthError('');
  }, []);

  const value = useMemo(
    () => ({ user, loading, authError, clearAuthError, loginWithGoogle, setPendingReferral, logout }),
    [user, loading, authError, clearAuthError, loginWithGoogle, setPendingReferral, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
