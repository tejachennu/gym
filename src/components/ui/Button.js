"use client";

import React, { useState } from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  onClick,
  style = {},
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none',
    position: 'relative',
    overflow: 'hidden',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    transform: isPressed && !disabled ? 'scale(0.96)' : 'scale(1)',
  };

  const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: '14px', height: '36px' },
    md: { padding: '12px 24px', fontSize: '16px', height: '48px' },
    lg: { padding: '16px 32px', fontSize: '18px', height: '56px' }
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#E00008',
      color: '#FFFFFF',
      boxShadow: isHovered && !disabled ? '0 0 20px rgba(224, 0, 8, 0.4)' : 'none',
    },
    secondary: {
      backgroundColor: '#2a2a30',
      color: '#FFFFFF',
    },
    danger: {
      backgroundColor: '#ff1744',
      color: '#FFFFFF',
      boxShadow: isHovered && !disabled ? '0 0 20px rgba(255, 23, 68, 0.4)' : 'none',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#AAAAAA',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#FFFFFF',
      border: '1px solid #2a2a30',
    }
  };

  if (variant === 'ghost' && isHovered && !disabled) {
    variantStyles.ghost.color = '#FFFFFF';
    variantStyles.ghost.backgroundColor = '#1a1a1e';
  }
  
  if (variant === 'outline' && isHovered && !disabled) {
    variantStyles.outline.border = '1px solid #AAAAAA';
  }

  const spinnerStyle = {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '50%',
    borderTopColor: '#fff',
    animation: 'spin 1s linear infinite'
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style
      }}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      {...props}
    >
      {loading ? (
        <div style={spinnerStyle} />
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
