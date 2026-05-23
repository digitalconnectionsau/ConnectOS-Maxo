'use client';

import { useEffect, useState } from 'react';
import { Package, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface Product {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  unit_price: string | number | null;
  currency: string | null;
  product_type: string | null;
  active: boolean;
  taxable: boolean | null;
  quickbooks_id: string | null;
  last_synced_at: string | null;
}

function formatPrice(value: Product['unit_price'], currency: string | null): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return '—';
  return `${(currency || 'AUD')} ${n.toFixed(2)}`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to load products');
        setProducts(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="Products & Services"
        subtitle="Synced from QuickBooks. Used on tickets and invoices."
        breadcrumbs={[{ label: 'Products' }]}
      />

      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        ) : error ? (
          <div className="p-6 text-red-700 text-sm">{error}</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">No products yet</p>
            <p className="text-sm mt-1">
              Connect QuickBooks and run a sync from{' '}
              <a className="text-teal-600 hover:underline" href="/settings/integrations">
                Settings → Integrations
              </a>{' '}
              to pull your items.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QBO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 font-mono">{p.sku || '—'}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{p.product_type || '—'}</td>
                  <td className="px-6 py-3 text-right text-sm text-gray-900 font-medium">
                    {formatPrice(p.unit_price, p.currency)}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {p.active ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 inline" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300 inline" />
                    )}
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-500 font-mono">{p.quickbooks_id || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
