'use client';

import DataTable, { TableColumn, TableRow } from '@/components/ui/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge, formatDate } from '@/components/ui/TableComponents';
import { Phone, PhoneCall, MessageSquare } from 'lucide-react';

interface Call {
  id: number;
  contact_name?: string;
  direction: string;
  from_number: string;
  to_number: string;
  status: string;
  duration?: number;
  created_at: string;
}

interface CallingPageProps {
  calls: Call[];
}

export default function CallingPage({ calls }: CallingPageProps) {
  const columns: TableColumn[] = [
    {
      key: 'contact',
      label: 'Contact',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            row.direction === 'inbound' ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            <Phone className={`h-4 w-4 ${
              row.direction === 'inbound' ? 'text-green-600' : 'text-blue-600'
            }`} />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {row.contact_name || 'Unknown Contact'}
            </div>
            <div className="text-sm text-gray-500">
              {row.direction === 'inbound' ? row.from_number : row.to_number}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'direction',
      label: 'Direction',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          value === 'inbound' 
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {value === 'inbound' ? 'Incoming' : 'Outgoing'}
        </span>
      )
    },
    {
      key: 'duration',
      label: 'Duration',
      sortable: true,
      render: (value) => {
        if (!value || value === 0) {
          return <span className="text-gray-500 text-sm">No answer</span>;
        }
        const minutes = Math.floor(value / 60);
        const seconds = value % 60;
        return (
          <span className="text-sm font-mono">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'created_at',
      label: 'Date & Time',
      sortable: true,
      render: (value) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {formatDate(value, 'short')}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(value).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </div>
        </div>
      )
    }
  ];

  // Transform calls data to match table format
  const tableData: TableRow[] = calls.map(call => ({
    id: call.id,
    contact: call.contact_name || 'Unknown Contact',
    contact_name: call.contact_name,
    direction: call.direction,
    from_number: call.from_number,
    to_number: call.to_number,
    duration: call.duration,
    status: call.status,
    created_at: call.created_at
  }));

  return (
    <DataTable
      header={
        <PageHeader
          title="Call Logs"
          subtitle="Track your incoming and outgoing calls"
          breadcrumbs={[
            { label: 'Phone System', href: '/dashboard' },
            { label: 'Call Logs' }
          ]}
        />
      }
      data={calls}
      columns={columns}
      title="Recent Calls"
      searchable={true}
      selectable={true}
      actions={[
        {
          label: 'Make Call',
          onClick: () => console.log('Make new call'),
          variant: 'primary'
        },
        {
          label: 'Export',
          onClick: () => console.log('Export call log'),
          variant: 'secondary'
        }
      ]}
      onRowClick={(row) => {
        console.log('Call details:', row);
        // TODO: Show call details modal or navigate to call details
      }}
      emptyMessage="No calls found. Make your first call to see it here!"
    />
  );
}