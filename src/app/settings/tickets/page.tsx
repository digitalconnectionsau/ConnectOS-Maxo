'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface Status {
  id: number;
  name: string;
  color: string;
  sort_order: number;
  is_closed: boolean;
  is_default: boolean;
}
interface Priority {
  id: number;
  name: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  default_response_minutes: number | null;
  default_resolution_minutes: number | null;
}
interface SlaPolicy {
  id: number;
  name: string;
  description: string | null;
  response_minutes: number;
  resolution_minutes: number;
  is_default: boolean;
}

// New-row blanks (id=0 marks "not yet saved")
const NEW_STATUS: Omit<Status, 'id'> = { name: '', color: '#6B7280', sort_order: 100, is_closed: false, is_default: false };
const NEW_PRIORITY: Omit<Priority, 'id'> = { name: '', color: '#6B7280', sort_order: 100, is_default: false, default_response_minutes: null, default_resolution_minutes: null };
const NEW_SLA: Omit<SlaPolicy, 'id'> = { name: '', description: '', response_minutes: 240, resolution_minutes: 1440, is_default: false };

export default function TicketSettingsPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [slas, setSlas] = useState<SlaPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [s, p, sl] = await Promise.all([
      fetch('/api/settings/ticket-statuses').then((r) => r.json()),
      fetch('/api/settings/ticket-priorities').then((r) => r.json()),
      fetch('/api/settings/sla-policies').then((r) => r.json()),
    ]);
    setStatuses(s);
    setPriorities(p);
    setSlas(sl);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div>
      <PageHeader
        title="Ticket Settings"
        subtitle="Manage statuses, priorities, and SLA policies"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }, { label: 'Tickets' }]}
      />

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" /></div>
      ) : (
        <div className="mt-6 space-y-8">
          <StatusesSection rows={statuses} reload={loadAll} />
          <PrioritiesSection rows={priorities} reload={loadAll} />
          <SlasSection rows={slas} reload={loadAll} />
        </div>
      )}
    </div>
  );
}

