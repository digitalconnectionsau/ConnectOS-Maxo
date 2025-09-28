'use client';

import { Printer, Send, Upload, Download, Eye, ArrowDownLeft, ArrowUpRight, User, FileText } from 'lucide-react';
import DataTable, { TableColumn } from '@/components/ui/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge, formatDate, formatTime, formatPhoneNumber } from '@/components/ui/TableComponents';

interface Fax {
  id: number;
  contact_name?: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  subject: string;
  page_count: number;
  status: 'completed' | 'failed' | 'pending' | 'processing';
  created_at: string;
  file_url?: string;
  file_size?: number;
  resolution?: 'standard' | 'fine' | 'super_fine';
}

interface FaxPageProps {
  faxes: Fax[];
  onSendFax?: () => void;
}

export default function FaxPage({ faxes, onSendFax }: FaxPageProps) {
  const columns: TableColumn[] = [
    {
      key: 'direction',
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {value === 'inbound' ? (
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-blue-600" />
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
      render: (value: string, fax: Fax) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {value || 'Unknown Contact'}
            </div>
            <div className="text-sm text-gray-500">
              {formatPhoneNumber(fax.direction === 'inbound' ? fax.from_number : fax.to_number)}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
      render: (value: string, fax: Fax) => (
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900 truncate">
              {value || '(No Subject)'}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {fax.page_count} page{fax.page_count !== 1 ? 's' : ''}
            {fax.resolution && ` • ${fax.resolution.replace('_', ' ')}`}
          </div>
        </div>
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
            value === 'completed' ? 'success' :
            value === 'failed' ? 'error' :
            value === 'processing' ? 'warning' : 'default'
          }
        />
      )
    },
    {
      key: 'file_size',
      label: 'Size',
      sortable: true,
      render: (value: number) => (
        <span className="text-sm text-gray-600">
          {value ? `${(value / 1024).toFixed(1)} KB` : '-'}
        </span>
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
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, fax: Fax) => (
        <div className="flex items-center gap-1">
          {fax.file_url && fax.status === 'completed' && (
            <>
              <button 
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                title="View Fax"
                onClick={() => console.log('View fax:', fax.id)}
              >
                <Eye className="h-4 w-4 text-gray-600" />
              </button>
              <button 
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download Fax"
                onClick={() => console.log('Download fax:', fax.id)}
              >
                <Download className="h-4 w-4 text-gray-600" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const actions = [];
  if (onSendFax) {
    actions.push({
      label: 'Send Fax',
      onClick: onSendFax,
      variant: 'primary' as const
    });
  }

  return (
    <DataTable
      header={
        <PageHeader
          title="Fax Management"
          subtitle="Send and receive fax documents securely"
          breadcrumbs={[
            { label: 'Phone System', href: '/dashboard' },
            { label: 'Fax Management' }
          ]}
        />
      }
      data={faxes}
      columns={columns}
      title="Fax History"
      searchable={true}
      actions={actions}
      emptyMessage={
        onSendFax 
          ? "No fax history yet. Send your first fax to get started!"
          : "Your sent and received faxes will appear here"
      }
      onRowClick={(row) => {
        console.log('Fax details:', row);
        // TODO: Show fax details modal or navigate to fax viewer
      }}
    />
  );
}