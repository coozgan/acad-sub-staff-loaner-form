import React, { useState, useEffect } from 'react';
import {
  Package,
  User,
  Mail,
  CheckCircle,
  Loader2,
  ShoppingCart,
  X,
  Plus,
  AlertCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Device, BorrowFormData, CartItem, SubmissionResult } from '../types/device';
import {
  fetchDevices,
  borrowMultipleDevices,
  getAvailableDevices,
  ApiRequestError,
} from '../services/api';
import { getEmailError, getRequiredFieldError } from '../utils/validation';

interface BorrowFormProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const BorrowForm: React.FC<BorrowFormProps> = ({ onShowToast }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState('');
  const [submissionResults, setSubmissionResults] = useState<SubmissionResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, deviceId: '' });

  const [formData, setFormData] = useState<BorrowFormData>({
    name: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const availableDevices = getAvailableDevices(devices);
  const deviceTypes = [...new Set(availableDevices.map((device) => device.DeviceType))];
  const filteredDevices = selectedDeviceType
    ? availableDevices.filter((device) => device.DeviceType === selectedDeviceType)
    : availableDevices;

  // Filter out devices already in cart
  const selectableDevices = filteredDevices.filter(
    (device) => !cart.some((item) => item.device.AssetID === device.AssetID)
  );

  const handleInputChange = (field: keyof BorrowFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const addToCart = (device: Device) => {
    if (cart.some((item) => item.device.AssetID === device.AssetID)) {
      onShowToast('warning', 'Already in cart', `${device.AssetID} is already in your cart.`);
      return;
    }

    setCart((prev) => [...prev, { device, addedAt: new Date() }]);
    onShowToast('success', 'Added to cart', `${device.AssetID} has been added to your cart.`);
  };

  const removeFromCart = (assetId: string) => {
    setCart((prev) => prev.filter((item) => item.device.AssetID !== assetId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const isInCart = (assetId: string) => {
    return cart.some((item) => item.device.AssetID === assetId);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameError = getRequiredFieldError(formData.name, 'Name');
    if (nameError) newErrors.name = nameError;

    const emailError = getEmailError(formData.email);
    if (emailError) newErrors.email = emailError;

    if (cart.length === 0) {
      newErrors.cart = 'Please add at least one device to your cart';
      onShowToast('warning', 'Cart is empty', 'Please add at least one device before submitting.');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setProgress({ current: 0, total: cart.length, deviceId: '' });

    const finalReason = "";

    try {
      const results = await borrowMultipleDevices(
        cart.map((item) => item.device),
        formData.name,
        formData.email,
        finalReason,
        (completed, total, currentDevice) => {
          setProgress({ current: completed, total, deviceId: currentDevice });
        }
      );

      setSubmissionResults(results);
      setSubmitted(true);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (failCount === 0) {
        onShowToast(
          'success',
          'All devices borrowed successfully!',
          `${successCount} device(s) have been checked out.`
        );
      } else if (successCount > 0) {
        onShowToast(
          'warning',
          'Partial success',
          `${successCount} device(s) borrowed, ${failCount} failed.`
        );
      } else {
        onShowToast('error', 'All requests failed', 'Please check the error messages and try again.');
      }

      await loadDevices();
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : 'An unexpected error occurred.';
      onShowToast('error', 'Submission failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubmissionResults([]);
    setCart([]);
    setFormData({
      name: '',
      email: '',
    });
    setProgress({ current: 0, total: 0, deviceId: '' });
  };

  // Submission Results View
  if (submitted) {
    const successCount = submissionResults.filter((r) => r.success).length;
    const failCount = submissionResults.filter((r) => !r.success).length;

    return (
      <div className="space-y-6">
        {/* Summary Header */}
        <div className="text-center py-6">
          <div
            className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${failCount === 0
              ? 'bg-green-500/20'
              : successCount > 0
                ? 'bg-yellow-500/20'
                : 'bg-red-500/20'
              }`}
          >
            {failCount === 0 ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <AlertCircle className="w-10 h-10 text-yellow-600" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {failCount === 0 ? 'All Devices Borrowed!' : 'Submission Complete'}
          </h3>
          <p className="text-gray-600">
            {successCount} successful, {failCount} failed
          </p>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          {submissionResults.map((result) => (
            <div
              key={result.deviceId}
              className={`cart-item ${result.success ? 'success' : 'error'}`}
            >
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{result.deviceId}</p>
                  {result.error && <p className="text-sm text-red-600">{result.error}</p>}
                </div>
              </div>
              <span className={`badge ${result.success ? 'badge-success' : 'badge-error'}`}>
                {result.success ? 'Success' : 'Failed'}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button onClick={handleReset} className="btn-primary flex-1">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Borrow More Devices
          </button>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--color-primary)] mb-4" />
        <p className="text-gray-600">Loading devices...</p>
      </div>
    );
  }

  // Error State
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-800 mb-2 font-semibold">Failed to load devices</p>
        <p className="text-gray-500 text-sm mb-6">{loadError}</p>
        <button onClick={loadDevices} className="btn-primary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <User className="w-5 h-5 text-[var(--color-primary)]" />
          Personal Information
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">
              <User className="w-4 h-4 mr-2 text-gray-400" />
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Juan Dela Cruz"
            />
            {errors.name && (
              <p className="error-text">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="form-label">
              <Mail className="w-4 h-4 mr-2 text-gray-400" />
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="juandelacruz30@ics.edu.sg"
            />
            {errors.email && (
              <p className="error-text">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Device Selection Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Package className="w-5 h-5 text-[var(--color-primary)]" />
          Select Devices
        </h3>

        {/* Device Type Filter */}
        <div>
          <label className="form-label">Filter by Device Type</label>
          <select
            value={selectedDeviceType}
            onChange={(e) => setSelectedDeviceType(e.target.value)}
            className="form-select"
          >
            <option value="">All Types</option>
            {deviceTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Available Devices Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectableDevices.length} device(s) available
            </p>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Cart
              </button>
            )}
          </div>

          {selectableDevices.length === 0 && cart.length === 0 ? (
            <div className="empty-state">
              <Package className="empty-state-icon" />
              <p>No devices available</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
              {selectableDevices.map((device) => (
                <div
                  key={device.AssetID}
                  onClick={() => addToCart(device)}
                  className={`device-card ${isInCart(device.AssetID) ? 'in-cart' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{device.AssetID}</p>
                      <p className="text-sm text-gray-500">{device.DeviceType}</p>
                    </div>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-[var(--color-primary)] group transition-colors"
                    >
                      <Plus className="w-4 h-4 text-gray-600 group-hover:text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      {cart.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            Your Cart ({cart.length})
          </h3>

          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.device.AssetID} className="cart-item">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.device.AssetID}</p>
                    <p className="text-sm text-gray-500">{item.device.DeviceType}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.device.AssetID)}
                  className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center hover:bg-red-500/40 transition-colors"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {errors.cart && (
        <p className="error-text">
          <AlertCircle className="w-3.5 h-3.5 mr-1" />
          {errors.cart}
        </p>
      )}

      {/* Progress Bar (during submission) */}
      {submitting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Processing {progress.deviceId || '...'}
            </span>
            <span className="text-gray-800 font-medium">
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || cart.length === 0}
        className="btn-primary w-full"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Processing {progress.current}/{progress.total}...
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5 mr-2" />
            Borrow {cart.length} Device{cart.length !== 1 ? 's' : ''}
          </>
        )}
      </button>
    </form>
  );
};