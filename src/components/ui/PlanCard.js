'use client';

import React, { useState } from 'react';
import { Check, Sparkles, Edit2, Trash2 } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';

export default function PlanCard({
  plan,
  onEdit,
  onDelete,
  onSelect,
  isAdmin = false
}) {
  const pricingList = plan.pricing || [
    { duration: plan.duration || '1 Month', price: plan.startingPrice || plan.price || 0 }
  ];

  const [selectedPricingIndex, setSelectedPricingIndex] = useState(0);

  const currentPricing = pricingList[selectedPricingIndex] || pricingList[0];
  const durationLabel = (currentPricing.duration || `${currentPricing.durationVal || 1} ${currentPricing.durationUnit || 'Months'}`).toUpperCase();
  const priceValue = currentPricing.price;

  // Format header title e.g. "1 MONTH INVESTMENT", "1 HOUR INVESTMENT", "PER DAY INVESTMENT"
  const getHeaderTag = (durationStr) => {
    const d = durationStr.toUpperCase();
    if (d.includes('1 DAY') || d.includes('DAILY')) return 'PER DAY INVESTMENT';
    if (d.includes('1 HOUR') || d.includes('HOURLY')) return '1 HOUR INVESTMENT';
    return `${d} INVESTMENT`;
  };

  return (
    <div style={styles.cardContainer} className="glass-card animate-fade-up">
      {/* Badge if available */}
      {plan.badge && (
        <div style={styles.badgeWrapper}>
          <Badge variant="danger" style={styles.popularBadge}>
            <Sparkles size={12} /> {plan.badge}
          </Badge>
        </div>
      )}

      {/* Header Info */}
      <div style={styles.planHeader}>
        <h3 style={styles.planName}>{plan.plan_name || plan.name}</h3>
        {plan.category && <p style={styles.category}>{plan.category}</p>}
        {plan.description && <p style={styles.description}>"{plan.description}"</p>}
      </div>

      {/* Dynamic Price Display Box */}
      <div style={styles.priceBox}>
        <span style={styles.investmentLabel}>{getHeaderTag(currentPricing.duration || `${currentPricing.durationVal || 1} ${currentPricing.durationUnit || 'Months'}`)}</span>
        <div style={styles.priceRow}>
          <span style={styles.currencySymbol}>₹</span>
          <span style={styles.priceText}>{priceValue}</span>
        </div>
      </div>

      {/* Available Durations Selector Grid */}
      {pricingList.length > 1 && (
        <div style={styles.durationsSection}>
          <div style={styles.sectionHeader}>AVAILABLE DURATIONS</div>
          <div style={styles.durationsGrid}>
            {pricingList.map((tier, idx) => {
              const isSelected = selectedPricingIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPricingIndex(idx)}
                  style={{
                    ...styles.durationPill,
                    ...(isSelected ? styles.durationPillActive : {})
                  }}
                >
                  <span style={{
                    ...styles.pillDuration,
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary)'
                  }}>
                    {(tier.duration || `${tier.durationVal || 1} ${tier.durationUnit || 'Months'}`).toUpperCase()}
                  </span>
                  <span style={{
                    ...styles.pillPrice,
                    color: isSelected ? '#FFFFFF' : 'var(--text)'
                  }}>
                    ₹{tier.price}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan Inclusions List */}
      <div style={styles.inclusionsSection}>
        <div style={styles.sectionHeader}>PLAN INCLUSIONS</div>
        <div style={styles.featuresList}>
          {(plan.features || []).map((feat, idx) => (
            <div key={idx} style={styles.featureRow}>
              <div style={styles.checkBadge}>
                <Check size={12} color="#FFFFFF" strokeWidth={3} />
              </div>
              <span style={styles.featureText}>{feat.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {/* Client Portal Enabled Features */}
        <div style={{ marginTop: '12px', padding: '8px 10px', backgroundColor: 'var(--card-hover)', borderRadius: '8px' }}>
          <div style={styles.sectionHeader}>CLIENT PORTAL FEATURES</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
            <Badge variant={(plan.hasDiet ?? true) ? 'success' : 'secondary'} size="sm">
              {(plan.hasDiet ?? true) ? '🥗 Diet' : '🥗 No Diet'}
            </Badge>
            <Badge variant={(plan.hasWorkout ?? true) ? 'success' : 'secondary'} size="sm">
              {(plan.hasWorkout ?? true) ? '🏋️ Workout' : '🏋️ No Workout'}
            </Badge>
            <Badge variant={(plan.hasTracking ?? true) ? 'success' : 'secondary'} size="sm">
              {(plan.hasTracking ?? true) ? '📊 Tracking' : '📊 No Tracking'}
            </Badge>
            {(plan.hasTracking ?? true) && (plan.hasPostureCheckin ?? true) && (
              <Badge variant="success" size="sm">
                📸 10-Day Posture
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {isAdmin ? (
        <div style={styles.adminActions}>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(plan)} style={{ flex: 1 }}>
              <Edit2 size={14} /> Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(plan.id)} style={{ color: '#ff1744' }}>
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      ) : (
        onSelect && (
          <Button 
            fullWidth 
            onClick={() => onSelect(plan, currentPricing)}
            style={styles.selectBtn}
          >
            Select {currentPricing.duration} Plan
          </Button>
        )
      )}
    </div>
  );
}

const styles = {
  cardContainer: {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    gap: '24px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
  },
  badgeWrapper: {
    position: 'absolute',
    top: '-12px',
    right: '24px',
  },
  popularBadge: {
    backgroundColor: 'var(--accent, #E00008)',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    boxShadow: '0 4px 14px rgba(224, 0, 8, 0.5)',
  },
  planHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  planName: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: 'var(--text)',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  category: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--accent, #E00008)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  description: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary, #AAAAAA)',
    marginTop: '6px',
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  priceBox: {
    backgroundColor: 'var(--card-hover)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '20px 16px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  investmentLabel: {
    fontSize: '0.7rem',
    fontWeight: 800,
    color: 'var(--text-secondary, #AAAAAA)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--accent, #E00008)',
    marginRight: '2px',
  },
  priceText: {
    fontSize: '3rem',
    fontWeight: 900,
    color: 'var(--accent, #E00008)',
    lineHeight: 1,
    letterSpacing: '-0.04em',
  },
  durationsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeader: {
    fontSize: '0.7rem',
    fontWeight: 800,
    color: 'var(--text-secondary, #AAAAAA)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  durationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  durationPill: {
    backgroundColor: 'var(--card-hover)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    outline: 'none',
  },
  durationPillActive: {
    backgroundColor: 'var(--accent, #E00008)',
    borderColor: 'var(--accent, #E00008)',
    boxShadow: '0 4px 16px rgba(224, 0, 8, 0.4)',
    transform: 'translateY(-1px)',
  },
  pillDuration: {
    fontSize: '0.68rem',
    fontWeight: 800,
    letterSpacing: '0.05em',
  },
  pillPrice: {
    fontSize: '1.05rem',
    fontWeight: 800,
  },
  inclusionsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    flex: 1,
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  featureRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  checkBadge: {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    backgroundColor: 'var(--accent, #E00008)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(224, 0, 8, 0.4)',
  },
  featureText: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text)',
    letterSpacing: '0.02em',
    lineHeight: 1.3,
  },
  adminActions: {
    display: 'flex',
    gap: '10px',
    marginTop: 'auto',
    paddingTop: '12px',
    borderTop: '1px solid var(--border)',
  },
  selectBtn: {
    marginTop: 'auto',
    backgroundColor: 'var(--accent, #E00008)',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '0.9rem',
  },
};
