import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-secondary-800 bg-secondary-900 text-secondary-300">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-lg font-extrabold text-white">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-sm text-white">Y1</span>
            YO1Cashback
          </div>
          <p className="mt-3 max-w-md text-sm text-secondary-400">
            Shop your favorite brands and earn real cashback on every purchase. Withdraw directly to
            your bank, UPI, or PayPal.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-secondary-400">
            <li><Link href="/dashboard" className="hover:text-brand-400">Dashboard</Link></li>
            <li><Link href="/wallet" className="hover:text-brand-400">Wallet</Link></li>
            <li><Link href="/referrals" className="hover:text-brand-400">Refer & Earn</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Support</h4>
          <ul className="mt-3 space-y-2 text-sm text-secondary-400">
            <li>support@yo1cashback.com</li>
            <li><Link href="/tickets" className="hover:text-brand-400">Support tickets</Link></li>
            <li><Link href="/" className="hover:text-brand-400">Terms & Conditions</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-secondary-800 py-5">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-secondary-500 sm:flex-row">
          <p>© {new Date().getFullYear()} YO1Cashback. All rights reserved.</p>
          <p>yo1cashback.com</p>
        </div>
      </div>
    </footer>
  );
}
