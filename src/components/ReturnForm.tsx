import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  User,
  Mail,
  Package,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  Check,
  Search,
} from 'lucide-react';
import { Device, SubmissionResult } from '../types/device';
import { fetchDevices, returnDevice, getBorrowedDevices, ApiRequestError } from '../services/api';

interface ReturnFormProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

interface ReturnProgress {
  current: number;
  total: number;
  deviceId: string;
}

interface Borrower {
  name: string;
  email: string;
  deviceCount: number;
}

export const ReturnForm: React.FC<ReturnFormProps> = ({ onShowToast }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<ReturnProgress | null>(null);
  const [submissionResults, setSubmissionResults] = useState<SubmissionResult[] | null>(null);

  // User identification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Suggestion dropdown states
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const nameSuggestionsRef = useRef<HTMLDivElement>(null);
  const emailSuggestionsRef = useRef<HTMLDivElement>(null);

  // Selected devices for return (keyed by AssetID)
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDevices();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        nameSuggestionsRef.current &&
        !nameSuggestionsRef.current.contains(event.target as Node) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(event.target as Node)
      ) {
        setShowNameSuggestions(false);
      }
      if (
        emailSuggestionsRef.current &&
        !emailSuggestionsRef.current.contains(event.target as Node) &&
        emailInputRef.current &&
        !emailInputRef.current.contains(event.target as Node)
      ) {
        setShowEmailSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Get unique borrowers from borrowed devices
  const uniqueBorrowers: Borrower[] = useMemo(() => {
    const borrowed = getBorrowedDevices(devices);
    const borrowerMap = new Map<string, Borrower>();

    borrowed.forEach((device) => {
      const key = `${device.Name.toLowerCase()}|${device.Email.toLowerCase()}`;
      if (!borrowerMap.has(key)) {
        borrowerMap.set(key, {
          name: device.Name,
          email: device.Email,
          deviceCount: 1,
        });
      } else {
        borrowerMap.get(key)!.deviceCount++;
      }
    });

    return Array.from(borrowerMap.values());
  }, [devices]);

  // Filter suggestions based on user input (fuzzy matching)
  const nameSuggestions = useMemo(() => {
    if (!name.trim()) return uniqueBorrowers;
    const searchTerm = name.toLowerCase();
    return uniqueBorrowers.filter(
      (b) =>
        b.name.toLowerCase().includes(searchTerm) ||
        b.email.toLowerCase().includes(searchTerm)
    );
  }, [uniqueBorrowers, name]);

  const emailSuggestions = useMemo(() => {
    if (!email.trim()) return uniqueBorrowers;
    const searchTerm = email.toLowerCase();
    return uniqueBorrowers.filter(
      (b) =>
        b.email.toLowerCase().includes(searchTerm) ||
        b.name.toLowerCase().includes(searchTerm)
    );
  }, [uniqueBorrowers, email]);

  // Get devices borrowed by the current user (matched by name AND email)
  const userBorrowedDevices: Device[] = useMemo(() => {
    if (!name.trim() || !email.trim()) return [];

    return devices.filter(
      (device) =>
        device.Name &&
        device.Email &&
        device.Name.toLowerCase() === name.trim().toLowerCase() &&
        device.Email.toLowerCase() === email.trim().toLowerCase()
    );
  }, [devices, name, email]);

  const selectBorrower = (borrower: Borrower) => {
    setName(borrower.name);
    setEmail(borrower.email);
    setShowNameSuggestions(false);
    setShowEmailSuggestions(false);
    setSelectedDevices(new Set()); // Clear selection when borrower changes
  };

  const toggleDevice = (assetId: string) => {
    setSelectedDevices((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDevices.size === userBorrowedDevices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(userBorrowedDevices.map((d) => d.AssetID)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedDevices.size === 0) {
      onShowToast('warning', 'No devices selected', 'Please select at least one device to return.');
      return;
    }

    const devicesToReturn = userBorrowedDevices.filter((d) => selectedDevices.has(d.AssetID));

    setSubmitting(true);
    setProgress({ current: 0, total: devicesToReturn.length, deviceId: '' });

    const results: SubmissionResult[] = [];

    for (let i = 0; i < devicesToReturn.length; i++) {
      const device = devicesToReturn[i];
      setProgress({ current: i, total: devicesToReturn.length, deviceId: device.AssetID });

      try {
        await returnDevice(device.AssetID);
        results.push({ deviceId: device.AssetID, success: true });
      } catch (error) {
        const errorMessage =
          error instanceof ApiRequestError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Unknown error';
        results.push({ deviceId: device.AssetID, success: false, error: errorMessage });
      }

      if (i < devicesToReturn.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    setProgress({ current: devicesToReturn.length, total: devicesToReturn.length, deviceId: '' });
    setSubmissionResults(results);
    setSubmitting(false);

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    if (failCount === 0) {
      onShowToast('success', 'All devices returned!', `${successCount} device(s) returned successfully.`);
    } else if (successCount > 0) {
      onShowToast('warning', 'Partial success', `${successCount} returned, ${failCount} failed.`);
    } else {
      onShowToast('error', 'Return failed', 'All device returns failed. Please try again.');
    }

    await loadDevices();
  };

  const resetForm = () => {
    setSubmissionResults(null);
    setProgress(null);
    setSelectedDevices(new Set());
    setName('');
    setEmail('');
  };

  // Highlight matching text in suggestions
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-200 text-yellow-900 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Submission results view
  if (submissionResults) {
    const successResults = submissionResults.filter((r) => r.success);
    const failedResults = submissionResults.filter((r) => !r.success);

    return (
      <div className="space-y-6">
        <div className="text-center py-6">
          <div
            className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${failedResults.length === 0 ? 'bg-green-500/20' : 'bg-yellow-500/20'
              }`}
          >
            {failedResults.length === 0 ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <AlertCircle className="w-10 h-10 text-yellow-600" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {failedResults.length === 0 ? 'All Devices Returned!' : 'Return Complete'}
          </h3>
          <p className="text-gray-600 mb-4">
            {successResults.length} of {submissionResults.length} device(s) returned successfully.
          </p>
        </div>

        {successResults.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Successfully Returned
            </h4>
            <ul className="space-y-1">
              {successResults.map((result) => (
                <li key={result.deviceId} className="text-green-700 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {result.deviceId}
                </li>
              ))}
            </ul>
          </div>
        )}

        {failedResults.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
              <X className="w-5 h-5" />
              Failed to Return
            </h4>
            <ul className="space-y-2">
              {failedResults.map((result) => (
                <li key={result.deviceId} className="text-red-700 text-sm">
                  <span className="font-medium">{result.deviceId}</span>
                  {result.error && <span className="text-red-500 block ml-4">— {result.error}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button onClick={resetForm} className="btn-secondary w-full">
          Return More Devices
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--color-secondary)] mb-4" />
        <p className="text-gray-600">Loading devices...</p>
      </div>
    );
  }

  // Error state
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
      {/* Name and Email Inputs with Autocomplete */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Name Field with Suggestions */}
        <div className="relative">
          <label className="form-label">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            Name
          </label>
          <div className="relative">
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSelectedDevices(new Set());
                setShowNameSuggestions(true);
              }}
              onFocus={() => setShowNameSuggestions(true)}
              className="form-input pr-10"
              placeholder="Start typing to search..."
              autoComplete="off"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Name Suggestions Dropdown */}
          {showNameSuggestions && nameSuggestions.length > 0 && (
            <div
              ref={nameSuggestionsRef}
              className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto"
            >
              <div className="p-2 text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                <Search className="w-3 h-3 inline mr-1" />
                {nameSuggestions.length} borrower{nameSuggestions.length !== 1 ? 's' : ''} found
              </div>
              {nameSuggestions.map((borrower) => (
                <button
                  key={`${borrower.name}|${borrower.email}`}
                  type="button"
                  onClick={() => selectBorrower(borrower)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {highlightMatch(borrower.name, name)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-3 h-3 text-gray-300" />
                    <span className="text-sm text-gray-500">
                      {highlightMatch(borrower.email, name)}
                    </span>
                    <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {borrower.deviceCount} device{borrower.deviceCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Email Field with Suggestions */}
        <div className="relative">
          <label className="form-label">
            <Mail className="w-4 h-4 mr-2 text-gray-400" />
            Email
          </label>
          <div className="relative">
            <input
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSelectedDevices(new Set());
                setShowEmailSuggestions(true);
              }}
              onFocus={() => setShowEmailSuggestions(true)}
              className="form-input pr-10"
              placeholder="Start typing to search..."
              autoComplete="off"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Email Suggestions Dropdown */}
          {showEmailSuggestions && emailSuggestions.length > 0 && (
            <div
              ref={emailSuggestionsRef}
              className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto"
            >
              <div className="p-2 text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                <Search className="w-3 h-3 inline mr-1" />
                {emailSuggestions.length} borrower{emailSuggestions.length !== 1 ? 's' : ''} found
              </div>
              {emailSuggestions.map((borrower) => (
                <button
                  key={`${borrower.name}|${borrower.email}`}
                  type="button"
                  onClick={() => selectBorrower(borrower)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {highlightMatch(borrower.email, email)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-3 h-3 text-gray-300" />
                    <span className="text-sm text-gray-500">
                      {highlightMatch(borrower.name, email)}
                    </span>
                    <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {borrower.deviceCount} device{borrower.deviceCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info when name/email not entered */}
      {(!name.trim() || !email.trim()) && (
        <div className="info-box">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p>
            Start typing your name or email to see suggestions. Select a borrower from the dropdown
            to view your borrowed devices.
          </p>
        </div>
      )}

      {/* User's borrowed devices */}
      {name.trim() && email.trim() && (
        <>
          {/* Progress indicator during submission */}
          {submitting && progress && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Returning {progress.deviceId} ({progress.current + 1}/{progress.total})...
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((progress.current + 1) / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {userBorrowedDevices.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <Package className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h4 className="font-semibold text-yellow-800 mb-1">No Borrowed Devices Found</h4>
              <p className="text-yellow-700 text-sm">
                No devices are currently borrowed under "{name}" ({email}).
              </p>
              <p className="text-yellow-600 text-xs mt-2">
                Try selecting a different borrower from the suggestions above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header with user info and select all */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="form-label mb-0">
                    <Package className="w-4 h-4 mr-2 text-gray-400" />
                    Devices for {name}
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">{email}</p>
                </div>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  {selectedDevices.size === userBorrowedDevices.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Device list */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="divide-y divide-gray-100">
                  {userBorrowedDevices.map((device) => {
                    const isSelected = selectedDevices.has(device.AssetID);

                    return (
                      <div
                        key={device.AssetID}
                        onClick={() => toggleDevice(device.AssetID)}
                        className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 hover:border-blue-400'
                            }`}
                        >
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>

                        {/* Device Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900">{device.AssetID}</div>
                          <div className="text-sm text-gray-500">{device.DeviceType}</div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${isSelected
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                            }`}
                        >
                          {isSelected ? 'Selected' : 'Borrowed'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selection summary */}
              <div className="text-sm text-gray-500 text-center">
                {selectedDevices.size} of {userBorrowedDevices.length} device(s) selected for return
              </div>
            </div>
          )}
        </>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || selectedDevices.size === 0 || !name.trim() || !email.trim()}
        className="btn-secondary w-full"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Returning Devices...
          </>
        ) : selectedDevices.size > 0 ? (
          `Return ${selectedDevices.size} Device${selectedDevices.size !== 1 ? 's' : ''}`
        ) : (
          'Return Devices'
        )}
      </button>
    </form>
  );
};