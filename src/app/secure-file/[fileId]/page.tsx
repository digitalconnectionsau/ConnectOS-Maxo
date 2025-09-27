'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Lock, Download, FileText, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function SecureFilePage() {
  const params = useParams();
  const fileId = params.fileId as string;
  
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState<{
    filename?: string;
    downloaded?: boolean;
  } | null>(null);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/secure-download/${fileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        // Get file info from response headers
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : 'downloaded-file';

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        // Show success message
        setFileInfo({ filename, downloaded: true });
      } else {
        const data = await response.json();
        setError(data.error || 'Download failed');
      }
    } catch {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-indigo-500 rounded-2xl">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Secure File Access</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the PIN to decrypt and download this file
          </p>
        </div>

        {/* File Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-gray-400 mr-3" />
            <div>
              <div className="font-medium text-gray-900">Encrypted File</div>
              <div className="text-sm text-gray-500">File ID: {fileId?.substring(0, 8)}...</div>
            </div>
          </div>
        </div>

        {!fileInfo?.downloaded ? (
          /* PIN Entry Form */
          <form className="space-y-6" onSubmit={handleDownload}>
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                PIN Code
              </label>
              <div className="relative">
                <input
                  id="pin"
                  name="pin"
                  type={showPin ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !pin}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Decrypting...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Decrypt & Download
                </>
              )}
            </button>
          </form>
        ) : (
          /* Success Message */
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Download className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-green-900 mb-2">Download Complete</h3>
            <p className="text-green-700 text-sm">
              The file &quot;{fileInfo.filename}&quot; has been successfully decrypted and downloaded.
            </p>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Security Notice</h4>
              <p className="text-xs text-blue-700 mt-1">
                Files are encrypted with AES-256 encryption. The PIN is never stored on our servers.
                This link will expire automatically for security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}