'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { PageLoader } from '@/components/ui/Loading';
import { logoutUser } from '@/lib/auth';
import { Menu, X, LogOut, ShieldCheck } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin', icon: '📊' },
  { name: 'Clients', path: '/admin/clients', icon: '🏋️' },
  { name: 'Plans', path: '/admin/plans', icon: '📋' },
  { name: 'Diet Plans', path: '/admin/diet-plans', icon: '🥗' },
  { name: 'Workout Plans', path: '/admin/workout-plans', icon: '💪' },
  { name: 'Monitoring', path: '/admin/monitoring', icon: '📱' },
  { name: 'Blood Reports', path: '/admin/blood-reports', icon: '🩸' },
  { name: 'Notifications', path: '/admin/notifications', icon: '🔔' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userData?.role === 'client') {
        router.push('/client');
      }
    }
  }, [user, userData, loading, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
      {/* Mobile Top Header */}
      <div style={{
        ...styles.mobileHeader,
        display: isMobile ? 'flex' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={20} color="var(--accent, #E00008)" />
          <h1 style={styles.logo}>PowerHouse Admin</h1>
        </div>
        <button onClick={toggleMenu} style={styles.menuButton} aria-label="Toggle navigation menu">
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar (Desktop Fixed / Mobile Slide Drawer) */}
      <div style={{ 
        ...styles.sidebar, 
        transform: isMobile 
          ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') 
          : 'translateX(0)'
      }}>
        <div style={styles.sidebarHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} color="var(--accent, #E00008)" />
            <h1 style={styles.logoDesktop}>PowerHouse</h1>
          </div>
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
          <button style={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{
        ...styles.mainContent,
        marginLeft: isMobile ? 0 : '260px',
        padding: isMobile ? '12px 14px 40px 14px' : '28px 36px',
        paddingTop: isMobile ? '72px' : '28px',
      }}>
        {children}
      </main>

      {/* Overlay Backdrop for Mobile Drawer */}
      {isMobile && isMobileMenuOpen && (
        <div style={styles.overlay} onClick={toggleMenu} />
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--bg, #080808)',
    color: 'var(--text, #FFFFFF)',
    position: 'relative',
    overflowX: 'hidden',
  },
  mobileHeader: {
    padding: '12px 16px',
    backgroundColor: 'rgba(18, 18, 20, 0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border, #2a2a30)',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: '60px',
    boxSizing: 'border-box',
  },
  logo: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--accent, #E00008)',
    letterSpacing: '-0.2px',
  },
  menuButton: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'var(--text, #FFFFFF)',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    zIndex: 95,
    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
  },
  sidebarHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid var(--border, #2a2a30)',
  },
  logoDesktop: {
    margin: 0,
    fontSize: '1.3rem',
    fontWeight: 800,
    color: 'var(--accent, #E00008)',
  },
  adminName: {
    margin: '4px 0 0',
    color: 'var(--text-secondary, #AAAAAA)',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  nav: {
    flex: 1,
    padding: '16px 10px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: '10px',
    color: 'var(--text-secondary, #AAAAAA)',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    fontSize: '0.88rem',
    fontWeight: 500,
  },
  navItemActive: {
    backgroundColor: 'rgba(224, 0, 8, 0.12)',
    color: 'var(--accent, #E00008)',
    fontWeight: 700,
    border: '1px solid rgba(224, 0, 8, 0.25)',
  },
  navIcon: {
    marginRight: '10px',
    fontSize: '1.1rem',
  },
  logoutWrapper: {
    padding: '16px 14px',
    borderTop: '1px solid var(--border, #2a2a30)',
  },
  logoutButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    border: '1px solid rgba(255, 82, 82, 0.3)',
    color: '#ff5252',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  },
  mainContent: {
    flex: 1,
    minHeight: '100vh',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    zIndex: 90,
  },
};
