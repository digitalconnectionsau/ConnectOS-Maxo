'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import { Edit, Save, Trash2, X } from 'lucide-react';

interface Article {
  id: number; title: string; slug: string; body: string; excerpt: string | null;
  status: string; visibility: string; category_name: string | null; view_count: number;
  updated_at: string; published_at: string | null;
}

// Minimal markdown renderer. No external deps — handles headings, bold, italic, code, lists, paragraphs, links.
function renderMarkdown(md: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let html = esc(md);
  html = html.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre class="bg-slate-900 text-slate-100 rounded p-3 overflow-auto text-sm"><code>${code}</code></pre>`);
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 rounded">$1</code>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-5">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6">$1</h1>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-teal-700 hover:underline" target="_blank" rel="noreferrer">$1</a>');
  html = html.replace(/^(?:- |\* )(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul class="list-disc ml-6 my-2">${m}</ul>`);
  html = html.split(/\n\n+/).map((b) => /^<(h\d|ul|pre|p|blockquote)/.test(b.trim()) ? b : `<p class="my-2">${b.replace(/\n/g, '<br/>')}</p>`).join('\n');
  return html;
}

export default function KbArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{ title: string; body: string; excerpt: string; status: string }>({ title: '', body: '', excerpt: '', status: 'draft' });

  async function load() {
    const r = await fetch(`/api/kb/articles/${slug}`);
    if (!r.ok) { setArticle(null); return; }
    const d = await r.json();
    setArticle(d.article);
    setForm({ title: d.article.title, body: d.article.body, excerpt: d.article.excerpt ?? '', status: d.article.status });
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug]);

  async function save() {
    if (!article) return;
    const r = await fetch(`/api/kb/articles/${article.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    if (r.ok) { const d = await r.json(); setArticle(d.article); setEditing(false); }
  }

  async function del() {
    if (!article) return;
    if (!confirm('Delete this article?')) return;
    await fetch(`/api/kb/articles/${article.id}`, { method: 'DELETE' });
    router.push('/kb');
  }

  if (!article) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={article.title}
        breadcrumbs={[{ label: 'Knowledge Base', href: '/kb' }, { label: article.title }]}
        subtitle={`${article.category_name ?? 'Uncategorised'} · ${article.status} · ${article.view_count} views`}
      />

      <div className="flex gap-2">
        {!editing ? (
          <>
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 px-3 py-1.5 border rounded text-sm"><Edit className="h-4 w-4" /> Edit</button>
            <button onClick={del} className="inline-flex items-center gap-2 px-3 py-1.5 border border-red-200 text-red-700 rounded text-sm"><Trash2 className="h-4 w-4" /> Delete</button>
            <Link href="/kb" className="px-3 py-1.5 border rounded text-sm">Back</Link>
          </>
        ) : (
          <>
            <button onClick={save} className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm"><Save className="h-4 w-4" /> Save</button>
            <button onClick={() => { setEditing(false); load(); }} className="inline-flex items-center gap-2 px-3 py-1.5 border rounded text-sm"><X className="h-4 w-4" /> Cancel</button>
          </>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded text-lg font-medium" />
          <input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Excerpt" className="w-full px-3 py-2 border rounded text-sm" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="px-3 py-2 border rounded text-sm">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={24} className="w-full px-3 py-2 border rounded font-mono text-sm" />
        </div>
      ) : (
        <article className="prose max-w-none bg-white rounded-lg border p-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body || '_(empty)_') }} />
      )}
    </div>
  );
}
