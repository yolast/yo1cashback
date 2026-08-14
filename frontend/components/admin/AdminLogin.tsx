'use client';

import { useState } from 'react';
import { adminApi, setAdminToken, getErrorMessage } from '@/lib/axios';
import type { AdminUser } from '@/types';
import { Spinner } from '@/components/ui/Spinner';

export function AdminLogin({ onSuccess }: { onSuccess: (admin: AdminUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.post('/auth/admin/login', { email, password });
      const { user, tokens } = res.data.data;
      setAdminToken(tokens.accessToken);
      localStorage.setItem('yo1_admin_refresh_token', tokens.refreshToken);
      onSuccess(user);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-10">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-lg font-bold text-white">
              Y1
            </span>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Admin Login</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to the YO1Cashback admin panel.</p>
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yo1cashback.com"
                className="input mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="input mt-1"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner className="h-4 w-4" /> : null}
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
