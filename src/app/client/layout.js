'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { PageLoader } from '@/components/ui/Loading';
import BottomNav from '@/components/ui/BottomNav';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { getClientNotifications, markAsRead, deleteNotification } from '@/lib/firestore';
import { Sun, Moon, Bell, Trash2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function ClientLayout({ children }) {
  const { user, userData, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userData?.role === 'admin') {
        router.push('/admin');
      } else if (user?.uid) {
        getClientNotifications(user.uid).then(setNotifications).catch(console.error);
      }
    }
  }, [user, userData, loading, router]);

  const handleRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !user || userData?.role !== 'client') return <PageLoader />;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '60px' }}>
      {/* Prominent Header with Theme Switcher at Top */}
      <header style={{ 
        padding: '10px 16px', 
        borderBottom: '1px solid var(--border)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: 'var(--card)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar src={userData?.photoURL || userData?.profileImage} name={userData?.displayName || userData?.name || 'Client'} size="sm" />
          <div>
            <span style={{ fontSize: '0.85rem', margin: 0, fontWeight: 700, color: 'var(--text)', display: 'block' }}>
              Hi, {userData?.displayName?.split(' ')[0] || userData?.name?.split(' ')[0] || 'Client'} 👋
            </span>
            <small style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
              {userData?.clientCode || 'Member'}
            </small>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Light / Dark Mode Toggle Pill */}
          <button 
            onClick={toggleTheme} 
            style={{
              background: 'var(--card-hover)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              color: 'var(--text)',
              padding: '4px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              boxShadow: 'var(--shadow-card)'
            }} 
            aria-label="Toggle theme mode"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={14} color="#ffd600" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={14} color="#0f172a" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          {/* Notifications Bell Button & Popup Menu */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifs(!showNotifs)}
              style={{
                background: 'var(--card-hover)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: 'var(--accent, #E00008)',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  fontSize: '0.6rem',
                  fontWeight: 800
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifs && (
              <div style={{
                position: 'absolute', 
                top: '40px', 
                right: '0', 
                width: '280px',
                backgroundColor: 'var(--card)', 
                border: '1px solid var(--border)',
                borderRadius: '12px', 
                padding: '12px', 
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                zIndex: 100
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Bell size={14} color="var(--accent)" /> Notifications ({notifications.length})
                  </h3>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 700 }}>
                      {unreadCount} Unread
                    </span>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', textAlign: 'center', margin: '14px 0' }}>
                    No recent notifications
                  </p>
                ) : (
                  <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.map(n => {
                      const dateLabel = n.sentAt 
                        ? new Date(n.sentAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : (n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : 'Recent');

                      return (
                        <div 
                          key={n.id} 
                          onClick={() => handleRead(n.id)} 
                          style={{ 
                            padding: '8px', 
                            borderRadius: '8px',
                            backgroundColor: n.read ? 'transparent' : 'rgba(224, 0, 8, 0.08)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                            <strong style={{ fontSize: '0.8rem', color: n.read ? 'var(--text-secondary)' : '#FFFFFF', fontWeight: 700 }}>
                              {n.title || 'Coach Update'}
                            </strong>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>{dateLabel}</small>
                              <button
                                onClick={(e) => handleDeleteNotification(e, n.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                title="Remove notification"
                              >
                                <Trash2 size={12} color="#ff1744" />
                              </button>
                            </div>
                          </div>

                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                            {n.message}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main style={{ flex: 1, padding: '12px', maxWidth: '760px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
