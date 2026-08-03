'use client';

import React, { useState } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';

export const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  icon,
  required = false,
  disabled = false,
  helperText,
  style = {},
  containerStyle = {},
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const wrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
    ...containerStyle
  };

  const labelStyle = {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: error ? '#ff1744' : (isFocused ? 'var(--accent, #E00008)' : 'var(--text-secondary, #AAAAAA)'),
    transition: 'color 0.2s ease',
  };

  const inputContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: 'var(--card, #121214)',
    border: `1px solid ${error ? '#ff1744' : (isFocused ? 'var(--accent, #E00008)' : 'var(--border, #2a2a30)')}`,
    borderRadius: 'var(--radius-sm, 12px)',
    padding: `12px ${isPassword ? '44px' : '16px'} 12px ${icon ? '42px' : '16px'}`,
    color: '#FFFFFF',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: isFocused && !error ? '0 0 0 1px var(--accent, #E00008), 0 0 12px rgba(224, 0, 8, 0.2)' : 'none',
    opacity: disabled ? 0.5 : 1,
    ...style
  };

  const iconStyle = {
    position: 'absolute',
    left: '14px',
    color: isFocused ? 'var(--accent, #E00008)' : 'var(--text-secondary, #AAAAAA)',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease',
  };

  const cleanLabel = label?.endsWith('*') ? label.slice(0, -1).trim() : label;

  return (
    <div style={wrapperStyle}>
      {label && (
        <label style={labelStyle}>
          {cleanLabel} {required && <span style={{ color: '#E00008' }}>*</span>}
        </label>
      )}
      <div style={inputContainerStyle}>
        {icon && <div style={iconStyle}>{icon}</div>}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyle}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #AAAAAA)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {(error || helperText) && (
        <div style={{ fontSize: '0.75rem', color: error ? '#ff1744' : 'var(--text-secondary, #AAAAAA)', marginTop: '2px' }}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};

export const Textarea = ({ label, error, helperText, required, disabled, style = {}, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const cleanLabel = label?.endsWith('*') ? label.slice(0, -1).trim() : label;

  const inputStyle = {
    width: '100%',
    backgroundColor: 'var(--card, #121214)',
    border: `1px solid ${error ? '#ff1744' : (isFocused ? 'var(--accent, #E00008)' : 'var(--border, #2a2a30)')}`,
    borderRadius: 'var(--radius-sm, 12px)',
    padding: '12px 16px',
    color: '#FFFFFF',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: isFocused && !error ? '0 0 0 1px var(--accent, #E00008), 0 0 12px rgba(224, 0, 8, 0.2)' : 'none',
    opacity: disabled ? 0.5 : 1,
    minHeight: '100px',
    resize: 'vertical',
    ...style
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: error ? '#ff1744' : (isFocused ? 'var(--accent, #E00008)' : 'var(--text-secondary, #AAAAAA)') }}>
          {cleanLabel} {required && <span style={{ color: '#E00008' }}>*</span>}
        </label>
      )}
      <textarea
        disabled={disabled}
        style={inputStyle}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {(error || helperText) && (
        <div style={{ fontSize: '0.75rem', color: error ? '#ff1744' : 'var(--text-secondary, #AAAAAA)' }}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};

export const Select = ({ label, error, helperText, required, disabled, options = [], style = {}, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const cleanLabel = label?.endsWith('*') ? label.slice(0, -1).trim() : label;

  const inputStyle = {
    width: '100%',
    backgroundColor: 'var(--card, #121214)',
    border: `1px solid ${error ? '#ff1744' : (isFocused ? 'var(--accent, #E00008)' : 'var(--border, #2a2a30)')}`,
    borderRadius: 'var(--radius-sm, 12px)',
    padding: '12px 40px 12px 16px',
    color: '#FFFFFF',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: isFocused && !error ? '0 0 0 1px var(--accent, #E00008), 0 0 12px rgba(224, 0, 8, 0.2)' : 'none',
    opacity: disabled ? 0.5 : 1,
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    ...style
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: error ? '#ff1744' : (isFocused ? 'var(--accent, #E00008)' : 'var(--text-secondary, #AAAAAA)') }}>
          {cleanLabel} {required && <span style={{ color: '#E00008' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <select
          disabled={disabled}
          style={inputStyle}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        >
          {options.map((opt, i) => (
            <option key={i} value={typeof opt === 'object' ? opt.value : opt} style={{ backgroundColor: '#121214', color: '#FFFFFF' }}>
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
        </select>
        <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: isFocused ? 'var(--accent, #E00008)' : 'var(--text-secondary, #AAAAAA)', display: 'flex', alignItems: 'center' }}>
          <ChevronDown size={18} />
        </div>
      </div>
      {(error || helperText) && (
        <div style={{ fontSize: '0.75rem', color: error ? '#ff1744' : 'var(--text-secondary, #AAAAAA)' }}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};

export default Input;
