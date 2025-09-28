'use client';

import { useState } from 'react';
import { Shield, Upload } from 'lucide-react';

interface Contact {
  id: number;
  name: string;
}

interface SecureUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (uploadData: {
    file: File | null;
    pin: string;
    contactId: string;
    description: string;
  }) => Promise<void>;
  loading: boolean;
  contacts: Contact[];
}

export default function SecureUploadModal({ isOpen, onClose, onSubmit, loading, contacts }: SecureUploadModalProps) {
  const [formData, setFormData] = useState({
    file: null as File | null,
    pin: '',
    contactId: '',
    description: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ file: null, pin: '', contactId: '', description: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-semibold mb-6 text-gray-900 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-purple-500" />
          Secure File Upload
        </h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose File</label>
            <input
              type="file"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onChange={(e) => setFormData({...formData, file: e.target.files?.[0] || null})}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Security PIN (4+ characters)</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter secure PIN"
              value={formData.pin}
              onChange={(e) => setFormData({...formData, pin: e.target.value})}
              required
              minLength={4}
            />
            <p className="text-xs text-gray-500 mt-1">Share this PIN separately for security</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact (Optional)</label>
            <select
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={formData.contactId}
              onChange={(e) => setFormData({...formData, contactId: e.target.value})}
            >
              <option value="">Select contact</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>{contact.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="What is this file about?"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <p className="text-xs text-amber-700">
                  File will be encrypted with AES-256. Share the download link and PIN separately for maximum security.
                  Link expires in 7 days.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.file || !formData.pin}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200 font-medium flex items-center disabled:opacity-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              {loading ? 'Encrypting...' : 'Encrypt & Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}