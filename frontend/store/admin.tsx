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
import { adminApi, setAdminToken } from '@/lib/axios';
import type { AdminUser } from '@/types';

interface AdminContextValue {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('yo1_admin_access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    adminApi
      .get('/auth/me')
      .then((res) => setAdmin(res.data.data))
      .catch(() => {
        setAdminToken(null);
        localStorage.removeItem('yo1_admin_refresh_token');
        setAdmin(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await adminApi.post('/auth/admin/login', { email, password });
    const { user, tokens } = res.data.data;
    setAdminToken(tokens.accessToken);
    localStorage.setItem('yo1_admin_refresh_token', tokens.refreshToken);
    setAdmin(user);
  }, []);

  const logout = useCallback(() => {
    setAdminToken(null);
    localStorage.removeItem('yo1_admin_refresh_token');
    setAdmin(null);
  }, []);

  const value = useMemo(() => ({ admin, loading, login, logout }), [admin, loading, login, logout]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
