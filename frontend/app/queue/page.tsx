'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/store/auth';
import { queueService } from '@/services';
import { formatCurrency, formatDateTime, statusColor } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

const tabs = ['all', 'pending', 'processing', 'completed', 'rejected'] as const;

export default function CashbackQueuePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number]>('all');

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/queue');
  }, [loading, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['queue', tab],
    queryFn: async () => {
      const params = tab === 'all' ? '' : `?status=${tab}`;
      return queueService.list(params);
    },
    enabled: !!user,
  });

  if (loading || isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-slate-900">Cashback Queue</h1>
      <p className="mt-1 text-sm text-slate-500">Your cashback entries and their position in the confirmation queue.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        {data && data.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Queue position</th>
                <th className="px-6 py-3">Entry date</th>
                <th className="px-6 py-3">Store</th>
                <th className="px-6 py-3">Cashback</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    {item.queuePosition ? (
                      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-brand-50 px-2 text-sm font-bold text-brand-700">
                        #{item.queuePosition}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{formatDateTime(item.createdAt)}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{item.storeName || '—'}</td>
                  <td className="px-6 py-4 font-semibold text-accent-600">+{formatCurrency(item.cashbackAmount)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-10 text-center text-sm text-slate-500">No cashback entries found.</p>
        )}
      </div>
    </div>
  );
}
