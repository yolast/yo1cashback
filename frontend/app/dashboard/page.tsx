'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/axios';
import type { DashboardData } from '@/types';
import { formatCurrency, formatDate, statusColor } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/dashboard');
  }, [loading, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/users/dashboard')).data.data as DashboardData,
    enabled: !!user,
  });

  if (loading || isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  if (!user || !data) return null;

  const stats = [
    { label: 'Wallet balance', value: formatCurrency(data.walletBalance), accent: true },
    { label: 'Cashback earned', value: formatCurrency(data.cashbackEarned) },
    { label: 'Cashback received', value: formatCurrency(data.cashbackReceived) },
    { label: 'Total referrals', value: String(data.totalReferrals) },
  ];

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, {data.customerName || user.name || user.email || user.phone}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/profile" className="btn-secondary">
            Edit profile
          </Link>
          <Link href="/withdrawals" className="btn-primary">
            Withdraw
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
          Customer ID: <span className="font-mono font-bold text-slate-900">{data.customerId || '—'}</span>
        </span>
        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
          Queue position:{' '}
          <span className="font-bold text-brand-700">{data.queuePosition ? `#${data.queuePosition}` : '—'}</span>
        </span>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`card p-5 ${s.accent ? 'border-brand-200 bg-brand-50' : ''}`}>
            <p className="text-sm font-medium text-slate-500">{s.label}</p>
            <p className={`mt-2 text-2xl font-extrabold ${s.accent ? 'text-brand-700' : 'text-slate-900'}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent cashback</h2>
            <Link href="/queue" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          {data.recentCashback.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No cashback yet. Start shopping to earn rewards!</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {data.recentCashback.map((item) => (
                <div key={item._id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                      {(item.storeName || 'C').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.storeName || 'Order'}</p>
                      <p className="text-xs text-slate-400">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-accent-600">+{formatCurrency(item.cashbackAmount)}</p>
                    <span className={`mt-0.5 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900">Refer & earn</h2>
            <p className="mt-2 text-sm text-slate-500">Share your code and earn a bonus on your friends&apos; cashback.</p>
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Your referral code</p>
              <p className="mt-1 text-xl font-extrabold tracking-wider text-brand-700">{user.referralCode || '—'}</p>
            </div>
            <Link href="/referrals" className="btn-secondary mt-4 w-full">
              View referrals
            </Link>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900">Lifetime stats</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Total orders</dt>
                <dd className="font-semibold text-slate-900">{data.summary.totalOrders}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Pending cashback</dt>
                <dd className="font-semibold text-amber-600">{formatCurrency(data.wallet.totalPending)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Withdrawn</dt>
                <dd className="font-semibold text-slate-900">{formatCurrency(data.wallet.totalWithdrawn)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
