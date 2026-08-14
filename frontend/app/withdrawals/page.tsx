'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/store/auth';
import { api, getErrorMessage } from '@/lib/axios';
import type { Withdrawal } from '@/types';
import { formatCurrency, formatDateTime, statusColor } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

export default function WithdrawalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/withdrawals');
  }, [loading, user, router]);

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => (await api.get('/withdrawals')).data.data as Withdrawal[],
    enabled: !!user,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/users/dashboard');
      return res.data.data as { walletBalance: number };
    },
    enabled: !!user,
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      return api.post('/withdrawals', { amount: Number(amount), upiId, remarks });
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Withdrawal request submitted.' });
      setAmount('');
      setRemarks('');
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => setMessage({ type: 'error', text: getErrorMessage(err) }),
  });

  if (loading || isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  if (!user) return null;

  const balance = dashboard?.walletBalance ?? user.balance;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-slate-900">Withdrawals</h1>
      <p className="mt-1 text-sm text-slate-500">Available balance: {formatCurrency(balance)}</p>

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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Request withdrawal</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Amount</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="input mt-1"
              />
              <p className="mt-1 text-xs text-slate-400">Minimum withdrawal: ₹10</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@bank"
                className="input mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Remarks (optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any note for the withdrawal"
                rows={3}
                className="input mt-1 resize-none"
              />
            </div>
            <button
              onClick={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending || !amount || !upiId}
              className="btn-primary w-full"
            >
              {withdrawMutation.isPending ? <Spinner className="h-4 w-4" /> : null}
              Submit request
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">How it works</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">1</span>
              Submit your withdrawal with your UPI ID.
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">2</span>
              Our team reviews and approves your request.
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">3</span>
              Once paid, the amount is sent to your UPI ID.
            </li>
          </ul>
        </div>
      </div>

      <div className="card mt-8 overflow-hidden">
        <h2 className="border-b border-slate-100 px-6 py-4 text-lg font-semibold text-slate-900">
          Withdrawal history
        </h2>
        {withdrawals && withdrawals.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">UPI ID</th>
                <th className="px-6 py-3">Remarks</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {withdrawals.map((w) => (
                <tr key={w._id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(w.amount)}</td>
                  <td className="px-6 py-4 text-slate-600">{w.upiId || '—'}</td>
                  <td className="px-6 py-4 text-slate-500">{w.remarks || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(w.status)}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatDateTime(w.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-10 text-center text-sm text-slate-500">No withdrawals yet.</p>
        )}
      </div>
    </div>
  );
}
