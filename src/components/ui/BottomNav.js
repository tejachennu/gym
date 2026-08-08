'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Utensils, Dumbbell, Activity, Camera, History, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { userProfile, userData } = useAuth();
  const profile = userProfile || userData;

  const hasPlan = !!(profile?.currentPlan && profile?.currentPlan !== 'None' && profile?.currentPlan !== 'Not Assigned') || (profile?.planHistory && profile.planHistory.length > 0);

  const planFeatures = profile?.planFeatures || {};

  const hasDiet = typeof planFeatures.hasDiet === 'boolean' ? planFeatures.hasDiet : hasPlan;
  const hasWorkout = typeof planFeatures.hasWorkout === 'boolean' ? planFeatures.hasWorkout : hasPlan;
  const hasTracking = typeof planFeatures.hasTracking === 'boolean' ? planFeatures.hasTracking : hasPlan;
  const hasPostureCheckin = planFeatures.hasPostureCheckin === true;

  if (profile?.status === 'inactive') return null;

  const navItems = [
    { label: 'Home', href: '/client', icon: Home, show: true },
    { label: 'Diet', href: '/client/diet', icon: Utensils, show: hasDiet },
    { label: 'Workout', href: '/client/workout', icon: Dumbbell, show: hasWorkout },
    { label: 'Activity', href: '/client/daily-log', icon: Activity, show: hasTracking },
    { label: 'History', href: '/client/history', icon: History, show: true },
    { label: 'Profile', href: '/client/profile', icon: User, show: true },
  ].filter(item => item.show);

  return (
    <nav style={styles.nav}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        const itemWidth = `${100 / navItems.length}%`;

        return (
          <Link key={item.label} href={item.href} style={{ ...styles.item, width: itemWidth }}>
            {isActive && <div style={styles.activeDot} />}
            <div
              style={{
                color: isActive ? 'var(--accent, #E00008)' : 'var(--text-secondary, #AAAAAA)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              <Icon size={18} />
            </div>
            <span
              style={{
                ...styles.label,
                color: isActive ? 'var(--text, #FFFFFF)' : 'var(--text-secondary, #AAAAAA)',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '56px',
    backgroundColor: 'var(--glass-card-bg, rgba(18, 18, 20, 0.85))',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderTop: '1px solid var(--border, #2a2a30)',
    display: 'flex',
    justify: 'space-around',
    alignItems: 'center',
    paddingBottom: 'env(safe-area-inset-bottom)',
    zIndex: 100,
    boxShadow: 'var(--shadow-card)',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    textDecoration: 'none',
    height: '100%',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 0,
    width: '20px',
    height: '3px',
    backgroundColor: 'var(--accent, #E00008)',
    borderRadius: '0 0 4px 4px',
    boxShadow: 'var(--shadow-glow)',
  },
  label: {
    fontSize: '0.65rem',
    transition: 'color 0.2s',
  },
};
