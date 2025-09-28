'use client';

import SettingsPage from '@/components/pages/SettingsPage';
import { useState, useEffect } from 'react';

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleSaveSettings = async (settings: any) => {
    try {
      // TODO: Implement settings save API
      console.log('Saving settings:', settings);
      alert('Settings save functionality will be implemented with backend API');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
          <SettingsPage 
        currentUser={currentUser || undefined}
        onSaveSettings={handleSaveSettings}
      />
  );
}