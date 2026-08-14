'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import { getErrorMessage } from '@/lib/axios';
import type { AdminTicket, TicketMessage } from '@/types';
import { formatDateTime, statusColor, statusLabel } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

export default function AdminTicketsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [message, setMessage] = useState('');

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: () => adminService.tickets(),
  });

  const { data: thread } = useQuery({
    queryKey: ['admin-ticket', selectedId],
    queryFn: () => adminService.ticketThread(selectedId as string),
    enabled: !!selectedId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminService.updateTicket(id, status),
    onSuccess: () => {
      setMessage('Ticket updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
    onError: (err) => setMessage(getErrorMessage(err)),
  });

  const replyMutation = useMutation({
    mutationFn: () => adminService.replyTicket(selectedId as string, reply),
    onSuccess: () => {
      setReply('');
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
    onError: (err) => setMessage(getErrorMessage(err)),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Tickets</h1>
      <p className="mt-1 text-sm text-slate-500">Reply to customer tickets and manage status.</p>

      {message && (
        <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">{message}</div>
      )}

      <div className="card mt-6 overflow-hidden">
        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Spinner className="h-8 w-8 text-brand-600" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets?.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-4 font-medium text-slate-900">{t.subject}</td>
                  <td className="px-6 py-4 text-slate-600">{t.user?.email || '—'}</td>
                  <td className="px-6 py-4 capitalize text-slate-600">{t.category}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(t.status)}`}>
                      {statusLabel(t.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedId(t._id)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        View
                      </button>
                      {t.status === 'open' && (
                        <button onClick={() => statusMutation.mutate({ id: t._id, status: 'in_progress' })} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                          In Progress
                        </button>
                      )}
                      {t.status !== 'closed' ? (
                        <button onClick={() => statusMutation.mutate({ id: t._id, status: 'closed' })} className="rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
                          Close
                        </button>
                      ) : (
                        <button onClick={() => statusMutation.mutate({ id: t._id, status: 'open' })} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
                          Reopen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedId && (
        <TicketThreadModal
          thread={thread}
          reply={reply}
          onReplyChange={setReply}
          onReply={() => replyMutation.mutate()}
          replyPending={replyMutation.isPending}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function TicketThreadModal({
  thread,
  reply,
  onReplyChange,
  onReply,
  replyPending,
  onClose,
}: {
  thread?: { ticket: AdminTicket; messages: TicketMessage[] };
  reply: string;
  onReplyChange: (v: string) => void;
  onReply: () => void;
  replyPending: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{thread?.ticket.subject || 'Ticket'}</h2>
            {thread && (
              <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusColor(thread.ticket.status)}`}>
                {statusLabel(thread.ticket.status)}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {thread?.messages.map((m) => (
            <div key={m._id} className={`flex ${m.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.senderType === 'admin' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                <p>{m.message}</p>
                <p className={`mt-1 text-[11px] ${m.senderType === 'admin' ? 'text-brand-200' : 'text-slate-400'}`}>
                  {m.senderType === 'admin' ? 'Support' : 'Customer'} · {formatDateTime(m.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <div className="flex gap-2">
            <input value={reply} onChange={(e) => onReplyChange(e.target.value)} placeholder="Write a reply..." className="input" />
            <button onClick={onReply} disabled={replyPending || !reply} className="btn-primary shrink-0">
              {replyPending ? <Spinner className="h-4 w-4" /> : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
