import React, { useState, useEffect } from 'react';
import { User, Mail, Package, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Device, ReturnFormData } from '../types/device';
import { fetchDevices, returnDevice, getBorrowedDevices, ApiRequestError } from '../services/api';

interface ReturnFormProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const ReturnForm: React.FC<ReturnFormProps> = ({ onShowToast }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<ReturnFormData>({
    name: '',
    email: '',
    deviceName: '',
  });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchDevices();
      setDevices(data);
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : 'Failed to load devices. Please try again.';
      setLoadError(message);
      onShowToast('error', 'Failed to load devices', message);
    } finally {
      setLoading(false);
    }
  };

  // Show all borrowed devices once both name and email are filled
  const borrowedDevices = formData.name && formData.email ? getBorrowedDevices(devices) : [];

  const handleInputChange = (field: keyof ReturnFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'name' || field === 'email' ? { deviceName: '' } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.deviceName) {
      onShowToast('warning', 'No device selected', 'Please select a device to return.');
      return;
    }

    setSubmitting(true);
    try {
      await returnDevice(formData.deviceName);
      setSubmitted(true);
      onShowToast('success', 'Device returned successfully!', `${formData.deviceName} has been returned.`);
      setFormData({
        name: '',
        email: '',
        deviceName: '',
      });
      await loadDevices();
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : 'Failed to return device. Please try again.';
      onShowToast('error', 'Return failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Device Returned Successfully!</h3>
        <p className="text-gray-600 mb-8">Thank you for returning the device in good condition.</p>
        <button onClick={() => setSubmitted(false)} className="btn-secondary">
          Return Another Device
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--color-secondary)] mb-4" />
        <p className="text-gray-600">Loading devices...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-800 font-semibold mb-2">Failed to load devices</p>
        <p className="text-gray-500 text-sm mb-6">{loadError}</p>
        <button onClick={loadDevices} className="btn-secondary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="form-input"
            placeholder="Juan Dela Cruz"
          />
        </div>

        <div>
          <label className="form-label">
            <Mail className="w-4 h-4 mr-2 text-gray-400" />
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="form-input"
            placeholder="juandelacruz30@ics.edu.sg"
          />
        </div>
      </div>

      {formData.name && formData.email && (
        <div>
          <label className="form-label">
            <Package className="w-4 h-4 mr-2 text-gray-400" />
            Device to Return
          </label>
          <select
            value={formData.deviceName}
            onChange={(e) => handleInputChange('deviceName', e.target.value)}
            className="form-select"
          >
            <option value="">Select a device to return</option>
            {borrowedDevices.map((device) => (
              <option key={device.AssetID} value={device.AssetID}>
                {device.AssetID} ({device.DeviceType}) - Borrowed by: {device.Name}
              </option>
            ))}
          </select>
          {borrowedDevices.length === 0 && (
            <p className="text-yellow-600 text-sm mt-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              No borrowed devices found in the system.
            </p>
          )}
        </div>
      )}

      {(!formData.name || !formData.email) && (
        <div className="info-box">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p>Please enter both your name and email to see available devices for return.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !formData.deviceName}
        className="btn-secondary w-full"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          'Return Device'
        )}
      </button>
    </form>
  );
};