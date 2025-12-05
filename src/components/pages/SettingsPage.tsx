'use client';

import { Settings as SettingsIcon, User, Bell, Shield, Phone, Palette, Globe, Database, Key } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface SettingsPageProps {
  currentUser?: {
    id: number;
    username: string;
    email: string;
    full_name: string | null;
    role: string;
  };
  onSaveSettings?: (settings: any) => void;
}

export default function SettingsPage({ currentUser, onSaveSettings }: SettingsPageProps) {
  const settingsCategories = [
    {
      id: 'profile',
      title: 'Profile Settings',
      icon: User,
      description: 'Manage your personal information and account details',
      items: [
        { label: 'Full Name', value: currentUser?.full_name || 'Not set', type: 'text' },
        { label: 'Email Address', value: currentUser?.email || '', type: 'email' },
        { label: 'Username', value: currentUser?.username || '', type: 'text' },
        { label: 'Role', value: currentUser?.role || 'User', type: 'select' }
      ]
    },
    {
      id: 'notifications',
      title: 'Notification Preferences',
      icon: Bell,
      description: 'Control how and when you receive notifications',
      items: [
        { label: 'Email Notifications', value: true, type: 'toggle' },
        { label: 'SMS Notifications', value: false, type: 'toggle' },
        { label: 'Call Notifications', value: true, type: 'toggle' },
        { label: 'Fax Notifications', value: true, type: 'toggle' }
      ]
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: Shield,
      description: 'Manage your security settings and privacy preferences',
      items: [
        { label: 'Two-Factor Authentication', value: false, type: 'toggle' },
        { label: 'Session Timeout', value: '30 minutes', type: 'select' },
        { label: 'Login Notifications', value: true, type: 'toggle' },
        { label: 'Data Encryption', value: true, type: 'toggle' }
      ]
    },
    {
      id: 'communication',
      title: 'Communication Settings',
      icon: Phone,
      description: 'Configure your calling, SMS, and fax preferences',
      items: [
        { label: 'Default Caller ID', value: 'Not configured', type: 'text' },
        { label: 'Call Recording', value: false, type: 'toggle' },
        { label: 'SMS Signature', value: '', type: 'text' },
        { label: 'Fax Cover Page', value: true, type: 'toggle' }
      ]
    },
    {
      id: 'appearance',
      title: 'Appearance & Theme',
      icon: Palette,
      description: 'Customize the look and feel of your workspace',
      items: [
        { label: 'Theme', value: 'Light', type: 'select' },
        { label: 'Sidebar Behavior', value: 'Auto-collapse', type: 'select' },
        { label: 'Compact View', value: false, type: 'toggle' },
        { label: 'Show Activity Indicators', value: true, type: 'toggle' }
      ]
    },
    {
      id: 'integrations',
      title: 'Integrations & API',
      icon: Globe,
      description: 'Manage third-party integrations and API access',
      items: [
        { label: 'Twilio Integration', value: 'Connected', type: 'status' },
        { label: 'API Access', value: 'Enabled', type: 'status' },
        { label: 'Webhook Notifications', value: false, type: 'toggle' },
        { label: 'Third-party Access', value: 'Restricted', type: 'select' }
      ]
    }
  ];

  const renderSettingItem = (item: any) => {
    switch (item.type) {
      case 'toggle':
        return (
          <div className="flex items-center justify-between">
            <span className="text-gray-700">{item.label}</span>
            <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              item.value ? 'bg-teal-500' : 'bg-gray-200'
            }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                item.value ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        );
      case 'select':
        return (
          <div className="flex items-center justify-between">
            <span className="text-gray-700">{item.label}</span>
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent">
              <option value={item.value}>{item.value}</option>
            </select>
          </div>
        );
      case 'status':
        return (
          <div className="flex items-center justify-between">
            <span className="text-gray-700">{item.label}</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              item.value === 'Connected' || item.value === 'Enabled' 
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {item.value}
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-between">
            <span className="text-gray-700">{item.label}</span>
            <input 
              type={item.type}
              defaultValue={item.value}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        );
    }
  };

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Settings"
        subtitle="Manage your account and application preferences"
        breadcrumbs={[
          { label: 'Phone System' },
          { label: 'Settings' }
        ]}
      />

      <div className="space-y-6 mt-6">
        {settingsCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mr-4">
                  <category.icon className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {category.items.map((item, index) => (
                  <div key={index}>
                    {renderSettingItem(item)}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Save {category.title}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-200">
        <div className="px-6 py-5 border-b border-red-100">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mr-4">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
              <p className="text-sm text-red-600">Irreversible actions that affect your account</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Reset All Settings</h4>
                <p className="text-sm text-gray-600">Reset all settings to default values</p>
              </div>
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                Reset Settings
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Delete Account</h4>
                <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
              </div>
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}