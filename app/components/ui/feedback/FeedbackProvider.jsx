'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import Toast from './Toast';

const FeedbackContext = createContext(null);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export const FeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((options) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      open: true,
      duration: 4000,
      showProgress: true,
      position: { vertical: 'top', horizontal: 'center' },
      ...options,
    };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, open: false } : toast
      )
    );
    // Remove from DOM after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 300);
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts((prev) => prev.map((toast) => ({ ...toast, open: false })));
    setTimeout(() => {
      setToasts([]);
    }, 300);
  }, []);

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return showToast({ type: 'success', message, ...options });
  }, [showToast]);

  const error = useCallback((message, options = {}) => {
    return showToast({
      type: 'error',
      message,
      duration: 6000, // Errors stay longer
      ...options
    });
  }, [showToast]);

  const warning = useCallback((message, options = {}) => {
    return showToast({ type: 'warning', message, ...options });
  }, [showToast]);

  const info = useCallback((message, options = {}) => {
    return showToast({ type: 'info', message, ...options });
  }, [showToast]);

  // Toast with action
  const actionToast = useCallback((message, action, options = {}) => {
    return showToast({
      message,
      action,
      duration: 8000, // Action toasts stay longer
      showProgress: false,
      ...options
    });
  }, [showToast]);

  const value = useMemo(() => ({
    showToast,
    hideToast,
    hideAllToasts,
    success,
    error,
    warning,
    info,
    actionToast,
  }), [showToast, hideToast, hideAllToasts, success, error, warning, info, actionToast]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          open={toast.open}
          onClose={() => hideToast(toast.id)}
          message={toast.message}
          description={toast.description}
          type={toast.type}
          duration={toast.duration}
          showProgress={toast.showProgress}
          action={toast.action}
          position={toast.position}
        />
      ))}
    </FeedbackContext.Provider>
  );
};

export default FeedbackProvider;
