'use client';

import { useState } from 'react';

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contact: {
    name: string;
    phone: string;
    email: string;
    jobTitle: string;
    notes: string;
  }) => Promise<void>;
  loading: boolean;
}

export default function NewContactModal({ isOpen, onClose, onSubmit, loading }: NewContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    jobTitle: '',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ name: '', phone: '', email: '', jobTitle: '', notes: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-semibold mb-6 text-gray-900">Add New Contact</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <input
            type="tel"
            placeholder="Phone Number"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email (optional)"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input
            type="text"
            placeholder="Job Title (optional)"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            value={formData.jobTitle}
            onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
          />
          <textarea
            placeholder="Notes (optional)"
            rows={3}
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
              className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors duration-200 font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}