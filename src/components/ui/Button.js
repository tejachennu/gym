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
    gap: '6px',
    borderRadius: 'var(--radius-sm, 8px)',
    fontWeight: '600',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none',
    position: 'relative',
    overflow: 'hidden',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    transform: isPressed && !disabled ? 'scale(0.97)' : 'scale(1)',
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '0.78rem', height: '32px' },
    md: { padding: '8px 16px', fontSize: '0.85rem', height: '38px' },
    lg: { padding: '10px 20px', fontSize: '0.9rem', height: '44px' }
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--accent, #E00008)',
      color: '#FFFFFF',
      boxShadow: isHovered && !disabled ? 'var(--shadow-glow)' : 'none',
    },
    secondary: {
      backgroundColor: 'var(--card-border, #2a2a30)',
      color: 'var(--text, #FFFFFF)',
    },
    danger: {
      backgroundColor: 'var(--danger, #ff1744)',
      color: '#FFFFFF',
      boxShadow: isHovered && !disabled ? '0 0 15px rgba(255, 23, 68, 0.3)' : 'none',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary, #AAAAAA)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--text, #FFFFFF)',
      border: '1px solid var(--border, #2a2a30)',
    }
  };

  if (variant === 'ghost' && isHovered && !disabled) {
    variantStyles.ghost.color = 'var(--text, #FFFFFF)';
    variantStyles.ghost.backgroundColor = 'var(--card-hover, #1a1a1e)';
  }
  
  if (variant === 'outline' && isHovered && !disabled) {
    variantStyles.outline.border = '1px solid var(--accent, #E00008)';
    variantStyles.outline.color = 'var(--accent, #E00008)';
  }

  const spinnerStyle = {
    width: '14px',
    height: '14px',
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
