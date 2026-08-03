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
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary, #AAAAAA)',
    letterSpacing: '-0.01em',
  },
  iconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
  },
  value: {
    fontSize: '1.85rem',
    fontWeight: 800,
    color: '#FFFFFF',
    letterSpacing: '-0.03em',
    lineHeight: 1,
  },
  changeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  description: {
    fontSize: '0.75rem',
    color: 'var(--text-muted, #666666)',
  },
};
