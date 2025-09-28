'use client';

import { Users, Phone, Mail, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
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
}

interface ContactsPageProps {
  contacts: Contact[];
  onNewContact: () => void;
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