'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, RefreshCw, Link2, Unlink } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import M365Card from '@/components/integrations/M365Card';
import OpenAiCard from '@/components/integrations/OpenAiCard';

interface QboStatus {
  connected: boolean;
  environment: 'sandbox' | 'production' | null;
  realmId: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  expiresAt: string | null;
}

function IntegrationsPageInner() {
  const params = useSearchParams();
  const oauthResult = params.get('qbo');                  // 'success' | 'error' | null
  const oauthMessage = params.get('message');

  const [status, setStatus] = useState<QboStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | 'connect' | 'disconnect' | 'sync'>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    oauthResult === 'error' ? (oauthMessage || 'Connection failed') : null
  );

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/quickbooks/status');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load status');
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const connect = async () => {
    setBusy('connect');
    setError(null);
    try {
      const res = await fetch('/api/integrations/quickbooks/connect', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start OAuth flow');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start connection');
      setBusy(null);
    }
  };

  const disconnect = async () => {
    if (!confirm('Disconnect QuickBooks? You can reconnect at any time.')) return;
    setBusy('disconnect');
    setError(null);
    try {
      const res = await fetch('/api/integrations/quickbooks/disconnect', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to disconnect');
      }
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setBusy(null);
    }
  };

  const syncCustomers = async () => {
    setBusy('sync');
    setError(null);
    setSyncResult(null);
    try {
      const res = await fetch('/api/integrations/quickbooks/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      setSyncResult(
        `Customers — ${data.customers.fetched} fetched (${data.customers.inserted} new, ${data.customers.updated} updated). ` +
          `Products — ${data.products.fetched} fetched (${data.products.inserted} new, ${data.products.updated} updated).`
      );
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Integrations"
        subtitle="Connect ClientHub to your other business systems"
        breadcrumbs={[{ label: 'Settings' }, { label: 'Integrations' }]}
      />

      <div className="mt-6 space-y-6">
        {oauthResult === 'success' && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            QuickBooks connected successfully.
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {syncResult && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            {syncResult}
          </div>
        )}

        {/* QuickBooks card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mr-4">
                <Link2 className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">QuickBooks Online</h3>
                <p className="text-sm text-gray-600">
                  Sync customers, products and invoices with QuickBooks.
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

          <div className="p-6 space-y-4">
            {status?.connected && (
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Environment</dt>
                  <dd className="text-gray-900 font-medium capitalize">{status.environment}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Realm ID</dt>
                  <dd className="text-gray-900 font-mono text-xs break-all">{status.realmId}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Last sync</dt>
                  <dd className="text-gray-900">
                    {status.lastSyncAt
                      ? new Date(status.lastSyncAt).toLocaleString()
                      : 'Never'}
                  </dd>
                </div>
              </dl>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {status?.connected ? (
                <>
                  <button
                    onClick={syncCustomers}
                    disabled={busy !== null}
                    className="inline-flex items-center bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {busy === 'sync' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sync from QuickBooks
                  </button>
                  <button
                    onClick={disconnect}
                    disabled={busy !== null}
                    className="inline-flex items-center bg-white border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={connect}
                  disabled={busy !== null || loading}
                  className="inline-flex items-center bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {busy === 'connect' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Connect to QuickBooks
                </button>
              )}
            </div>

            {status?.lastError && (
              <p className="text-xs text-red-600 pt-2">Last error: {status.lastError}</p>
            )}
          </div>
        </div>

        <M365Card />
        <OpenAiCard />
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading…</div>}>
      <IntegrationsPageInner />
    </Suspense>
  );
}
