'use client';

import { useState } from 'react';
import { User, CreditCard, Shield, DollarSign, Plus, History, Wallet } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StripePaymentForm from '@/components/ui/StripePaymentForm';

interface AccountPageProps {
  currentUser?: {
    id: number;
    username: string;
    email: string;
    full_name: string | null;
    role: string;
  };
  wallet?: {
    balance: number;
    currency: string;
    formatted_balance: string;
    transactions: any[];
  };
  onUpdateProfile: (profileData: any) => Promise<void>;
  onAddFunds: (amount: number) => Promise<void>;
  onRefreshWallet: () => Promise<void>;
}

export default function AccountPage({ 
  currentUser, 
  wallet, 
  onUpdateProfile, 
  onAddFunds, 
  onRefreshWallet 
}: AccountPageProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(2500); // $25.00 default

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      description: 'Personal information and account settings'
    },
    {
      id: 'billing',
      label: 'Billing & Wallet',
      icon: CreditCard,
      description: 'Manage your prepaid balance and billing'
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      description: 'Password and security settings'
    }
  ];

  const topUpAmounts = [
    { amount: 1000, label: '$10.00' },
    { amount: 2500, label: '$25.00' },
    { amount: 5000, label: '$50.00' },
    { amount: 10000, label: '$100.00' }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'debit':
        return <DollarSign className="h-4 w-4 text-red-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentForm(false);
    await onRefreshWallet();
    alert('Payment successful! Your wallet has been topped up.');
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              defaultValue={currentUser?.full_name || ''}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              defaultValue={currentUser?.username || ''}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              defaultValue={currentUser?.email || ''}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <input
              type="text"
              value={currentUser?.role || 'User'}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
        </div>
        <div className="mt-6">
          <button className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Wallet className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-semibold">Wallet Balance</h3>
            </div>
            <p className="text-3xl font-bold">{wallet?.formatted_balance || '$0.00'}</p>
            <p className="text-sm opacity-90">Available for communications</p>
          </div>
          <button
            onClick={() => setShowPaymentForm(true)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Funds
          </button>
        </div>
      </div>

      {/* Quick Top-up Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Top-up</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {topUpAmounts.map((option) => (
            <button
              key={option.amount}
              onClick={() => {
                setSelectedAmount(option.amount);
                setShowPaymentForm(true);
              }}
              className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-all text-center"
            >
              <DollarSign className="h-6 w-6 text-teal-600 mx-auto mb-2" />
              <span className="font-semibold text-gray-900">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="p-6">
          {wallet?.transactions && wallet.transactions.length > 0 ? (
            <div className="space-y-3">
              {wallet.transactions.slice(0, 10).map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center">
                    {getTransactionIcon(transaction.type)}
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400">Your transaction history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-6">
          <button className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Update Password
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
              Enable
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Login Notifications</h4>
              <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
            </div>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Enabled
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Account Settings"
        subtitle="Manage your profile, billing, and security preferences"
        breadcrumbs={[
          { label: 'Phone System' },
          { label: 'Account' }
        ]}
      />

      <div className="mt-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-left transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-teal-500 bg-teal-50 text-teal-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <tab.icon className="h-5 w-5 mr-3" />
                  <div>
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-sm opacity-75">{tab.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'billing' && renderBillingTab()}
        {activeTab === 'security' && renderSecurityTab()}
      </div>

      {/* Stripe Payment Modal */}
      {showPaymentForm && (
        <StripePaymentForm
          amount={selectedAmount}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentForm(false)}
        />
      )}
    </div>
  );
}