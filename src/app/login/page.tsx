'use client';

import { useState, useEffect } from 'react';
import { Lock, Phone, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if already logged in by checking for session cookie
    const checkAuth = () => {
      try {
        // Check if session cookie exists
        const cookies = document.cookie.split(';');
        const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('crm-session='));
        
        if (sessionCookie && sessionCookie.includes('user-')) {
          // Already authenticated, redirect to main app
          window.location.href = '/';
        }
      } catch {
        // Stay on login page
      }
    };
    checkAuth();

    // Test if background image loads
    const img = new Image();
    img.onload = () => console.log('Background image loaded successfully');
    img.onerror = () => console.log('Background image failed to load');
    img.src = '/bg.jpg';
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        const data = await response.json();
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div 
      className="min-h-screen w-full relative bg-gradient-to-br from-sky-300 via-green-200 to-green-400"
      style={{ 
        backgroundImage: `url('/bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        {/* Glass Border Container */}
        <div 
          className="max-w-md w-full rounded-3xl p-3"
          style={{ 
            backdropFilter: 'blur(22px) saturate(180%)',
            WebkitBackdropFilter: 'blur(22px) saturate(180%)',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '24px'
          }}
        >
          {/* Main Login Card Container */}
          <div 
            className="w-full rounded-3xl shadow-2xl p-8 space-y-8"
            style={{ 
              backgroundColor: '#F6F6F6',
              borderRadius: '18px' // Slightly smaller to show the glass border
            }}
          >
          
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-16 h-16 bg-teal-500 rounded-2xl shadow-lg">
                <Phone className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 drop-shadow-sm">Phone CRM Login</h2>
            <p className="mt-2 text-sm text-gray-700 drop-shadow-sm">Sign in to access your business communication platform</p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-black font-bold"
                style={{
                  '--tw-ring-color': '#007E76'
                } as React.CSSProperties}
                placeholder="Enter your username"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-black font-bold"
                  style={{
                    '--tw-ring-color': '#007E76'
                  } as React.CSSProperties}
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 hover:bg-gray-200 hover:border-2 border-transparent"
            style={{ 
              backgroundColor: '#007E76',
              color: 'white',
              borderColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F5';
              e.currentTarget.style.color = '#007E76';
              e.currentTarget.style.borderColor = '#007E76';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#007E76';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Signing in...
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 mr-2" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Secure access to your phone and CRM system
          </p>
        </div>
        
          </div>
        </div>
      </div>
    </div>
  );
}