'use client';

import { Mail, ArrowDownLeft, ArrowUpRight, User, Plus, Paperclip, Star } from 'lucide-react';
import DataTable, { TableColumn } from '@/components/ui/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge, formatDate, formatTime } from '@/components/ui/TableComponents';

interface Email {
  id: number;
  contact_name?: string;
  direction: 'inbound' | 'outbound';
  from: string;
  to: string;
  subject: string;
  body: string;
  created_at: string;
  status: 'read' | 'unread' | 'replied' | 'forwarded';
  priority: 'high' | 'normal' | 'low';
  has_attachments?: boolean;
  is_starred?: boolean;
}

interface EmailsPageProps {
  emails: Email[];
  onNewEmail?: () => void;
}

export default function EmailsPage({ emails, onNewEmail }: EmailsPageProps) {
  const columns: TableColumn[] = [
    {
      key: 'direction',
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {value === 'inbound' ? (
            <ArrowDownLeft className="h-4 w-4 text-purple-600" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-blue-600" />
          )}
          <StatusBadge
            status={value === 'inbound' ? 'Received' : 'Sent'}
            variant={value === 'inbound' ? 'info' : 'default'}
          />
        </div>
      )
    },
    {
      key: 'contact_name',
      label: 'Contact',
      sortable: true,
      render: (value: string, email: Email) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {value || 'Unknown Contact'}
            </div>
            <div className="text-sm text-gray-500">
              {email.direction === 'inbound' ? email.from : email.to}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
      render: (value: string, email: Email) => (
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            {email.is_starred && (
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
            )}
            {email.has_attachments && (
              <Paperclip className="h-3 w-3 text-gray-400" />
            )}
            <span className="font-medium text-gray-900 truncate">
              {value || '(No Subject)'}
            </span>
          </div>
          <p className="text-sm text-gray-500 truncate mt-1">
            {email.body.length > 60 ? `${email.body.substring(0, 60)}...` : email.body}
          </p>
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (value: string) => (
        <StatusBadge
          status={value}
          variant={value === 'high' ? 'error' : value === 'low' ? 'success' : 'default'}
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
          variant={
            value === 'unread' ? 'warning' : 
            value === 'replied' ? 'success' : 
            value === 'forwarded' ? 'info' : 'default'
          }
        />
      )
    },
    {
      key: 'created_at',
      label: 'Time',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm">
          <div className="text-gray-900">{formatDate(value)}</div>
          <div className="text-gray-500">{formatTime(value)}</div>
        </div>
      )
    }
  ];

  const actions = [];
  if (onNewEmail) {
    actions.push({
      label: 'Compose Email',
      onClick: onNewEmail,
      variant: 'primary' as const
    });
  }

  return (
    <DataTable
      header={
        <PageHeader
          title="Email Messages"
          subtitle="Send and receive email communications"
          breadcrumbs={[
            { label: 'Phone System', href: '/dashboard' },
            { label: 'Email Messages' }
          ]}
        />
      }
      data={emails}
      columns={columns}
      title="Email Communications"
      searchable={true}
      actions={actions}
      emptyMessage={
        onNewEmail 
          ? "No emails yet. Compose your first email to get started!"
          : "Your email conversations will appear here"
      }
    />
  );
}