'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllClients, getClientDailyLogs } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import StatsCard from '@/components/ui/StatsCard';
import Button from '@/components/ui/Button';
import { StatsSkeleton, TableSkeleton } from '@/components/ui/Loading';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Activity, 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  Bell, 
  Flame, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const { userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    todaysUploads: 0,
    pendingReviews: 0,
    activeMemberships: 0,
    expiringSoon: 0,
    upcomingCheckins: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const clients = await getAllClients();
      
      const total = clients.length;
      const active = clients.filter(c => c.status === 'active').length;
      
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      const expiring = clients.filter(c => {
        if (!c.planExpiry) return false;
        const expiryDate = new Date(c.planExpiry);
        return expiryDate > now && expiryDate <= nextWeek;
      }).length;

      let allLogs = [];
      for (const client of clients.slice(0, 10)) {
        const logs = await getClientDailyLogs(client.id);
        allLogs = [...allLogs, ...logs.map(log => ({ ...log, clientName: client.displayName || client.name || 'Unknown' }))];
      }
      
      allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const todayStr = new Date().toISOString().split('T')[0];
      const todays = allLogs.filter(log => log.date === todayStr).length;
      const pending = allLogs.filter(log => !log.reviewed).length;

      setStats({
        totalClients: total,
        todaysUploads: todays,
        pendingReviews: pending,
        activeMemberships: active,
        expiringSoon: expiring,
        upcomingCheckins: Math.ceil(total * 0.3),
      });

      setRecentLogs(allLogs.slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    try {
      const { seedPlans } = await import('@/lib/seedPlans');
      await seedPlans();
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-up">
      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.badge}><Sparkles size={12} /> System Online</span>
            <span style={styles.dateTag}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          <h1 style={styles.title}>
            Welcome back, <span style={{ color: 'var(--accent, #E00008)' }}>{userData?.displayName || 'Admin Trainer'}</span> 👋
          </h1>
          <p style={styles.subtitle}>Here is your fitness ecosystem performance & client activity summary for today.</p>
        </div>
        <div style={styles.actions}>
          <Button onClick={handleSeedData} variant="outline" style={{ borderColor: 'var(--accent, #E00008)', color: 'var(--accent, #E00008)' }}>
            🌱 Seed Sample Data
          </Button>
          <Button onClick={() => router.push('/admin/clients')}>
            <Plus size={16} /> Add Client
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/notifications')}>
            <Bell size={16} /> Send Alert
          </Button>
        </div>
      </header>

      {/* Stats Cards Row */}
      {loading ? (
        <div style={styles.statsGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <StatsSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div style={styles.statsGrid}>
          <StatsCard 
            title="TOTAL CLIENTS" 
            value={stats.totalClients} 
            change="+12% this month" 
            changeType="up"
            icon={Users} 
            color="var(--accent, #E00008)"
          />
          <StatsCard 
            title="TODAY'S MEAL UPLOADS" 
            value={stats.todaysUploads} 
            change="Active submissions" 
            changeType="up"
            icon={Activity} 
            color="#29b6f6"
          />
          <StatsCard 
            title="PENDING REVIEWS" 
            value={stats.pendingReviews} 
            change={stats.pendingReviews > 0 ? "Requires review" : "All reviewed"} 
            changeType={stats.pendingReviews > 0 ? "down" : "up"}
            icon={Clock} 
            color="#ffd600"
          />
          <StatsCard 
            title="ACTIVE MEMBERSHIPS" 
            value={stats.activeMemberships} 
            change="Current members" 
            changeType="up"
            icon={CreditCard} 
            color="#00c853"
          />
          <StatsCard 
            title="EXPIRING SOON" 
            value={stats.expiringSoon} 
            change="Within 7 days" 
            changeType="down"
            icon={AlertTriangle} 
            color="#ff1744"
          />
          <StatsCard 
            title="UPCOMING CHECK-INS" 
            value={stats.upcomingCheckins} 
            change="Transformation logs" 
            changeType="up"
            icon={Calendar} 
            color="#ab47bc"
          />
        </div>
      )}

      {/* Main Section */}
      <div style={styles.mainGrid}>
        {/* Recent Client Activity Stream */}
        <Card style={styles.activityCard} className="glass-card">
          <div style={styles.cardHeader}>
            <div style={styles.cardHeaderTitle}>
              <Flame size={20} color="var(--accent, #E00008)" />
              <h2 style={styles.cardTitle}>Recent Client Submissions</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/monitoring')}>
              View All <ArrowUpRight size={14} />
            </Button>
          </div>

          {loading ? (
            <TableSkeleton rows={4} />
          ) : recentLogs.length > 0 ? (
            <div style={styles.logList}>
              {recentLogs.map((log) => (
                <div key={log.id} style={styles.logItem}>
                  <div style={styles.logAvatar}>
                    {log.clientName.charAt(0)}
                  </div>
                  <div style={styles.logDetails}>
                    <div style={styles.logClientName}>{log.clientName}</div>
                    <div style={styles.logMeta}>
                      Submitted daily monitoring log for {log.date}
                    </div>
                  </div>
                  <div style={styles.logStatus}>
                    {log.reviewed ? (
                      <span style={{ ...styles.statusTag, backgroundColor: 'rgba(0, 200, 83, 0.15)', color: '#00c853' }}>
                        <CheckCircle2 size={12} /> Reviewed
                      </span>
                    ) : (
                      <span style={{ ...styles.statusTag, backgroundColor: 'rgba(255, 214, 0, 0.15)', color: '#ffd600' }}>
                        <Clock size={12} /> Pending Review
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyLogs}>
              <Activity size={36} color="var(--text-muted, #666666)" />
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9rem' }}>
                No recent daily logs found. Click <strong>Seed Sample Data</strong> above to populate sample logs.
              </p>
            </div>
          )}
        </Card>

        {/* Quick Actions Panel */}
        <Card style={styles.quickActionsCard} className="glass-card">
          <h2 style={styles.cardTitle}>Quick Trainer Actions</h2>
          <div style={styles.actionList}>
            <button style={styles.actionItem} onClick={() => router.push('/admin/clients')}>
              <div style={styles.actionIconWrapper}><Users size={18} color="var(--accent, #E00008)" /></div>
              <div style={styles.actionText}>
                <div style={styles.actionTitle}>Add New Client</div>
                <div style={styles.actionSub}>Create profile & credentials</div>
              </div>
            </button>

            <button style={styles.actionItem} onClick={() => router.push('/admin/diet-plans')}>
              <div style={styles.actionIconWrapper}><Flame size={18} color="#29b6f6" /></div>
              <div style={styles.actionText}>
                <div style={styles.actionTitle}>Assign Diet Plan</div>
                <div style={styles.actionSub}>Build 9 meal slots with macros</div>
              </div>
            </button>

            <button style={styles.actionItem} onClick={() => router.push('/admin/workout-plans')}>
              <div style={styles.actionIconWrapper}><TrendingUp size={18} color="#00c853" /></div>
              <div style={styles.actionText}>
                <div style={styles.actionTitle}>Assign Workout Plan</div>
                <div style={styles.actionSub}>Sets, reps & exercise routines</div>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '28px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' },
  badgeRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: '20px',
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
    color: '#00c853',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  dateTag: { fontSize: '0.8rem', color: 'var(--text-secondary, #AAAAAA)' },
  title: { fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  subtitle: { color: 'var(--text-secondary, #AAAAAA)', margin: '6px 0 0 0', fontSize: '0.925rem' },
  actions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  activityCard: { padding: '24px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  cardHeaderTitle: { display: 'flex', alignItems: 'center', gap: '10px' },
  cardTitle: { fontSize: '1.15rem', fontWeight: 700, margin: 0 },
  logList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  logItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  logAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-surface, rgba(224, 0, 8, 0.15))',
    color: 'var(--accent, #E00008)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.9rem',
  },
  logDetails: { flex: 1 },
  logClientName: { fontSize: '0.9rem', fontWeight: 600, color: '#FFFFFF' },
  logMeta: { fontSize: '0.8rem', color: 'var(--text-secondary, #AAAAAA)', marginTop: '2px' },
  logStatus: { fontSize: '0.75rem' },
  statusTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontWeight: 600,
  },
  emptyLogs: {
    padding: '40px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  quickActionsCard: { padding: '24px' },
  actionList: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' },
  actionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border, #2a2a30)',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#FFFFFF',
  },
  actionIconWrapper: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { flex: 1 },
  actionTitle: { fontSize: '0.875rem', fontWeight: 600 },
  actionSub: { fontSize: '0.75rem', color: 'var(--text-secondary, #AAAAAA)', marginTop: '2px' },
};
