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
    sm: { width: '32px', height: '32px', fontSize: '14px' },
    md: { width: '48px', height: '48px', fontSize: '20px' },
    lg: { width: '64px', height: '64px', fontSize: '24px' },
    xl: { width: '96px', height: '96px', fontSize: '36px' }
  };

  const currentSize = sizes[size] || sizes.md;

  const containerStyle = {
    position: 'relative',
    display: 'inline-block',
    ...currentSize,
    ...style
  };

  const avatarStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    backgroundColor: '#2a2a30',
    border: '2px solid #121214',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 'bold',
    background: !src ? 'linear-gradient(135deg, #E00008, #8a0005)' : 'none'
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
    minWidth: '10px',
    minHeight: '10px',
    borderRadius: '50%',
    backgroundColor: statuses[status],
    border: '2px solid #121214'
  };

  const getInitials = (n) => {
    return n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div style={containerStyle}>
      {src ? (
        <img src={src} alt={name} style={avatarStyle} />
      ) : (
        <div style={avatarStyle}>{getInitials(name)}</div>
      )}
      {status && statuses[status] && (
        <div style={statusStyle} />
      )}
    </div>
  );
};

export default Avatar;
