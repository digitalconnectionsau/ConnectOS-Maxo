'use client';

import { Users, Phone, MessageSquare, Calendar, Mail } from 'lucide-react';

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
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contacts</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{contacts.length}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center">
              <Users className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{calls.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Phone className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Messages</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{messages.length}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Emails</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{emails.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
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
  );
}