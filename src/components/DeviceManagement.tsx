'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Phone, Wifi, Settings } from 'lucide-react';

interface Device {
  id: number;
  type: 'mobile' | 'yealink';
  name: string;
  identifier: string; // MAC address for Yealink, device ID for mobile
  status: 'active' | 'inactive' | 'provisioning';
  lastSeen?: string;
  extension?: string;
  user?: string;
}

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device?: Device;
  type: 'mobile' | 'yealink';
}

function DeviceModal({ isOpen, onClose, device, type }: DeviceModalProps) {
  const [formData, setFormData] = useState({
    name: device?.name || '',
    identifier: device?.identifier || '',
    extension: device?.extension || '',
    userId: device?.user || ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const endpoint = type === 'mobile' ? '/api/sip/register' : '/api/yealink/devices';
      const response = await fetch(endpoint, {
        method: device ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deviceType: type,
          id: device?.id
        })
      });

      if (response.ok) {
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error('Device registration error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {device ? 'Edit' : 'Add'} {type === 'mobile' ? 'Mobile' : 'Yealink'} Device
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border rounded-md"
              placeholder={type === 'mobile' ? 'John\'s iPhone' : 'Reception Desk Phone'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'mobile' ? 'Device ID' : 'MAC Address'}
            </label>
            <input
              type="text"
              value={formData.identifier}
              onChange={(e) => setFormData({...formData, identifier: e.target.value})}
              className="w-full p-2 border rounded-md"
              placeholder={type === 'mobile' ? 'mobile-device-123' : '00:15:65:12:34:56'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Extension
            </label>
            <input
              type="text"
              value={formData.extension}
              onChange={(e) => setFormData({...formData, extension: e.target.value})}
              className="w-full p-2 border rounded-md"
              placeholder="101"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned User ID
            </label>
            <input
              type="text"
              value={formData.userId}
              onChange={(e) => setFormData({...formData, userId: e.target.value})}
              className="w-full p-2 border rounded-md"
              placeholder="1"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              {device ? 'Update' : 'Add'} Device
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | undefined>();
  const [deviceType, setDeviceType] = useState<'mobile' | 'yealink'>('mobile');

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      // This would typically fetch from your API
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = (type: 'mobile' | 'yealink') => {
    setDeviceType(type);
    setSelectedDevice(undefined);
    setModalOpen(true);
  };

  const handleEditDevice = (device: Device) => {
    setDeviceType(device.type);
    setSelectedDevice(device);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Device Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleAddDevice('mobile')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            Add Mobile
          </button>
          <button
            onClick={() => handleAddDevice('yealink')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Add Yealink
          </button>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-12">
          <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No devices registered</h3>
          <p className="text-gray-400 mb-4">Get started by adding your first mobile or Yealink device</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleEditDevice(device)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {device.type === 'mobile' ? (
                    <Smartphone className="w-8 h-8 text-green-600" />
                  ) : (
                    <Phone className="w-8 h-8 text-blue-600" />
                  )}
                  <div>
                    <h3 className="font-medium">{device.name}</h3>
                    <p className="text-sm text-gray-600">
                      {device.type === 'mobile' ? 'Mobile Device' : 'Yealink Phone'}
                      {device.extension && ` • Ext ${device.extension}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    device.status === 'active' ? 'bg-green-100 text-green-800' :
                    device.status === 'provisioning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    <Wifi className={`w-3 h-3 ${
                      device.status === 'active' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    {device.status}
                  </div>
                  <Settings className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              {device.lastSeen && (
                <div className="mt-2 text-xs text-gray-500">
                  Last seen: {new Date(device.lastSeen).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <DeviceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        device={selectedDevice}
        type={deviceType}
      />
    </div>
  );
}