'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services';
import { getErrorMessage } from '@/lib/axios';
import { Spinner } from '@/components/ui/Spinner';

const textFields = [
  { key: 'platformName', label: 'Platform Name', type: 'text' },
  { key: 'supportEmail', label: 'Support Email', type: 'email' },
  { key: 'supportPhone', label: 'Support Phone', type: 'text' },
] as const;

const numberFields = [
  { key: 'minWithdrawal', label: 'Minimum Withdrawal', type: 'number' },
  { key: 'maxWithdrawal', label: 'Maximum Withdrawal (0 = unlimited)', type: 'number' },
] as const;

export function SettingsForm() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => settingsService.all(),
  });

  useEffect(() => {
    if (!settings) return;
    const map: Record<string, string> = {};
    for (const s of settings) {
      if (s.key === 'maintenanceMode') {
        setMaintenanceMode(s.value === true || s.value === 'true');
      } else {
        map[s.key] = String(s.value ?? '');
      }
    }
    setValues(map);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates: Promise<unknown>[] = [];
      for (const field of [...textFields, ...numberFields]) {
        const value = field.type === 'number' ? Number(values[field.key] || 0) : values[field.key] || '';
        updates.push(settingsService.update(field.key, value));
      }
      updates.push(settingsService.update('maintenanceMode', maintenanceMode));
      await Promise.all(updates);
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Settings saved.' });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (err) => setMessage({ type: 'error', text: getErrorMessage(err) }),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-xl">
      {message && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="card p-6">
        <div className="space-y-4">
          {textFields.map((f) => (
            <div key={f.key}>
              <label className="text-sm font-medium text-slate-700">{f.label}</label>
              <input
                type={f.type}
                value={values[f.key] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="input mt-1"
              />
            </div>
          ))}

          {numberFields.map((f) => (
            <div key={f.key}>
              <label className="text-sm font-medium text-slate-700">{f.label}</label>
              <input
                type="number"
                min="0"
                value={values[f.key] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="input mt-1"
              />
            </div>
          ))}

          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Maintenance Mode</p>
              <p className="text-xs text-slate-500">Block customer-facing APIs while enabled.</p>
            </div>
            <button
              onClick={() => setMaintenanceMode((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition ${maintenanceMode ? 'bg-brand-600' : 'bg-slate-300'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  maintenanceMode ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary w-full"
          >
            {saveMutation.isPending ? <Spinner className="h-4 w-4" /> : null}
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
}
