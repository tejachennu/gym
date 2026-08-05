'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function SearchableSelect({
  label,
  placeholder = '-- Search & Select --',
  searchPlaceholder = 'Search...',
  value,
  onChange,
  options = [], // [{ label, value, email, phone }]
  required = false,
  error,
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search query matching name, email, or phone
  const filteredOptions = options.filter(opt => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const nameMatch = opt.label?.toLowerCase().includes(query);
    const emailMatch = opt.email?.toLowerCase().includes(query);
    const phoneMatch = opt.phone?.toLowerCase().includes(query);

    return nameMatch || emailMatch || phoneMatch;
  });

  const handleSelect = (val) => {
    onChange({ target: { value: val } });
    setIsOpen(false);
    setSearchQuery('');
  };

  const cleanLabel = label?.endsWith('*') ? label.slice(0, -1).trim() : label;

  return (
    <div ref={containerRef} style={{ ...styles.container, ...style }}>
      {label && (
        <label style={styles.label}>
          {cleanLabel} {required && <span style={{ color: 'var(--accent, #E00008)' }}>*</span>}
        </label>
      )}
      
      <div style={{ ...styles.wrapper, zIndex: isOpen ? 1001 : 1 }}>
        {/* Dropdown Toggle Selector */}
        <div 
          onClick={() => setIsOpen(!isOpen)} 
          style={{
            ...styles.selector,
            borderColor: isOpen ? 'var(--accent, #E00008)' : 'var(--border, #2a2a30)',
            boxShadow: isOpen ? '0 0 0 1px var(--accent, #E00008), 0 0 12px rgba(224, 0, 8, 0.2)' : 'none',
          }}
        >
          <span style={{ color: selectedOption ? 'var(--text)' : 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={18} style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }} />
        </div>

        {/* Search & List Dropdown Menu */}
        {isOpen && (
          <div style={styles.dropdownCard}>
            {/* Search Input Box */}
            <div style={styles.searchBox}>
              <Search size={16} style={styles.searchIcon} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
                autoFocus
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')} 
                  style={styles.clearBtn}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Options List */}
            <div style={styles.list}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      style={{
                        ...styles.optionRow,
                        backgroundColor: isSelected ? 'rgba(224, 0, 8, 0.15)' : 'transparent',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = isSelected ? 'rgba(224, 0, 8, 0.2)' : 'var(--card-hover)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = isSelected ? 'rgba(224, 0, 8, 0.15)' : 'transparent'}
                    >
                      <div style={styles.optionDetails}>
                        <div style={styles.optionName}>{opt.label}</div>
                        <div style={styles.optionMeta}>
                          {opt.email && <span>📧 {opt.email}</span>}
                          {opt.phone && <span style={{ marginLeft: '12px' }}>📞 {opt.phone}</span>}
                        </div>
                      </div>
                      {isSelected && <Check size={16} color="var(--accent, #E00008)" style={{ marginLeft: 'auto' }} />}
                    </div>
                  );
                })
              ) : (
                <div style={styles.empty}>No matching clients found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <span style={styles.errorText}>{error}</span>}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary, #AAAAAA)',
  },
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  selector: {
    width: '100%',
    backgroundColor: 'var(--card, #121214)',
    border: '1px solid var(--border, #2a2a30)',
    borderRadius: 'var(--radius-sm, 12px)',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  dropdownCard: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border, #2a2a30)',
    borderRadius: '16px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
    zIndex: 10002,
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--card-hover)',
    borderRadius: '10px',
    border: '1px solid var(--border, #2a2a30)',
    padding: '0 12px',
  },
  searchIcon: {
    color: 'var(--text-secondary, #AAAAAA)',
  },
  searchInput: {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text)',
    padding: '10px 8px',
    fontSize: '0.875rem',
    outline: 'none',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary, #AAAAAA)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  list: {
    maxHeight: '350px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  optionRow: {
    padding: '10px 12px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  optionDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  optionName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  optionMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary, #AAAAAA)',
    display: 'flex',
    alignItems: 'center',
  },
  empty: {
    padding: '16px',
    textAlign: 'center',
    color: 'var(--text-secondary, #AAAAAA)',
    fontSize: '0.85rem',
  },
  errorText: {
    fontSize: '0.75rem',
    color: 'var(--danger, #ff1744)',
  }
};
