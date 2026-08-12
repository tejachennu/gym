'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false
}) {
  if (!isOpen) return null;

  const getAccentColor = () => {
    switch (variant) {
      case 'danger': return 'var(--danger, #ff1744)';
      case 'warning': return '#ffd600';
      default: return 'var(--accent, #E00008)';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: `${getAccentColor()}15`,
          border: `1px solid ${getAccentColor()}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: getAccentColor()
        }}>
          <AlertTriangle size={26} />
        </div>

        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.5, fontWeight: 500 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '10px' }}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            style={{ flex: 1, padding: '10px', justifyContent: 'center' }}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
            style={{ flex: 1, padding: '10px', justifyContent: 'center', fontWeight: 700 }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
