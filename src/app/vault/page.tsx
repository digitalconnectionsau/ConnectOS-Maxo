'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Eye, EyeOff, Copy, Trash2, KeyRound, ExternalLink } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface Item {
  id: number; name: string; item_type: string; username: string | null;
  url: string | null; folder: string | null; tags: string[] | null;
  has_password: boolean; has_notes: boolean; updated_at: string;
}

export default function VaultPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [revealed, setRevealed] = useState<Record<number, { password: string | null; notes: string | null }>>({});
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', password: '', url: '', folder: '', notes: '' });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    const r = await fetch(`/api/vault?${qs.toString()}`);
    const d = await r.json();
    setItems(d.items ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function reveal(id: number) {
    if (revealed[id]) {
      setRevealed((p) => { const c = { ...p }; delete c[id]; return c; });
      return;
    }
    const r = await fetch(`/api/vault/${id}/reveal`, { method: 'POST' });
    if (!r.ok) return;
    const d = await r.json();
    setRevealed((p) => ({ ...p, [id]: { password: d.item.password, notes: d.item.notes } }));
  }

  async function copy(text: string | null) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
  }

  async function save() {
    if (!form.name.trim()) return;
    const r = await fetch('/api/vault', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      setForm({ name: '', username: '', password: '', url: '', folder: '', notes: '' });
      setCreating(false);
      load();
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this credential?')) return;
    await fetch(`/api/vault/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Password Vault" subtitle="Encrypted at rest. Every reveal is audited." />

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Search name, user, URL…" className="w-full pl-9 pr-3 py-2 border rounded-md text-sm" />
        </div>
        <button onClick={() => setCreating((v) => !v)} className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm">
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      {creating && (
        <div className="rounded-lg border bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input placeholder="Name *" className="px-3 py-2 border rounded text-sm md:col-span-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Username" className="px-3 py-2 border rounded text-sm" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input placeholder="Password" type="password" className="px-3 py-2 border rounded text-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input placeholder="URL" className="px-3 py-2 border rounded text-sm" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <input placeholder="Folder (optional)" className="px-3 py-2 border rounded text-sm" value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })} />
          <textarea placeholder="Notes (encrypted)" className="px-3 py-2 border rounded text-sm md:col-span-2" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="md:col-span-2 flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm">Save</button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Username</th>
              <th className="px-4 py-2">Password</th>
              <th className="px-4 py-2">URL</th>
              <th className="px-4 py-2">Folder</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={6}>Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={6}>No items.</td></tr>
            ) : items.map((it) => (
              <tr key={it.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2 font-medium flex items-center gap-2"><KeyRound className="h-4 w-4 text-slate-400" /> {it.name}</td>
                <td className="px-4 py-2">
                  <span className="font-mono">{it.username ?? '—'}</span>
                  {it.username && <button onClick={() => copy(it.username)} className="ml-2 text-slate-400 hover:text-slate-700"><Copy className="h-3.5 w-3.5 inline" /></button>}
                </td>
                <td className="px-4 py-2">
                  {it.has_password ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{revealed[it.id]?.password ?? '••••••••'}</span>
                      <button onClick={() => reveal(it.id)} className="text-slate-400 hover:text-slate-700" title="Reveal (audited)">
                        {revealed[it.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {revealed[it.id]?.password && (
                        <button onClick={() => copy(revealed[it.id].password)} className="text-slate-400 hover:text-slate-700" title="Copy"><Copy className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-2">
                  {it.url ? <a href={it.url} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline inline-flex items-center gap-1">{it.url} <ExternalLink className="h-3 w-3" /></a> : '—'}
                </td>
                <td className="px-4 py-2 text-slate-500">{it.folder ?? '—'}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => remove(it.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
