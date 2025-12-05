'use client';

import { useState, useEffect } from 'react';
import AccountPage from '@/components/pages/AccountPage';

export default function Account() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      
      // Load current user
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }
      
      // Load wallet information
      const walletResponse = await fetch('/api/wallet');
      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setWallet(walletData);
      }
    } catch (error) {
      console.error('Error loading account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (profileData: any) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      
      if (response.ok) {
        await loadAccountData();
        alert('Profile updated successfully');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const handleAddFunds = async (amount: number) => {
    try {
      // This will be handled by the Stripe payment component
      console.log('Adding funds:', amount);
      await loadAccountData(); // Refresh wallet data after payment
    } catch (error) {
      console.error('Error adding funds:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <AccountPage 
      currentUser={currentUser}
      wallet={wallet}
      onUpdateProfile={handleUpdateProfile}
      onAddFunds={handleAddFunds}
      onRefreshWallet={loadAccountData}
    />
  );
}