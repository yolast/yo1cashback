import { SettingsForm } from '@/components/admin/SettingsForm';

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">Configure platform settings.</p>
      <SettingsForm />
    </div>
  );
}
