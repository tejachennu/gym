'use client';

import React from 'react';

export const Spinner = ({ size = 24, color = '#E00008', thickness = 3 }) => {
  const style = {
    width: size,
    height: size,
    border: `${thickness}px solid rgba(224, 0, 8, 0.2)`,
    borderRadius: '50%',
    borderTopColor: color,
    animation: 'spin 0.8s linear infinite',
  };
  return <div style={style} />;
};

export const Skeleton = ({ width = '100%', height = '20px', rounded = '8px', style = {} }) => {
  return (
    <div
      className="shimmer"
      style={{
        width,
        height,
        borderRadius: rounded,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        ...style
      }}
    />
  );
};

export const PageLoader = ({ message = 'Loading MRK FITNESS...' }) => {
  const style = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#080808',
    backgroundImage: 'radial-gradient(circle at center, rgba(224, 0, 8, 0.12) 0%, #080808 70%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  };
  return (
    <div style={style}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={56} thickness={4} />
      </div>
      <h2 style={{ marginTop: '24px', fontSize: '1.25rem', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
        <span style={{ color: '#E00008' }}>Power</span>House
      </h2>
      <div style={{ marginTop: '8px', color: '#AAAAAA', fontSize: '0.875rem' }}>{message}</div>
    </div>
  );
};

export const CardSkeleton = () => {
  const cardStyle = {
    backgroundColor: 'var(--card, #121214)',
    borderRadius: 'var(--radius, 20px)',
    border: '1px solid var(--border, #2a2a30)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  };
  
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Skeleton width="48px" height="48px" rounded="50%" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <Skeleton width="60%" height="18px" />
          <Skeleton width="40%" height="13px" />
        </div>
      </div>
      <Skeleton width="100%" height="48px" rounded="12px" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <Skeleton width="30%" height="14px" />
        <Skeleton width="20%" height="14px" />
      </div>
    </div>
  );
};

export const StatsSkeleton = () => {
  return (
    <div style={{
      backgroundColor: 'var(--card, #121214)',
      borderRadius: 'var(--radius, 20px)',
      border: '1px solid var(--border, #2a2a30)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="50%" height="14px" />
        <Skeleton width="32px" height="32px" rounded="10px" />
      </div>
      <Skeleton width="40%" height="28px" />
      <Skeleton width="60%" height="12px" />
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div style={{
      backgroundColor: 'var(--card, #121214)',
      borderRadius: 'var(--radius, 20px)',
      border: '1px solid var(--border, #2a2a30)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <Skeleton width="30%" height="20px" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Skeleton width="40px" height="40px" rounded="50%" />
          <Skeleton width="30%" height="16px" />
          <Skeleton width="25%" height="16px" />
          <Skeleton width="20%" height="16px" style={{ marginLeft: 'auto' }} />
        </div>
      ))}
    </div>
  );
};

export default {
  Spinner,
  Skeleton,
  PageLoader,
  CardSkeleton,
  StatsSkeleton,
  TableSkeleton
};
