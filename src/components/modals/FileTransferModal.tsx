'use client';

import { useState } from 'react';
import { Upload, Share2, Send, FileText, Clock } from 'lucide-react';

interface FileTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transferData: {
    file: File | null;
    recipient: string;
    contactName: string;
    message: string;
    expirationHours: number;
    requirePin: boolean;
    pin?: string;
  }) => Promise<void>;
  loading: boolean;
  contacts: Array<{ id: number; name: string; email?: string; phone?: string; }>;
}

export default function FileTransferModal({ isOpen, onClose, onSubmit, loading, contacts }: FileTransferModalProps) {
  const [formData, setFormData] = useState({
    file: null as File | null,
    recipient: '',
    contactName: '',
    message: '',
    expirationHours: 24,
    requirePin: true,
    pin: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({
      file: null,
      recipient: '',
      contactName: '',
      message: '',
      expirationHours: 24,
      requirePin: true,
      pin: ''
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, file });
  };

  const generatePin = () => {
    const pin = Math.random().toString().slice(2, 8);
    setFormData({ ...formData, pin });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
        <h3 className="text-xl font-semibold mb-6 text-gray-900 flex items-center">
          <Share2 className="h-5 w-5 mr-2 text-purple-500" />
          Send File Transfer
        </h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="transfer-file"
                required
              />
              <label htmlFor="transfer-file" className="cursor-pointer">
                {formData.file ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      <FileText className="h-8 w-8 text-purple-500 mr-2" />
                      <span className="text-gray-700 font-medium">{formData.file.name}</span>
                    </div>
                    <p className="text-sm text-gray-500">{formatFileSize(formData.file.size)}</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Click to select file</p>
                    <p className="text-xs text-gray-500 mt-1">Any file type accepted</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Email/Phone</label>
            <input
              type="text"
              placeholder="email@example.com or +1-555-123-4567"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={formData.recipient}
              onChange={(e) => setFormData({...formData, recipient: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact (Optional)</label>
            <select
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={formData.contactName}
              onChange={(e) => setFormData({...formData, contactName: e.target.value})}
            >
              <option value="">Select from contacts</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.name}>
                  {contact.name} {contact.email && `(${contact.email})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
            <textarea
              placeholder="Add a message for the recipient..."
              rows={3}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Time</label>
            <select
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={formData.expirationHours}
              onChange={(e) => setFormData({...formData, expirationHours: parseInt(e.target.value)})}
            >
              <option value={1}>1 Hour</option>
              <option value={6}>6 Hours</option>
              <option value={24}>24 Hours</option>
              <option value={72}>3 Days</option>
              <option value={168}>7 Days</option>
              <option value={720}>30 Days</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="require-pin"
                checked={formData.requirePin}
                onChange={(e) => setFormData({...formData, requirePin: e.target.checked})}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="require-pin" className="ml-2 block text-sm text-gray-700">
                Require PIN for download security
              </label>
            </div>

            {formData.requirePin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Security PIN</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter PIN"
                    className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.pin}
                    onChange={(e) => setFormData({...formData, pin: e.target.value})}
                    minLength={4}
                    maxLength={8}
                  />
                  <button
                    type="button"
                    onClick={generatePin}
                    className="px-4 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Generate
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-purple-500 mr-2 mt-0.5" />
              <div>
                <p className="text-xs text-purple-700">
                  Files are encrypted during transfer and storage. 
                  The recipient will receive a secure download link {formData.requirePin ? 'and PIN ' : ''}
                  that expires after the selected time period.
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
              disabled={loading || !formData.file || !formData.recipient || (formData.requirePin && !formData.pin)}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200 font-medium flex items-center disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}