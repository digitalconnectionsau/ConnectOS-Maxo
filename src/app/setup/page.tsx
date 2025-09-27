'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Check } from 'lucide-react';
import CompanySetup from '@/components/CompanySetup';

interface CompanyData {
  companyName: string;
  email: string;
  phone: string;
  industry: string;
  size: string;
  address: string;
  city: string;
  state: string;
  country: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  password: string;
  confirmPassword: string;
}

export default function SetupPage() {
  const [step, setStep] = useState(0); // Start at step 0 for database init
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const router = useRouter();

  const handleCompanySetup = (data: CompanyData) => {
    setCompanyData(data);
    setStep(2);
  };

  const handleInitializeDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/setup/init-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setDbInitialized(true);
        setStep(1); // Move to company setup
      } else {
        const error = await response.json();
        alert(`Database initialization failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Database initialization error:', error);
      alert('Database initialization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyData) return;
    
    setLoading(true);

    try {
      // Create the admin user
      const response = await fetch('/api/setup/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: companyData.adminEmail.split('@')[0], // Use email prefix as username
          email: companyData.adminEmail,
          password: companyData.password,
          fullName: companyData.adminName,
          role: 'admin',
          companyData: companyData
        }),
      });

      if (response.ok) {        
        // Auto-login after account creation
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: companyData.adminEmail,
            password: companyData.password
          })
        });

        if (loginResponse.ok) {
          router.push('/');
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Setup failed');
      }
    } catch {
      alert('Setup failed. Please try again.');
    }

    setLoading(false);
  };

  if (step === 0) {
    // Database initialization step
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-600 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Initialize Database</h2>
              <p className="text-gray-600">Set up your CRM database tables and create admin user</p>
            </div>

            <div className="mb-8">
              <button
                onClick={handleInitializeDatabase}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Initializing Database...' : 'Initialize Database'}
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <p>This will create:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Database tables for contacts, calls, messages</li>
                <li>Default admin user (admin/admin123)</li>
                <li>Essential system configuration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return <CompanySetup onComplete={handleCompanySetup} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-teal-500 to-blue-600 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-green-400 to-transparent opacity-20"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center">
                <Check className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
            <p className="text-gray-600">Your Phone CRM system is ready to use</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center p-4 bg-green-50 rounded-xl">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Company Profile</div>
                <div className="text-sm text-gray-500">{companyData?.companyName}</div>
              </div>
            </div>

            <div className="flex items-center p-4 bg-green-50 rounded-xl">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Admin Account</div>
                <div className="text-sm text-gray-500">{companyData?.adminName}</div>
              </div>
            </div>

            <div className="flex items-center p-4 bg-green-50 rounded-xl">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Security</div>
                <div className="text-sm text-gray-500">Encrypted & Protected</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateAccount}
            disabled={loading}
            className="w-full py-3 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors duration-200 font-medium flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Setting up...
              </>
            ) : (
              <>
                <Building2 className="h-5 w-5 mr-2" />
                Complete Setup & Login
              </>
            )}
          </button>

          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              You&apos;ll be automatically logged in after setup
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}