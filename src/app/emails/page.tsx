'use client';

import EmailsPage from '@/components/pages/EmailsPage';
import { useState, useEffect } from 'react';

export default function Emails() {
  const [emails, setEmails] = useState([]);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      // TODO: Create emails API endpoint
      console.log('Loading emails...');
      setEmails([]);
    } catch (error) {
      console.error('Error loading emails:', error);
    }
  };

  return <EmailsPage emails={emails} />;
}