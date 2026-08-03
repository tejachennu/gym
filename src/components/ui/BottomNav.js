'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Utensils, Dumbbell, FileText, User } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home', href: '/client', icon: Home },
  { label: 'Diet', href: '/client/diet', icon: Utensils },
  { label: 'Workout', href: '/client/workout', icon: Dumbbell },
  { label: 'Tracking', href: '/client/daily-log', icon: FileText },
  { label: 'Profile', href: '/client/profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav style={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link key={item.href} href={item.href} style={styles.item}>
            {isActive && <div style={styles.activeDot} />}
            <div
              style={{
                color: isActive ? 'var(--accent, #E00008)' : 'var(--text-secondary, #AAAAAA)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isActive ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              <Icon size={20} />
            </div>
            <span
              style={{
                ...styles.label,
                color: isActive ? '#FFFFFF' : 'var(--text-secondary, #AAAAAA)',
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
    height: '68px',
    backgroundColor: 'rgba(18, 18, 20, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderTop: '1px solid var(--border, #2a2a30)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 'env(safe-area-inset-bottom)',
    zIndex: 100,
    boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.5)',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    textDecoration: 'none',
    width: '20%',
    height: '100%',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 0,
    width: '24px',
    height: '3px',
    backgroundColor: 'var(--accent, #E00008)',
    borderRadius: '0 0 4px 4px',
    boxShadow: '0 2px 10px rgba(224, 0, 8, 0.6)',
  },
  label: {
    fontSize: '0.7rem',
    transition: 'color 0.2s',
  },
};
