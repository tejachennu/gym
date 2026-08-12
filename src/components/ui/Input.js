'use client';

import React, { useState } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { allowOnlyNumbers } from '@/lib/validation';

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
  numeric = false,
  allowDecimal = false,
  helperText,
  style = {},
  containerStyle = {},
  onKeyPress,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const wrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
    ...containerStyle
  };

  const labelStyle = {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: error ? 'var(--danger, #ff1744)' : (isFocused ? 'var(--accent, #E00008)' : 'var(--text-secondary, #AAAAAA)'),
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
    border: `1px solid ${error ? 'var(--danger, #ff1744)' : (isFocused ? 'var(--accent, #E00008)' : 'var(--border, #2a2a30)')}`,
    borderRadius: 'var(--radius-sm, 8px)',
    padding: `8px ${isPassword ? '38px' : '12px'} 8px ${icon ? '36px' : '12px'}`,
    color: 'var(--text, #FFFFFF)',
    fontSize: '0.85rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: isFocused && !error ? '0 0 0 1px var(--accent, #E00008), 0 0 8px var(--accent-glow)' : 'none',
    opacity: disabled ? 0.6 : 1,
    ...style
  };

  const iconStyle = {
    position: 'absolute',
    left: '10px',
    color: isFocused ? 'var(--accent, #E00008)' : 'var(--text-secondary, #AAAAAA)',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease',
  };

  const cleanLabel = label?.endsWith('*') ? label.slice(0, -1).trim() : label;

  const handleKeyPress = (e) => {
    if (numeric) {
      allowOnlyNumbers(e, allowDecimal);
    }
    if (onKeyPress) onKeyPress(e);
  };

  return (
    <div style={wrapperStyle}>
      {label && (
        <label style={labelStyle}>
          {cleanLabel} {required && <span style={{ color: 'var(--accent, #E00008)' }}>*</span>}
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
          onKeyPress={handleKeyPress}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #AAAAAA)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px'
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {(error || helperText) && (
        <div style={{ fontSize: '0.72rem', color: error ? 'var(--danger, #ff1744)' : 'var(--text-secondary, #AAAAAA)', marginTop: '2px' }}>
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
    border: `1px solid ${error ? 'var(--danger, #ff1744)' : (isFocused ? 'var(--accent, #E00008)' : 'var(--border, #2a2a30)')}`,
    borderRadius: 'var(--radius-sm, 8px)',
    padding: '8px 12px',
    color: 'var(--text, #FFFFFF)',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: isFocused && !error ? '0 0 0 1px var(--accent, #E00008), 0 0 8px var(--accent-glow)' : 'none',
    opacity: disabled ? 0.6 : 1,
    minHeight: '80px',
    resize: 'vertical',
    ...style
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: error ? 'var(--danger, #ff1744)' : (isFocused ? 'var(--accent, #E00008)' : 'var(--text-secondary, #AAAAAA)') }}>
          {cleanLabel} {required && <span style={{ color: 'var(--accent, #E00008)' }}>*</span>}
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
        <div style={{ fontSize: '0.72rem', color: error ? 'var(--danger, #ff1744)' : 'var(--text-secondary, #AAAAAA)' }}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};

export const Select = ({ label, error, helperText, required, disabled, options = [], style = {}, containerStyle = {}, children, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const cleanLabel = label?.endsWith('*') ? label.slice(0, -1).trim() : label;

  const inputStyle = {
    width: '100%',
    backgroundColor: 'var(--card, #121214)',
    border: `1px solid ${error ? 'var(--danger, #ff1744)' : (isFocused ? 'var(--accent, #E00008)' : 'var(--border, #2a2a30)')}`,
    borderRadius: 'var(--radius-sm, 8px)',
    padding: '8px 32px 8px 12px',
    color: 'var(--text, #FFFFFF)',
    fontSize: '0.85rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: isFocused && !error ? '0 0 0 1px var(--accent, #E00008), 0 0 8px var(--accent-glow)' : 'none',
    opacity: disabled ? 0.6 : 1,
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    ...style
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', ...containerStyle }}>
      {label && (
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: error ? 'var(--danger, #ff1744)' : (isFocused ? 'var(--accent, #E00008)' : 'var(--text-secondary, #AAAAAA)') }}>
          {cleanLabel} {required && <span style={{ color: 'var(--accent, #E00008)' }}>*</span>}
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
          {children ? children : options.map((opt, i) => (
            <option key={i} value={typeof opt === 'object' ? opt.value : opt} style={{ backgroundColor: '#121214', color: '#FFFFFF' }}>
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
        </select>
        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: isFocused ? 'var(--accent, #E00008)' : 'var(--text-secondary, #AAAAAA)', display: 'flex', alignItems: 'center' }}>
          <ChevronDown size={16} />
        </div>
      </div>
      {(error || helperText) && (
        <div style={{ fontSize: '0.72rem', color: error ? 'var(--danger, #ff1744)' : 'var(--text-secondary, #AAAAAA)' }}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};

export default Input;
