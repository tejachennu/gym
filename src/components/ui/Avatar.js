"use client";

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';

export function getDirectImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  
  const driveRegex = /(?:id=|\/d\/|file\/d\/)([a-zA-Z0-9_-]{25,})/;
  const match = trimmed.match(driveRegex);
  if (match && match[1]) {
    const fileId = match[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }
  return trimmed;
}

const Avatar = ({ 
  src, 
  name = 'User', 
  size = 'md', 
  status,
  style = {},
  onClick,
  enableModal = false
}) => {
  const [currentSrc, setCurrentSrc] = useState(() => getDirectImageUrl(src));
  const [hasError, setHasError] = useState(false);
  const [retryStep, setRetryStep] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setCurrentSrc(getDirectImageUrl(src));
    setHasError(false);
    setRetryStep(0);
  }, [src]);

  const sizes = {
    sm: { width: '28px', height: '28px', fontSize: '12px' },
    md: { width: '38px', height: '38px', fontSize: '15px' },
    lg: { width: '52px', height: '52px', fontSize: '20px' },
    xl: { width: '76px', height: '76px', fontSize: '28px' }
  };

  const currentSize = sizes[size] || sizes.md;
  const isClickable = !!onClick || (enableModal && !!currentSrc && !hasError);

  const containerStyle = {
    position: 'relative',
    display: 'inline-block',
    flexShrink: 0,
    cursor: isClickable ? 'pointer' : 'default',
    ...currentSize,
    ...style
  };

  const avatarStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    backgroundColor: 'var(--card-border, #2a2a30)',
    border: '2px solid var(--card, #121214)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 'bold',
    background: (!currentSrc || hasError) ? 'linear-gradient(135deg, var(--accent, #E00008), #8a0005)' : 'none'
  };

  const statuses = {
    online: '#00c853',
    offline: '#AAAAAA',
    away: '#ffd600'
  };

  const statusStyle = {
    position: 'absolute',
    bottom: '5%',
    right: '5%',
    width: '25%',
    height: '25%',
    minWidth: '8px',
    minHeight: '8px',
    borderRadius: '50%',
    backgroundColor: statuses[status],
    border: '2px solid var(--card, #121214)'
  };

  const getInitials = (n) => {
    if (!n) return 'U';
    return n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleImgError = () => {
    if (!src) return;
    const driveRegex = /(?:id=|\/d\/|file\/d\/)([a-zA-Z0-9_-]{25,})/;
    const match = String(src).match(driveRegex);
    
    if (match && match[1] && retryStep === 0) {
      setRetryStep(1);
      setCurrentSrc(`https://drive.google.com/uc?export=view&id=${match[1]}`);
      return;
    }
    if (match && match[1] && retryStep === 1) {
      setRetryStep(2);
      setCurrentSrc(`https://lh3.googleusercontent.com/d/${match[1]}=s1000`);
      return;
    }
    setHasError(true);
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    if (enableModal && currentSrc && !hasError) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div style={containerStyle} onClick={handleClick} title={name}>
        {currentSrc && !hasError ? (
          <img 
            src={currentSrc} 
            alt={name} 
            style={avatarStyle} 
            onError={handleImgError} 
          />
        ) : (
          <div style={avatarStyle}>
            {getInitials(name)}
          </div>
        )}
        {status && statuses[status] && (
          <div style={statusStyle} />
        )}
      </div>

      {isModalOpen && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={`${name} - Profile Photo`} 
          size="md"
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
            <img 
              src={currentSrc} 
              alt={name} 
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', objectFit: 'contain' }} 
            />
          </div>
        </Modal>
      )}
    </>
  );
};

export default Avatar;

