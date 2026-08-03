'use client';
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  totalItems = 0,
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 25, 50]
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div style={styles.container}>
      {/* Items info */}
      <div style={styles.info}>
        Showing <span style={styles.highlight}>{startItem}</span> to{' '}
        <span style={styles.highlight}>{endItem}</span> of{' '}
        <span style={styles.highlight}>{totalItems}</span> items
      </div>

      {/* Pagination Controls */}
      <div style={styles.controls}>
        {/* Items per page selector */}
        {onItemsPerPageChange && (
          <div style={styles.pageSizeWrapper}>
            <span style={styles.pageSizeLabel}>Rows:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              style={styles.pageSizeSelect}
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={styles.navGroup}>
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            style={{ ...styles.btn, ...(currentPage === 1 ? styles.btnDisabled : {}) }}
            title="First Page"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ ...styles.btn, ...(currentPage === 1 ? styles.btnDisabled : {}) }}
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page Number Pills */}
          {getPageNumbers().map((num) => (
            <button
              key={num}
              onClick={() => onPageChange(num)}
              style={{
                ...styles.pageBtn,
                ...(currentPage === num ? styles.pageBtnActive : {})
              }}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{ ...styles.btn, ...(currentPage === totalPages ? styles.btnDisabled : {}) }}
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            style={{ ...styles.btn, ...(currentPage === totalPages ? styles.btnDisabled : {}) }}
            title="Last Page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    padding: '16px 20px',
    backgroundColor: 'var(--card, #121214)',
    border: '1px solid var(--border, #2a2a30)',
    borderRadius: 'var(--radius-sm, 12px)',
    marginTop: '20px',
  },
  info: {
    color: 'var(--text-secondary, #AAAAAA)',
    fontSize: '0.875rem',
  },
  highlight: {
    color: 'var(--text, #FFFFFF)',
    fontWeight: 600,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  pageSizeWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pageSizeLabel: {
    color: 'var(--text-secondary, #AAAAAA)',
    fontSize: '0.85rem',
  },
  pageSizeSelect: {
    backgroundColor: 'var(--bg, #080808)',
    border: '1px solid var(--border, #2a2a30)',
    color: 'var(--text, #FFFFFF)',
    borderRadius: '8px',
    padding: '4px 8px',
    fontSize: '0.85rem',
    outline: 'none',
    cursor: 'pointer',
  },
  navGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border, #2a2a30)',
    color: 'var(--text, #FFFFFF)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  pageBtn: {
    minWidth: '32px',
    height: '32px',
    padding: '0 8px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-secondary, #AAAAAA)',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  pageBtnActive: {
    backgroundColor: 'var(--accent, #E00008)',
    color: '#FFFFFF',
    fontWeight: 600,
    boxShadow: '0 0 12px rgba(224, 0, 8, 0.4)',
  },
};
