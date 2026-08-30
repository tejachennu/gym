'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useEffect, useState } from 'react';
import { PageLoader } from '@/components/ui/Loading';
import { logoutUser } from '@/lib/auth';
import { getAdminNotifications, markAsRead, deleteNotification } from '@/lib/firestore';
import { Menu, X, LogOut, ShieldCheck, Sun, Moon, Bell, Trash2, MessageSquare, CheckCircle2, AlertTriangle } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin', icon: '📊' },
  { name: 'Clients', path: '/admin/clients', icon: '🏋️' },
  { name: 'Enquiries', path: '/admin/enquiries', icon: '📩' },
  { name: 'Transformations', path: '/admin/transformations', icon: '📸' },
  { name: 'Plans', path: '/admin/plans', icon: '📋' },
  { name: 'Billing', path: '/admin/billing', icon: '💰' },
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
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadNotifications = async () => {
    try {
      const list = await getAdminNotifications();
      setNotifications(list || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userData?.role === 'client') {
        router.push('/client');
      } else {
        loadNotifications();
      }
    }
  }, [user, userData, loading, router]);

  // Close mobile drawer and notif dropdown on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowNotifs(false);
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

  const handleMarkAsRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await markAsRead(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotif = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await deleteNotification(notifId);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.read && notif.id) {
      await handleMarkAsRead(notif.id);
    }
    setShowNotifs(false);
    if (notif.type === 'client_reply' || notif.link === '/admin/monitoring') {
      const searchParam = notif.clientName ? `?search=${encodeURIComponent(notif.clientName)}` : '';
      router.push(`/admin/monitoring${searchParam}`);
    } else if (notif.link) {
      router.push(notif.link);
    } else {
      router.push('/admin/notifications');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={styles.container}>
      {/* Mobile Top Header */}
      <div style={{
        ...styles.mobileHeader,
        display: isMobile ? 'flex' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/mrk-logo.png" alt="MRK FITNESS" style={{ height: '22px', width: 'auto', objectFit: 'contain' }} />
          <h1 style={styles.logo}>MRK FITNESS COACH</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifs(!showNotifs)}
              style={styles.bellButton}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={styles.unreadBadge}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <button onClick={toggleMenu} style={styles.menuButton} aria-label="Toggle navigation menu">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar (Desktop Fixed / Mobile Slide Drawer) */}
      <div style={{ 
        ...styles.sidebar, 
        transform: isMobile 
          ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') 
          : 'translateX(0)'
      }}>
        <div style={styles.sidebarHeader}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <img src="/mrk-logo.png" alt="MRK FITNESS COACH" style={{ height: '30px', width: 'auto', objectFit: 'contain' }} />
            
            {/* Desktop Notifications Bell Button */}
            {!isMobile && (
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowNotifs(!showNotifs)}
                  style={styles.bellButton}
                  title="Notifications & Client Replies"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span style={styles.unreadBadge}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
          <p style={styles.adminName}>Management Portal</p>
        </div>

        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
            const isNotificationsTab = item.path === '/admin/notifications';
            return (
              <a
                key={item.path}
                href={item.path}
                style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.name}</span>
                {isNotificationsTab && unreadCount > 0 && (
                  <span style={{
                    backgroundColor: 'var(--accent, #E00008)',
                    color: '#FFF',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        <div style={styles.logoutWrapper}>
          <button style={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>

      {/* Notifications Dropdown Modal / Popup */}
      {showNotifs && (
        <div style={{
          position: 'fixed',
          top: isMobile ? '56px' : '65px',
          right: isMobile ? '12px' : 'auto',
          left: isMobile ? 'auto' : '240px',
          width: '320px',
          maxHeight: '420px',
          backgroundColor: 'var(--card, #121214)',
          border: '1px solid var(--border, #2a2a30)',
          borderRadius: '14px',
          padding: '12px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          zIndex: 110,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border, #2a2a30)', paddingBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text, #FFF)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={14} color="var(--accent)" /> Notifications & Replies ({notifications.length})
            </h3>
            {unreadCount > 0 && (
              <span style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 700 }}>
                {unreadCount} Unread
              </span>
            )}
          </div>

          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {notifications.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', textAlign: 'center', margin: '14px 0' }}>
                No notifications or client replies yet.
              </p>
            ) : (
              notifications.slice(0, 10).map((n) => {
                const isReply = n.type === 'client_reply';
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: n.read ? 'rgba(255,255,255,0.03)' : 'rgba(224, 0, 8, 0.08)',
                      border: `1px solid ${n.read ? 'var(--border, #2a2a30)' : 'rgba(224, 0, 8, 0.3)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'start'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: isReply ? 'rgba(0, 200, 83, 0.15)' : 'rgba(224, 0, 8, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isReply ? <MessageSquare size={13} color="#00c853" /> : <Bell size={13} color="var(--accent)" />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#FFF' }}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)' }} />
                        )}
                      </div>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <a 
            href="/admin/notifications" 
            onClick={() => setShowNotifs(false)}
            style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, textDecoration: 'none', paddingTop: '4px', borderTop: '1px solid var(--border)' }}
          >
            View All in Notification Hub →
          </a>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{
        ...styles.mainContent,
        marginLeft: isMobile ? 0 : '230px',
        padding: isMobile ? '10px 12px 30px 12px' : '20px 28px',
        paddingTop: isMobile ? '60px' : '20px',
      }}>
        {children}
      </main>

      {/* Overlay Backdrop for Mobile Drawer & Notifs */}
      {((isMobile && isMobileMenuOpen) || showNotifs) && (
        <div style={styles.overlay} onClick={() => { setIsMobileMenuOpen(false); setShowNotifs(false); }} />
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
    padding: '10px 14px',
    backgroundColor: 'var(--glass-bg, rgba(18, 18, 20, 0.95))',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border, #2a2a30)',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: '52px',
    boxSizing: 'border-box',
  },
  logo: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 800,
    color: 'var(--accent, #E00008)',
    letterSpacing: '-0.2px',
  },
  menuButton: {
    background: 'var(--card-hover, rgba(255, 255, 255, 0.05))',
    border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
    borderRadius: '6px',
    color: 'var(--text, #FFFFFF)',
    padding: '5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButton: {
    background: 'var(--card-hover, rgba(255, 255, 255, 0.05))',
    border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
    borderRadius: '8px',
    color: 'var(--text, #FFFFFF)',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: '-3px',
    right: '-3px',
    backgroundColor: 'var(--accent, #E00008)',
    color: '#FFFFFF',
    borderRadius: '10px',
    padding: '1px 5px',
    fontSize: '0.6rem',
    fontWeight: 800,
  },
  themeButton: {
    background: 'var(--card-hover, rgba(255, 255, 255, 0.05))',
    border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
    borderRadius: '6px',
    color: 'var(--text, #FFFFFF)',
    padding: '5px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebar: {
    width: '230px',
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
    boxShadow: 'var(--shadow-card)',
  },
  sidebarHeader: {
    padding: '16px 16px',
    borderBottom: '1px solid var(--border, #2a2a30)',
  },
  adminName: {
    margin: '4px 0 0',
    color: 'var(--text-secondary, #AAAAAA)',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  nav: {
    flex: 1,
    padding: '12px 8px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '8px',
    color: 'var(--text-secondary, #AAAAAA)',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    fontSize: '0.82rem',
    fontWeight: 500,
  },
  navItemActive: {
    backgroundColor: 'var(--accent-surface, rgba(224, 0, 8, 0.12))',
    color: 'var(--accent, #E00008)',
    fontWeight: 700,
    border: '1px solid var(--accent-glow, rgba(224, 0, 8, 0.25))',
  },
  navIcon: {
    marginRight: '8px',
    fontSize: '1rem',
  },
  logoutWrapper: {
    padding: '12px 12px',
    borderTop: '1px solid var(--border, #2a2a30)',
  },
  logoutButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    border: '1px solid rgba(255, 82, 82, 0.3)',
    color: 'var(--danger, #ff5252)',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '0.8rem',
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
