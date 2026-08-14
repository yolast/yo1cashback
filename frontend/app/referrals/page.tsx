'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/axios';
import type { ReferralData } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

export default function ReferralsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/referrals');
  }, [loading, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: async () => (await api.get('/referrals')).data.data as ReferralData,
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

  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yo1cashback.com'}/register?ref=${data.code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-slate-900">Refer & Earn</h1>
      <p className="mt-1 text-sm text-slate-500">
        Invite friends and earn a bonus on every cashback they earn.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="card bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white">
          <h2 className="text-lg font-semibold">Your referral code</h2>
          <p className="mt-4 text-4xl font-extrabold tracking-widest">{data.code || '—'}</p>
          <button onClick={copy} className="mt-6 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
            {copied ? 'Copied!' : 'Copy referral link'}
          </button>
        </div>

        <div className="card p-6">
          <p className="text-sm font-medium text-slate-500">Friends referred</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{data.totalReferees}</p>
        </div>

        <div className="card p-6">
          <p className="text-sm font-medium text-slate-500">Referral earnings</p>
          <p className="mt-2 text-3xl font-extrabold text-accent-600">{formatCurrency(data.totalEarned)}</p>
        </div>
      </div>

      <div className="card mt-8 overflow-hidden">
        <h2 className="border-b border-slate-100 px-6 py-4 text-lg font-semibold text-slate-900">
          Your referrals
        </h2>
        {data.referrals.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {data.referrals.map((ref) => (
              <div key={ref._id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{ref.name || ref.email}</p>
                  <p className="text-xs text-slate-400">{ref.email}</p>
                </div>
                <p className="text-xs text-slate-400">Joined {formatDate(ref.createdAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-10 text-center text-sm text-slate-500">
            No referrals yet. Share your code to start earning.
          </p>
        )}
      </div>
    </div>
  );
}
