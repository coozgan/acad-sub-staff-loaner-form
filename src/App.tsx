import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { BorrowForm } from './components/BorrowForm';
import { ReturnForm } from './components/ReturnForm';
import { ToastContainer, useToast, ToastType } from './components/Toast';

function App() {
  const [activeTab, setActiveTab] = useState<'borrow' | 'return'>('borrow');
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();

  const handleShowToast = (type: ToastType, title: string, message?: string) => {
    switch (type) {
      case 'success':
        showSuccess(title, message);
        break;
      case 'error':
        showError(title, message);
        break;
      case 'warning':
        showWarning(title, message);
        break;
      case 'info':
        showInfo(title, message);
        break;
    }
  };

  return (
    <div className="min-h-screen animated-bg">
      <div className="content-container">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="logo-container">
            <img
              src="https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_4/v1622188341/ics/fvi34ugb5edtsbwzddiv/2014-ICS-Logo-FINAL.jpg"
              alt="ICS Logo"
              className="h-16 w-auto object-contain rounded-lg"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Device Loaner System
          </h1>
          <p className="text-gray-600">
            Borrow and return devices with ease
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card-sm mb-6 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('borrow')}
              className={`tab-btn ${activeTab === 'borrow' ? 'active-borrow' : ''}`}
            >
              <Download className="w-4 h-4 mr-2" />
              Borrow Device
            </button>
            <button
              onClick={() => setActiveTab('return')}
              className={`tab-btn ${activeTab === 'return' ? 'active-return' : ''}`}
            >
              <Upload className="w-4 h-4 mr-2" />
              Return Device
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="glass-card p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab === 'borrow' ? 'Borrow Devices' : 'Return a Device'}
            </h2>
            <p className="text-gray-600">
              {activeTab === 'borrow'
                ? 'Select multiple devices to borrow. All items will be processed in your submission.'
                : "Enter your details to return a borrowed device."}
            </p>
          </div>

          {/* Form Content */}
          <div className="transition-opacity duration-200">
            {activeTab === 'borrow' ? (
              <BorrowForm onShowToast={handleShowToast} />
            ) : (
              <ReturnForm onShowToast={handleShowToast} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Need help? Contact IT support for assistance with device loans.
          </p>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;