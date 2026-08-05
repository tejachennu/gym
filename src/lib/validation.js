/**
 * Field Validation Utilities for Gym Management Portal
 */

// Keypress handler to restrict typing non-numeric characters in numeric inputs
export const allowOnlyNumbers = (e, allowDecimal = false) => {
  const charCode = e.which ? e.which : e.keyCode;
  // Allow backspace, delete, tab, escape, enter, left/right arrows
  if ([8, 9, 13, 27, 46, 37, 39].includes(charCode)) return true;
  
  if (allowDecimal && charCode === 46) {
    if (e.target.value.includes('.')) {
      e.preventDefault();
      return false;
    }
    return true;
  }

  if (charCode < 48 || charCode > 57) {
    e.preventDefault();
    return false;
  }
  return true;
};

/**
 * Validate a field value with clean, specific error messages including the field name
 */
export const validateField = (fieldName, value, options = {}) => {
  const {
    required = false,
    numeric = false,
    maxDigits = null,
    minDigits = null,
    allowDecimal = false,
    min = null,
    max = null,
    email = false,
    phone = false,
  } = options;

  const strVal = value !== undefined && value !== null ? String(value).trim() : '';

  // Required check
  if (required && !strVal) {
    return `${fieldName} field is required.`;
  }

  if (!strVal) return null; // If not required and empty, valid

  // Email format check
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(strVal)) {
      return `Please enter a valid email address for ${fieldName}.`;
    }
  }

  // Phone check
  if (phone) {
    const phoneClean = strVal.replace(/[\s\-\+\(\)]/g, '');
    if (!/^\d+$/.test(phoneClean)) {
      return `${fieldName} must contain only numbers (letters are not allowed).`;
    }
    if (phoneClean.length < 7 || phoneClean.length > 15) {
      return `${fieldName} must be between 7 and 15 digits long.`;
    }
  }

  // Numeric checks
  if (numeric) {
    // Letters not allowed check
    if (allowDecimal) {
      if (!/^\d*\.?\d*$/.test(strVal) || strVal === '.') {
        return `${fieldName} must be a valid number (letters are not allowed).`;
      }
    } else {
      if (!/^\d+$/.test(strVal)) {
        return `${fieldName} must be a number (letters are not allowed).`;
      }
    }

    // Digits length check (ignoring decimal point)
    const integerPart = strVal.split('.')[0];
    if (maxDigits !== null && integerPart.length > maxDigits) {
      return `${fieldName} cannot exceed ${maxDigits} digits (e.g. ${'9'.repeat(maxDigits)}).`;
    }

    if (minDigits !== null && integerPart.length < minDigits) {
      return `${fieldName} must be at least ${minDigits} digits long.`;
    }

    // Range checks
    const numVal = parseFloat(strVal);
    if (min !== null && numVal < min) {
      return `${fieldName} cannot be less than ${min}.`;
    }
    if (max !== null && numVal > max) {
      return `${fieldName} cannot exceed ${max}.`;
    }
  }

  return null;
};

// Preset validators for common fields in the application
export const FIELD_PRESETS = {
  weight: { numeric: true, allowDecimal: true, maxDigits: 3, max: 500 },
  height: { numeric: true, allowDecimal: true, maxDigits: 3, max: 300 },
  age: { numeric: true, maxDigits: 3, max: 120 },
  water: { numeric: true, allowDecimal: true, maxDigits: 2, max: 20 },
  sleep: { numeric: true, allowDecimal: true, maxDigits: 2, max: 24 },
  steps: { numeric: true, maxDigits: 6, max: 200000 },
  reps: { numeric: true, maxDigits: 3, max: 999 },
  sets: { numeric: true, maxDigits: 3, max: 100 },
  calories: { numeric: true, maxDigits: 5, max: 20000 },
  price: { numeric: true, allowDecimal: true, maxDigits: 6, max: 999999 },
  phone: { phone: true },
  email: { email: true }
};
