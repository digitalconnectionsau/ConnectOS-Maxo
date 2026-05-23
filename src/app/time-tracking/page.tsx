'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Play, Square, Loader2, Clock, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface ActiveTimer {
  user_id: number;
  started_at: string;
  project_id: number | null;
  project_name: string | null;
  ticket_id: number | null;
  ticket_number: string | null;
  description: string | null;
}
interface Entry {
  id: number;
  project_id: number | null;
  project_name: string | null;
  ticket_id: number | null;
  ticket_number: string | null;
  description: string | null;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  billable: boolean;
}
interface Project { id: number; name: string }
interface Ticket { id: number; ticket_number: string; subject: string }

function formatHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
function formatHM(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}
function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString();
}

export default function TimeTrackingPage() {
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [projectId, setProjectId] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [description, setDescription] = useState('');

  // Tick — re-render every second while a timer is running
  const [, setNow] = useState(0);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    const [tRes, eRes] = await Promise.all([
      fetch('/api/timers'),
      fetch('/api/time-entries?limit=200'),
    ]);
    const tData = await tRes.json();
    const eData = await eRes.json();
    setTimer(tData.timer);
    setEntries(eData.entries ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, tRes] = await Promise.all([
          fetch('/api/projects?status=active'),
          fetch('/api/tickets?open_only=true'),
        ]);
        if (pRes.ok) {
          const d = await pRes.json();
          setProjects(d.projects ?? []);
        }
        if (tRes.ok) {
          const d = await tRes.json();
          setTickets((d.tickets ?? []).slice(0, 50));
        }
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  useEffect(() => {
    if (timer) {
      tickRef.current = setInterval(() => setNow((n) => n + 1), 1000);
      return () => { if (tickRef.current) clearInterval(tickRef.current); };
    }
  }, [timer]);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          project_id: projectId ? Number(projectId) : null,
          ticket_id: ticketId ? Number(ticketId) : null,
          description: description.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start timer');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start timer');
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    setBusy(true);
    try {
      await fetch('/api/timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
      setProjectId(''); setTicketId(''); setDescription('');
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteEntry(id: number) {
    if (!confirm('Delete this time entry?')) return;
    await fetch(`/api/time-entries/${id}`, { method: 'DELETE' });
    refresh();
  }

  const elapsedSeconds = timer
    ? Math.floor((Date.now() - new Date(timer.started_at).getTime()) / 1000)
    : 0;

  // Group entries by day
  const grouped: Record<string, Entry[]> = {};
  for (const e of entries) {
    const k = dayKey(e.started_at);
    (grouped[k] ??= []).push(e);
  }
  const dayKeys = Object.keys(grouped);

  // Weekly total: last 7 days
  const weekCutoff = Date.now() - 7 * 86400 * 1000;
  const weekSeconds = entries
    .filter((e) => new Date(e.started_at).getTime() >= weekCutoff)
    .reduce((sum, e) => sum + e.duration_seconds, 0);

  return (
    <div>
      <PageHeader
        title="Time Tracking"
        subtitle="Run a timer or log time manually against projects and tickets"
        breadcrumbs={[{ label: 'Time Tracking' }]}
      />

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      )}

      {/* Active timer card */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-400 mx-auto" />
        ) : timer ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-4xl font-mono font-semibold text-teal-700">{formatHMS(elapsedSeconds)}</div>
              <div className="mt-1 text-sm text-gray-700">
                {timer.project_name && <span className="font-medium">{timer.project_name}</span>}
                {timer.project_name && timer.ticket_number && <span className="text-gray-400 mx-2">·</span>}
                {timer.ticket_number && <span className="font-mono text-xs">{timer.ticket_number}</span>}
              </div>
              {timer.description && <div className="text-sm text-gray-600 mt-1">{timer.description}</div>}
              <div className="text-xs text-gray-500 mt-1">Started {new Date(timer.started_at).toLocaleTimeString()}</div>
            </div>
            <button
              onClick={stop}
              disabled={busy}
              className="inline-flex items-center bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-medium"
            >
              <Square className="h-4 w-4 mr-2" /> Stop timer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <Field label="Project">
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
                <option value="">— None —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Ticket">
              <select value={ticketId} onChange={(e) => setTicketId(e.target.value)} className={inputCls}>
                <option value="">— None —</option>
                {tickets.map((t) => <option key={t.id} value={t.id}>{t.ticket_number} — {t.subject}</option>)}
              </select>
            </Field>
            <Field label="Description">
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
                className={inputCls}
              />
            </Field>
            <button
              onClick={start}
              disabled={busy}
              className="inline-flex items-center justify-center bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Play className="h-4 w-4 mr-2" /> Start timer
            </button>
          </div>
        )}
      </div>

      {/* Weekly summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="Last 7 days" value={formatHM(weekSeconds)} icon={<Clock className="h-5 w-5 text-teal-600" />} />
        <Stat title="Recent entries" value={String(entries.length)} icon={<Clock className="h-5 w-5 text-teal-600" />} />
        <Stat
          title="Status"
          value={timer ? 'Timer running' : 'Idle'}
          icon={<Clock className={`h-5 w-5 ${timer ? 'text-red-500' : 'text-gray-400'}`} />}
        />
      </div>

      {/* Entries grouped by day */}
      <div className="mt-6 space-y-4">
        {dayKeys.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
            No time entries yet — start a timer above.
          </div>
        ) : (
          dayKeys.map((day) => {
            const dayEntries = grouped[day];
            const total = dayEntries.reduce((s, e) => s + e.duration_seconds, 0);
            return (
              <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">{day}</span>
                  <span className="text-sm text-gray-600 font-mono">{formatHM(total)}</span>
                </div>
                <table className="min-w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {dayEntries.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 w-32 text-gray-500 text-xs">
                          {new Date(e.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(e.ended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {e.project_name || <span className="text-gray-400">No project</span>}
                        </td>
                        <td className="px-4 py-2">
                          {e.ticket_id ? (
                            <Link href={`/tickets/${e.ticket_id}`} className="text-teal-700 hover:text-teal-800 font-mono text-xs">
                              {e.ticket_number}
                            </Link>
                          ) : null}
                        </td>
                        <td className="px-4 py-2 text-gray-800">{e.description || '—'}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatHM(e.duration_seconds)}</td>
                        <td className="px-4 py-2 text-right w-10">
                          <button
                            onClick={() => deleteEntry(e.id)}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
function Stat({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">{title}</div>
        <div className="text-xl font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  );
}
