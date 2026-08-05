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
    backgroundColor: 'var(--card)',
    borderRadius: '20px',
    border: '1px dashed var(--border)',
    ...style
  };

  const iconStyle = {
    fontSize: '64px',
    marginBottom: '24px',
    opacity: 0.8
  };

  const titleStyle = {
    color: 'var(--text)',
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
    margin: 0
  };

  const descStyle = {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    maxWidth: '400px',
    marginBottom: actionLabel ? '24px' : '0'
  };

  const btnStyle = {
    backgroundColor: 'var(--accent)',
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
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
