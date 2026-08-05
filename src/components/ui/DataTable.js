"use client";

import React, { useState } from 'react';

const DataTable = ({ 
  columns = [], 
  data = [], 
  onRowClick, 
  loading = false, 
  emptyMessage = "No records found" 
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const wrapperStyle = {
    width: '100%',
    overflowX: 'auto',
    backgroundColor: 'var(--card)',
    borderRadius: '20px',
    border: '1px solid var(--border)'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  };

  const thStyle = {
    padding: '16px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap'
  };

  const tdStyle = {
    padding: '16px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text)',
    fontSize: '14px'
  };

  const trStyle = (isHoverable) => ({
    transition: 'background-color 0.2s',
    cursor: isHoverable ? 'pointer' : 'default'
  });

  if (loading) {
    return (
      <div style={wrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {columns.map((c, i) => <th key={i} style={thStyle}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((_, i) => (
              <tr key={i}>
                {columns.map((_, j) => (
                  <td key={j} style={tdStyle}>
                    <div style={{ width: '100%', height: '20px', background: 'var(--card-hover)', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ ...wrapperStyle, padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                style={thStyle} 
                onClick={() => handleSort(col.key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {col.label}
                  {sortConfig.key === col.key && (
                    <span style={{ fontSize: '10px' }}>
                      {sortConfig.direction === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIdx) => (
            <tr 
              key={rowIdx} 
              style={trStyle(!!onRowClick)}
              onClick={() => onRowClick && onRowClick(row)}
              onMouseEnter={e => { if(onRowClick) e.currentTarget.style.backgroundColor = 'var(--card-hover)'; }}
              onMouseLeave={e => { if(onRowClick) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} style={tdStyle}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
