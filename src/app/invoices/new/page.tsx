'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Save } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface ContactOption { id: number; name: string; sync_to_quickbooks?: boolean }
interface ProjectOption { id: number; name: string; hourly_rate: string | null; client_contact_id: number | null }

interface Line { description: string; quantity: number; unit_price: number; tax_amount: number }

export default function NewInvoicePage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [contactId, setContactId] = useState<number | ''>('');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [issued, setIssued] = useState<string>(new Date().toISOString().slice(0, 10));
  const [due, setDue] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([{ description: '', quantity: 1, unit_price: 0, tax_amount: 0 }]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [cR, pR] = await Promise.all([
        fetch('/api/contacts').then((r) => r.json()),
        fetch('/api/projects').then((r) => r.json()),
      ]);
      setContacts(cR.contacts ?? cR ?? []);
      setProjects(pR.projects ?? pR ?? []);
    })();
  }, []);

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function addLine() { setLines((p) => [...p, { description: '', quantity: 1, unit_price: 0, tax_amount: 0 }]); }
  function removeLine(idx: number) { setLines((p) => p.filter((_, i) => i !== idx)); }

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const tax = lines.reduce((s, l) => s + (l.tax_amount || 0), 0);
  const total = subtotal + tax;

  async function pullFromTime() {
    if (!projectId) { setErr('Pick a project first to load unbilled time.'); return; }
    setErr(null);
    const r = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: contactId || null,
        from_project_id: projectId,
        project_id: projectId,
        status: 'draft',
        issued_date: issued, due_date: due || null, notes,
      }),
    });
    const d = await r.json();
    if (!r.ok) { setErr(d.error || 'Failed'); return; }
    router.push(`/invoices/${d.invoice.id}`);
  }

  async function save() {
    if (!contactId) { setErr('Pick a client.'); return; }
    if (!lines.some((l) => l.description.trim())) { setErr('Add at least one line.'); return; }
    setSaving(true); setErr(null);
    const r = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_id: contactId,
        project_id: projectId || null,
        status: 'draft',
        issued_date: issued, due_date: due || null, notes,
        items: lines.filter((l) => l.description.trim()),
      }),
    });
    setSaving(false);
    const d = await r.json();
    if (!r.ok) { setErr(d.error || 'Failed'); return; }
    router.push(`/invoices/${d.invoice.id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New invoice" breadcrumbs={[{ label: 'Invoices', href: '/invoices' }, { label: 'New' }]} />
      {err && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm">
          <div className="text-slate-600 mb-1">Client</div>
          <select className="w-full px-3 py-2 border rounded-md" value={contactId} onChange={(e) => setContactId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Select…</option>
            {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.sync_to_quickbooks ? '  · QBO' : ''}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <div className="text-slate-600 mb-1">Project (optional)</div>
          <select className="w-full px-3 py-2 border rounded-md" value={projectId} onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">—</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <div className="text-slate-600 mb-1">Issued</div>
          <input type="date" className="w-full px-3 py-2 border rounded-md" value={issued} onChange={(e) => setIssued(e.target.value)} />
        </label>
        <label className="text-sm">
          <div className="text-slate-600 mb-1">Due</div>
          <input type="date" className="w-full px-3 py-2 border rounded-md" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-slate-900">Line items</h2>
          <div className="flex gap-2">
            <button onClick={pullFromTime} className="px-3 py-1.5 text-sm border rounded text-teal-700 border-teal-200 hover:bg-teal-50">
              Bill unbilled time from project
            </button>
            <button onClick={addLine} className="px-3 py-1.5 text-sm border rounded inline-flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add line
            </button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-600 bg-slate-50">
            <tr>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2 w-20">Qty</th>
              <th className="px-3 py-2 w-28">Unit</th>
              <th className="px-3 py-2 w-28">Tax</th>
              <th className="px-3 py-2 w-28 text-right">Line total</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-1.5">
                  <input className="w-full px-2 py-1 border rounded" value={l.description} onChange={(e) => updateLine(i, { description: e.target.value })} />
                </td>
                <td className="px-3 py-1.5">
                  <input type="number" step="0.01" className="w-full px-2 py-1 border rounded" value={l.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} />
                </td>
                <td className="px-3 py-1.5">
                  <input type="number" step="0.01" className="w-full px-2 py-1 border rounded" value={l.unit_price} onChange={(e) => updateLine(i, { unit_price: Number(e.target.value) })} />
                </td>
                <td className="px-3 py-1.5">
                  <input type="number" step="0.01" className="w-full px-2 py-1 border rounded" value={l.tax_amount} onChange={(e) => updateLine(i, { tax_amount: Number(e.target.value) })} />
                </td>
                <td className="px-3 py-1.5 text-right">{(l.quantity * l.unit_price + (l.tax_amount || 0)).toFixed(2)}</td>
                <td className="pr-3">
                  <button onClick={() => removeLine(i)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50">
            <tr><td className="px-3 py-2 text-right" colSpan={4}>Subtotal</td><td className="px-3 py-2 text-right">{subtotal.toFixed(2)}</td><td/></tr>
            <tr><td className="px-3 py-2 text-right" colSpan={4}>Tax</td><td className="px-3 py-2 text-right">{tax.toFixed(2)}</td><td/></tr>
            <tr><td className="px-3 py-2 text-right font-semibold" colSpan={4}>Total</td><td className="px-3 py-2 text-right font-semibold">{total.toFixed(2)}</td><td/></tr>
          </tfoot>
        </table>
      </div>

      <label className="block text-sm">
        <div className="text-slate-600 mb-1">Notes</div>
        <textarea className="w-full px-3 py-2 border rounded-md" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <div className="flex gap-2">
        <button disabled={saving} onClick={save} className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded disabled:opacity-50">
          <Save className="h-4 w-4" /> Save draft
        </button>
        <Link href="/invoices" className="px-4 py-2 border rounded">Cancel</Link>
      </div>
    </div>
  );
}
