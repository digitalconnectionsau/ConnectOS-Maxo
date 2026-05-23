'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';

export default function OpenAiCard() {
  const [status, setStatus] = useState<{ connected: boolean; model: string } | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const r = await fetch('/api/integrations/openai');
    const d = await r.json();
    setStatus(d); setModel(d.model);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!apiKey) { setMsg('API key required.'); return; }
    setSaving(true); setMsg(null);
    const r = await fetch('/api/integrations/openai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, model }),
    });
    setSaving(false);
    if (r.ok) { setApiKey(''); setMsg('Saved.'); load(); }
    else setMsg('Save failed.');
  }

  async function disconnect() {
    if (!confirm('Disconnect OpenAI?')) return;
    await fetch('/api/integrations/openai', { method: 'DELETE' });
    load();
  }

  return (
    <div className="rounded-lg border bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-600" />
          <h3 className="font-semibold text-slate-900">OpenAI (AI assists)</h3>
        </div>
        {status?.connected && <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Connected</span>}
      </div>
      <p className="text-sm text-slate-600 mt-1">Powers ticket draft replies and summaries. Key is encrypted at rest.</p>

      <div className="mt-4 space-y-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={status?.connected ? '••• replace key (optional)' : 'sk-...'}
          className="w-full px-3 py-2 border rounded text-sm"
        />
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="gpt-4o-mini"
          className="w-full px-3 py-2 border rounded text-sm font-mono"
        />
        <div className="flex gap-2">
          <button disabled={saving} onClick={save} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm disabled:opacity-50">
            {status?.connected ? 'Update' : 'Connect'}
          </button>
          {status?.connected && (
            <button onClick={disconnect} className="inline-flex items-center gap-1 px-3 py-2 border border-red-200 text-red-700 rounded text-sm">
              <Trash2 className="h-4 w-4" /> Disconnect
            </button>
          )}
        </div>
        {msg && <div className="text-xs text-slate-500">{msg}</div>}
      </div>
    </div>
  );
}
