'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Utensils, 
  Dumbbell, 
  Activity, 
  Camera, 
  FileText, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { logoutUser } from '@/lib/auth';
import { useToast } from './Toast';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Clients', path: '/admin/clients', icon: Users },
  { name: 'Plans', path: '/admin/plans', icon: CreditCard },
  { name: 'Diet Plans', path: '/admin/diet-plans', icon: Utensils },
  { name: 'Workout Plans', path: '/admin/workout-plans', icon: Dumbbell },
  { name: 'Monitoring', path: '/admin/monitoring', icon: Activity },
  { name: 'Check-ins', path: '/admin/checkins', icon: Camera },
  { name: 'Blood Reports', path: '/admin/blood-reports', icon: FileText },
  { name: 'Notifications', path: '/admin/notifications', icon: Bell },
];

export default function Sidebar({ userProfile }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div style={styles.mobileHeader}>
        <div style={styles.logoGroup}>
          <div style={styles.logoBadge}>
            <Dumbbell size={18} color="#FFFFFF" />
          </div>
          <span style={styles.logoText}>
            <span style={{ color: 'var(--accent, #E00008)' }}>Power</span>House
          </span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} style={styles.menuBtn}>
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside style={{ ...styles.sidebar, ...(isOpen ? styles.sidebarOpen : {}) }}>
        {/* Brand Header */}
        <div style={styles.brandHeader}>
          <div style={styles.brandLogoRow}>
            <div style={styles.logoBadge}>
              <Dumbbell size={20} color="#FFFFFF" />
            </div>
            <div>
              <h1 style={styles.brandTitle}>
                <span style={{ color: 'var(--accent, #E00008)' }}>Power</span>House
              </h1>
              <div style={styles.portalTag}>
                <ShieldCheck size={12} color="var(--accent, #E00008)" /> Admin Portal
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={styles.nav}>
          <div style={styles.navSectionLabel}>MAIN MENU</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                style={{
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {})
                }}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--accent, #E00008)' : 'var(--text-secondary, #AAAAAA)' }} />
                <span style={styles.navText}>{item.name}</span>
                {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--accent, #E00008)' }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer Profile & Logout */}
        <div style={styles.footer}>
          <div style={styles.profileBox}>
            <div style={styles.avatarCircle}>
              {userProfile?.displayName?.charAt(0) || 'A'}
            </div>
            <div style={styles.profileDetails}>
              <div style={styles.profileName}>{userProfile?.displayName || 'Admin Trainer'}</div>
              <div style={styles.profileRole}>Administrator</div>
            </div>
          </div>

          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile */}
      {isOpen && <div style={styles.backdrop} onClick={() => setIsOpen(false)} />}
    </>
  );
}

const styles = {
  mobileHeader: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    backgroundColor: 'var(--card, #121214)',
    borderBottom: '1px solid var(--border, #2a2a30)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'var(--accent, #E00008)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 12px rgba(224, 0, 8, 0.4)',
  },
  logoText: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: '#FFFFFF',
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: '#FFFFFF',
    cursor: 'pointer',
    padding: '4px',
  },
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--card, #121214)',
    borderRight: '1px solid var(--border, #2a2a30)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 90,
    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  sidebarOpen: {
    transform: 'translateX(0) !important',
  },
  brandHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid var(--border, #2a2a30)',
  },
  brandLogoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#FFFFFF',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  portalTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.75rem',
    color: 'var(--text-secondary, #AAAAAA)',
    marginTop: '2px',
  },
  navSectionLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--text-muted, #666666)',
    letterSpacing: '0.08em',
    marginBottom: '8px',
    paddingLeft: '12px',
  },
  nav: {
    flex: 1,
    padding: '20px 12px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm, 12px)',
    color: 'var(--text-secondary, #AAAAAA)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  navLinkActive: {
    backgroundColor: 'var(--accent-surface, rgba(224, 0, 8, 0.1))',
    color: '#FFFFFF',
    fontWeight: 600,
    border: '1px solid rgba(224, 0, 8, 0.2)',
  },
  navText: {
    flex: 1,
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid var(--border, #2a2a30)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  profileBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatarCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent, #E00008)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.9rem',
  },
  profileDetails: {
    flex: 1,
    overflow: 'hidden',
  },
  profileName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#FFFFFF',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  profileRole: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary, #AAAAAA)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border, #2a2a30)',
    color: 'var(--text-secondary, #AAAAAA)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 80,
  },
};
