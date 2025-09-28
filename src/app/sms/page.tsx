'use client';

import SMSPage from '@/components/pages/SMSPage';
import SMSModal from '@/components/modals/SMSModal';
import { useState, useEffect } from 'react';

export default function SMS() {
  const [messages, setMessages] = useState([]);
  const [showSMSForm, setShowSMSForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendSMS = async (smsData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsData)
      });
      
      if (response.ok) {
        await loadMessages();
        setShowSMSForm(false);
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
    setLoading(false);
  };

  return (
    <>
      <SMSPage messages={messages} />
      
      <SMSModal 
        isOpen={showSMSForm}
        onClose={() => setShowSMSForm(false)}
        onSubmit={handleSendSMS}
        loading={loading}
      />
    </>
  );
}