'use client';

import { useState } from 'react';
import { Users, Phone, Mail, Plus, MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';
import DataTable, { TableColumn } from '@/components/ui/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import { Avatar, StatusBadge, formatDate, formatPhoneNumber } from '@/components/ui/TableComponents';

interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string;
  job_title?: string;
  company?: string;
  call_count: number;
  message_count: number;
  last_contact: string;
  status: 'active' | 'inactive' | 'blocked';
  created_at: string;
  sync_to_quickbooks?: boolean;
  quickbooks_id?: string | null;
}

interface ContactsPageProps {
  contacts: Contact[];
  onNewContact: () => void;
}

/**
 * Per-contact QuickBooks sync toggle.
 *   ON  → contact is treated as a Customer; pushed to QBO if not already there.
 *   OFF → contact is a lead / no longer synced.
 * Manages its own optimistic state; falls back if the API rejects.
 */
function QuickBooksSyncToggle({ contact }: { contact: Contact }) {
  const [enabled, setEnabled] = useState<boolean>(!!contact.sync_to_quickbooks);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    const next = !enabled;
    setBusy(true);
    setError(null);
    setEnabled(next); // optimistic
    try {
      const res = await fetch(`/api/contacts/${contact.id}/quickbooks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'Failed to update sync');
      }
    } catch (err) {
      setEnabled(!next); // rollback
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy}
        title={enabled ? 'Synced with QuickBooks' : 'Not synced'}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
          enabled ? 'bg-teal-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {busy && <Loader2 className="h-3.5 w-3.5 text-gray-400 animate-spin" />}
      {error && <span className="text-xs text-red-600" title={error}>!</span>}
    </div>
  );
}

export default function ContactsPage({ contacts, onNewContact }: ContactsPageProps) {
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Contact',
      sortable: true,
      render: (value: string, contact: Contact) => (
        <div className="flex items-center gap-3">
          <Avatar name={contact.name} />
          <div>
            <div className="font-medium text-gray-900">{contact.name}</div>
            {contact.job_title && (
              <div className="text-sm text-gray-500">{contact.job_title}</div>
            )}
            {contact.company && (
              <div className="text-sm text-gray-400">{contact.company}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="font-mono text-sm">{formatPhoneNumber(value)}</span>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value: string) => value ? (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">{value}</span>
        </div>
      ) : (
        <span className="text-gray-400 text-sm">-</span>
      )
    },
    {
      key: 'call_count',
      label: 'Calls',
      sortable: true,
      render: (value: number) => (
        <StatusBadge
          status={`${value} calls`}
          variant="info"
        />
      )
    },
    {
      key: 'message_count',
      label: 'Messages',
      sortable: true,
      render: (value: number) => (
        <StatusBadge
          status={`${value} msgs`}
          variant="success"
        />
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <StatusBadge
          status={value}
          variant={value === 'active' ? 'success' : value === 'blocked' ? 'error' : 'warning'}
        />
      )
    },
    {
      key: 'last_contact',
      label: 'Last Contact',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-500">{formatDate(value)}</span>
      )
    },
    {
      key: 'sync_to_quickbooks',
      label: 'QuickBooks',
      sortable: true,
      render: (_value: boolean, contact: Contact) => (
        <QuickBooksSyncToggle contact={contact} />
      )
    },
    {
      key: 'actions',
      label: '',
      render: (value: any, contact: Contact) => (
        <div className="flex items-center justify-end gap-2">
          <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <Trash2 className="h-4 w-4 text-gray-600" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreHorizontal className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      )
    }
  ];

  return (
    <DataTable
      header={
        <PageHeader
          title="Contacts"
          subtitle="Manage your business contacts and relationships"
          breadcrumbs={[
            { label: 'Phone System', href: '/dashboard' },
            { label: 'Contacts' }
          ]}
        />
      }
      data={contacts}
      columns={columns}
      title="Contacts Directory"
      searchable={true}
      actions={[
        {
          label: 'Add Contact',
          onClick: onNewContact,
          variant: 'primary'
        }
      ]}
      emptyMessage="No contacts yet. Get started by adding your first contact."
    />
  );
}