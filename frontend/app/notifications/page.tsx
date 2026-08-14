'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/axios';
import type { AppNotification } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

const typeIcons: Record<string, string> = {
  cashback: '💰',
  withdrawal: '🏦',
  referral: '🎁',
  ticket: '🎫',
  system: '🔔',
};

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/notifications');
  }, [loading, user, router]);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data.data as AppNotification[],
    enabled: !!user,
  });

  const markAll = useMutation({
    mutationFn: async () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">System updates and account activity.</p>
        </div>
        <button onClick={() => markAll.mutate()} className="btn-secondary">
          Mark all read
        </button>
      </div>

      <div className="card mt-6 overflow-hidden">
        {notifications && notifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`flex items-start gap-4 px-6 py-4 transition ${n.read ? '' : 'bg-brand-50/40'}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg">
                  {typeIcons[n.type] || '🔔'}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markRead.mutate(n._id)}
                    className="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="p-10 text-center text-sm text-slate-500">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
