'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { StatsSkeleton } from './Loading';

export default function StatsCard({
  title,
  value,
  change,
  changeType = 'up',
  icon: Icon,
  description,
  loading = false,
  color = 'var(--accent, #E00008)'
}) {
  if (loading) return <StatsSkeleton />;

  const isUp = changeType === 'up';

  return (
    <div style={styles.card} className="glass-card">
      <div style={styles.header}>
        <span style={styles.title}>{title}</span>
        {Icon && (
          <div style={{ ...styles.iconBadge, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
            {typeof Icon === 'function' || typeof Icon === 'object' ? (
              <Icon size={18} color={color} />
            ) : (
              <span style={{ fontSize: '1.1rem' }}>{Icon}</span>
            )}
          </div>
        )}
      </div>

      <div style={styles.valueRow}>
        <span style={styles.value}>{value}</span>
        {change && (
          <div
            style={{
              ...styles.changeBadge,
              backgroundColor: isUp ? 'var(--success-glow, rgba(0,200,83,0.15))' : 'rgba(255,23,68,0.15)',
              color: isUp ? 'var(--success, #00c853)' : 'var(--danger, #ff1744)',
            }}
          >
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{change}</span>
          </div>
        )}
      </div>

      {description && <div style={styles.description}>{description}</div>}
    </div>
  );
}

const styles = {
  card: {
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderRadius: '14px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '4px'
  },
  title: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--text-secondary, #AAAAAA)',
    letterSpacing: '0.2px',
    textTransform: 'uppercase',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  iconBadge: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  valueRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
    flexWrap: 'wrap'
  },
  value: {
    fontSize: '1.4rem',
    fontWeight: 900,
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
    lineHeight: 1,
  },
  changeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    padding: '2px 6px',
    borderRadius: '12px',
    fontSize: '0.65rem',
    fontWeight: 700,
    whiteSpace: 'nowrap'
  },
  description: {
    fontSize: '0.7rem',
    color: 'var(--text-muted, #666666)',
  },
};
