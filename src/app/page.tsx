'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Users, Settings, Plus, Search, Send, PhoneCall } from 'lucide-react';

interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string;
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
  const [activeTab, setActiveTab] = useState('contacts');
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
        setNewContact({ name: '', phone: '', email: '', notes: '' });
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Phone className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">PhoneCRM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowNewContactForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Contact
              </button>
              <button 
                onClick={() => setShowSMSForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send SMS
              </button>
              <button 
                onClick={() => setShowCallForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                Make Call
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('contacts')}
                className={`w-full flex items-center px-3 py-2 text-left rounded-lg ${
                  activeTab === 'contacts' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="h-5 w-5 mr-3" />
                Contacts ({contacts.length})
              </button>
              <button
                onClick={() => setActiveTab('calls')}
                className={`w-full flex items-center px-3 py-2 text-left rounded-lg ${
                  activeTab === 'calls' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Phone className="h-5 w-5 mr-3" />
                Call Log ({calls.length})
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`w-full flex items-center px-3 py-2 text-left rounded-lg ${
                  activeTab === 'messages' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="h-5 w-5 mr-3" />
                Messages ({messages.length})
              </button>
            </nav>

            {/* Status Panel */}
            <div className="mt-8 bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Setup Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>UI Ready</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>API Routes</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span>Twilio Config Needed</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Add your Twilio credentials to .env.local to enable calling and SMS
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'contacts' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
                  </div>
                </div>
                <div className="p-6">
                  {contacts.length > 0 ? (
                    <div className="space-y-4">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                              <p className="text-gray-600">{contact.phone}</p>
                              {contact.email && (
                                <p className="text-gray-500 text-sm">{contact.email}</p>
                              )}
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <div>{contact.call_count} calls</div>
                              <div>{contact.message_count} messages</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
                      <p className="text-gray-500 mb-4">Get started by adding your first contact</p>
                      <button 
                        onClick={() => setShowNewContactForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >
                        Add Contact
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'calls' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Call Log</h2>
                </div>
                <div className="p-6">
                  {calls.length > 0 ? (
                    <div className="space-y-4">
                      {calls.map((call) => (
                        <div key={call.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center">
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                  call.direction === 'inbound' ? 'bg-green-500' : 'bg-blue-500'
                                }`}></span>
                                <span className="font-medium">
                                  {call.contact_name || 'Unknown'}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm">
                                {call.direction === 'inbound' ? call.from_number : call.to_number}
                              </p>
                              <p className="text-gray-500 text-sm capitalize">{call.status}</p>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <div>{new Date(call.created_at).toLocaleString()}</div>
                              {call.duration && <div>{call.duration}s</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Phone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No calls yet</h3>
                      <p className="text-gray-500">Your call history will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
                </div>
                <div className="p-6">
                  {messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                message.direction === 'inbound' ? 'bg-green-500' : 'bg-blue-500'
                              }`}></span>
                              <span className="font-medium">
                                {message.contact_name || 'Unknown'}
                              </span>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              {new Date(message.created_at).toLocaleString()}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-1">
                            {message.direction === 'inbound' ? message.from_number : message.to_number}
                          </p>
                          <p className="text-gray-900">{message.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">New Contact</h3>
            <form onSubmit={handleCreateContact} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
              />
              <textarea
                placeholder="Notes (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={newContact.notes}
                onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewContactForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSMSForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Send SMS</h3>
            <form onSubmit={handleSendSMS} className="space-y-4">
              <input
                type="tel"
                placeholder="Phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={smsForm.to}
                onChange={(e) => setSmsForm({...smsForm, to: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Contact name (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={smsForm.contactName}
                onChange={(e) => setSmsForm({...smsForm, contactName: e.target.value})}
              />
              <textarea
                placeholder="Message"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24"
                value={smsForm.message}
                onChange={(e) => setSmsForm({...smsForm, message: e.target.value})}
                required
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSMSForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCallForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Make Call</h3>
            <form onSubmit={handleMakeCall} className="space-y-4">
              <input
                type="tel"
                placeholder="Phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={callForm.to}
                onChange={(e) => setCallForm({...callForm, to: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Contact name (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={callForm.contactName}
                onChange={(e) => setCallForm({...callForm, contactName: e.target.value})}
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCallForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  {loading ? 'Calling...' : 'Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