/* ---------- Statuses ---------- */
function StatusesSection({ rows, reload }: { rows: Status[]; reload: () => Promise<void> }) {
  const [draft, setDraft] = useState(NEW_STATUS);

  const save = async (row: Status) => {
    await fetch(`/api/settings/ticket-statuses/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    });
    await reload();
  };
  const del = async (id: number) => {
    if (!confirm('Delete this status?')) return;
    await fetch(`/api/settings/ticket-statuses/${id}`, { method: 'DELETE' });
    await reload();
  };
  const create = async () => {
    if (!draft.name.trim()) return;
    await fetch('/api/settings/ticket-statuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setDraft(NEW_STATUS);
    await reload();
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Statuses</h2>
        <p className="text-sm text-gray-500">Mark a status as <em>closed</em> to stop SLA timers and treat tickets as done.</p>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <Th>Name</Th><Th>Color</Th><Th>Order</Th><Th center>Closed</Th><Th center>Default</Th><Th />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((s) => (
            <StatusRow key={s.id} row={s} onSave={save} onDelete={del} />
          ))}
          <tr className="bg-gray-50">
            <Td><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="New status..." className="w-full border border-gray-200 rounded px-2 py-1" /></Td>
            <Td><input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className="h-8 w-12" /></Td>
            <Td><input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} className="w-20 border border-gray-200 rounded px-2 py-1" /></Td>
            <Td center><input type="checkbox" checked={draft.is_closed} onChange={(e) => setDraft({ ...draft, is_closed: e.target.checked })} /></Td>
            <Td center><input type="checkbox" checked={draft.is_default} onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })} /></Td>
            <Td><button onClick={create} className="text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Add</button></Td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function StatusRow({ row, onSave, onDelete }: { row: Status; onSave: (r: Status) => Promise<void>; onDelete: (id: number) => Promise<void> }) {
  const [r, setR] = useState(row);
  const dirty = JSON.stringify(r) !== JSON.stringify(row);
  return (
    <tr>
      <Td><input value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1" /></Td>
      <Td><input type="color" value={r.color} onChange={(e) => setR({ ...r, color: e.target.value })} className="h-8 w-12" /></Td>
      <Td><input type="number" value={r.sort_order} onChange={(e) => setR({ ...r, sort_order: Number(e.target.value) })} className="w-20 border border-gray-200 rounded px-2 py-1" /></Td>
      <Td center><input type="checkbox" checked={r.is_closed} onChange={(e) => setR({ ...r, is_closed: e.target.checked })} /></Td>
      <Td center><input type="checkbox" checked={r.is_default} onChange={(e) => setR({ ...r, is_default: e.target.checked })} /></Td>
      <Td>
        <div className="flex gap-2 justify-end">
          {dirty && <button onClick={() => onSave(r)} className="text-teal-600 hover:text-teal-700"><Save className="h-4 w-4" /></button>}
          <button onClick={() => onDelete(row.id)} className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      </Td>
    </tr>
  );
}

/* ---------- Priorities ---------- */
function PrioritiesSection({ rows, reload }: { rows: Priority[]; reload: () => Promise<void> }) {
  const [draft, setDraft] = useState(NEW_PRIORITY);

  const save = async (row: Priority) => {
    await fetch(`/api/settings/ticket-priorities/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    });
    await reload();
  };
  const del = async (id: number) => {
    if (!confirm('Delete this priority?')) return;
    await fetch(`/api/settings/ticket-priorities/${id}`, { method: 'DELETE' });
    await reload();
  };
  const create = async () => {
    if (!draft.name.trim()) return;
    await fetch('/api/settings/ticket-priorities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setDraft(NEW_PRIORITY);
    await reload();
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Priorities</h2>
        <p className="text-sm text-gray-500">Default response/resolution minutes are used when no SLA policy is attached.</p>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <Th>Name</Th><Th>Color</Th><Th>Order</Th><Th center>Default</Th><Th>Response (min)</Th><Th>Resolution (min)</Th><Th />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((p) => (
            <PriorityRow key={p.id} row={p} onSave={save} onDelete={del} />
          ))}
          <tr className="bg-gray-50">
            <Td><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="New priority..." className="w-full border border-gray-200 rounded px-2 py-1" /></Td>
            <Td><input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className="h-8 w-12" /></Td>
            <Td><input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} className="w-20 border border-gray-200 rounded px-2 py-1" /></Td>
            <Td center><input type="checkbox" checked={draft.is_default} onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })} /></Td>
            <Td><input type="number" value={draft.default_response_minutes ?? ''} onChange={(e) => setDraft({ ...draft, default_response_minutes: e.target.value ? Number(e.target.value) : null })} className="w-24 border border-gray-200 rounded px-2 py-1" /></Td>
            <Td><input type="number" value={draft.default_resolution_minutes ?? ''} onChange={(e) => setDraft({ ...draft, default_resolution_minutes: e.target.value ? Number(e.target.value) : null })} className="w-24 border border-gray-200 rounded px-2 py-1" /></Td>
            <Td><button onClick={create} className="text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Add</button></Td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function PriorityRow({ row, onSave, onDelete }: { row: Priority; onSave: (r: Priority) => Promise<void>; onDelete: (id: number) => Promise<void> }) {
  const [r, setR] = useState(row);
  const dirty = JSON.stringify(r) !== JSON.stringify(row);
  return (
    <tr>
      <Td><input value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1" /></Td>
      <Td><input type="color" value={r.color} onChange={(e) => setR({ ...r, color: e.target.value })} className="h-8 w-12" /></Td>
      <Td><input type="number" value={r.sort_order} onChange={(e) => setR({ ...r, sort_order: Number(e.target.value) })} className="w-20 border border-gray-200 rounded px-2 py-1" /></Td>
      <Td center><input type="checkbox" checked={r.is_default} onChange={(e) => setR({ ...r, is_default: e.target.checked })} /></Td>
      <Td><input type="number" value={r.default_response_minutes ?? ''} onChange={(e) => setR({ ...r, default_response_minutes: e.target.value ? Number(e.target.value) : null })} className="w-24 border border-gray-200 rounded px-2 py-1" /></Td>
      <Td><input type="number" value={r.default_resolution_minutes ?? ''} onChange={(e) => setR({ ...r, default_resolution_minutes: e.target.value ? Number(e.target.value) : null })} className="w-24 border border-gray-200 rounded px-2 py-1" /></Td>
      <Td>
        <div className="flex gap-2 justify-end">
          {dirty && <button onClick={() => onSave(r)} className="text-teal-600 hover:text-teal-700"><Save className="h-4 w-4" /></button>}
          <button onClick={() => onDelete(row.id)} className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      </Td>
    </tr>
  );
}

