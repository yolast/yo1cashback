'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import { getErrorMessage } from '@/lib/axios';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer, CustomerDetail } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch],
    queryFn: () => adminService.users(debouncedSearch),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-user', selectedId],
    queryFn: () => adminService.user(selectedId as string),
    enabled: !!selectedId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminService.updateUserStatus(id, isActive),
    onSuccess: () => {
      setMessage('Customer updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => setMessage(getErrorMessage(err)),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
      <p className="mt-1 text-sm text-slate-500">Search, view, suspend, and activate customers.</p>

      {message && (
        <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">{message}</div>
      )}

      <div className="mb-4 mt-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, or customer ID..."
          className="input max-w-md"
        />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Spinner className="h-8 w-8 text-brand-600" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Email / Phone</th>
                <th className="px-6 py-3">Customer ID</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users?.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-4 font-medium text-slate-900">{u.name || '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{u.email || u.phone || '—'}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{u.customerId || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${u.isActive ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                      {u.isActive ? 'active' : 'suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatDateTime(u.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedId(u._id)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        View
                      </button>
                      {u.isActive ? (
                        <button onClick={() => statusMutation.mutate({ id: u._id, isActive: false })} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                          Suspend
                        </button>
                      ) : (
                        <button onClick={() => statusMutation.mutate({ id: u._id, isActive: true })} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedId && <CustomerModal detail={detail} loading={detailLoading} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function CustomerModal({ detail, loading, onClose }: { detail?: CustomerDetail; loading: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card max-h-[80vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Customer Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        {loading || !detail ? (
          <div className="grid place-items-center py-10">
            <Spinner className="h-6 w-6 text-brand-600" />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-900">{detail.name || '—'}</p>
              <p className="text-slate-500">{detail.email || '—'}</p>
              <p className="text-slate-500">{detail.phone || '—'}</p>
              <p className="mt-1 text-xs text-slate-400">
                Customer ID: <span className="font-mono">{detail.customerId || '—'}</span>
              </p>
              <p className="text-xs text-slate-400">Joined {formatDateTime(detail.createdAt)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Balance" value={formatCurrency(detail.wallet?.balance ?? 0)} />
              <StatBox label="Total earned" value={formatCurrency(detail.wallet?.totalEarned ?? 0)} />
              <StatBox label="Pending" value={formatCurrency(detail.wallet?.totalPending ?? 0)} />
              <StatBox label="Withdrawn" value={formatCurrency(detail.wallet?.totalWithdrawn ?? 0)} />
            </div>
            <div className="rounded-lg border border-slate-100 p-4 text-sm text-slate-600">
              <p>Orders: <span className="font-semibold">{detail.summary?.totalOrders ?? 0}</span></p>
              <p>Order value: <span className="font-semibold">{formatCurrency(detail.summary?.totalOrderValue ?? 0)}</span></p>
              <p>Completed cashback: <span className="font-semibold">{formatCurrency(detail.summary?.totalCompleted ?? 0)}</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}
