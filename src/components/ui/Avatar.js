"use client";

import React from 'react';

const Avatar = ({ 
  src, 
  name = 'User', 
  size = 'md', 
  status,
  style = {}
}) => {
  const sizes = {
    sm: { width: '28px', height: '28px', fontSize: '12px' },
    md: { width: '38px', height: '38px', fontSize: '15px' },
    lg: { width: '52px', height: '52px', fontSize: '20px' },
    xl: { width: '76px', height: '76px', fontSize: '28px' }
  };

  const currentSize = sizes[size] || sizes.md;

  const containerStyle = {
    position: 'relative',
    display: 'inline-block',
    flexShrink: 0,
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
    background: !src ? 'linear-gradient(135deg, var(--accent, #E00008), #8a0005)' : 'none'
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

  return (
    <div style={containerStyle}>
      {src ? (
        <img src={src} alt={name} style={avatarStyle} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
      ) : null}
      <div style={{ ...avatarStyle, display: src ? 'none' : 'flex' }}>
        {getInitials(name)}
      </div>
      {status && statuses[status] && (
        <div style={statusStyle} />
      )}
    </div>
  );
};

export default Avatar;
