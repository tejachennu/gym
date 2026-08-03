'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/Loading';
import BottomNav from '@/components/ui/BottomNav';
import Badge from '@/components/ui/Badge';
import { getClientNotifications, markAsRead } from '@/lib/firestore';

export default function ClientLayout({ children }) {
  const { user, userData, loading } = useAuth();
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
    await markAsRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  if (loading || !user || userData?.role !== 'client') return <PageLoader />;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '70px' }}>
      <header style={{ 
        padding: '15px 20px', 
        borderBottom: '1px solid var(--border)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: 'var(--card)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/mrk-logo.png" 
            alt="MRK FITNESS" 
            style={{ 
              height: '36px', 
              width: 'auto', 
              maxWidth: '150px', 
              objectFit: 'contain',
              display: 'block'
            }} 
          />
          <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: '0.95rem', margin: 0, fontWeight: 700, color: '#FFFFFF' }}>
            Hi, {userData?.name?.split(' ')[0] || 'Client'} 👋
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <span 
            style={{ fontSize: '24px', cursor: 'pointer', padding: '5px' }} 
            onClick={() => setShowNotifs(!showNotifs)}
          >
            🔔
          </span>
          {unreadCount > 0 && (
            <Badge style={{ position: 'absolute', top: -2, right: -2, backgroundColor: 'var(--accent)', color: 'white', padding: '2px 6px', fontSize: '0.7rem' }}>
              {unreadCount}
            </Badge>
          )}
          
          {showNotifs && (
            <div style={{
              position: 'absolute', top: '40px', right: '0', width: '280px',
              backgroundColor: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '5px' }}>Notifications</h3>
              {notifications.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>No recent notifications</p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.map(n => (
                    <div key={n.id} onClick={() => handleRead(n.id)} style={{ padding: '8px', borderBottom: '1px solid var(--border)', opacity: n.read ? 0.7 : 1, cursor: 'pointer' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>{n.message}</p>
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{new Date(n.createdAt?.toDate()).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      
      <main style={{ flex: 1, padding: '20px', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {children}
      </main>

      <BottomNav items={[
        {label: 'Home', path: '/client', icon: '🏠'},
        {label: 'Diet', path: '/client/diet', icon: '🥗'},
        {label: 'Workout', path: '/client/workout', icon: '💪'},
        {label: 'Tracking', path: '/client/daily-log', icon: '📝'},
        {label: 'Profile', path: '/client/profile', icon: '👤'}
      ]} />
    </div>
  );
}
