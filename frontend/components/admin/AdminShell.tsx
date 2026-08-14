'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAdmin } from '@/store/admin';
import { Spinner } from '@/components/ui/Spinner';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/queue', label: 'Queue', icon: '🧾' },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: '🏦' },
  { href: '/admin/tickets', label: 'Tickets', icon: '🎫' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { admin, loading, logout } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !admin) router.replace('/admin/login');
  }, [loading, admin, router]);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="container-page py-8">
      <div className="flex gap-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="card sticky top-24 p-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === l.href ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{l.icon}</span>
                {l.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="truncate px-3 text-xs text-slate-500">{admin.name || admin.email}</p>
              <button
                onClick={() => {
                  logout();
                  router.push('/admin/login');
                }}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  pathname === l.href ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
