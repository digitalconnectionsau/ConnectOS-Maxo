'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Loader2, Briefcase, Search } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface Project {
  id: number;
  name: string;
  code: string | null;
  client_name: string | null;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  hourly_rate: string | null;
  billable: boolean;
  color: string | null;
}

interface Contact {
  id: number;
  name: string;
}

const STATUS_STYLES: Record<Project['status'], string> = {
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-amber-100 text-amber-800',
  completed: 'bg-gray-100 text-gray-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [clientId, setClientId] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [billable, setBillable] = useState(true);

  const refresh = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/projects?${params.toString()}`);
    const data = await res.json();
    setProjects(data.projects ?? []);
  }, [statusFilter, search]);

  useEffect(() => {
    (async () => {
      try {
        await refresh();
        const r = await fetch('/api/contacts');
        if (r.ok) {
          const d = await r.json();
          setContacts(d.contacts ?? d ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  useEffect(() => {
    const t = setTimeout(refresh, 250);
    return () => clearTimeout(t);
  }, [search, statusFilter, refresh]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || null,
          client_contact_id: clientId ? Number(clientId) : null,
          hourly_rate: hourlyRate ? Number(hourlyRate) : null,
          billable,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setName(''); setCode(''); setClientId(''); setHourlyRate(''); setBillable(true);
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Track client engagements and the work done against them"
        breadcrumbs={[{ label: 'Projects' }]}
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="on_hold">On hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="ml-auto inline-flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="h-4 w-4 mr-1" /> New project
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Name" required>
              <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
            </Field>
            <Field label="Code (optional)">
              <input value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Client">
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputCls}>
                <option value="">— None —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Hourly rate">
              <input
                type="number" step="0.01" min="0"
                value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
            Billable by default
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {submitting ? 'Saving…' : 'Create project'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" /></div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Briefcase className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            No projects yet
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Project</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Rate</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.id}`} className="text-teal-700 hover:text-teal-800 font-medium">
                      {p.name}
                    </Link>
                    {p.code && <span className="ml-2 text-xs text-gray-500">{p.code}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.client_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {p.hourly_rate ? `$${Number(p.hourly_rate).toFixed(2)}/hr` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.status]}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
