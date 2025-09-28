'use client';

import { 
  FolderOpen, 
  Upload, 
  Download, 
  Share2, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Image, 
  Video, 
  Music,
  Archive,
  Eye,
  Trash2,
  Clock,
  User,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import DataTable, { TableColumn } from '@/components/ui/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge, formatDate, formatTime } from '@/components/ui/TableComponents';

interface FileTransfer {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  direction: 'upload' | 'download' | 'share';
  contact_name?: string;
  contact_info?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress?: number;
  created_at: string;
  expires_at?: string;
  download_url?: string;
}

interface FileTransferPageProps {
  transfers: FileTransfer[];
  onUploadFile?: () => void;
  onShareFile?: () => void;
}

export default function FileTransferPage({ transfers, onUploadFile, onShareFile }: FileTransferPageProps) {
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('image')) return Image;
    if (type.includes('video')) return Video;
    if (type.includes('audio')) return Music;
    if (type.includes('archive') || type.includes('zip')) return Archive;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns: TableColumn[] = [
    {
      key: 'direction',
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {value === 'upload' ? (
            <ArrowUpRight className="h-4 w-4 text-blue-600" />
          ) : value === 'download' ? (
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
          ) : (
            <Share2 className="h-4 w-4 text-purple-600" />
          )}
          <StatusBadge
            status={value}
            variant={
              value === 'upload' ? 'info' : 
              value === 'download' ? 'success' : 'warning'
            }
          />
        </div>
      )
    },
    {
      key: 'filename',
      label: 'File',
      sortable: true,
      render: (value: string, transfer: FileTransfer) => {
        const FileIcon = getFileIcon(transfer.file_type);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileIcon className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900 truncate max-w-xs">
                {value}
              </div>
              <div className="text-sm text-gray-500">
                {formatFileSize(transfer.file_size)} • {transfer.file_type}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'contact_name',
      label: 'Contact',
      sortable: true,
      render: (value: string, transfer: FileTransfer) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-3 w-3 text-gray-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {value || 'Direct Transfer'}
            </div>
            {transfer.contact_info && (
              <div className="text-xs text-gray-500">{transfer.contact_info}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string, transfer: FileTransfer) => (
        <div>
          <StatusBadge
            status={value}
            variant={
              value === 'completed' ? 'success' :
              value === 'failed' ? 'error' :
              value === 'in_progress' ? 'warning' : 'default'
            }
          />
          {transfer.progress !== undefined && transfer.status === 'in_progress' && (
            <div className="mt-2 w-20">
              <div className="text-xs text-gray-600 mb-1">{transfer.progress}%</div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${transfer.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm">
          <div className="text-gray-900">{formatDate(value)}</div>
          <div className="text-gray-500">{formatTime(value)}</div>
        </div>
      )
    },
    {
      key: 'expires_at',
      label: 'Expires',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-gray-500">
          {value ? formatDate(value) : '-'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, transfer: FileTransfer) => (
        <div className="flex items-center gap-1">
          {transfer.download_url && transfer.status === 'completed' && (
            <>
              <button 
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                title="Preview File"
                onClick={() => console.log('Preview file:', transfer.id)}
              >
                <Eye className="h-4 w-4 text-gray-600" />
              </button>
              <button 
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download File"
                onClick={() => console.log('Download file:', transfer.id)}
              >
                <Download className="h-4 w-4 text-gray-600" />
              </button>
            </>
          )}
          <button 
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            title="Delete Transfer"
            onClick={() => console.log('Delete transfer:', transfer.id)}
          >
            <Trash2 className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      )
    }
  ];

  const actions = [];
  if (onUploadFile) {
    actions.push({
      label: 'Upload File',
      onClick: onUploadFile,
      variant: 'primary' as const
    });
  }
  if (onShareFile) {
    actions.push({
      label: 'Share File',
      onClick: onShareFile,
      variant: 'secondary' as const
    });
  }

  return (
    <DataTable
      header={
        <PageHeader
          title="File Transfer"
          subtitle="Securely send, receive, and share files"
          breadcrumbs={[
            { label: 'Phone System', href: '/dashboard' },
            { label: 'File Transfer' }
          ]}
        />
      }
      data={transfers}
      columns={columns}
      title="Transfer History"
      searchable={true}
      actions={actions}
      emptyMessage={
        onUploadFile 
          ? "No file transfers yet. Upload or share your first file to get started!"
          : "Your file transfers will appear here"
      }
      onRowClick={(row) => {
        console.log('File transfer details:', row);
        // TODO: Show transfer details modal
      }}
    />
  );
}