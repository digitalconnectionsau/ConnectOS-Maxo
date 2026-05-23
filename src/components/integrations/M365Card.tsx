'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Mail, Plus, Trash2, RefreshCw, Unlink } from 'lucide-react';

interface Mailbox {
  id: number;
  address: string;
  display_name: string | null;
  enabled: boolean;
  last_polled_at: string | null;
  last_message_at: string | null;
  create_tickets: boolean;
}

interface M365Status {
  connected: boolean;
  tenant_id?: string;
  client_id?: string;
  last_error?: string | null;
  mailboxes: Mailbox[];
}

export default function M365Card() {
  const [status, setStatus] = useState<M365Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | 'connect' | 'disconnect' | 'add' | 'poll' | number>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const [newAddress, setNewAddress] = useState('');
  const [newDisplay, setNewDisplay] = useState('');
  const [createTickets, setCreateTickets] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/microsoft365/status');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('connect');
    setError(null);
    setInfo(null);
    try {
      const res = await fetch('/api/integrations/microsoft365/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, client_id: clientId, client_secret: clientSecret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect');
      setClientSecret('');
      setInfo('Microsoft 365 connected. Add a mailbox below to start ingesting email.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    if (!confirm('Disconnect Microsoft 365? Mailboxes will be retained but inactive.')) return;
    setBusy('disconnect');
    try {
      await fetch('/api/integrations/microsoft365/disconnect', { method: 'POST' });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const addMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim()) return;
    setBusy('add');
    setError(null);
    try {
      const res = await fetch('/api/integrations/microsoft365/mailboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: newAddress.trim(),
          display_name: newDisplay.trim() || null,
          create_tickets: createTickets,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to add mailbox');
      setNewAddress('');
      setNewDisplay('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add mailbox');
    } finally {
      setBusy(null);
    }
  };

  const removeMailbox = async (id: number) => {
    if (!confirm('Remove this mailbox? Existing tickets are kept.')) return;
    setBusy(id);
    try {
      await fetch(`/api/integrations/microsoft365/mailboxes?id=${id}`, { method: 'DELETE' });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const pollNow = async (id?: number) => {
    setBusy(id ?? 'poll');
    setError(null);
    setInfo(null);
    try {
      const res = await fetch('/api/integrations/microsoft365/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { mailbox_id: id } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Poll failed');
      const totals = data.results.reduce(
        (acc: { fetched: number; created: number; comments: number; errors: number }, r: any) => ({
          fetched: acc.fetched + r.fetched,
          created: acc.created + r.ticketsCreated,
          comments: acc.comments + r.commentsAdded,
          errors: acc.errors + r.errors.length,
        }),
        { fetched: 0, created: 0, comments: 0, errors: 0 }
      );
      setInfo(
        `Polled ${data.results.length} mailbox(es): ${totals.fetched} message(s), ` +
          `${totals.created} new ticket(s), ${totals.comments} comment(s) added` +
          (totals.errors ? `, ${totals.errors} error(s)` : '')
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Poll failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mr-4">
            <Mail className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Microsoft 365 Email</h3>
            <p className="text-sm text-gray-600">
              Poll a shared mailbox to create tickets and append replies automatically.
            </p>
          </div>
        </div>
        {loading ? (
          <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
        ) : status?.connected ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Connected
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
            <XCircle className="h-3.5 w-3.5 mr-1" /> Not connected
          </span>
        )}
      </div>

      <div className="p-6 space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
        )}
        {info && (
          <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">{info}</div>
        )}
        {status?.last_error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Last error: {status.last_error}
          </div>
        )}

        {/* Credentials form */}
        {!status?.connected ? (
          <form onSubmit={connect} className="space-y-3">
            <p className="text-xs text-gray-500">
              Create an Azure AD app with <span className="font-mono">Mail.ReadWrite</span> and{' '}
              <span className="font-mono">Mail.Send</span> application permissions, grant admin
              consent, then paste the credentials below.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Tenant ID" value={tenantId} onChange={setTenantId} required />
              <Input label="Client ID" value={clientId} onChange={setClientId} required />
              <div className="md:col-span-2">
                <Input label="Client Secret" value={clientSecret} onChange={setClientSecret} required type="password" />
              </div>
            </div>
            <button
              type="submit"
              disabled={busy !== null}
              className="inline-flex items-center bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {busy === 'connect' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Connect Microsoft 365
            </button>
          </form>
        ) : (
          <>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Tenant ID</dt>
                <dd className="text-gray-900 font-mono text-xs break-all">{status.tenant_id}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Client ID</dt>
                <dd className="text-gray-900 font-mono text-xs break-all">{status.client_id}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => pollNow()}
                disabled={busy !== null}
                className="inline-flex items-center bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {busy === 'poll' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Poll all mailboxes
              </button>
              <button
                onClick={disconnect}
                disabled={busy !== null}
                className="inline-flex items-center bg-white border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <Unlink className="h-4 w-4 mr-2" /> Disconnect
              </button>
            </div>

            {/* Mailbox list */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">Address</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-center">Creates tickets</th>
                    <th className="px-4 py-2 text-left">Last poll</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {status.mailboxes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-xs">
                        No mailboxes configured.
                      </td>
                    </tr>
                  ) : (
                    status.mailboxes.map((m) => (
                      <tr key={m.id}>
                        <td className="px-4 py-2 font-mono text-xs">{m.address}</td>
                        <td className="px-4 py-2">{m.display_name || '—'}</td>
                        <td className="px-4 py-2 text-center">{m.create_tickets ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-2 text-xs text-gray-600">
                          {m.last_polled_at ? new Date(m.last_polled_at).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => pollNow(m.id)}
                              disabled={busy !== null}
                              className="text-teal-600 hover:text-teal-700 disabled:opacity-50"
                              title="Poll this mailbox"
                            >
                              {busy === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => removeMailbox(m.id)}
                              disabled={busy !== null}
                              className="text-red-500 hover:text-red-600 disabled:opacity-50"
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add mailbox */}
            <form onSubmit={addMailbox} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <Input label="Mailbox address" value={newAddress} onChange={setNewAddress} required placeholder="support@example.com" />
              <Input label="Display name" value={newDisplay} onChange={setNewDisplay} placeholder="Support" />
              <label className="text-sm text-gray-700 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={createTickets}
                  onChange={(e) => setCreateTickets(e.target.checked)}
                />
                Create tickets
              </label>
              <button
                type="submit"
                disabled={busy !== null || !newAddress.trim()}
                className="inline-flex items-center justify-center bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {busy === 'add' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add mailbox
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </label>
  );
}
