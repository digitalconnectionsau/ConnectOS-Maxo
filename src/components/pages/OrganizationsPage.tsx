'use client';

import { Building2, Users, Globe, DollarSign, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import DataTable, { TableColumn } from '@/components/ui/DataTable';
import { Avatar, StatusBadge, formatDate } from '@/components/ui/TableComponents';

interface Organization {
  id: number;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  annual_revenue?: number;
  contact_count: number;
  created_at: string;
}

interface OrganizationsPageProps {
  organizations: Organization[];
  onNewOrganization: () => void;
}

export default function OrganizationsPage({ organizations, onNewOrganization }: OrganizationsPageProps) {
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Organization',
      sortable: true,
      render: (value: string, org: Organization) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{org.name}</div>
            {org.industry && (
              <div className="text-sm text-gray-500">{org.industry}</div>
            )}
            {org.website && (
              <div className="text-sm text-blue-500">
                <Globe className="h-3 w-3 inline mr-1" />
                {org.website}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'size',
      label: 'Size',
      sortable: true,
      render: (value: string) => value ? (
        <StatusBadge status={value} />
      ) : (
        <span className="text-gray-400">-</span>
      )
    },
    {
      key: 'contact_count',
      label: 'Contacts',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'annual_revenue',
      label: 'Revenue',
      sortable: true,
      render: (value: number) => value ? (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-400" />
          <span className="font-medium text-green-600">
            ${value.toLocaleString()}
          </span>
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: string) => formatDate(value)
    },
    {
      key: 'actions',
      label: '',
      render: () => (
        <div className="flex justify-end">
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={organizations}
      searchable={true}
      actions={[
        {
          label: 'Add Organization',
          onClick: onNewOrganization,
          variant: 'primary'
        }
      ]}
      emptyMessage="No organizations yet. Get started by adding your first organization."
    />
  );
}