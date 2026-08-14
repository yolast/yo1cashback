'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/store/auth';
import { getInitials, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/wallet', label: 'Wallet' },
    { href: '/referrals', label: 'Refer & Earn' },
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-brand-700">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">Y1</span>
            YO1Cashback
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive(link.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!loading && user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-sm font-medium hover:bg-slate-50"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {getInitials(user.name || user.email || user.phone || '')}
                </span>
                <span className="hidden max-w-[120px] truncate sm:inline">
                  {formatCurrency(user.balance)}
                </span>
              </button>
              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold">{user.name || user.email || user.phone}</p>
                    <p className="truncate text-xs text-slate-500">{user.email || user.phone}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/dashboard"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setProfileOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/wallet"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setProfileOpen(false)}
                    >
                      Wallet
                    </Link>
                    <Link
                      href="/withdrawals"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setProfileOpen(false)}
                    >
                      Withdraw
                    </Link>
                    <Link
                      href="/referrals"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setProfileOpen(false)}
                    >
                      Referrals
                    </Link>
                    <Link
                      href="/tickets"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setProfileOpen(false)}
                    >
                      Support tickets
                    </Link>
                    <Link
                      href="/notifications"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setProfileOpen(false)}
                    >
                      Notifications
                    </Link>
                    <Link
                      href="/profile"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setProfileOpen(false)}
                    >
                      Profile
                    </Link>
                    {user.role === 'superadmin' && (
                      <Link
                        href="/admin"
                        className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => setProfileOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        await logout();
                        router.push('/');
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-secondary">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary hidden sm:inline-flex">
                Get started
              </Link>
            </div>
          )}

          <button
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-700 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-2 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </Link>
          ))}
          {!loading && !user && (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-primary mt-2 w-full">
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
