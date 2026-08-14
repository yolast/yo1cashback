'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import { getErrorMessage } from '@/lib/axios';
import type { Withdrawal } from '@/types';
import { formatCurrency, formatDateTime, statusColor } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

export default function AdminWithdrawalsPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [message, setMessage] = useState('');

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: () => adminService.withdrawals(),
  });

  const wdMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'paid' | 'rejected' }) =>
      adminService.updateWithdrawal(id, status),
    onSuccess: () => {
      setMessage('Withdrawal updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => setMessage(getErrorMessage(err)),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Withdrawals</h1>
      <p className="mt-1 text-sm text-slate-500">Approve, reject, and mark withdrawals paid.</p>

      {message && (
        <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">{message}</div>
      )}

      <div className="card mt-6 overflow-hidden">
        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Spinner className="h-8 w-8 text-brand-600" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">UPI ID</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {withdrawals?.map((w) => (
                <tr key={w._id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-4 text-slate-600">{typeof w.user === 'object' ? w.user.email || w.user.phone : w.user}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(w.amount)}</td>
                  <td className="px-6 py-4 text-slate-600">{w.upiId || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(w.status)}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatDateTime(w.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {w.status === 'pending' && (
                        <>
                          <button onClick={() => wdMutation.mutate({ id: w._id, status: 'approved' })} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                            Approve
                          </button>
                          <button onClick={() => wdMutation.mutate({ id: w._id, status: 'rejected' })} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                            Reject
                          </button>
                        </>
                      )}
                      {w.status === 'approved' && (
                        <button onClick={() => wdMutation.mutate({ id: w._id, status: 'paid' })} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                          Mark paid
                        </button>
                      )}
                      <button onClick={() => setSelected(w)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        History
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && <WithdrawalHistoryModal withdrawal={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function WithdrawalHistoryModal({ withdrawal, onClose }: { withdrawal: Withdrawal; onClose: () => void }) {
  const history = withdrawal.statusHistory || [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card max-h-[80vh] w-full max-w-md overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Withdrawal History</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-900">{formatCurrency(withdrawal.amount)}</p>
          <p className="text-slate-500">{withdrawal.upiId || '—'}</p>
          {withdrawal.remarks && <p className="text-slate-500">“{withdrawal.remarks}”</p>}
        </div>

        <ol className="mt-4 space-y-3">
          {history.length > 0 ? (
            history.map((h, i) => (
              <li key={i} className="flex gap-3">
                <span className={`mt-0.5 inline-block h-3 w-3 shrink-0 rounded-full ${statusColor(h.status).split(' ')[0] || 'bg-slate-400'}`} />
                <div>
                  <p className="text-sm font-medium capitalize text-slate-900">{h.status}</p>
                  {h.note && <p className="text-xs text-slate-500">{h.note}</p>}
                  <p className="text-xs text-slate-400">{formatDateTime(h.at)}</p>
                </div>
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-500">No history recorded.</li>
          )}
        </ol>
      </div>
    </div>
  );
}
