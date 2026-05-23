'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface Article { id: number; title: string; slug: string; excerpt: string | null; status: string; category_name: string | null; updated_at: string; view_count: number; }
interface Category { id: number; name: string; slug: string }

export default function KbPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<number | ''>('');

  async function load() {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (category) qs.set('category_id', String(category));
    const [a, c] = await Promise.all([
      fetch(`/api/kb/articles?${qs}`).then((r) => r.json()),
      fetch(`/api/kb/categories`).then((r) => r.json()),
    ]);
    setArticles(a.articles ?? []);
    setCategories(c.categories ?? []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [category]);

  return (
    <div className="space-y-6">
      <PageHeader title="Knowledge Base" subtitle="Internal docs, runbooks, client guides." />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Search articles…" className="w-full pl-9 pr-3 py-2 border rounded-md text-sm" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : '')} className="px-3 py-2 border rounded text-sm">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Link href="/kb/new" className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm">
          <Plus className="h-4 w-4" /> New article
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((a) => (
          <Link key={a.id} href={`/kb/${a.slug}`} className="block rounded-lg border bg-white p-4 hover:shadow transition">
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded ${a.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
              <span className="text-xs text-slate-400">{a.view_count} views</span>
            </div>
            <h3 className="mt-2 font-semibold text-slate-900">{a.title}</h3>
            {a.excerpt && <p className="mt-1 text-sm text-slate-600 line-clamp-3">{a.excerpt}</p>}
            <div className="mt-2 text-xs text-slate-400">{a.category_name ?? 'Uncategorised'} · updated {new Date(a.updated_at).toLocaleDateString()}</div>
          </Link>
        ))}
        {articles.length === 0 && <div className="text-slate-500">No articles yet.</div>}
      </div>
    </div>
  );
}
