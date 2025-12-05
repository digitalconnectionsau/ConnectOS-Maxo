'use client';

import { Users, Phone, MessageSquare, Calendar, Mail, TrendingUp, Activity, Clock } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string;
  job_title?: string;
  call_count: number;
  message_count: number;
  last_contact: string;
}

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

interface Message {
  id: number;
  contact_name?: string;
  direction: string;
  from_number: string;
  to_number: string;
  body: string;
  created_at: string;
}

interface DashboardPageProps {
  contacts: Contact[];
  calls: Call[];
  messages: Message[];
  emails?: any[];
}

export default function DashboardPage({ contacts, calls, messages, emails = [] }: DashboardPageProps) {
  const totalActivities = calls.length + messages.length + emails.length;
  
  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your phone system activity and performance"
        breadcrumbs={[
          { label: 'Phone System' },
          { label: 'Dashboard' }
        ]}
      />
      
      <div className="space-y-6 mt-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{contacts.length}</p>
                <p className="text-xs text-gray-500 mt-1">Active contacts</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{calls.length}</p>
                <p className="text-xs text-gray-500 mt-1">All time calls</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Phone className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SMS Messages</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{messages.length}</p>
                <p className="text-xs text-gray-500 mt-1">Sent & received</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Activity</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalActivities}</p>
                <p className="text-xs text-gray-500 mt-1">All communications</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 text-gray-600 mr-2" />
              Quick Actions
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all group">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-teal-200">
                  <Users className="h-5 w-5 text-teal-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Add Contact</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-indigo-200">
                  <Phone className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Make Call</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-emerald-200">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Send SMS</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-purple-200">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Send Email</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            {calls.length === 0 && messages.length === 0 && emails.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h4>
                <p className="text-gray-500">Start by adding contacts and making calls, sending messages, or emails</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const recentCalls = calls.slice(0, 3).map(call => ({ ...call, type: 'call' }));
                  const recentMessages = messages.slice(0, 3).map(message => ({ ...message, type: 'message' }));
                  const recentEmails = emails.slice(0, 3).map(email => ({ ...email, type: 'email' }));
                  const recentActivity = [...recentCalls, ...recentMessages, ...recentEmails]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5);
                  
                  return recentActivity.map((item, index) => (
                    <div key={index} className="flex items-center p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
                        item.type === 'message' ? 'bg-emerald-100' : 
                        item.type === 'email' ? 'bg-purple-100' : 'bg-indigo-100'
                      }`}>
                        {item.type === 'message' ? 
                          <MessageSquare className="h-5 w-5 text-emerald-600" /> : 
                          item.type === 'email' ?
                          <Mail className="h-5 w-5 text-purple-600" /> :
                          <Phone className="h-5 w-5 text-indigo-600" />
                        }
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">
                            {item.type === 'message' ? 'SMS Message' : 
                             item.type === 'email' ? 'Email' : 'Phone Call'}
                          </p>
                          <span className="text-sm text-gray-500">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.contact_name || 'Unknown'} • {item.direction === 'inbound' ? item.from_number || item.from : item.to_number || item.to}
                        </p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}