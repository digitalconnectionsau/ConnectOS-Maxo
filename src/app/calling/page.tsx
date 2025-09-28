'use client';

import CallingPage from '@/components/pages/CallingPage';
import CallModal from '@/components/modals/CallModal';
import { useState, useEffect } from 'react';

export default function Calling() {
  const [calls, setCalls] = useState([]);
  const [showCallForm, setShowCallForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      const response = await fetch('/api/calls');
      const data = await response.json();
      setCalls(data);
    } catch (error) {
      console.error('Error loading calls:', error);
    }
  };

  const handleMakeCall = async (callData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/calls/make', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callData)
      });
      
      if (response.ok) {
        await loadCalls();
        setShowCallForm(false);
      }
    } catch (error) {
      console.error('Error making call:', error);
    }
    setLoading(false);
  };

  return (
    <>
      <CallingPage calls={calls} />
      
      <CallModal 
        isOpen={showCallForm}
        onClose={() => setShowCallForm(false)}
        onSubmit={handleMakeCall}
        loading={loading}
      />
    </>
  );
}