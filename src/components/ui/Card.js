"use client";

import React, { useState } from 'react';

const Card = ({
  children,
  title,
  subtitle,
  icon,
  hoverable = false,
  padding = '24px',
  className = '',
  onClick,
  style = {},
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyle = {
    backgroundColor: 'var(--card)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    padding: padding,
    transition: 'all 0.3s ease',
    transform: isHovered && hoverable ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow: isHovered && hoverable ? 'var(--shadow-card)' : 'none',
    cursor: hoverable || onClick ? 'pointer' : 'default',
    ...style
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: (title || subtitle) ? '20px' : '0'
  };

  const iconContainerStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: 'var(--accent-surface)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px'
  };

  const titleStyle = {
    color: 'var(--text)',
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  };

  const subtitleStyle = {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    margin: '4px 0 0 0'
  };

  return (
    <div
      style={cardStyle}
      className={className}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {(title || subtitle || icon) && (
        <div style={headerStyle}>
          {icon && <div style={iconContainerStyle}>{icon}</div>}
          <div>
            {title && <h3 style={titleStyle}>{title}</h3>}
            {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
