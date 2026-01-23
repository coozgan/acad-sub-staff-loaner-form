import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastProps {
    toast: ToastMessage;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const duration = toast.duration || 5000;
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onClose(toast.id), 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(toast.id), 300);
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <AlertCircle className="w-5 h-5" />,
        warning: <AlertTriangle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />,
    };

    return (
        <div
            className={`toast ${toast.type}`}
            style={{
                animation: isExiting ? 'slideOut 0.3s ease-in forwards' : undefined,
            }}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-white">{icons[toast.type]}</div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{toast.title}</p>
                    {toast.message && (
                        <p className="text-sm text-white/80 mt-1">{toast.message}</p>
                    )}
                </div>
                <button
                    onClick={handleClose}
                    className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

interface ToastContainerProps {
    toasts: ToastMessage[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
};

// Hook for managing toasts
export const useToast = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (toast: Omit<ToastMessage, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts((prev) => [...prev, { ...toast, id }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const showSuccess = (title: string, message?: string) => {
        addToast({ type: 'success', title, message });
    };

    const showError = (title: string, message?: string) => {
        addToast({ type: 'error', title, message, duration: 8000 });
    };

    const showWarning = (title: string, message?: string) => {
        addToast({ type: 'warning', title, message });
    };

    const showInfo = (title: string, message?: string) => {
        addToast({ type: 'info', title, message });
    };

    return {
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };
};
