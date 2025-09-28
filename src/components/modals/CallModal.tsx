'use client';

import { useState } from 'react';
import { PhoneCall } from 'lucide-react';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (callData: {
    to: string;
    contactName: string;
  }) => Promise<void>;
  loading: boolean;
}

export default function CallModal({ isOpen, onClose, onSubmit, loading }: CallModalProps) {
  const [formData, setFormData] = useState({
    to: '',
    contactName: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ to: '', contactName: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-semibold mb-6 text-gray-900">Make Call</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="tel"
            placeholder="Phone Number"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={formData.to}
            onChange={(e) => setFormData({...formData, to: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Contact Name (optional)"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={formData.contactName}
            onChange={(e) => setFormData({...formData, contactName: e.target.value})}
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
              className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors duration-200 font-medium flex items-center disabled:opacity-50"
            >
              <PhoneCall className="h-4 w-4 mr-2" />
              {loading ? 'Calling...' : 'Start Call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}