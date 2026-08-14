'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/store/auth';
import { walletService } from '@/services';
import { formatCurrency, formatDateTime, statusColor } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

interface LedgerEntry {
  id: string;
  type: string;
  label: string;
  detail: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function WalletPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/wallet');
  }, [loading, user, router]);

  const { data: walletData, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletService.get(),
    enabled: !!user,
  });

  const { data: entries } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: () => walletService.transactions(),
    enabled: !!user,
  });

  if (loading || isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  if (!user || !walletData) return null;

  const { wallet } = walletData;

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Wallet</h1>
          <p className="mt-1 text-sm text-slate-500">Your balance and transaction history.</p>
        </div>
        <Link href="/withdrawals" className="btn-primary">
          Withdraw
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <div className="card border-brand-200 bg-brand-50 p-5 sm:col-span-1">
          <p className="text-sm font-medium text-slate-500">Wallet balance</p>
          <p className="mt-2 text-3xl font-extrabold text-brand-700">{formatCurrency(wallet.balance)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-slate-500">Total earned</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatCurrency(wallet.totalEarned)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-slate-500">Pending</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">{formatCurrency(wallet.totalPending)}</p>
        </div>
      </div>

      <div className="card mt-8 overflow-hidden">
        <h2 className="border-b border-slate-100 px-6 py-4 text-lg font-semibold text-slate-900">Transactions</h2>
        {entries && entries.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {entries.map((e: LedgerEntry) => {
              const positive = e.type === 'cashback';
              return (
                <div key={e.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{e.label}</p>
                    <p className="text-xs text-slate-400">
                      {e.detail} · {formatDateTime(e.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${positive ? 'text-accent-600' : 'text-red-600'}`}>
                      {positive ? '+' : '-'}{formatCurrency(e.amount)}
                    </p>
                    {e.status && (
                      <span className={`mt-0.5 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusColor(e.status)}`}>
                        {e.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="p-10 text-center text-sm text-slate-500">No transactions yet.</p>
        )}
      </div>
    </div>
  );
}
