'use client';

import FaxPage from '@/components/pages/FaxPage';
import FaxModal from '@/components/modals/FaxModal';
import { useState, useEffect } from 'react';

export default function Fax() {
  const [faxes, setFaxes] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showFaxForm, setShowFaxForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const contactsRes = await fetch('/api/contacts');
      setContacts(await contactsRes.json());
      
      // TODO: Create fax API endpoint
      console.log('Loading faxes...');
      setFaxes([]);
    } catch (error) {
      console.error('Error loading fax data:', error);
    }
  };

  const handleSendFax = async (faxData: any) => {
    setLoading(true);
    try {
      // TODO: Implement fax API
      console.log('Sending fax:', faxData);
      alert('Fax functionality will be implemented with backend API');
      setShowFaxForm(false);
    } catch (error) {
      console.error('Error sending fax:', error);
    }
    setLoading(false);
  };

  return (
    <>
      <FaxPage 
        faxes={faxes} 
        onSendFax={() => setShowFaxForm(true)} 
      />
      
      <FaxModal
        isOpen={showFaxForm}
        onClose={() => setShowFaxForm(false)}
        onSubmit={handleSendFax}
        loading={loading}
        contacts={contacts}
      />
    </>
  );
}