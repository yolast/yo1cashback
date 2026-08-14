'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services';
import type { AdminStats } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.stats(),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Platform overview.</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Customers" value={String(stats.totalCustomers)} />
        <StatCard label="Total Cashback Paid" value={formatCurrency(stats.totalCashbackPaid)} />
        <StatCard label="Total Pending Withdrawals" value={String(stats.totalPendingWithdrawals)} highlight />
        <StatCard label="Total Queue Members" value={String(stats.totalQueueMembers)} highlight />
        <StatCard label="Total Tickets" value={String(stats.totalTickets)} highlight />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Admins" value={String(stats.totalAdmins ?? 0)} small />
        <StatCard label="Orders Tracked" value={String(stats.totalTransactions ?? 0)} small />
        <StatCard label="Total Withdrawn" value={formatCurrency(stats.totalWithdrawn ?? 0)} small />
        <StatCard label="Wallet Balance (all)" value={formatCurrency(stats.totalWalletBalance ?? 0)} small />
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight = false, small = false }: { label: string; value: string; highlight?: boolean; small?: boolean }) {
  return (
    <div className={`card p-5 ${highlight ? 'border-amber-200 bg-amber-50' : ''}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 font-extrabold ${small ? 'text-xl' : 'text-2xl'} ${highlight ? 'text-amber-700' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}
