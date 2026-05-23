'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';

interface Category { id: number; name: string }

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/kb/categories').then((r) => r.json()).then((d) => setCategories(d.categories ?? []));
  }, []);

  async function save() {
    if (!title.trim()) { setErr('Title is required'); return; }
    setSaving(true); setErr(null);
    const r = await fetch('/api/kb/articles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, excerpt, body, status, category_id: categoryId || null }),
    });
    setSaving(false);
    const d = await r.json();
    if (!r.ok) { setErr(d.error || 'Failed'); return; }
    router.push(`/kb/${d.article.slug}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New article" breadcrumbs={[{ label: 'Knowledge Base', href: '/kb' }, { label: 'New' }]} />
      {err && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 border rounded text-lg font-medium" />
      <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short excerpt (shown in listings)" className="w-full px-3 py-2 border rounded text-sm" />

      <div className="flex gap-3">
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')} className="px-3 py-2 border rounded text-sm">
          <option value="">Uncategorised</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className="px-3 py-2 border rounded text-sm">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <textarea
        value={body} onChange={(e) => setBody(e.target.value)}
        placeholder="Body (Markdown supported)"
        rows={20}
        className="w-full px-3 py-2 border rounded font-mono text-sm"
      />

      <div className="flex gap-2">
        <button disabled={saving} onClick={save} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded disabled:opacity-50">
          Save
        </button>
        <Link href="/kb" className="px-4 py-2 border rounded">Cancel</Link>
      </div>
    </div>
  );
}
