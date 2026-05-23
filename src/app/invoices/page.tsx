'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface Row {
  id: number;
  invoice_number: string;
  contact_name: string | null;
  project_name: string | null;
  status: string;
  total: string;
  currency: string;
  issued_date: string | null;
  due_date: string | null;
  quickbooks_id: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-200 text-slate-600',
};

export default function InvoicesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const qs = new URLSearchParams();
    if (status) qs.set('status', status);
    if (search) qs.set('search', search);
    const r = await fetch(`/api/invoices?${qs.toString()}`);
    const d = await r.json();
    setRows(d.invoices ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  const totalOutstanding = rows
    .filter((r) => r.status === 'sent' || r.status === 'overdue')
    .reduce((s, r) => s + Number(r.total), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" subtitle="Bill clients and push to QuickBooks." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-slate-500">Outstanding</div>
          <div className="text-2xl font-semibold text-slate-900">${totalOutstanding.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-slate-500">Total invoices</div>
          <div className="text-2xl font-semibold text-slate-900">{rows.length}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-slate-500">Paid</div>
          <div className="text-2xl font-semibold text-slate-900">
            {rows.filter((r) => r.status === 'paid').length}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search invoice # or client…"
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm"
        >
          <Plus className="h-4 w-4" /> New invoice
        </Link>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">Invoice</th>
              <th className="px-4 py-2">Client</th>
              <th className="px-4 py-2">Project</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Issued</th>
              <th className="px-4 py-2">Due</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2">QBO</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={8}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={8}>No invoices yet.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">
                  <Link href={`/invoices/${r.id}`} className="text-teal-700 hover:underline">{r.invoice_number}</Link>
                </td>
                <td className="px-4 py-2">{r.contact_name ?? '—'}</td>
                <td className="px-4 py-2">{r.project_name ?? '—'}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[r.status] ?? 'bg-gray-100'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2">{r.issued_date ?? '—'}</td>
                <td className="px-4 py-2">{r.due_date ?? '—'}</td>
                <td className="px-4 py-2 text-right">{r.currency} {Number(r.total).toFixed(2)}</td>
                <td className="px-4 py-2 text-xs text-slate-500">{r.quickbooks_id ? `#${r.quickbooks_id}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
