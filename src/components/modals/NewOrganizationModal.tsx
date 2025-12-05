'use client';

import { useState } from 'react';

interface NewOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (organization: {
    name: string;
    website: string;
    industry: string;
    size: string;
    annual_revenue: string;
  }) => Promise<void>;
  loading: boolean;
}

export default function NewOrganizationModal({ isOpen, onClose, onSubmit, loading }: NewOrganizationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    size: '',
    annual_revenue: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ 
      name: '', 
      website: '', 
      industry: '', 
      size: '', 
      annual_revenue: '' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
        <h3 className="text-xl font-semibold mb-6 text-gray-900">Add New Organization</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Name */}
          <div>
            <input
              type="text"
              placeholder="Organization Name"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          {/* Website and Industry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="url"
              placeholder="Website (optional)"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.website}
              onChange={(e) => setFormData({...formData, website: e.target.value})}
            />
            <input
              type="text"
              placeholder="Industry (optional)"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.industry}
              onChange={(e) => setFormData({...formData, industry: e.target.value})}
            />
          </div>

          {/* Size and Revenue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.size}
              onChange={(e) => setFormData({...formData, size: e.target.value})}
            >
              <option value="">Select Size (optional)</option>
              <option value="startup">Startup (1-10 employees)</option>
              <option value="small">Small (11-50 employees)</option>
              <option value="medium">Medium (51-250 employees)</option>
              <option value="large">Large (251-1000 employees)</option>
              <option value="enterprise">Enterprise (1000+ employees)</option>
            </select>
            <input
              type="number"
              placeholder="Annual Revenue (optional)"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.annual_revenue}
              onChange={(e) => setFormData({...formData, annual_revenue: e.target.value})}
              min="0"
            />
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
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}