/* ---------- SLA Policies ---------- */
function SlasSection({ rows, reload }: { rows: SlaPolicy[]; reload: () => Promise<void> }) {
  const [draft, setDraft] = useState(NEW_SLA);

  const save = async (row: SlaPolicy) => {
    await fetch(`/api/settings/sla-policies/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    });
    await reload();
  };
  const del = async (id: number) => {
    if (!confirm('Delete this SLA policy?')) return;
    await fetch(`/api/settings/sla-policies/${id}`, { method: 'DELETE' });
    await reload();
  };
  const create = async () => {
    if (!draft.name.trim()) return;
    await fetch('/api/settings/sla-policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setDraft(NEW_SLA);
    await reload();
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">SLA Policies</h2>
        <p className="text-sm text-gray-500">Applied to a ticket on creation. Times are in minutes from when the ticket is opened.</p>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <Th>Name</Th><Th>Description</Th><Th>Response (min)</Th><Th>Resolution (min)</Th><Th center>Default</Th><Th />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((s) => (
            <SlaRow key={s.id} row={s} onSave={save} onDelete={del} />
          ))}
          <tr className="bg-gray-50">
            <Td><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="New policy..." className="w-full border border-gray-200 rounded px-2 py-1" /></Td>
            <Td><input value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1" /></Td>
            <Td><input type="number" value={draft.response_minutes} onChange={(e) => setDraft({ ...draft, response_minutes: Number(e.target.value) })} className="w-24 border border-gray-200 rounded px-2 py-1" /></Td>
            <Td><input type="number" value={draft.resolution_minutes} onChange={(e) => setDraft({ ...draft, resolution_minutes: Number(e.target.value) })} className="w-24 border border-gray-200 rounded px-2 py-1" /></Td>
            <Td center><input type="checkbox" checked={draft.is_default} onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })} /></Td>
            <Td><button onClick={create} className="text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Add</button></Td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function SlaRow({ row, onSave, onDelete }: { row: SlaPolicy; onSave: (r: SlaPolicy) => Promise<void>; onDelete: (id: number) => Promise<void> }) {
  const [r, setR] = useState(row);
  const dirty = JSON.stringify(r) !== JSON.stringify(row);
  return (
    <tr>
      <Td><input value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1" /></Td>
      <Td><input value={r.description ?? ''} onChange={(e) => setR({ ...r, description: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1" /></Td>
      <Td><input type="number" value={r.response_minutes} onChange={(e) => setR({ ...r, response_minutes: Number(e.target.value) })} className="w-24 border border-gray-200 rounded px-2 py-1" /></Td>
      <Td><input type="number" value={r.resolution_minutes} onChange={(e) => setR({ ...r, resolution_minutes: Number(e.target.value) })} className="w-24 border border-gray-200 rounded px-2 py-1" /></Td>
      <Td center><input type="checkbox" checked={r.is_default} onChange={(e) => setR({ ...r, is_default: e.target.checked })} /></Td>
      <Td>
        <div className="flex gap-2 justify-end">
          {dirty && <button onClick={() => onSave(r)} className="text-teal-600 hover:text-teal-700"><Save className="h-4 w-4" /></button>}
          <button onClick={() => onDelete(row.id)} className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      </Td>
    </tr>
  );
}

/* ---------- Small layout helpers ---------- */
function Th({ children, center }: { children?: React.ReactNode; center?: boolean }) {
  return <th className={`px-4 py-3 ${center ? 'text-center' : 'text-left'} font-medium`}>{children}</th>;
}
function Td({ children, center }: { children?: React.ReactNode; center?: boolean }) {
  return <td className={`px-4 py-2 align-middle ${center ? 'text-center' : ''}`}>{children}</td>;
}
