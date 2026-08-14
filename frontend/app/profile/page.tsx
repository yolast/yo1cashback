'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/store/auth';
import { api, getErrorMessage } from '@/lib/axios';
import { Spinner } from '@/components/ui/Spinner';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/profile');
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: async () => {
      return api.patch('/users/profile', { name, phone, email });
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Profile updated.' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => setMessage({ type: 'error', text: getErrorMessage(err) }),
  });

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
      <p className="mt-1 text-sm text-slate-500">Update your personal details.</p>

      {message && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="card mt-6 max-w-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Mobile</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="input mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input mt-1"
            />
          </div>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary w-full">
            {mutation.isPending ? <Spinner className="h-4 w-4" /> : null}
            Save changes
          </button>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-500">
          <p>Customer ID: <span className="font-mono font-semibold text-slate-800">{user.customerId || '—'}</span></p>
        </div>
      </div>
    </div>
  );
}
