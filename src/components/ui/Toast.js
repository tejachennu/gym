"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const containerStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={containerStyle}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const [isClosing, setIsClosing] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(onRemove, 300); // Wait for animation
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  const colors = {
    success: '#00c853',
    error: '#ff1744',
    warning: '#ffd600',
    info: '#2196f3'
  };
  const color = colors[toast.type] || colors.info;

  const toastStyle = {
    backgroundColor: '#121214',
    borderLeft: `4px solid ${color}`,
    borderTop: '1px solid #2a2a30',
    borderRight: '1px solid #2a2a30',
    borderBottom: '1px solid #2a2a30',
    borderRadius: '8px',
    padding: '16px',
    color: '#fff',
    minWidth: '300px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    animation: isClosing ? 'slideOut 0.3s forwards' : 'slideIn 0.3s forwards',
    position: 'relative',
    overflow: 'hidden'
  };

  const progressStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '3px',
    backgroundColor: color,
    width: '100%',
    animation: `shrink ${toast.duration}ms linear forwards`
  };

  return (
    <div style={toastStyle}>
      <style>{`
        @keyframes slideOut {
          to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span>{toast.message}</span>
      </div>
      <button 
        onClick={() => {
          setIsClosing(true);
          setTimeout(onRemove, 300);
        }}
        style={{ background: 'transparent', border: 'none', color: '#AAAAAA', cursor: 'pointer', fontSize: '18px' }}
      >
        ×
      </button>
      <div style={progressStyle} />
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  const { showToast } = context;

  return {
    showToast,
    success: (msg, duration) => showToast(msg, 'success', duration),
    error: (msg, duration) => showToast(msg, 'error', duration),
    warning: (msg, duration) => showToast(msg, 'warning', duration),
    info: (msg, duration) => showToast(msg, 'info', duration),
  };
};

export default ToastProvider;
