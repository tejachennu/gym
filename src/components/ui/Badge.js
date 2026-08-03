"use client";

import React from 'react';

const Badge = ({ 
  text, 
  variant = 'default', 
  size = 'md', 
  dot = false,
  style = {}
}) => {
  const colors = {
    default: { bg: '#2a2a30', text: '#FFFFFF', dot: '#FFFFFF' },
    success: { bg: 'rgba(0, 200, 83, 0.15)', text: '#00c853', dot: '#00c853' },
    warning: { bg: 'rgba(255, 214, 0, 0.15)', text: '#ffd600', dot: '#ffd600' },
    danger: { bg: 'rgba(255, 23, 68, 0.15)', text: '#ff1744', dot: '#ff1744' },
    info: { bg: 'rgba(33, 150, 243, 0.15)', text: '#2196f3', dot: '#2196f3' }
  };

  const sizes = {
    sm: { padding: '2px 8px', fontSize: '12px' },
    md: { padding: '4px 12px', fontSize: '14px' }
  };

  const currentVariant = colors[variant] || colors.default;
  const currentSize = sizes[size] || sizes.md;

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: currentVariant.bg,
    color: currentVariant.text,
    borderRadius: '999px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    ...currentSize,
    ...style
  };

  const dotStyle = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: currentVariant.dot,
    animation: dot ? 'pulse 2s infinite' : 'none'
  };

  return (
    <span style={badgeStyle}>
      {dot && <span style={dotStyle} />}
      {text}
    </span>
  );
};

export default Badge;
