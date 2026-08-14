'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/store/auth';
import { api, getErrorMessage } from '@/lib/axios';
import type { Ticket, TicketDetail } from '@/types';
import { formatDateTime, statusColor, statusLabel } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

const categories = ['cashback', 'withdrawal', 'account', 'store', 'other'];

export default function TicketsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('other');
  const [message, setMessage] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/tickets');
  }, [loading, user, router]);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => (await api.get('/tickets')).data.data as Ticket[],
    enabled: !!user,
  });

  const { data: detail } = useQuery({
    queryKey: ['ticket', selectedId],
    queryFn: async () => (await api.get(`/tickets/${selectedId}`)).data.data as TicketDetail,
    enabled: !!user && !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/tickets', { subject, category, message }),
    onSuccess: (res) => {
      setSubject('');
      setMessage('');
      setShowForm(false);
      setSelectedId(res.data.data._id);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const replyMutation = useMutation({
    mutationFn: async () => api.post(`/tickets/${selectedId}/messages`, { message: reply }),
    onSuccess: () => {
      setReply('');
      queryClient.invalidateQueries({ queryKey: ['ticket', selectedId] });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  if (loading || isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Support Tickets</h1>
          <p className="mt-1 text-sm text-slate-500">Create a ticket and track replies.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? 'Cancel' : 'New ticket'}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {showForm && (
        <div className="card mt-6 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Create a ticket</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary" className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input mt-1">
                {categories.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Describe your issue"
                className="input mt-1 resize-none"
              />
            </div>
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !subject || !message}
              className="btn-primary"
            >
              {createMutation.isPending ? <Spinner className="h-4 w-4" /> : null}
              Submit ticket
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-1">
          <h2 className="border-b border-slate-100 px-6 py-4 text-lg font-semibold text-slate-900">My tickets</h2>
          {tickets && tickets.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {tickets.map((t) => (
                <button
                  key={t._id}
                  onClick={() => setSelectedId(t._id)}
                  className={`block w-full px-6 py-4 text-left transition hover:bg-slate-50 ${
                    selectedId === t._id ? 'bg-brand-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">{t.subject}</p>
                    <span className={`inline-block shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusColor(t.status)}`}>
                      {statusLabel(t.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(t.createdAt)}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="p-6 text-sm text-slate-500">No tickets yet.</p>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedId && detail ? (
            <div className="card overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">{detail.ticket.subject}</h2>
                <p className="text-xs text-slate-400 capitalize">Category: {detail.ticket.category}</p>
              </div>
              <div className="max-h-[420px] space-y-4 overflow-y-auto px-6 py-4">
                {detail.messages.map((m) => (
                  <div
                    key={m._id}
                    className={`flex ${m.senderType === 'admin' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.senderType === 'admin' ? 'bg-slate-100 text-slate-800' : 'bg-brand-600 text-white'
                      }`}
                    >
                      <p>{m.message}</p>
                      <p className={`mt-1 text-[11px] ${m.senderType === 'admin' ? 'text-slate-400' : 'text-brand-200'}`}>
                        {m.senderType === 'admin' ? 'Support' : 'You'} · {formatDateTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 px-6 py-4">
                <div className="flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply..."
                    className="input"
                  />
                  <button
                    onClick={() => replyMutation.mutate()}
                    disabled={replyMutation.isPending || !reply}
                    className="btn-primary shrink-0"
                  >
                    {replyMutation.isPending ? <Spinner className="h-4 w-4" /> : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card grid min-h-[300px] place-items-center text-sm text-slate-500">
              Select a ticket to view replies.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
