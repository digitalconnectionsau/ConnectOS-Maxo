'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface SMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (smsData: {
    to: string;
    message: string;
    contactName: string;
  }) => Promise<void>;
  loading: boolean;
}

export default function SMSModal({ isOpen, onClose, onSubmit, loading }: SMSModalProps) {
  const [formData, setFormData] = useState({
    to: '',
    message: '',
    contactName: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ to: '', message: '', contactName: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-semibold mb-6 text-gray-900">Send SMS</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="tel"
            placeholder="Phone Number"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            value={formData.to}
            onChange={(e) => setFormData({...formData, to: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Contact Name (optional)"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            value={formData.contactName}
            onChange={(e) => setFormData({...formData, contactName: e.target.value})}
          />
          <textarea
            placeholder="Your message"
            rows={4}
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            required
          />
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
  );
}