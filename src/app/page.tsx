'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Users, Settings, Plus, Search, Send, PhoneCall, Calendar, Building2 } from 'lucide-react';

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

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [showSMSForm, setShowSMSForm] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);

  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    jobTitle: '',
    notes: ''
  });

  const [smsForm, setSmsForm] = useState({
    to: '',
    message: '',
    contactName: ''
  });

  const [callForm, setCallForm] = useState({
    to: '',
    contactName: ''
  });

  // Load data
  useEffect(() => {
    loadContacts();
    loadCalls();
    loadMessages();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadCalls = async () => {
    try {
      const response = await fetch('/api/calls');
      const data = await response.json();
      setCalls(data);
    } catch (error) {
      console.error('Error loading calls:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });
      
      if (response.ok) {
        await loadContacts();
        setShowNewContactForm(false);
        setNewContact({ name: '', phone: '', email: '', jobTitle: '', notes: '' });
      }
    } catch (error) {
      console.error('Error creating contact:', error);
    }
    
    setLoading(false);
  };

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsForm)
      });
      
      if (response.ok) {
        await loadMessages();
        setShowSMSForm(false);
        setSmsForm({ to: '', message: '', contactName: '' });
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
    
    setLoading(false);
  };

  const handleMakeCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/calls/make', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callForm)
      });
      
      if (response.ok) {
        await loadCalls();
        setShowCallForm(false);
        setCallForm({ to: '', contactName: '' });
      }
    } catch (error) {
      console.error('Error making call:', error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-teal-500 rounded-2xl mr-4">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Phone CRM</h1>
                <p className="text-sm text-gray-500">Business Communication Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowNewContactForm(true)}
                className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl flex items-center font-medium shadow-sm transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Contact
              </button>
              <button 
                onClick={() => setShowSMSForm(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center font-medium shadow-sm transition-all duration-200"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send SMS
              </button>
              <button 
                onClick={() => setShowCallForm(true)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center font-medium shadow-sm transition-all duration-200"
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                Call
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center px-4 py-3.5 text-left rounded-2xl transition-all duration-200 font-medium ${
                  activeTab === 'dashboard' 
                    ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Building2 className="h-5 w-5 mr-3" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`w-full flex items-center px-4 py-3.5 text-left rounded-2xl transition-all duration-200 font-medium ${
                  activeTab === 'contacts' 
                    ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Users className="h-5 w-5 mr-3" />
                Contacts
                <span className="ml-auto bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-sm font-medium">
                  {contacts.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('calls')}
                className={`w-full flex items-center px-4 py-3.5 text-left rounded-2xl transition-all duration-200 font-medium ${
                  activeTab === 'calls' 
                    ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Phone className="h-5 w-5 mr-3" />
                Call Log
                <span className="ml-auto bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-sm font-medium">
                  {calls.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`w-full flex items-center px-4 py-3.5 text-left rounded-2xl transition-all duration-200 font-medium ${
                  activeTab === 'messages' 
                    ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="h-5 w-5 mr-3" />
                Messages
                <span className="ml-auto bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-sm font-medium">
                  {messages.length}
                </span>
              </button>
            </nav>

            {/* Status Panel */}
            <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-emerald-600">PostgreSQL</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Status</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-emerald-600">Ready</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Twilio</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-yellow-600">Configure</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-700">
                  Deploy to Railway and configure Twilio webhooks to enable full functionality
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-4">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  </div>
                  <div className="p-6">
                    {calls.length === 0 && messages.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h4>
                        <p className="text-gray-500">Start by adding contacts and making calls or sending messages</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(() => {
                          const recentCalls = calls.slice(0, 3).map(call => ({ ...call, type: 'call' }));
                          const recentMessages = messages.slice(0, 3).map(message => ({ ...message, type: 'message' }));
                          const recentActivity = [...recentCalls, ...recentMessages]
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .slice(0, 5);
                          
                          return recentActivity.map((item, index) => (
                            <div key={index} className="flex items-center p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
                                item.type === 'message' ? 'bg-emerald-100' : 'bg-indigo-100'
                              }`}>
                                {item.type === 'message' ? 
                                  <MessageSquare className="h-5 w-5 text-emerald-600" /> : 
                                  <Phone className="h-5 w-5 text-indigo-600" />
                                }
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-gray-900">
                                    {item.type === 'message' ? 'SMS Message' : 'Phone Call'}
                                  </p>
                                  <span className="text-sm text-gray-500">
                                    {new Date(item.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {item.contact_name || 'Unknown'} • {item.direction === 'inbound' ? item.from_number : item.to_number}
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
            )}

            {activeTab === 'contacts' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
                    <div className="relative">
                      <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search contacts..."
                        className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {contacts.length > 0 ? (
                    <div className="grid gap-4">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="p-5 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50/50 transition-all duration-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mr-3">
                                  <span className="text-teal-600 font-semibold">
                                    {contact.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                                  {contact.job_title && (
                                    <p className="text-sm text-gray-500">{contact.job_title}</p>
                                  )}
                                </div>
                              </div>
                              <div className="ml-13">
                                <p className="text-gray-700 font-medium">{contact.phone}</p>
                                {contact.email && (
                                  <p className="text-gray-500 text-sm">{contact.email}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex space-x-3 mb-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {contact.call_count} calls
                                </span>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800">
                                  {contact.message_count} messages
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
                      <p className="text-gray-500 mb-6">Get started by adding your first contact</p>
                      <button 
                        onClick={() => setShowNewContactForm(true)}
                        className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
                      >
                        Add Your First Contact
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'calls' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">Call Log</h2>
                </div>
                <div className="p-6">
                  {calls.length > 0 ? (
                    <div className="space-y-4">
                      {calls.map((call) => (
                        <div key={call.id} className="p-5 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
                                call.direction === 'inbound' ? 'bg-emerald-100' : 'bg-indigo-100'
                              }`}>
                                <Phone className={`h-5 w-5 ${
                                  call.direction === 'inbound' ? 'text-emerald-600' : 'text-indigo-600'
                                }`} />
                              </div>
                              <div>
                                <div className="flex items-center mb-1">
                                  <span className="font-semibold text-gray-900 mr-2">
                                    {call.contact_name || 'Unknown'}
                                  </span>
                                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                    call.direction === 'inbound' 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : 'bg-indigo-100 text-indigo-800'
                                  }`}>
                                    {call.direction === 'inbound' ? 'Incoming' : 'Outgoing'}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm">
                                  {call.direction === 'inbound' ? call.from_number : call.to_number}
                                </p>
                                <p className="text-gray-500 text-sm capitalize mt-1">{call.status}</p>
                              </div>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <div>{new Date(call.created_at).toLocaleString()}</div>
                              {call.duration && <div className="mt-1">{call.duration}s</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Phone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No calls yet</h3>
                      <p className="text-gray-500">Your call history will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
                </div>
                <div className="p-6">
                  {messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className="p-5 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
                                message.direction === 'inbound' ? 'bg-emerald-100' : 'bg-indigo-100'
                              }`}>
                                <MessageSquare className={`h-5 w-5 ${
                                  message.direction === 'inbound' ? 'text-emerald-600' : 'text-indigo-600'
                                }`} />
                              </div>
                              <div>
                                <div className="flex items-center mb-1">
                                  <span className="font-semibold text-gray-900 mr-2">
                                    {message.contact_name || 'Unknown'}
                                  </span>
                                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                    message.direction === 'inbound' 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : 'bg-indigo-100 text-indigo-800'
                                  }`}>
                                    {message.direction === 'inbound' ? 'Received' : 'Sent'}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm">
                                  {message.direction === 'inbound' ? message.from_number : message.to_number}
                                </p>
                              </div>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              {new Date(message.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="ml-14">
                            <p className="text-gray-900 leading-relaxed">{message.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                      <p className="text-gray-500">Your SMS conversations will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNewContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">Add New Contact</h3>
            <form onSubmit={handleCreateContact} className="space-y-5">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email (optional)"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
              />
              <input
                type="text"
                placeholder="Job Title (optional)"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={newContact.jobTitle}
                onChange={(e) => setNewContact({...newContact, jobTitle: e.target.value})}
              />
              <textarea
                placeholder="Notes (optional)"
                rows={3}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                value={newContact.notes}
                onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
              />
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewContactForm(false)}
                  className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors duration-200 font-medium disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSMSForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">Send SMS</h3>
            <form onSubmit={handleSendSMS} className="space-y-5">
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={smsForm.to}
                onChange={(e) => setSmsForm({...smsForm, to: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Contact Name (optional)"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={smsForm.contactName}
                onChange={(e) => setSmsForm({...smsForm, contactName: e.target.value})}
              />
              <textarea
                placeholder="Your message"
                rows={4}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                value={smsForm.message}
                onChange={(e) => setSmsForm({...smsForm, message: e.target.value})}
                required
              />
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSMSForm(false)}
                  className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors duration-200 font-medium flex items-center disabled:opacity-50"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCallForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">Make Call</h3>
            <form onSubmit={handleMakeCall} className="space-y-5">
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={callForm.to}
                onChange={(e) => setCallForm({...callForm, to: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Contact Name (optional)"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={callForm.contactName}
                onChange={(e) => setCallForm({...callForm, contactName: e.target.value})}
              />
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCallForm(false)}
                  className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors duration-200 font-medium flex items-center disabled:opacity-50"
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  {loading ? 'Calling...' : 'Start Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
