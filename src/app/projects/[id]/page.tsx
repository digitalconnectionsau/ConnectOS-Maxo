'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Trash2, Save } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface Project {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  client_contact_id: number | null;
  client_name: string | null;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  hourly_rate: string | null;
  billable: boolean;
}
interface Entry {
  id: number;
  user_name: string | null;
  ticket_number: string | null;
  ticket_id: number | null;
  description: string | null;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  billable: boolean;
  hourly_rate: string | null;
}
interface Stats {
  total_seconds: number;
  billable_seconds: number;
  revenue: number;
  entry_count: number;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const projectId = Number(id);

  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingPatch, setSavingPatch] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    if (!res.ok) {
      setError('Failed to load project');
      return;
    }
    const data = await res.json();
    setProject(data.project);
    setStats(data.stats);
    setEntries(data.entries);
  }, [projectId]);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  async function patch(body: Record<string, unknown>) {
    setSavingPatch(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) await refresh();
    } finally {
      setSavingPatch(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this project? Time entries will be kept but unlinked.')) return;
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    window.location.href = '/projects';
  }

  if (loading) {
    return <div className="p-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" /></div>;
  }
  if (error || !project) {
    return <div className="p-6 text-red-700 text-sm">{error || 'Not found'}</div>;
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle={project.code ? `${project.code} · ${project.client_name || 'No client'}` : project.client_name || 'No client'}
        breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: project.name }]}
      />

      <Link href="/projects" className="inline-flex items-center text-sm text-gray-600 hover:text-teal-700 mt-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to projects
      </Link>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats */}
        <Stat title="Total hours" value={stats ? formatDuration(stats.total_seconds) : '—'} />
        <Stat title="Billable hours" value={stats ? formatDuration(stats.billable_seconds) : '—'} />
        <Stat title="Revenue" value={stats ? `$${stats.revenue.toFixed(2)}` : '—'} />
        <Stat title="Entries" value={stats ? String(stats.entry_count) : '—'} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <h2 className="px-6 py-4 text-sm font-medium text-gray-700 border-b border-gray-100">Time entries</h2>
          {entries.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">No time logged yet</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Ticket</th>
                  <th className="px-4 py-2 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-2 text-gray-600">{new Date(e.started_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-gray-700">{e.user_name || '—'}</td>
                    <td className="px-4 py-2 text-gray-800">{e.description || '—'}</td>
                    <td className="px-4 py-2">
                      {e.ticket_id ? (
                        <Link href={`/tickets/${e.ticket_id}`} className="text-teal-700 hover:text-teal-800 font-mono text-xs">
                          {e.ticket_number}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{formatDuration(e.duration_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Sidebar — settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">Settings</h2>
          <Field label="Status">
            <select
              value={project.status}
              disabled={savingPatch}
              onChange={(e) => patch({ status: e.target.value })}
              className={inputCls}
            >
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="Hourly rate">
            <input
              type="number" step="0.01" min="0"
              defaultValue={project.hourly_rate ?? ''}
              onBlur={(e) => {
                const v = e.target.value === '' ? null : Number(e.target.value);
                if (String(v ?? '') !== String(project.hourly_rate ?? '')) patch({ hourly_rate: v });
              }}
              className={inputCls}
            />
          </Field>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={project.billable}
              onChange={(e) => patch({ billable: e.target.checked })}
            />
            Billable
          </label>
          <Field label="Description">
            <textarea
              defaultValue={project.description ?? ''}
              onBlur={(e) => {
                if ((e.target.value || null) !== project.description) patch({ description: e.target.value || null });
              }}
              rows={4}
              className={inputCls}
            />
          </Field>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{savingPatch ? (<><Save className="inline h-3 w-3 mr-1" />Saving…</>) : 'Saved'}</span>
            <button onClick={remove} className="text-red-600 hover:text-red-700 inline-flex items-center">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </button>
          </div>
        </div>
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

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
