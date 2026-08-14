'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import { getErrorMessage } from '@/lib/axios';
import type { CashbackItem } from '@/types';
import { formatCurrency, statusColor } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

export default function AdminQueuePage() {
  const queryClient = useQueryClient();

  const { data: queue, isLoading } = useQuery({
    queryKey: ['admin-queue'],
    queryFn: () => adminService.queue(),
  });

  const queueMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'processing' | 'completed' | 'rejected' }) =>
      adminService.updateQueueItem(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Queue</h1>
      <p className="mt-1 text-sm text-slate-500">Sequential queue — process members in order.</p>

      <div className="card mt-6 overflow-hidden">
        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Spinner className="h-8 w-8 text-brand-600" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Position</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Store</th>
                <th className="px-6 py-3">Cashback</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue?.map((item: CashbackItem & { user?: { email?: string; phone?: string } }) => (
                <tr key={item._id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-brand-50 px-2 text-sm font-bold text-brand-700">
                      #{item.position ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{item.user?.email || item.user?.phone || '—'}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{item.storeName || '—'}</td>
                  <td className="px-6 py-4 font-semibold text-accent-600">{formatCurrency(item.cashbackAmount)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {item.status === 'pending' && (
                        <button onClick={() => queueMutation.mutate({ id: item._id, status: 'processing' })} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                          Start
                        </button>
                      )}
                      {item.status === 'processing' && (
                        <button onClick={() => queueMutation.mutate({ id: item._id, status: 'completed' })} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                          Complete
                        </button>
                      )}
                      {(item.status === 'pending' || item.status === 'processing') && (
                        <button onClick={() => queueMutation.mutate({ id: item._id, status: 'rejected' })} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                          Reject
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
    </div>
  );
}
