'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(8, 8, 8, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999999,
    padding: '20px',
    boxSizing: 'border-box',
  };

  const sizes = {
    sm: '420px',
    md: '620px',
    lg: '850px',
    xl: '1140px'
  };

  const modalStyle = {
    backgroundColor: 'var(--card, #121214)',
    border: '1px solid var(--border, #2a2a30)',
    borderRadius: 'var(--radius, 20px)',
    width: '100%',
    maxWidth: sizes[size],
    maxHeight: 'calc(100vh - 60px)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.8)',
    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    overflow: 'hidden',
    margin: 'auto',
  };

  const headerStyle = {
    padding: '20px 24px',
    borderBottom: '1px solid var(--border, #2a2a30)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    flexShrink: 0,
  };

  const titleStyle = {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
  };

  const closeBtnStyle = {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary, #AAAAAA)',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s ease'
  };

  const contentStyle = {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  };

  const modalContent = (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {title && (
          <div style={headerStyle}>
            <h2 style={titleStyle}>{title}</h2>
            <button 
              style={closeBtnStyle} 
              onClick={onClose}
              onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary, #AAAAAA)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div style={contentStyle}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
