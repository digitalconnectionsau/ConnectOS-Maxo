'use client';

import { useState } from 'react';
import { MapPin, ArrowRight, ArrowLeft, Check } from 'lucide-react';

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

interface CompanySetupProps {
  onComplete: (companyData: CompanyData) => void;
}

export default function CompanySetup({ onComplete }: CompanySetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Company Information
    companyName: '',
    email: '',
    phone: '',
    industry: '',
    size: '',
    
    // Step 2: Location
    address: '',
    city: '',
    state: '',
    country: 'Australia',
    
    // Step 3: Admin Account
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    password: '',
    confirmPassword: ''
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-green-400 to-transparent opacity-20"></div>
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-teal-300 opacity-10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="flex gap-8 max-w-6xl w-full">
          
          {/* Left Panel - Company Information */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl w-96">
            <div className="mb-6">
              <div className="text-sm text-teal-600 font-medium mb-2">
                STEP {currentStep}: {currentStep === 1 ? 'COMPANY INFORMATION' : currentStep === 2 ? 'LOCATION' : 'ADMIN ACCOUNT'}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentStep === 1 ? 'Company Information' : currentStep === 2 ? 'Location Details' : 'Admin Account'}
              </h2>
              <p className="text-gray-600 text-sm">
                {currentStep === 1 ? 'Provide information about your company' : 
                 currentStep === 2 ? 'Where is your business located?' : 
                 'Create your admin account'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Company Info */}
              {currentStep === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      placeholder="Seamans Furniture"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="company@gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1 (234)-555-1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    >
                      <option value="">Select industry</option>
                      <option value="furniture">Furniture & Home</option>
                      <option value="retail">Retail</option>
                      <option value="services">Professional Services</option>
                      <option value="technology">Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </>
              )}

              {/* Step 2: Location */}
              {currentStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="123 Business Street"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        placeholder="Sydney"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                        placeholder="NSW"
                      />
                    </div>
                  </div>

                  {/* Mock map area */}
                  <div className="bg-teal-100 rounded-xl h-32 flex items-center justify-center border-2 border-dashed border-teal-300">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 text-teal-500 mx-auto mb-2" />
                      <p className="text-sm text-teal-600">Location will be shown here</p>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Admin Account */}
              {currentStep === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      value={formData.adminName}
                      onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                      placeholder="Adam Watkins"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                      placeholder="yours@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium flex items-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors duration-200 font-medium flex items-center"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors duration-200 font-medium flex items-center"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Complete Setup
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Panel - Create Account */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl w-96">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Setup Progress</h2>
            
            <div className="space-y-4">
              {/* Step indicators */}
              <div className={`flex items-center p-4 rounded-xl ${currentStep >= 1 ? 'bg-teal-50' : 'bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${currentStep >= 1 ? 'bg-teal-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {currentStep > 1 ? <Check className="h-4 w-4" /> : '1'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">Company Information</div>
                  <div className="text-sm text-gray-500">Basic company details</div>
                </div>
              </div>

              <div className={`flex items-center p-4 rounded-xl ${currentStep >= 2 ? 'bg-teal-50' : 'bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${currentStep >= 2 ? 'bg-teal-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {currentStep > 2 ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">Location</div>
                  <div className="text-sm text-gray-500">Business address & map</div>
                </div>
              </div>

              <div className={`flex items-center p-4 rounded-xl ${currentStep >= 3 ? 'bg-teal-50' : 'bg-gray-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${currentStep >= 3 ? 'bg-teal-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {currentStep > 3 ? <Check className="h-4 w-4" /> : '3'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">Admin Account</div>
                  <div className="text-sm text-gray-500">Create your login</div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-100">
              <h3 className="font-semibold text-gray-900 mb-2">What you&apos;ll get:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-teal-500 mr-2" />
                  Complete Phone & CRM System
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-teal-500 mr-2" />
                  Twilio Integration
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-teal-500 mr-2" />
                  Secure File Sharing
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-teal-500 mr-2" />
                  Contact Management
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}