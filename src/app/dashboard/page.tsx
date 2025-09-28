'use client';

import DashboardPage from '@/components/pages/DashboardPage';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [contacts, setContacts] = useState([]);
  const [calls, setCalls] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contactsRes, callsRes, messagesRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/calls'),
        fetch('/api/messages')
      ]);

      setContacts(await contactsRes.json());
      setCalls(await callsRes.json());
      setMessages(await messagesRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  return <DashboardPage contacts={contacts} calls={calls} messages={messages} />;
}