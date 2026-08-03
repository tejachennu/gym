'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { PageLoader } from '@/components/ui/Loading';
import { logoutUser } from '@/lib/auth';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin', icon: '📊' },
  { name: 'Clients', path: '/admin/clients', icon: '🏋️' },
  { name: 'Plans', path: '/admin/plans', icon: '📋' },
  { name: 'Diet Plans', path: '/admin/diet-plans', icon: '🥗' },
  { name: 'Workout Plans', path: '/admin/workout-plans', icon: '💪' },
  { name: 'Monitoring', path: '/admin/monitoring', icon: '📱' },
  { name: 'Check-ins', path: '/admin/checkins', icon: '📸' },
  { name: 'Blood Reports', path: '/admin/blood-reports', icon: '🩸' },
  { name: 'Notifications', path: '/admin/notifications', icon: '🔔' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userData?.role === 'client') {
        router.push('/client');
      }
    }
  }, [user, userData, loading, router]);

  if (loading || !user || userData?.role === 'client') {
    return <PageLoader />;
  }

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Mobile Header */}
      <div style={styles.mobileHeader}>
        <h1 style={styles.logo}>PowerHouse Admin</h1>
        <button onClick={toggleMenu} style={styles.menuButton}>
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <div style={{ ...styles.sidebar, ...(isMobileMenuOpen ? styles.sidebarOpen : {}) }}>
        <div style={styles.sidebarHeader}>
          <h1 style={styles.logoDesktop}>PowerHouse</h1>
          <p style={styles.adminName}>Admin Portal</p>
        </div>
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
            return (
              <a
                key={item.path}
                href={item.path}
                style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                {item.name}
              </a>
            );
          })}
        </nav>
        <div style={styles.logoutWrapper}>
          <button style={styles.logoutButton} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <main style={styles.mainContent}>
        {children}
      </main>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && <div style={styles.overlay} onClick={toggleMenu} />}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--bg, #080808)',
    color: 'var(--text, #FFFFFF)',
  },
  mobileHeader: {
    display: 'none', // Shown via media query in real CSS, using inline fallback
    padding: '16px',
    backgroundColor: 'var(--card, #121214)',
    borderBottom: '1px solid var(--border, #2a2a30)',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  logo: {
    margin: 0,
    fontSize: '1.2rem',
    color: 'var(--accent, #E00008)',
  },
  menuButton: {
    background: 'none',
    border: 'none',
    color: 'var(--text, #FFFFFF)',
    fontSize: '1.5rem',
    cursor: 'pointer',
  },
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--card, #121214)',
    borderRight: '1px solid var(--border, #2a2a30)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    left: 0,
    top: 0,
    zIndex: 90,
    transition: 'transform 0.3s ease',
  },
  sidebarHeader: {
    padding: '30px 24px',
    borderBottom: '1px solid var(--border, #2a2a30)',
  },
  logoDesktop: {
    margin: 0,
    fontSize: '1.5rem',
    color: 'var(--accent, #E00008)',
    fontWeight: 'bold',
  },
  adminName: {
    margin: '4px 0 0',
    color: 'var(--text-secondary, #AAAAAA)',
    fontSize: '0.9rem',
  },
  nav: {
    flex: 1,
    padding: '24px 12px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm, 12px)',
    color: 'var(--text-secondary, #AAAAAA)',
    textDecoration: 'none',
    transition: 'all 0.2s',
    fontSize: '0.95rem',
    fontWeight: 500,
  },
  navItemActive: {
    backgroundColor: 'var(--accent-glow, rgba(224, 0, 8, 0.1))',
    color: 'var(--accent, #E00008)',
  },
  navIcon: {
    marginRight: '12px',
    fontSize: '1.2rem',
  },
  logoutWrapper: {
    padding: '24px',
    borderTop: '1px solid var(--border, #2a2a30)',
  },
  logoutButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border, #2a2a30)',
    color: 'var(--text, #FFFFFF)',
    borderRadius: 'var(--radius-sm, 12px)',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  mainContent: {
    flex: 1,
    marginLeft: '260px', // Matches sidebar width
    padding: '40px',
    minHeight: '100vh',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 80,
  },
};
