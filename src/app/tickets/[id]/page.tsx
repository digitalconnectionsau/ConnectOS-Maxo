'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Send, Lock, MessageSquare, Clock, Mail, Sparkles } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface TicketDetail {
  id: number;
  ticket_number: string;
  subject: string;
  description: string | null;
  contact_id: number | null;
  contact_name: string | null;
  assignee_user_id: number | null;
  assignee_name: string | null;
  status_id: number;
  status_name: string;
  status_color: string;
  status_is_closed: boolean;
  priority_id: number;
  priority_name: string;
  priority_color: string;
  sla_policy_id: number | null;
  response_due_at: string | null;
  resolution_due_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  email_conversation_id: string | null;
  email_mailbox_id: number | null;
}
interface Comment {
  id: number;
  body: string;
  is_internal: boolean;
  author_name: string | null;
  created_at: string;
}
interface Activity {
  id: number;
  action: string;
  field: string | null;
  from_value: string | null;
  to_value: string | null;
  user_name: string | null;
  created_at: string;
}
interface Lookup {
  id: number;
  name: string;
  color?: string;
}
interface AgentLookup {
  id: number;
  full_name: string | null;
  username: string;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const ticketId = Number(id);

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [statuses, setStatuses] = useState<Lookup[]>([]);
  const [priorities, setPriorities] = useState<Lookup[]>([]);
  const [agents, setAgents] = useState<AgentLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isInternal, setIsInternal] = useState(false);
  const [sendAsEmail, setSendAsEmail] = useState(true);
  const [posting, setPosting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/tickets/${ticketId}`);
    if (!res.ok) {
      setError('Failed to load ticket');
      return;
    }
    const data = await res.json();
    setTicket(data.ticket);
    setComments(data.comments);
    setActivity(data.activity);
  }, [ticketId]);

  useEffect(() => {
    (async () => {
      try {
        const [_, lookupsRes] = await Promise.all([refresh(), fetch('/api/tickets/lookups')]);
        if (lookupsRes.ok) {
          const d = await lookupsRes.json();
          setStatuses(d.statuses);
          setPriorities(d.priorities);
          setAgents(d.agents);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  async function patchTicket(patch: Record<string, unknown>) {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) refresh();
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    setComposerError(null);
    try {
      // If this ticket originated from email and the user opted to reply via
      // email (and it's not an internal note), route through the email-reply
      // endpoint which both sends the email and records a comment.
      const useEmail =
        !isInternal && sendAsEmail && ticket?.email_conversation_id && ticket?.email_mailbox_id;
      const endpoint = useEmail
        ? `/api/tickets/${ticketId}/email-reply`
        : `/api/tickets/${ticketId}/comments`;
      const body = useEmail
        ? { body: newComment.trim() }
        : { body: newComment.trim(), is_internal: isInternal };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send reply');
      }
      setNewComment('');
      await refresh();
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return <div className="p-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" /></div>;
  }
  if (error || !ticket) {
    return <div className="p-6 text-red-700 text-sm">{error || 'Ticket not found'}</div>;
  }

  return (
    <div>
      <PageHeader
        title={ticket.subject}
        subtitle={`${ticket.ticket_number} · Created ${formatDateTime(ticket.created_at)}`}
        breadcrumbs={[{ label: 'Tickets', href: '/tickets' }, { label: ticket.ticket_number }]}
      />

      <Link href="/tickets" className="inline-flex items-center text-sm text-gray-600 hover:text-teal-700 mt-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to tickets
      </Link>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {ticket.description && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Description</h3>
              <p className="text-gray-800 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {/* Comment composer */}
          <form onSubmit={postComment} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reply</span>
              <button
                type="button"
                disabled={aiBusy}
                onClick={async () => {
                  setAiBusy(true);
                  setAiError(null);
                  try {
                    const r = await fetch('/api/ai/draft-reply', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ticket_id: Number(ticketId), kind: 'draft_reply' }),
                    });
                    const d = await r.json();
                    if (!r.ok) throw new Error(d.error || 'AI request failed');
                    setNewComment((prev) => (prev ? prev + '\n\n' : '') + (d.text || ''));
                  } catch (err) {
                    setAiError(err instanceof Error ? err.message : 'AI request failed');
                  } finally {
                    setAiBusy(false);
                  }
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 disabled:opacity-50"
              >
                {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {aiBusy ? 'Drafting…' : 'Draft with AI'}
              </button>
            </div>
            {aiError && <p className="mb-2 text-xs text-red-600">{aiError}</p>}
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              placeholder={isInternal ? 'Internal note (not visible to client)...' : 'Reply to client...'}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                isInternal
                  ? 'border-amber-200 bg-amber-50 focus:ring-amber-400'
                  : 'border-gray-200 focus:ring-teal-500'
              }`}
            />
            <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded"
                  />
                  <Lock className="h-3.5 w-3.5" />
                  Internal note
                </label>
                {ticket.email_conversation_id && !isInternal && (
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendAsEmail}
                      onChange={(e) => setSendAsEmail(e.target.checked)}
                      className="rounded"
                    />
                    <Mail className="h-3.5 w-3.5" />
                    Send as email
                  </label>
                )}
              </div>
              <button
                type="submit"
                disabled={posting || !newComment.trim()}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isInternal ? 'Add note' : 'Send reply'}
              </button>
            </div>
            {composerError && (
              <p className="mt-2 text-sm text-red-600">{composerError}</p>
            )}
          </form>

          {/* Comments */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="text-center text-sm text-gray-500 p-6 bg-white rounded-2xl border border-gray-100">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                No replies yet
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-2xl shadow-sm border p-4 ${
                    c.is_internal ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <span className="font-medium text-gray-800">{c.author_name || 'System'}</span>
                    {c.is_internal && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-medium">
                        <Lock className="h-3 w-3" /> Internal
                      </span>
                    )}
                    <span className="text-gray-400">·</span>
                    <span>{formatDateTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.body}</p>
                </div>
              ))
            )}
          </div>

          {/* Activity */}
          {activity.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Activity
              </h3>
              <ul className="space-y-2 text-sm">
                {activity.map((a) => (
                  <li key={a.id} className="text-gray-600">
                    <span className="text-gray-400 text-xs mr-2">{formatDateTime(a.created_at)}</span>
                    <span className="font-medium text-gray-700">{a.user_name || 'System'}</span>{' '}
                    {describeAction(a)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <Field label="Status">
              <select
                value={ticket.status_id}
                onChange={(e) => patchTicket({ status_id: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={ticket.priority_id}
                onChange={(e) => patchTicket({ priority_id: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
              >
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Assignee">
              <select
                value={ticket.assignee_user_id ?? ''}
                onChange={(e) =>
                  patchTicket({ assignee_user_id: e.target.value ? Number(e.target.value) : null })
                }
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
              >
                <option value="">— Unassigned —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name || a.username}</option>
                ))}
              </select>
            </Field>
            <Field label="Contact">
              <div className="text-sm text-gray-800">{ticket.contact_name || '—'}</div>
            </Field>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-sm space-y-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">SLA</h3>
            <SlaRow label="First response" dueAt={ticket.response_due_at} metAt={ticket.first_response_at} closed={ticket.status_is_closed} />
            <SlaRow label="Resolution"     dueAt={ticket.resolution_due_at} metAt={ticket.resolved_at}        closed={ticket.status_is_closed} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      {children}
    </div>
  );
}

function SlaRow({
  label,
  dueAt,
  metAt,
  closed,
}: {
  label: string;
  dueAt: string | null;
  metAt: string | null;
  closed: boolean;
}) {
  if (!dueAt) return <div className="text-gray-500 text-xs">{label}: no SLA</div>;
  const due = new Date(dueAt).getTime();
  const now = Date.now();
  const overdue = !metAt && !closed && due < now;
  const met = !!metAt;
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={met ? 'text-green-600' : overdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
        {met ? `Met ${new Date(metAt!).toLocaleString()}` : new Date(dueAt).toLocaleString()}
      </span>
    </div>
  );
}

function describeAction(a: Activity): string {
  switch (a.action) {
    case 'created':         return `created the ticket (${a.to_value})`;
    case 'status_changed':  return `changed status`;
    case 'priority_changed':return `changed priority`;
    case 'assigned':        return `changed assignee`;
    case 'team_changed':    return `changed team`;
    case 'sla_changed':     return `changed SLA policy`;
    case 'replied':         return `posted a reply`;
    case 'note_added':      return `added an internal note`;
    default:                return a.action;
  }
}
