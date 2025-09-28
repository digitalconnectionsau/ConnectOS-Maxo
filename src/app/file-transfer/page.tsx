'use client';

import FileTransferPage from '@/components/pages/FileTransferPage';
import FileTransferModal from '@/components/modals/FileTransferModal';
import { useState, useEffect } from 'react';

export default function FileTransfer() {
  const [transfers, setTransfers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showFileTransferForm, setShowFileTransferForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const contactsRes = await fetch('/api/contacts');
      setContacts(await contactsRes.json());
      
      // TODO: Create file transfer API endpoint
      console.log('Loading file transfers...');
      setTransfers([]);
    } catch (error) {
      console.error('Error loading file transfer data:', error);
    }
  };

  const handleFileTransfer = async (transferData: any) => {
    setLoading(true);
    try {
      // TODO: Implement file transfer API
      console.log('Sending file transfer:', transferData);
      alert('File transfer functionality will be implemented with backend API');
      setShowFileTransferForm(false);
    } catch (error) {
      console.error('Error sending file transfer:', error);
    }
    setLoading(false);
  };

  return (
    <>
      <FileTransferPage 
        transfers={transfers} 
        onUploadFile={() => setShowFileTransferForm(true)}
        onShareFile={() => setShowFileTransferForm(true)}
      />
      
      <FileTransferModal
        isOpen={showFileTransferForm}
        onClose={() => setShowFileTransferForm(false)}
        onSubmit={handleFileTransfer}
        loading={loading}
        contacts={contacts}
      />
    </>
  );
}