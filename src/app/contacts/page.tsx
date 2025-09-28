'use client';

import ContactsPage from '@/components/pages/ContactsPage';
import NewContactModal from '@/components/modals/NewContactModal';
import { useState, useEffect } from 'react';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleCreateContact = async (contactData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      
      if (response.ok) {
        await loadContacts();
        setShowNewContactForm(false);
      }
    } catch (error) {
      console.error('Error creating contact:', error);
    }
    setLoading(false);
  };

  return (
    <>
      <ContactsPage 
        contacts={contacts} 
        onNewContact={() => setShowNewContactForm(true)} 
      />
      
      <NewContactModal 
        isOpen={showNewContactForm}
        onClose={() => setShowNewContactForm(false)}
        onSubmit={handleCreateContact}
        loading={loading}
      />
    </>
  );
}