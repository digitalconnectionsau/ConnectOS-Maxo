'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Ticket as TicketIcon, Loader2, Filter } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface TicketRow {
  id: number;
  ticket_number: string;
  subject: string;
  status_id: number;
  status_name: string;
  status_color: string;
  status_is_closed: boolean;
  priority_id: number;
  priority_name: string;
  priority_color: string;
  contact_name: string | null;
  assignee_name: string | null;
  response_due_at: string | null;
  resolution_due_at: string | null;
  created_at: string;
}

interface Lookup {
  id: number;
  name: string;
  color?: string;
  is_closed?: boolean;
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60_000);
  const sign = diff < 0 ? 'overdue by ' : 'in ';
  if (mins < 60) return `${sign}${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${sign}${hours}h`;
  const days = Math.round(hours / 24);
  return `${sign}${days}d`;
}

export default function TicketsListPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [statuses, setStatuses] = useState<Lookup[]>([]);
  const [priorities, setPriorities] = useState<Lookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter === 'open') params.set('open_only', '1');
    else if (statusFilter && statusFilter !== 'all') params.set('status_id', statusFilter);
    if (priorityFilter) params.set('priority_id', priorityFilter);
    if (search.trim()) params.set('search', search.trim());
    return params.toString();
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tickets/lookups');
        if (res.ok) {
          const data = await res.json();
          setStatuses(data.statuses);
          setPriorities(data.priorities);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/tickets?${queryString}`);
        if (!res.ok) throw new Error('Failed to load tickets');
        const data = await res.json();
        if (!cancelled) setTickets(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  return (
    <div>
      <PageHeader
        title="Tickets"
        subtitle="Support, requests and incidents from your clients."
        breadcrumbs={[{ label: 'Tickets' }]}
      />

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>Filter:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="open">Open (not closed)</option>
          <option value="all">All statuses</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All priorities</option>
          {priorities.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subject or number..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white flex-1 min-w-[200px]"
        />
        <Link
          href="/tickets/new"
          className="ml-auto bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> New Ticket
        </Link>
      </div>

      <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" /></div>
        ) : error ? (
          <div className="p-6 text-red-700 text-sm">{error}</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <TicketIcon className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">No tickets found</p>
            <p className="text-sm mt-1">Try a different filter or create a new ticket.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => {
                const overdueResp = t.response_due_at && new Date(t.response_due_at).getTime() < Date.now() && !t.status_is_closed;
                const overdueResol = t.resolution_due_at && new Date(t.resolution_due_at).getTime() < Date.now() && !t.status_is_closed;
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">
                      <Link href={`/tickets/${t.id}`} className="text-teal-700 hover:underline">{t.ticket_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/tickets/${t.id}`} className="font-medium text-gray-900 hover:text-teal-700 line-clamp-1">
                        {t.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.contact_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: t.status_color }}
                      >
                        {t.status_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: t.priority_color }}
                      >
                        {t.priority_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.assignee_name || '—'}</td>
                    <td className={`px-4 py-3 text-xs ${overdueResp ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {relativeTime(t.response_due_at)}
                    </td>
                    <td className={`px-4 py-3 text-xs ${overdueResol ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {relativeTime(t.resolution_due_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
