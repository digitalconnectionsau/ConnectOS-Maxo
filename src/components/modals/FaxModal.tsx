'use client';

import { useState } from 'react';
import { Send, Upload, FileText } from 'lucide-react';

interface FaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (faxData: {
    to: string;
    contactName: string;
    subject: string;
    message: string;
    file: File | null;
    coverPage: boolean;
  }) => Promise<void>;
  loading: boolean;
  contacts: Array<{ id: number; name: string; phone?: string; }>;
}

export default function FaxModal({ isOpen, onClose, onSubmit, loading, contacts }: FaxModalProps) {
  const [formData, setFormData] = useState({
    to: '',
    contactName: '',
    subject: '',
    message: '',
    file: null as File | null,
    coverPage: true
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({
      to: '',
      contactName: '',
      subject: '',
      message: '',
      file: null,
      coverPage: true
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, file });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
        <h3 className="text-xl font-semibold mb-6 text-gray-900 flex items-center">
          <Send className="h-5 w-5 mr-2 text-blue-500" />
          Send Fax
        </h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Fax Number</label>
            <input
              type="tel"
              placeholder="+1-555-123-4567"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.to}
              onChange={(e) => setFormData({...formData, to: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact (Optional)</label>
            <select
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.contactName}
              onChange={(e) => setFormData({...formData, contactName: e.target.value})}
            >
              <option value="">Select or enter manually</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.name}>{contact.name} {contact.phone && `(${contact.phone})`}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              placeholder="Document subject"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cover Page Message</label>
            <textarea
              placeholder="Message to include on the cover page (optional)"
              rows={3}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Document to Fax</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                className="hidden"
                id="fax-file"
              />
              <label htmlFor="fax-file" className="cursor-pointer">
                {formData.file ? (
                  <div className="flex items-center justify-center">
                    <FileText className="h-8 w-8 text-blue-500 mr-2" />
                    <span className="text-gray-700">{formData.file.name}</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Click to upload document</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOC, TXT, or Image files</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="cover-page"
              checked={formData.coverPage}
              onChange={(e) => setFormData({...formData, coverPage: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="cover-page" className="ml-2 block text-sm text-gray-700">
              Include cover page with message
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <p className="text-xs text-blue-700">
                  Your fax will be sent securely via our encrypted fax service. 
                  Delivery confirmation will be provided once transmission is complete.
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
              disabled={loading || !formData.to || !formData.subject}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send Fax'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}