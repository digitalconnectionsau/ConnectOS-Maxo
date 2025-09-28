'use client';

import { useState, useEffect } from 'react';
import { User, ChevronDown, LogOut, Settings, Bell } from 'lucide-react';
import Image from 'next/image';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: string;
}

export default function TopNavBar() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 relative z-50">
      {/* Logo Section */}
      <div className="flex items-center">
        <div className="flex items-center justify-center w-10 h-10 bg-teal-500 rounded-lg mr-3">
          {/* You can replace this with an actual logo image */}
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
            <span className="text-teal-500 text-xs font-bold">CRM</span>
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Phone CRM</h1>
          <p className="text-xs text-gray-500">Business Communication Platform</p>
        </div>
      </div>

      {/* Right Section - Notifications & User Account */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            3
          </span>
        </button>

        {/* User Account Dropdown */}
        {loading ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ) : currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-medium">
                {currentUser.full_name 
                  ? currentUser.full_name.charAt(0).toUpperCase()
                  : currentUser.username.charAt(0).toUpperCase()
                }
              </div>
              <div className="text-left hidden sm:block">
                <p className="font-medium text-gray-900">
                  {currentUser.full_name || currentUser.username}
                </p>
                <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserDropdown(false)}
                />
                
                {/* Dropdown Content */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-medium text-gray-900">{currentUser.full_name || currentUser.username}</p>
                    <p className="text-sm text-gray-500">{currentUser.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      // Navigate to settings - you can implement this
                      window.location.href = '/settings';
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Settings size={16} className="mr-3" />
                    Account Settings
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <LogOut size={16} className="mr-3" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <a 
              href="/login" 
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2"
            >
              Sign In
            </a>
          </div>
        )}
      </div>
    </div>
  );
}