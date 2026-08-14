export function formatCurrency(value: number, currency = '₹'): string {
  return `${currency}${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function cashbackLabel(store: { rateType: string; cashbackRate: number }): string {
  if (store.rateType === 'fixed') return `${formatCurrency(store.cashbackRate)} cashback`;
  return `Up to ${store.cashbackRate}% cashback`;
}

export function getInitials(name: string): string {
  return (name || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function statusLabel(status: string): string {
  return (status || '').replace(/_/g, ' ');
}

export function statusColor(status: string): string {
  switch (status) {
    case 'confirmed':
    case 'completed':
    case 'earned':
    case 'approved':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'pending':
    case 'processing':
    case 'open':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'rejected':
    case 'cancelled':
    case 'closed':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'paid':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'answered':
    case 'in_progress':
      return 'text-sky-600 bg-sky-50 border-sky-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}
