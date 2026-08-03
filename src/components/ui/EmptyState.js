"use client";

import React from 'react';

const EmptyState = ({ 
  icon = '📭', 
  title = 'No Data Available', 
  description = 'There is currently nothing to show here.', 
  actionLabel, 
  onAction,
  style = {}
}) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#121214',
    borderRadius: '20px',
    border: '1px dashed #2a2a30',
    ...style
  };

  const iconStyle = {
    fontSize: '64px',
    marginBottom: '24px',
    opacity: 0.8
  };

  const titleStyle = {
    color: '#FFFFFF',
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
    margin: 0
  };

  const descStyle = {
    color: '#AAAAAA',
    fontSize: '14px',
    maxWidth: '400px',
    marginBottom: actionLabel ? '24px' : '0'
  };

  const btnStyle = {
    backgroundColor: '#E00008',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>{icon}</div>
      <h3 style={titleStyle}>{title}</h3>
      <p style={descStyle}>{description}</p>
      {actionLabel && onAction && (
        <button 
          style={btnStyle} 
          onClick={onAction}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ff1a22'; e.currentTarget.style.boxShadow = '0 0 15px rgba(224,0,8,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#E00008'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
