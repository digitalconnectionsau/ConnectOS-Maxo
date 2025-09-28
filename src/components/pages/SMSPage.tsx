'use client';

import { MessageSquare, ArrowDownLeft, ArrowUpRight, Phone, User, Plus } from 'lucide-react';
import DataTable, { TableColumn } from '@/components/ui/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge, formatDate, formatTime, formatPhoneNumber } from '@/components/ui/TableComponents';

interface Message {
  id: number;
  contact_name?: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  body: string;
  created_at: string;
  status: 'delivered' | 'pending' | 'failed';
  message_type: 'sms' | 'mms';
}

interface SMSPageProps {
  messages: Message[];
  onNewMessage?: () => void;
}

export default function SMSPage({ messages, onNewMessage }: SMSPageProps) {
  const columns: TableColumn[] = [
    {
      key: 'direction',
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {value === 'inbound' ? (
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-indigo-600" />
          )}
          <StatusBadge
            status={value === 'inbound' ? 'Received' : 'Sent'}
            variant={value === 'inbound' ? 'success' : 'info'}
          />
        </div>
      )
    },
    {
      key: 'contact_name',
      label: 'Contact',
      sortable: true,
      render: (value: string, message: Message) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {value || 'Unknown Contact'}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {formatPhoneNumber(message.direction === 'inbound' ? message.from_number : message.to_number)}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'body',
      label: 'Message',
      render: (value: string) => (
        <div className="max-w-md">
          <p className="text-gray-900 text-sm leading-relaxed truncate">
            {value.length > 100 ? `${value.substring(0, 100)}...` : value}
          </p>
        </div>
      )
    },
    {
      key: 'message_type',
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <StatusBadge
          status={value.toUpperCase()}
          variant={value === 'mms' ? 'warning' : 'default'}
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
          variant={value === 'delivered' ? 'success' : value === 'failed' ? 'error' : 'warning'}
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
  if (onNewMessage) {
    actions.push({
      label: 'New Message',
      onClick: onNewMessage,
      variant: 'primary' as const
    });
  }

  return (
    <DataTable
      header={
        <PageHeader
          title="SMS Messages"
          subtitle="Send and receive text messages"
          breadcrumbs={[
            { label: 'Phone System', href: '/dashboard' },
            { label: 'SMS Messages' }
          ]}
        />
      }
      data={messages}
      columns={columns}
      title="Message History"
      searchable={true}
      actions={actions}
      emptyMessage={
        onNewMessage 
          ? "No messages yet. Send your first message to get started!"
          : "Your SMS conversations will appear here"
      }
    />
  );
}