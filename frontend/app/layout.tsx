import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { SiteChrome } from '@/components/layout/SiteChrome';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'YO1Cashback — Earn Cashback on Every Purchase',
  description:
    'Shop at your favorite stores and earn real cashback. YO1Cashback rewards you on every purchase across fashion, electronics, travel and more.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://yo1cashback.com'),
  openGraph: {
    title: 'YO1Cashback — Earn Cashback on Every Purchase',
    description: 'Shop, earn cashback, and withdraw real money.',
    url: 'https://yo1cashback.com',
    siteName: 'YO1Cashback',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
