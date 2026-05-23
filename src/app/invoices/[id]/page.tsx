'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send, Upload, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface Invoice {
  id: number;
  invoice_number: string;
  status: string;
  subtotal: string;
  tax_amount: string;
  total: string;
  currency: string;
  contact_id: number | null;
  contact_name: string | null;
  project_id: number | null;
  project_name: string | null;
  issued_date: string | null;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  quickbooks_id: string | null;
  last_synced_at: string | null;
}
interface Item {
  id: number; description: string; quantity_decimal: string | null; quantity: number;
  unit_price: string; tax_amount: string | null; total: string;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch(`/api/invoices/${id}`);
    const d = await r.json();
    setInv(d.invoice);
    setItems(d.items ?? []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function patch(body: Record<string, unknown>) {
    setBusy(true); setMsg(null);
    const r = await fetch(`/api/invoices/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setBusy(false);
    const d = await r.json();
    if (!r.ok) { setMsg(d.error || 'Failed'); return; }
    setInv(d.invoice);
  }

  async function pushToQbo() {
    setBusy(true); setMsg(null);
    const r = await fetch(`/api/invoices/${id}/push-qbo`, { method: 'POST' });
    setBusy(false);
    const d = await r.json();
    if (!r.ok) { setMsg(d.error || 'Push failed'); return; }
    setMsg(`Pushed to QuickBooks (id ${d.quickbooks_id}).`);
    load();
  }

  async function del() {
    if (!confirm('Delete this invoice?')) return;
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    router.push('/invoices');
  }

  if (!inv) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={inv.invoice_number}
        subtitle={inv.contact_name ?? '—'}
        breadcrumbs={[{ label: 'Invoices', href: '/invoices' }, { label: inv.invoice_number }]}
      />
      {msg && <div className="rounded border px-3 py-2 text-sm bg-amber-50 border-amber-200 text-amber-800">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Unit</th>
                  <th className="px-4 py-2 text-right">Tax</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="px-4 py-2">{it.description}</td>
                    <td className="px-4 py-2 text-right">{Number(it.quantity_decimal ?? it.quantity).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{Number(it.unit_price).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{Number(it.tax_amount ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{Number(it.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr><td className="px-4 py-2 text-right" colSpan={4}>Subtotal</td><td className="px-4 py-2 text-right">{Number(inv.subtotal).toFixed(2)}</td></tr>
                <tr><td className="px-4 py-2 text-right" colSpan={4}>Tax</td><td className="px-4 py-2 text-right">{Number(inv.tax_amount).toFixed(2)}</td></tr>
                <tr><td className="px-4 py-2 text-right font-semibold" colSpan={4}>Total ({inv.currency})</td><td className="px-4 py-2 text-right font-semibold">{Number(inv.total).toFixed(2)}</td></tr>
              </tfoot>
            </table>
          </div>

          {inv.notes && (
            <div className="rounded-lg border bg-white p-4">
              <h3 className="text-sm font-medium text-slate-700 mb-1">Notes</h3>
              <p className="text-sm whitespace-pre-wrap">{inv.notes}</p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-white p-4 space-y-2 text-sm">
            <div><span className="text-slate-500">Status:</span> <strong>{inv.status}</strong></div>
            <div><span className="text-slate-500">Issued:</span> {inv.issued_date ?? '—'}</div>
            <div><span className="text-slate-500">Due:</span> {inv.due_date ?? '—'}</div>
            <div><span className="text-slate-500">Paid:</span> {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : '—'}</div>
            <div><span className="text-slate-500">Project:</span> {inv.project_name ? <Link className="text-teal-700 hover:underline" href={`/projects/${inv.project_id}`}>{inv.project_name}</Link> : '—'}</div>
            <div><span className="text-slate-500">QBO:</span> {inv.quickbooks_id ?? '—'}</div>
            <div><span className="text-slate-500">Last synced:</span> {inv.last_synced_at ? new Date(inv.last_synced_at).toLocaleString() : '—'}</div>
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-2">
            <button disabled={busy || inv.status === 'sent'} onClick={() => patch({ status: 'sent' })} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50">
              <Send className="h-4 w-4" /> Mark as sent
            </button>
            <button disabled={busy || inv.status === 'paid'} onClick={() => patch({ status: 'paid' })} className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm disabled:opacity-50">
              Mark as paid
            </button>
            <button disabled={busy} onClick={pushToQbo} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-teal-200 text-teal-700 hover:bg-teal-50 rounded text-sm disabled:opacity-50">
              <Upload className="h-4 w-4" /> {inv.quickbooks_id ? 'Re-push to QuickBooks' : 'Push to QuickBooks'}
            </button>
            <button disabled={busy} onClick={del} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-700 hover:bg-red-50 rounded text-sm">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
