'use client';

import { AdminProvider } from '@/store/admin';
import { AdminShell } from '@/components/admin/AdminShell';

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
