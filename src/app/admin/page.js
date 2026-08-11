'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllClients, getClientDailyLogs, getClientCheckins, getPlans } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import StatsCard from '@/components/ui/StatsCard';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
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
  Sparkles,
  Eye,
  Camera,
  Search,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Wallet,
  Receipt,
  UserX,
  Filter
} from 'lucide-react';

export default function AdminDashboard() {
  const { userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterType, setFilterType] = useState('overall');

  const [clientsList, setClientsList] = useState([]);
  const [masterPlansList, setMasterPlansList] = useState([]);
  const [logsMap, setLogsMap] = useState({}); // { client_id: { 'YYYY-MM-DD': logData } }
  const [allLogs, setAllLogs] = useState([]);

  // Selected Stat Card for rendering details below
  const [selectedCard, setSelectedCard] = useState('upcomingCheckins');
  const [cardSearch, setCardSearch] = useState('');
  const [cardPage, setCardPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Posture viewer modal state
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const checkPostureEnabled = (client, plansList = masterPlansList) => {
    if (!client.currentPlan || client.currentPlan === 'None' || client.currentPlan === 'Not Assigned') {
      return false;
    }
    if (client.planFeatures && typeof client.planFeatures.hasPostureCheckin === 'boolean') {
      return client.planFeatures.hasPostureCheckin === true;
    }
    const clientPlanName = (client.currentPlan || '').toLowerCase();
    const matchedPlan = (plansList || []).find(mp => {
      const pName = (mp.plan_name || mp.name || '').toLowerCase();
      return pName && clientPlanName.includes(pName);
    });
    if (matchedPlan && typeof matchedPlan.hasPostureCheckin === 'boolean') {
      return matchedPlan.hasPostureCheckin === true;
    }
    return false;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [clients, fetchedPlans] = await Promise.all([
        getAllClients(),
        getPlans()
      ]);
      setClientsList(clients);
      setMasterPlansList(fetchedPlans || []);
      
      let logsListCombined = [];
      const tempLogsMap = {};

      for (const client of clients) {
        const logs = await getClientDailyLogs(client.id);
        const checkins = await getClientCheckins(client.id);
        
        tempLogsMap[client.id] = {};
        
        logs.forEach(log => {
          if (log.date) {
            const enriched = {
              ...log,
              type: 'daily-log',
              clientId: client.id,
              clientName: client.displayName || client.name || 'Client',
              clientPhoto: client.photoURL || client.profileImage,
              clientPhone: client.phone || '',
              clientEmail: client.email || ''
            };
            tempLogsMap[client.id][log.date] = enriched;
            logsListCombined.push(enriched);
          }
        });

        checkins.forEach(chk => {
          const chkDate = chk.createdAt?.toDate ? chk.createdAt.toDate().toISOString().split('T')[0] : (chk.date || '');
          if (chkDate) {
            const enriched = {
              ...(tempLogsMap[client.id][chkDate] || {}),
              ...chk,
              type: 'checkin',
              clientId: client.id,
              clientName: client.displayName || client.name || 'Client',
              clientPhoto: client.photoURL || client.profileImage,
              clientPhone: client.phone || '',
              clientEmail: client.email || ''
            };
            tempLogsMap[client.id][chkDate] = enriched;
            logsListCombined.push(enriched);
          }
        });
      }
      
      setLogsMap(tempLogsMap);
      logsListCombined.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      setAllLogs(logsListCombined);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const { filteredClientsList, filteredAllLogs } = useMemo(() => {
    let finalFrom = fromDate;
    let finalTo = toDate;

    if (filterType === 'current_month') {
      const now = new Date();
      finalFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      finalTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (filterType === 'last_month') {
      const now = new Date();
      finalFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      finalTo = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    } else if (filterType === 'overall') {
      finalFrom = '';
      finalTo = '';
    }

    const isWithin = (dateStr) => {
      if (!dateStr) return true;
      if (finalFrom && dateStr < finalFrom) return false;
      if (finalTo && dateStr > finalTo) return false;
      return true;
    };

    const getClientDate = (c) => c.joiningDate || c.planStart || (c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toISOString().split('T')[0] : '');

    const fClients = (filterType === 'overall' && !fromDate && !toDate) ? clientsList : clientsList.filter(c => {
       const cd = getClientDate(c);
       if (!cd) return true;
       return isWithin(cd);
    });

    const fLogs = (filterType === 'overall' && !fromDate && !toDate) ? allLogs : allLogs.filter(log => {
      const ld = log.date || (log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toISOString().split('T')[0] : '');
      return isWithin(ld);
    });

    return { filteredClientsList: fClients, filteredAllLogs: fLogs };
  }, [filterType, fromDate, toDate, clientsList, allLogs]);

  const stats = useMemo(() => {
    const total = filteredClientsList.length;
    const active = filteredClientsList.filter(c => c.status === 'active' || (c.currentPlan && c.currentPlan !== 'None')).length;
    const inactive = filteredClientsList.filter(c => c.status === 'inactive' || (!c.currentPlan || c.currentPlan === 'None' || c.currentPlan === 'Not Assigned')).length;
    
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    const expiring = filteredClientsList.filter(c => {
      if (!c.planExpiry) return false;
      const expiryDate = new Date(c.planExpiry);
      return expiryDate > now && expiryDate <= nextWeek;
    }).length;

    const totalRev = filteredClientsList.reduce((acc, c) => acc + (parseFloat(c.amountPaid) || 0), 0);
    const totalPending = filteredClientsList.reduce((acc, c) => acc + (parseFloat(c.balance) || 0), 0);
    const paidCount = filteredClientsList.filter(c => (parseFloat(c.balance) || 0) <= 0 && parseFloat(c.amountPaid || 0) > 0).length;

    const todayStr = now.toISOString().split('T')[0];
    const todays = filteredAllLogs.filter(log => log.date === todayStr).length;
    const pending = filteredAllLogs.filter(log => !log.reviewed).length;

    const upcomingCount = filteredClientsList.filter(c => checkPostureEnabled(c, masterPlansList)).length;

    return {
      totalClients: total,
      todaysUploads: todays,
      pendingReviews: pending,
      activeMemberships: active,
      expiringSoon: expiring,
      upcomingCheckins: upcomingCount,
      totalRevenue: totalRev,
      pendingDues: totalPending,
      paidMembers: paidCount,
      inactiveClients: inactive,
    };
  }, [filteredClientsList, filteredAllLogs, masterPlansList]);

  const handleCardClick = (cardKey) => {
    setSelectedCard(cardKey);
    setCardPage(1);
    setCardSearch('');
  };

  const getCardDataset = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    switch (selectedCard) {
      case 'totalRevenue':
        return filteredClientsList.filter(c => parseFloat(c.amountPaid || 0) > 0);

      case 'pendingDues':
        return filteredClientsList.filter(c => parseFloat(c.balance || 0) > 0);

      case 'paidMembers':
        return filteredClientsList.filter(c => parseFloat(c.balance || 0) <= 0 && parseFloat(c.amountPaid || 0) > 0);

      case 'todaysUploads':
        return filteredAllLogs.filter(log => log.date === todayStr);

      case 'pendingReviews':
        return filteredAllLogs.filter(log => !log.reviewed);

      case 'activeMemberships':
        return filteredClientsList.filter(c => c.status === 'active' || (c.currentPlan && c.currentPlan !== 'None'));

      case 'expiringSoon':
        return filteredClientsList.filter(c => {
          if (!c.planExpiry) return false;
          const exp = new Date(c.planExpiry);
          return exp > now && exp <= nextWeek;
        });

      case 'upcomingCheckins':
        return filteredClientsList
          .filter(c => checkPostureEnabled(c, masterPlansList))
          .map(c => {
            const cLogs = logsMap[c.id] ? Object.values(logsMap[c.id]) : [];
            const checkinLogs = cLogs.filter(l => l.type === 'checkin' || l.photos || l.measurements);
            checkinLogs.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
            
            let lastDate = checkinLogs.length > 0 ? new Date(checkinLogs[0].date || checkinLogs[0].createdAt) : null;
            if (!lastDate || isNaN(lastDate.getTime())) {
              lastDate = c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000) : new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
            }
            
            const nextCheckinDate = new Date(lastDate);
            nextCheckinDate.setDate(nextCheckinDate.getDate() + 10);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((nextCheckinDate - today) / (1000 * 60 * 60 * 24));
            
            let dueStatus = '';
            let dueVariant = 'success';
            if (diffDays < 0) {
              dueStatus = `Overdue by ${Math.abs(diffDays)} day(s)`;
              dueVariant = 'danger';
            } else if (diffDays === 0) {
              dueStatus = 'Due Today 🔥';
              dueVariant = 'warning';
            } else {
              dueStatus = `Due in ${diffDays} day(s)`;
              dueVariant = 'success';
            }

            return {
              ...c,
              checkinDueStatus: dueStatus,
              checkinDueVariant: dueVariant,
              nextCheckinDate: nextCheckinDate.toISOString().split('T')[0]
            };
          });

      case 'totalClients':
        return filteredClientsList;
      
      case 'inactiveClients':
        return filteredClientsList.filter(c => c.status === 'inactive' || (!c.currentPlan || c.currentPlan === 'None' || c.currentPlan === 'Not Assigned'));

      default:
        return filteredClientsList;
    }
  };

  const rawCardData = getCardDataset();

  // Search filter (date filtering is now upstream)
  const filteredCardData = (rawCardData || []).filter(item => {
    if (!cardSearch.trim()) return true;
    const q = cardSearch.toLowerCase().trim();
    const name = (item.displayName || item.name || item.clientName || '').toLowerCase();
    const email = (item.email || item.clientEmail || '').toLowerCase();
    const phone = (item.phone || item.clientPhone || '').toLowerCase();
    const plan = (item.currentPlan || item.planName || '').toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q) || plan.includes(q);
  });

  // Pagination slice
  const startIndex = (cardPage - 1) * itemsPerPage;
  const paginatedCardData = filteredCardData.slice(startIndex, startIndex + itemsPerPage);

  const getCardMeta = () => {
    switch (selectedCard) {
      case 'totalRevenue':
        return { title: 'Total Revenue Collected', icon: Wallet, color: '#00c853' };

      case 'pendingDues':
        return { title: 'Pending Dues & Unpaid Balances', icon: Receipt, color: '#ff9100' };

      case 'paidMembers':
        return { title: 'Fully Paid Memberships', icon: CheckCircle2, color: '#00e676' };

      case 'todaysUploads':
        return { title: "Today's Submissions & Uploads", icon: Activity, color: '#29b6f6' };

      case 'pendingReviews':
        return { title: 'Pending Client Reviews', icon: Clock, color: '#ffd600' };

      case 'activeMemberships':
        return { title: 'Active Client Memberships', icon: CreditCard, color: '#00b0ff' };

      case 'expiringSoon':
        return { title: 'Memberships Expiring Soon', icon: AlertTriangle, color: '#ff1744' };

      case 'upcomingCheckins':
        return { title: 'Upcoming 10-Day Transformation Check-ins', icon: Calendar, color: '#ab47bc' };

      case 'inactiveClients':
        return { title: 'Total Inactive & Unassigned Clients', icon: UserX, color: '#ff5252' };

      case 'totalClients':
      default:
        return { title: 'All Registered Gym Clients', icon: Users, color: 'var(--accent, #E00008)' };
    }
  };

  const currentCardMeta = getCardMeta();
  const MetaIcon = currentCardMeta.icon;

  return (
    <div style={styles.container} className="animate-fade-up">
      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.badge}><Sparkles size={12} /> System Active</span>
            <span style={styles.dateTag}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          <h1 style={styles.title}>
            Welcome back, <span style={{ color: 'var(--accent, #E00008)' }}>{userData?.displayName || 'Admin Trainer'}</span> 👋
          </h1>
          <p style={styles.subtitle}>Click on any card below to render detailed client check-in dates & submission status indicators.</p>
        </div>
        <div style={styles.actions}>
          <Button onClick={() => router.push('/admin/clients')} size="sm">
            <Plus size={14} /> Add Client
          </Button>
        </div>
      </header>

      {/* Date Filter Toolbar */}
      <Card style={{ padding: '12px', marginBottom: '14px' }} className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--accent, #E00008)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
              Dashboard Date Range Filter
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Select 
              value={filterType} 
              onChange={(e) => { 
                setFilterType(e.target.value); 
                if (e.target.value !== 'custom') {
                  setFromDate(''); 
                  setToDate(''); 
                }
                setCardPage(1); 
              }} 
              options={[
                { label: 'Overall (All Time)', value: 'overall' },
                { label: 'Current Month', value: 'current_month' },
                { label: 'Last Month', value: 'last_month' },
                { label: 'Custom Date Range', value: 'custom' },
              ]}
              style={{ width: '180px', margin: 0, padding: '8px' }}
            />

            {filterType === 'custom' && (
              <>
                <Input 
                  type="date" 
                  value={fromDate} 
                  onChange={(e) => { setFromDate(e.target.value); setCardPage(1); }} 
                  style={{ width: '135px' }} 
                />
                <Input 
                  type="date" 
                  value={toDate} 
                  onChange={(e) => { setToDate(e.target.value); setCardPage(1); }} 
                  style={{ width: '135px' }} 
                />
              </>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => { setFilterType('overall'); setFromDate(''); setToDate(''); setCardPage(1); }} 
              style={{ alignSelf: 'flex-end', height: '36px' }}
            >
              Reset Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Interactive Stats Cards Grid (Clickable) */}
      {loading ? (
        <div style={styles.statsGrid}>
          {Array.from({ length: 9 }).map((_, i) => (
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
            onClick={() => handleCardClick('totalClients')}
            isActive={selectedCard === 'totalClients'}
          />
          <StatsCard 
            title="TOTAL INACTIVE CLIENTS" 
            value={stats.inactiveClients} 
            change={stats.inactiveClients > 0 ? "Disabled / Unassigned" : "All active"} 
            changeType="down" 
            icon={UserX} 
            color="#ff5252" 
            onClick={() => handleCardClick('inactiveClients')}
            isActive={selectedCard === 'inactiveClients'}
          />
          <StatsCard 
            title="TOTAL REVENUE" 
            value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`} 
            change="Collected paid fees" 
            changeType="up" 
            icon={Wallet} 
            color="#00c853" 
            onClick={() => handleCardClick('totalRevenue')}
            isActive={selectedCard === 'totalRevenue'}
          />
          <StatsCard 
            title="PENDING DUES" 
            value={`₹${(stats.pendingDues || 0).toLocaleString('en-IN')}`} 
            change={stats.pendingDues > 0 ? "Unpaid balances" : "All dues cleared"} 
            changeType={stats.pendingDues > 0 ? "down" : "up"} 
            icon={Receipt} 
            color="#ff9100" 
            onClick={() => handleCardClick('pendingDues')}
            isActive={selectedCard === 'pendingDues'}
          />
          <StatsCard 
            title="PAID MEMBERS" 
            value={stats.paidMembers} 
            change="Cleared balance" 
            changeType="up" 
            icon={CheckCircle2} 
            color="#00e676" 
            onClick={() => handleCardClick('paidMembers')}
            isActive={selectedCard === 'paidMembers'}
          />
          <StatsCard 
            title="TODAY'S UPLOADS" 
            value={stats.todaysUploads} 
            change="Active submissions" 
            changeType="up" 
            icon={Activity} 
            color="#29b6f6" 
            onClick={() => handleCardClick('todaysUploads')}
            isActive={selectedCard === 'todaysUploads'}
          />
          <StatsCard 
            title="PENDING REVIEWS" 
            value={stats.pendingReviews} 
            change={stats.pendingReviews > 0 ? "Requires review" : "All reviewed"} 
            changeType={stats.pendingReviews > 0 ? "down" : "up"} 
            icon={Clock} 
            color="#ffd600" 
            onClick={() => handleCardClick('pendingReviews')}
            isActive={selectedCard === 'pendingReviews'}
          />
          <StatsCard 
            title="ACTIVE MEMBERSHIPS" 
            value={stats.activeMemberships} 
            change="Current members" 
            changeType="up" 
            icon={CreditCard} 
            color="#00b0ff" 
            onClick={() => handleCardClick('activeMemberships')}
            isActive={selectedCard === 'activeMemberships'}
          />
          <StatsCard 
            title="EXPIRING SOON" 
            value={stats.expiringSoon} 
            change="Within 7 days" 
            changeType="down" 
            icon={AlertTriangle} 
            color="#ff1744" 
            onClick={() => handleCardClick('expiringSoon')}
            isActive={selectedCard === 'expiringSoon'}
          />
          <StatsCard 
            title="UPCOMING CHECK-INS" 
            value={stats.upcomingCheckins} 
            change="Transformation logs" 
            changeType="up" 
            icon={Calendar} 
            color="#ab47bc" 
            onClick={() => handleCardClick('upcomingCheckins')}
            isActive={selectedCard === 'upcomingCheckins'}
          />
        </div>
      )}

      {/* DYNAMIC DETAILS TABLE SECTION (Renders based on selected Card) */}
      <Card style={{ padding: '14px' }} className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: `${currentCardMeta.color}15`,
              border: `1px solid ${currentCardMeta.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <MetaIcon size={18} color={currentCardMeta.color} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                {currentCardMeta.title} ({filteredCardData.length})
              </h2>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Showing client details and status overview
              </p>
            </div>
          </div>

          <Input 
            placeholder="Search within this list..."
            value={cardSearch}
            onChange={(e) => { setCardSearch(e.target.value); setCardPage(1); }}
            icon={<Search size={14} />}
            containerStyle={{ width: '220px' }}
          />
        </div>

        {/* Data Table */}
        {loading ? (
          <TableSkeleton rows={4} />
        ) : paginatedCardData.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card-hover)' }}>
                  <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Client</th>
                  <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    {selectedCard === 'upcomingCheckins' ? 'Next Check-in Date' : 'Contact / Code'}
                  </th>
                  <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Plan / Category</th>
                  <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    {['totalRevenue', 'pendingDues', 'paidMembers'].includes(selectedCard)
                      ? 'Billing Financials'
                      : (selectedCard === 'upcomingCheckins' ? '10-Day Posture Submissions' : 'Recent Submissions')}
                  </th>
                  <th style={{ padding: '10px', textAlign: 'right', color: 'var(--text-secondary)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCardData.map((item, idx) => {
                  const clientName = item.displayName || item.name || item.clientName || 'Client';
                  const photo = item.photoURL || item.profileImage || item.clientPhoto;
                  const rawId = item.clientId || item.id;
                  const clientId = typeof rawId === 'string' && rawId.includes('_') ? rawId.split('_')[0] : rawId;
                  const code = item.clientCode || 'Member';

                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Avatar src={photo} name={clientName} size="sm" />
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--text)', display: 'block' }}>{clientName}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{code}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                        {selectedCard === 'upcomingCheckins' ? (
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '0.85rem' }}>
                              📅 Next: {item.nextCheckinDateStr}
                            </div>
                            <Badge variant={item.dueVariant || 'success'} size="sm" style={{ marginTop: '2px' }}>
                              {item.dueStatus}
                            </Badge>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>{code}</div>
                            <div style={{ fontSize: '0.72rem' }}>{item.phone || item.clientPhone || item.email || '--'}</div>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '10px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' }}>
                          {item.currentPlan || item.planName || item.type || 'Standard'}
                        </span>
                      </td>

                      {/* BILLING / SUBMISSIONS COLUMN */}
                      <td style={{ padding: '10px' }}>
                        {['totalRevenue', 'pendingDues', 'paidMembers'].includes(selectedCard) ? (
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#00c853' }}>
                              Paid: ₹{parseFloat(item.amountPaid || 0).toLocaleString('en-IN')}
                            </div>
                            {parseFloat(item.balance || 0) > 0 ? (
                              <Badge variant="warning" size="sm" style={{ marginTop: '2px' }}>
                                Balance Due: ₹{parseFloat(item.balance).toLocaleString('en-IN')}
                              </Badge>
                            ) : (
                              <Badge variant="success" size="sm" style={{ marginTop: '2px' }}>
                                ✓ Fully Cleared
                              </Badge>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const cLogs = logsMap[clientId] ? Object.values(logsMap[clientId]) : [];
                            const postureLogs = cLogs.filter(l => l.type === 'checkin' || l.photos || l.frontPhoto || l.backPhoto || l.sidePhoto);
                            postureLogs.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

                            if (selectedCard === 'upcomingCheckins' || postureLogs.length > 0) {
                              if (postureLogs.length === 0) {
                                return (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    No posture check-in submitted yet
                                  </span>
                                );
                              }

                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {postureLogs.slice(0, 3).map((pLog, pIdx) => (
                                    <Button
                                      key={pIdx}
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSelectedSubmission({ ...pLog, clientName })}
                                      style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                                    >
                                      📸 {pLog.date || 'Log'}
                                    </Button>
                                  ))}
                                </div>
                              );
                            }

                            return (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {cLogs.length} total logs submitted
                              </span>
                            );
                          })()
                        )}
                      </td>

                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => router.push(`/admin/clients/${clientId}`)}
                          style={{ fontSize: '0.75rem' }}
                        >
                          Manage <ChevronRight size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
            No records match the selected stat category or search filter.
          </div>
        )}

        {/* Pagination Bar */}
        {filteredCardData.length > itemsPerPage && (
          <Pagination
            currentPage={cardPage}
            totalItems={filteredCardData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCardPage(page)}
          />
        )}
      </Card>

      {/* POSTURE SUBMISSION MODAL */}
      {selectedSubmission && (
        <Modal
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          title={`10-Day Posture Submission: ${selectedSubmission.clientName}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Logged Date: <strong>{selectedSubmission.date}</strong>
            </div>

            {/* Posture Photos Grid */}
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', color: 'var(--text)' }}>Submitted Posture Photos</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                {['frontPhoto', 'backPhoto', 'sidePhoto'].map((photoKey, idx) => {
                  const photoUrl = selectedSubmission[photoKey] || (selectedSubmission.photos ? selectedSubmission.photos[photoKey] : null);
                  const labels = ['Front View', 'Back View', 'Side View'];
                  return (
                    <div key={idx} style={{ textAlign: 'center', backgroundColor: 'var(--card)', padding: '6px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{labels[idx]}</span>
                      {photoUrl ? (
                        <a href={photoUrl} target="_blank" rel="noopener noreferrer">
                          <img src={photoUrl} alt={labels[idx]} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px' }} />
                        </a>
                      ) : (
                        <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', fontSize: '0.7rem', borderRadius: '6px' }}>
                          Not Provided
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingBottom: '40px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: 'rgba(224, 0, 8, 0.15)',
    color: 'var(--accent, #E00008)',
    fontSize: '0.7rem',
    fontWeight: 700,
  },
  dateTag: {
    fontSize: '0.72rem',
    color: 'var(--text-secondary)',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 900,
    margin: '0 0 4px 0',
    color: 'var(--text)',
  },
  subtitle: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '12px',
  },
};
