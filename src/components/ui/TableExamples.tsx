'use client';

import DataTable, { TableColumn, TableRow } from '@/components/ui/DataTable';
import { StatusBadge, Avatar, PriorityBadge, formatDate, ActionButton } from '@/components/ui/TableComponents';
import { Phone, MessageSquare, Mail } from 'lucide-react';

// Example: Contacts Table Usage
export function ContactsTableExample() {
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <Avatar name={value} src={row.avatar} />
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-gray-500 text-sm">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
    },
    {
      key: 'company',
      label: 'Company',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'lastContact',
      label: 'Last Contact',
      sortable: true,
      render: (value) => formatDate(value, 'relative')
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <ActionButton onClick={() => console.log('Call', row.id)} variant="primary" size="sm">
            <Phone size={12} className="mr-1" />
            Call
          </ActionButton>
          <ActionButton onClick={() => console.log('SMS', row.id)} size="sm">
            <MessageSquare size={12} className="mr-1" />
            SMS
          </ActionButton>
        </div>
      )
    }
  ];

  const sampleData: TableRow[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      company: 'Acme Corp',
      status: 'Active',
      lastContact: '2024-01-15'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1 (555) 987-6543',
      company: 'Tech Solutions',
      status: 'Pending',
      lastContact: '2024-01-10'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike@example.com',
      phone: '+1 (555) 456-7890',
      company: 'Digital Agency',
      status: 'In Review',
      lastContact: '2024-01-08'
    }
  ];

  return (
    <DataTable
      title="Contacts"
      columns={columns}
      data={sampleData}
      searchable={true}
      selectable={true}
      actions={[
        {
          label: 'New Contact',
          onClick: () => console.log('New contact'),
          variant: 'primary'
        },
        {
          label: 'Import',
          onClick: () => console.log('Import contacts'),
          variant: 'secondary'
        }
      ]}
      onRowSelect={(selected) => console.log('Selected:', selected)}
      onRowClick={(row) => console.log('Clicked:', row)}
    />
  );
}

// Example: Reports Table Usage (similar to your reference image)
export function ReportsTableExample() {
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded ${row.type === 'Report' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <span className="text-gray-600 text-sm">{value}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'project',
      label: 'Project',
      sortable: true,
      render: (value) => (
        <span className="text-gray-600 text-sm">{value}</span>
      )
    },
    {
      key: 'modified',
      label: 'Modified',
      sortable: true,
      render: (value) => formatDate(value, 'short')
    }
  ];

  const sampleData: TableRow[] = [
    {
      id: 1,
      name: 'Q1-Jiaao_Verra-Listing-Representation-Single Representator',
      type: 'Report',
      status: 'In review',
      project: 'Myanmar Kyeeonkyeewa Solar Power Plant Project',
      modified: '2024-07-06'
    },
    {
      id: 2,
      name: 'VCU-Conversion-Deed-of-Representation-v4.2 (VIET 1)',
      type: 'Report',
      status: 'Draft',
      project: 'Myanmar Kyeeonkyeewa Solar Power Plant Project',
      modified: '2024-07-06'
    },
    {
      id: 3,
      name: 'ERS MP 01062020 31122020',
      type: 'Report',
      status: 'Approved',
      project: 'Myanmar Kyeeonkyeewa Solar Power Plant Project',
      modified: '2024-07-06'
    }
  ];

  return (
    <DataTable
      title="Reports"
      columns={columns}
      data={sampleData}
      searchable={true}
      selectable={true}
      actions={[
        {
          label: 'New sheet',
          onClick: () => console.log('New sheet'),
          variant: 'secondary'
        },
        {
          label: 'New report',
          onClick: () => console.log('New report'),
          variant: 'primary'
        }
      ]}
    />
  );
}

// Example: Call History Table
export function CallHistoryTableExample() {
  const columns: TableColumn[] = [
    {
      key: 'contact',
      label: 'Contact',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <Avatar name={value} />
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-gray-500">{row.phone}</div>
          </div>
        </div>
      )
    },
    {
      key: 'direction',
      label: 'Direction',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Incoming' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'duration',
      label: 'Duration',
      sortable: true,
      render: (value) => value ? `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}` : 'Not answered'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => formatDate(value, 'relative')
    }
  ];

  const sampleData: TableRow[] = [
    {
      id: 1,
      contact: 'Sarah Wilson',
      phone: '+1 (555) 123-4567',
      direction: 'Incoming',
      duration: 185,
      status: 'Completed',
      date: '2024-01-15'
    },
    {
      id: 2,
      contact: 'Mark Davis',
      phone: '+1 (555) 987-6543',
      direction: 'Outgoing',
      duration: 0,
      status: 'No Answer',
      date: '2024-01-14'
    }
  ];

  return (
    <DataTable
      title="Call History"
      columns={columns}
      data={sampleData}
      searchable={true}
    />
  );
}