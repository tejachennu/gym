'use client';

import { useState, useEffect } from 'react';
import { 
  getAllClients, 
  getDocuments, 
  getClientWorkoutPlan, 
  reviewDailyLog, 
  updateCheckin,
  addReviewComment 
} from '@/lib/firestore';
import { getNextCheckinInfo } from '@/lib/checkinUtils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import StatsCard from '@/components/ui/StatsCard';
import Avatar from '@/components/ui/Avatar';
import { 
  Activity, 
  Search, 
  Dumbbell, 
  Utensils, 
  Camera, 
  CheckSquare, 
  Square,
  MessageSquare, 
  Filter, 
  Send, 
  Users, 
  Clock, 
  CheckCircle2, 
  Calendar,
  RefreshCw,
  Sparkles,
  Zap,
  Moon,
  Droplets,
  Smile,
  Eye,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';

function getDirectImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  const driveRegex = /(?:id=|\/d\/|file\/d\/)([a-zA-Z0-9_-]{25,})/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  return url;
}

const MEAL_SLOT_LABELS = {
  breakfast: 'Breakfast 🍳',
  preWorkout: 'Pre Workout ⚡',
  postWorkout: 'Post Workout 🥤',
  lunch: 'Lunch 🥗',
  dinner: 'Dinner 🍲'
};

function formatDateNice(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Today 🔥';
    if (dateStr === yesterday) return 'Yesterday ⏳';
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

function getAssignedWorkoutForDate(workoutPlan, cardDate) {
  if (!workoutPlan) return { dayTitle: '', exercises: [], matchedDayIndex: 0 };

  const days = workoutPlan.days;
  if (!days || !Array.isArray(days) || days.length === 0) {
    return {
      dayTitle: workoutPlan.planTitle || workoutPlan.title || 'Workout Plan',
      exercises: workoutPlan.exercises || [],
      matchedDayIndex: 0
    };
  }

  if (days.length === 1) {
    return {
      dayTitle: days[0].dayTitle || workoutPlan.planTitle || 'Workout Plan',
      exercises: days[0].exercises || [],
      matchedDayIndex: 0
    };
  }

  const d = new Date(cardDate || new Date());
  const weekdayName = d.toLocaleDateString('en-US', { weekday: 'long' });
  const shortWeekday = weekdayName.slice(0, 3);

  // 1. Try matching dayTitle by weekday name
  const titleIdx = days.findIndex(day => {
    const title = (day.dayTitle || '').toLowerCase();
    return title.includes(weekdayName.toLowerCase()) || title.includes(shortWeekday.toLowerCase());
  });

  if (titleIdx !== -1) {
    return {
      dayTitle: days[titleIdx].dayTitle,
      exercises: days[titleIdx].exercises || [],
      matchedDayIndex: titleIdx
    };
  }

  // 2. Try date offset from fromDate / planStart
  const startStr = workoutPlan.fromDate || workoutPlan.planStart;
  if (startStr) {
    const startDate = new Date(startStr);
    startDate.setHours(0, 0, 0, 0);
    const currDate = new Date(cardDate);
    currDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((currDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (!isNaN(diffDays) && diffDays >= 0) {
      const dayIdx = diffDays % days.length;
      return {
        dayTitle: days[dayIdx].dayTitle || `Day ${dayIdx + 1}`,
        exercises: days[dayIdx].exercises || [],
        matchedDayIndex: dayIdx
      };
    }
  }

  // 3. Fallback: Day of week index (Monday=0 ... Sunday=6)
  const jsDay = d.getDay();
  const monBasedIndex = (jsDay + 6) % 7;
  const targetIndex = monBasedIndex % days.length;

  return {
    dayTitle: days[targetIndex]?.dayTitle || `Day ${targetIndex + 1}`,
    exercises: days[targetIndex]?.exercises || [],
    matchedDayIndex: targetIndex
  };
}

export default function MonitoringPage() {
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Date Filters (Default 1 Month)
  const getDefaultFromDate = () => {
    const d = new Date();
    return new Date(d.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  };
  const getDefaultToDate = () => new Date().toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(getDefaultFromDate);
  const [toDate, setToDate] = useState(getDefaultToDate);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [masterCards, setMasterCards] = useState([]);
  const [clientsRawList, setClientsRawList] = useState([]);
  const [totalClientsCount, setTotalClientsCount] = useState(0);
  const [selectedProfileClient, setSelectedProfileClient] = useState(null);
  const [remarksMap, setRemarksMap] = useState({});
  const [reviewingMap, setReviewingMap] = useState({});
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState(null);
  const [cardDayMap, setCardDayMap] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchMasterDailyFeed = async (showLoading = false) => {
    try {
      if (showLoading) setIsRefreshing(true);
      const [clientsList, dailyLogsList, checkinsList] = await Promise.all([
        getAllClients(),
        getDocuments('DailyLogs'),
        getDocuments('BodyCheckins')
      ]);

      setTotalClientsCount(clientsList.length);
      setClientsRawList(clientsList || []);

      const clientMap = {};
      const workoutPlanMap = {};

      await Promise.all(
        clientsList.map(async (c) => {
          clientMap[c.id] = c.displayName || c.name || c.email || 'Client';
          try {
            const plan = await getClientWorkoutPlan(c.id);
            if (plan) workoutPlanMap[c.id] = plan;
          } catch (e) {
            console.error(e);
          }
        })
      );

      const dedupeComments = (commentsArray = []) => {
        const unique = [];
        const seen = new Set();
        for (const c of commentsArray) {
          if (!c || !c.text) continue;
          const timeMinute = c.createdAt ? c.createdAt.slice(0, 16) : '';
          const key = `${c.sender || c.senderRole}_${c.text.trim()}_${timeMinute}`;
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push(c);
        }
        return unique;
      };

      const cardGroupMap = {};

      dailyLogsList.forEach(log => {
        const cId = log.clientId;
        const dStr = log.date || (log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        const key = `${cId}_${dStr}`;

        if (!cardGroupMap[key]) {
          cardGroupMap[key] = {
            id: key,
            clientId: cId,
            clientName: clientMap[cId] || 'Client',
            date: dStr,
            timestamp: log.createdAt?.seconds ? log.createdAt.seconds * 1000 : new Date(dStr).getTime(),
            dailyLog: log,
            checkin: null,
            reviewed: !!log.reviewed,
            remarks: log.remarks || '',
            comments: dedupeComments(log.comments || []),
            hasUnreadClientReply: !!log.hasUnreadClientReply,
            lastCommentBy: log.lastCommentBy || '',
            lastCommentText: log.lastCommentText || '',
            lastCommentAt: log.lastCommentAt || ''
          };
        } else {
          cardGroupMap[key].dailyLog = log;
          if (log.reviewed) cardGroupMap[key].reviewed = true;
          if (log.remarks) cardGroupMap[key].remarks = log.remarks;
          if (log.comments && log.comments.length > 0) {
            cardGroupMap[key].comments = dedupeComments([...(cardGroupMap[key].comments || []), ...log.comments]);
          }
          if (log.hasUnreadClientReply) cardGroupMap[key].hasUnreadClientReply = true;
        }
      });

      checkinsList.forEach(chk => {
        const cId = chk.clientId;
        const clientObj = clientsList.find(c => c.id === cId);
        
        // Filter posture checkins for clients who have diet/workout plan assigned or posture checkin enabled
        const planFeats = clientObj?.planFeatures;
        const hasPlanOrWorkout = !!(clientObj?.currentPlan || workoutPlanMap[cId]);
        const isPostureEnabled = !planFeats || planFeats.hasPostureCheckin !== false;

        if (!hasPlanOrWorkout && !isPostureEnabled) return;

        const dStr = chk.date || (chk.createdAt?.seconds ? new Date(chk.createdAt.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        const key = `${cId}_${dStr}`;

        if (!cardGroupMap[key]) {
          cardGroupMap[key] = {
            id: key,
            clientId: cId,
            clientName: clientMap[cId] || 'Client',
            date: dStr,
            timestamp: chk.createdAt?.seconds ? chk.createdAt.seconds * 1000 : new Date(dStr).getTime(),
            dailyLog: null,
            checkin: chk,
            reviewed: !!chk.reviewed,
            remarks: chk.remarks || '',
            comments: dedupeComments(chk.comments || []),
            hasUnreadClientReply: !!chk.hasUnreadClientReply,
            lastCommentBy: chk.lastCommentBy || '',
            lastCommentText: chk.lastCommentText || '',
            lastCommentAt: chk.lastCommentAt || ''
          };
        } else {
          cardGroupMap[key].checkin = chk;
          if (chk.reviewed) cardGroupMap[key].reviewed = true;
          if (chk.remarks) cardGroupMap[key].remarks = chk.remarks;
          if (chk.comments && chk.comments.length > 0) {
            cardGroupMap[key].comments = dedupeComments([...(cardGroupMap[key].comments || []), ...chk.comments]);
          }
          if (chk.hasUnreadClientReply) cardGroupMap[key].hasUnreadClientReply = true;
        }
      });

      const masterList = Object.values(cardGroupMap).map(card => {
        const wPlan = workoutPlanMap[card.clientId] || null;
        const cObj = clientsList.find(c => c.id === card.clientId) || null;
        const chkInfo = getNextCheckinInfo(cObj, checkinsList);
        return {
          ...card,
          workoutPlan: wPlan,
          checkinInfo: chkInfo,
          comments: dedupeComments(card.comments || [])
        };
      });

      masterList.sort((a, b) => b.timestamp - a.timestamp);

      setMasterCards(masterList);

      const initialRemarks = {};
      masterList.forEach(c => {
        if (c.remarks) initialRemarks[c.id] = c.remarks;
      });
      setRemarksMap(initialRemarks);

    } catch (err) {
      console.error(err);
      toast.error('Failed to load daily monitoring feed');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMasterDailyFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReviewCard = async (card) => {
    const remarks = (remarksMap[card.id] || '').trim();
    if (!remarks) {
      toast.error('Please enter a review or reply message.');
      return;
    }

    setReviewingMap(prev => ({ ...prev, [card.id]: true }));
    try {
      if (card.dailyLog?.id) {
        await addReviewComment('DailyLogs', card.dailyLog.id, {
          sender: 'trainer',
          senderName: 'Radha Krishna Maram',
          senderRole: 'trainer',
          text: remarks,
          clientId: card.clientId
        });
      } else if (card.checkin?.id) {
        await addReviewComment('BodyCheckins', card.checkin.id, {
          sender: 'trainer',
          senderName: 'Radha Krishna Maram',
          senderRole: 'trainer',
          text: remarks,
          clientId: card.clientId
        });
      }

      toast.success(`Trainer review & reply sent to ${card.clientName}!`);
      setRemarksMap(prev => ({ ...prev, [card.id]: '' }));
      await fetchMasterDailyFeed(true);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to submit review');
    } finally {
      setReviewingMap(prev => ({ ...prev, [card.id]: false }));
    }
  };

  const filteredCards = masterCards.filter(card => {
    if (statusFilter === 'pending' && card.reviewed) return false;
    if (statusFilter === 'reviewed' && !card.reviewed) return false;
    
    if (fromDate && card.date < fromDate) return false;
    if (toDate && card.date > toDate) return false;

    if (search) {
      const q = search.toLowerCase();
      const nameMatch = card.clientName.toLowerCase().includes(q);
      const dateMatch = card.date.toLowerCase().includes(q);
      if (!nameMatch && !dateMatch) return false;
    }

    return true;
  });

  // Calculate Today's Stats
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayDateStr();
  const todayCards = masterCards.filter(c => c.date === todayStr);
  const todayUniqueClientsCount = new Set(todayCards.map(c => c.clientId)).size;
  const todayPendingCount = todayCards.filter(c => !c.reviewed).length;
  const todayReviewedCount = todayCards.filter(c => c.reviewed).length;
  const submissionPercentage = totalClientsCount > 0 
    ? Math.round((todayUniqueClientsCount / totalClientsCount) * 100) 
    : 0;

  const totalItems = filteredCards.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCards = filteredCards.slice(startIndex, startIndex + itemsPerPage);

  // Quick preset filter actions
  const applyDatePreset = (preset) => {
    const d = new Date();
    const today = d.toISOString().split('T')[0];
    if (preset === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (preset === 'yesterday') {
      const y = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      setFromDate(y);
      setToDate(y);
    } else if (preset === '7days') {
      const w = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      setFromDate(w);
      setToDate(today);
    } else if (preset === '30days') {
      setFromDate(getDefaultFromDate());
      setToDate(getDefaultToDate());
    }
    setCurrentPage(1);
  };

  return (
    <div style={styles.container} className="animate-fade-up">
      
      {/* 1. HERO HEADER BAR */}
      <header style={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.headerIconGlow}>
              <Activity size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={styles.title}>Daily Client Monitoring Feed</h1>
                <span style={styles.livePulseBadge}>
                  <span style={styles.pulseDot} />
                  LIVE SYNC
                </span>
              </div>
              <p style={styles.subtitle}>
                Track client workouts, meal proofs, biometric logs & coach review threads in real time
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Tabs */}
          <div style={styles.statusPillsRow}>
            <button 
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              style={{ ...styles.pillBtn, ...(statusFilter === 'all' ? styles.pillBtnActive : {}) }}
            >
              All Logs <span style={styles.pillCount}>{masterCards.length}</span>
            </button>

            <button 
              onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
              style={{ ...styles.pillBtn, ...(statusFilter === 'pending' ? styles.pillBtnActivePending : {}) }}
            >
              ⏳ Pending <span style={{ ...styles.pillCount, backgroundColor: 'rgba(255, 214, 0, 0.25)', color: '#ffd600' }}>{masterCards.filter(c => !c.reviewed).length}</span>
            </button>

            <button 
              onClick={() => { setStatusFilter('reviewed'); setCurrentPage(1); }}
              style={{ ...styles.pillBtn, ...(statusFilter === 'reviewed' ? styles.pillBtnActiveReviewed : {}) }}
            >
              ✓ Reviewed <span style={{ ...styles.pillCount, backgroundColor: 'rgba(0, 200, 83, 0.25)', color: '#00c853' }}>{masterCards.filter(c => c.reviewed).length}</span>
            </button>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchMasterDailyFeed(true)}
            disabled={isRefreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: 'var(--border)' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Syncing...' : 'Refresh'}
          </Button>
        </div>
      </header>

      {/* 2. TOP OVERVIEW METRICS TILES */}
      <div style={styles.statsGrid}>
        <StatsCard 
          title="SUBMITTED TODAY" 
          value={`${todayUniqueClientsCount} Active Members`} 
          description={`${submissionPercentage}% compliance of ${totalClientsCount} enrolled clients`}
          icon={Users} 
          color="#00c853" 
          loading={loading}
          onClick={() => {
            setFromDate(todayStr);
            setToDate(todayStr);
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          isActive={fromDate === todayStr && toDate === todayStr && statusFilter === 'all'}
        />

        <StatsCard 
          title="PENDING REVIEWS" 
          value={`${todayPendingCount} Logs Today`} 
          description="Awaiting coach feedback & guidance"
          icon={Clock} 
          color="#ffd600" 
          loading={loading}
          onClick={() => {
            setFromDate(todayStr);
            setToDate(todayStr);
            setStatusFilter('pending');
            setCurrentPage(1);
          }}
          isActive={fromDate === todayStr && toDate === todayStr && statusFilter === 'pending'}
        />

        <StatsCard 
          title="REVIEWED & SYNCED" 
          value={`${todayReviewedCount} Logs Done`} 
          description="Coach reviews sent directly to client app"
          icon={CheckCircle2} 
          color="#29b6f6" 
          loading={loading}
          onClick={() => {
            setFromDate(todayStr);
            setToDate(todayStr);
            setStatusFilter('reviewed');
            setCurrentPage(1);
          }}
          isActive={fromDate === todayStr && toDate === todayStr && statusFilter === 'reviewed'}
        />

        <StatsCard 
          title="FILTERED LOGS" 
          value={`${filteredCards.length} Total Logs`} 
          description="Matching search & date criteria"
          icon={Calendar} 
          color="var(--accent, #E00008)" 
          loading={loading}
          onClick={() => {
            setFromDate(getDefaultFromDate());
            setToDate(getDefaultToDate());
            setStatusFilter('all');
            setSearch('');
            setCurrentPage(1);
          }}
        />
      </div>

      {/* 3. SEARCH & DATE FILTER BAR */}
      <Card style={styles.filterCard} className="glass-card">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Client Search */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input 
              placeholder="Search by client name, ID, or date (YYYY-MM-DD)..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              icon={<Search size={15} color="var(--text-secondary)" />}
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            />
          </div>

          {/* Quick Date Preset Chips */}
          <div style={styles.presetChips}>
            <button 
              onClick={() => applyDatePreset('today')}
              style={{ ...styles.presetChip, ...(fromDate === todayStr && toDate === todayStr ? styles.presetChipActive : {}) }}
            >
              Today
            </button>
            <button 
              onClick={() => applyDatePreset('yesterday')}
              style={styles.presetChip}
            >
              Yesterday
            </button>
            <button 
              onClick={() => applyDatePreset('7days')}
              style={styles.presetChip}
            >
              7 Days
            </button>
            <button 
              onClick={() => applyDatePreset('30days')}
              style={styles.presetChip}
            >
              30 Days
            </button>
          </div>

          {/* Date Picker Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(0,0,0,0.25)', padding: '4px 8px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <Filter size={13} color="var(--accent)" />
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                style={styles.dateInput}
                title="From Date"
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>to</span>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                style={styles.dateInput}
                title="To Date"
              />
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => { setFromDate(getDefaultFromDate()); setToDate(getDefaultToDate()); setSearch(''); setCurrentPage(1); }}
              style={{ fontSize: '0.75rem' }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* 4. MASTER MONITORING CARDS LIST */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px' }}>
          <Spinner size={32} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading daily client telemetry & workout logs...</div>
        </div>
      ) : paginatedCards.length === 0 ? (
        <EmptyState 
          title="No Monitoring Logs Found" 
          message="No client activity or posture check-in logs match your active search or date filter." 
          icon="📱"
        />
      ) : (
        <div style={styles.cardList}>
          {paginatedCards.map(card => {
            const { dailyLog, checkin, workoutPlan, reviewed, clientName, date: cardDate, id: cardId } = card;
            const clientObj = clientsRawList.find(c => c.id === card.clientId) || { id: card.clientId, name: card.clientName };

            const completedExerciseIndices = dailyLog?.completedExercises || [];
            const workoutPlanTitle = workoutPlan?.title || workoutPlan?.planName || dailyLog?.workoutPlanTitle || 'Workout Plan';

            // Resolve assigned workout for cardDate
            const assignedInfo = getAssignedWorkoutForDate(workoutPlan, cardDate);
            const activeDayIdx = cardDayMap[cardId] !== undefined ? cardDayMap[cardId] : assignedInfo.matchedDayIndex;

            const activeDayObj = (workoutPlan?.days && workoutPlan.days.length > activeDayIdx) 
              ? workoutPlan.days[activeDayIdx] 
              : null;

            const assignedExercises = activeDayObj 
              ? (activeDayObj.exercises || []) 
              : assignedInfo.exercises;

            const assignedDayTitle = activeDayObj 
              ? (activeDayObj.dayTitle || `Day ${activeDayIdx + 1}`) 
              : assignedInfo.dayTitle;

            const totalExercises = assignedExercises.length;
            const completedCount = completedExerciseIndices.length;
            const workoutProgress = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : (dailyLog?.workoutCompleted ? 100 : 0);

            const mealPhotosMap = dailyLog?.mealPhotos || {};
            const mealSlotKeys = Object.keys(mealPhotosMap);

            return (
              <div 
                key={cardId} 
                style={{
                  ...styles.masterCard,
                  borderColor: card.hasUnreadClientReply ? 'rgba(224, 0, 8, 0.45)' : (reviewed ? 'rgba(0, 200, 83, 0.2)' : 'rgba(255, 214, 0, 0.25)')
                }} 
                className="glass-card"
              >
                
                {/* A. CARD HEADER: CLIENT IDENTITY & BADGES */}
                <div style={styles.cardHeader}>
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, cursor: 'pointer' }}
                    onClick={() => setSelectedProfileClient(clientObj)}
                    title="Click to view detailed client profile"
                  >
                    <div style={styles.avatarWrapper}>
                      <Avatar 
                        src={clientObj.photoURL || clientObj.profileImage || clientObj.photo || clientObj.avatar || card.photoURL || card.clientPhoto} 
                        name={clientName} 
                        size="md" 
                        onClick={(e) => {
                          const p = clientObj.photoURL || clientObj.profileImage || clientObj.photo || clientObj.avatar || card.photoURL || card.clientPhoto;
                          if (p) {
                            e.stopPropagation();
                            setViewingPhotoUrl(p);
                          }
                        }}
                      />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h2 style={styles.clientName}>{clientName}</h2>
                        <span style={styles.dateTag}>
                          📅 {formatDateNice(cardDate)}
                        </span>
                        <span style={styles.codeTag}>
                          ID: {clientObj.clientCode || '100'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {workoutPlan && (
                          <div style={styles.planPill}>
                            <Dumbbell size={11} color="#00c853" />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {workoutPlanTitle}
                            </span>
                          </div>
                        )}

                        {card.checkinInfo && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: card.checkinInfo.isOverdue ? 'rgba(255, 23, 68, 0.12)' : 'rgba(0, 176, 255, 0.12)',
                            border: `1px solid ${card.checkinInfo.isOverdue ? 'rgba(255, 23, 68, 0.35)' : 'rgba(0, 176, 255, 0.35)'}`,
                            color: card.checkinInfo.isOverdue ? '#ff1744' : '#00b0ff'
                          }}
                          title={`Next 10-day body check-in due: ${card.checkinInfo.nextCheckinDateFormatted}`}
                          >
                            <span>📅 Check-in: <strong>{card.checkinInfo.nextCheckinDateFormatted}</strong> ({card.checkinInfo.statusText})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header Status Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {card.hasUnreadClientReply && (
                      <span style={styles.unreadReplyBadge}>
                        <span style={styles.pulseDotRed} />
                        💬 New Client Reply
                      </span>
                    )}

                    <span style={{
                      ...styles.statusBadge, 
                      backgroundColor: reviewed ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 214, 0, 0.15)',
                      border: `1px solid ${reviewed ? 'rgba(0, 200, 83, 0.35)' : 'rgba(255, 214, 0, 0.35)'}`,
                      color: reviewed ? '#00c853' : '#ffd600',
                    }}>
                      {reviewed ? '✓ Reviewed' : '⏳ Pending Review'}
                    </span>
                  </div>
                </div>

                {/* B. BIOMETRICS TELEMETRY 5-COLUMN BAR */}
                <div style={styles.metricsRow}>
                  {/* Steps */}
                  <div style={styles.miniStat}>
                    <div style={styles.miniStatIconBox}>
                      <span style={{ fontSize: '15px' }}>👟</span>
                    </div>
                    <div style={{ ...styles.miniStatVal, color: '#4dabf7' }}>
                      {dailyLog?.steps ? Number(dailyLog.steps).toLocaleString() : '—'}
                    </div>
                    <div style={styles.miniStatLbl}>Daily Steps</div>
                    {dailyLog?.stepsScreenshot && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingPhotoUrl(dailyLog.stepsScreenshot);
                        }}
                        style={styles.stepsProofPill}
                        title="Click to view verified step counter screenshot"
                      >
                        📸 Proof 👁️
                      </button>
                    )}
                  </div>

                  {/* Sleep */}
                  <div style={styles.miniStat}>
                    <div style={styles.miniStatIconBox}>
                      <Moon size={15} color="#b388ff" />
                    </div>
                    <div style={{ ...styles.miniStatVal, color: '#b388ff' }}>
                      {dailyLog?.sleepHours ? `${dailyLog.sleepHours}h` : '—'}
                    </div>
                    <div style={styles.miniStatLbl}>
                      Sleep {dailyLog?.sleepQuality ? `(${dailyLog.sleepQuality})` : ''}
                    </div>
                  </div>

                  {/* Water */}
                  <div style={styles.miniStat}>
                    <div style={styles.miniStatIconBox}>
                      <Droplets size={15} color="#00b0ff" />
                    </div>
                    <div style={{ ...styles.miniStatVal, color: '#00b0ff' }}>
                      {dailyLog?.water ? `${dailyLog.water}L` : '—'}
                    </div>
                    <div style={styles.miniStatLbl}>Water Intake</div>
                  </div>

                  {/* Energy */}
                  <div style={styles.miniStat}>
                    <div style={styles.miniStatIconBox}>
                      <Zap size={15} color="#ffd600" />
                    </div>
                    <div style={{ ...styles.miniStatVal, color: '#ffd600' }}>
                      {dailyLog?.energyLevel || '—'}
                    </div>
                    <div style={styles.miniStatLbl}>Energy Level</div>
                  </div>

                  {/* Mood */}
                  <div style={styles.miniStat}>
                    <div style={styles.miniStatIconBox}>
                      <Smile size={15} color="#ff80ab" />
                    </div>
                    <div style={{ ...styles.miniStatVal, color: '#ff80ab' }}>
                      {dailyLog?.mood || '—'}
                    </div>
                    <div style={styles.miniStatLbl}>Daily Mood</div>
                  </div>
                </div>

                {/* C. WORKOUT PROGRESS STREAM */}
                <div style={styles.innerBlock}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={styles.blockTitleRow}>
                      <Dumbbell size={14} color="#00c853" />
                      <span style={styles.blockTitle}>Workout Progress</span>
                      {assignedDayTitle && (
                        <span style={{ fontSize: '0.75rem', color: '#00c853', fontWeight: 800 }}>
                          • {assignedDayTitle}
                        </span>
                      )}
                    </div>

                    {totalExercises > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={styles.progressBarBg}>
                          <div style={{ ...styles.progressBarFill, width: `${workoutProgress}%` }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: workoutProgress === 100 ? '#00c853' : 'var(--accent, #E00008)' }}>
                          {completedCount}/{totalExercises} ({workoutProgress}%)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Multi-day switcher pills for trainer */}
                  {workoutPlan?.days && workoutPlan.days.length > 1 && (
                    <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '6px' }}>
                      {workoutPlan.days.map((dObj, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCardDayMap({ ...cardDayMap, [cardId]: idx })}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.68rem',
                            fontWeight: activeDayIdx === idx ? 800 : 500,
                            backgroundColor: activeDayIdx === idx ? 'rgba(0, 200, 83, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            border: `1px solid ${activeDayIdx === idx ? '#00c853' : 'var(--border)'}`,
                            color: activeDayIdx === idx ? '#00c853' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {dObj.dayTitle || `Day ${idx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  {assignedExercises.length === 0 ? (
                    <div style={styles.mutedText}>No exercises assigned or logged for this day.</div>
                  ) : (
                    <div style={styles.exerciseList}>
                      {assignedExercises.map((ex, exIdx) => {
                        const isDone = completedExerciseIndices.includes(exIdx);
                        const exName = ex.name || ex.exerciseName || ex.title || `Exercise #${exIdx + 1}`;
                        const exSets = ex.sets || ex.targetSets || 3;
                        const exReps = ex.reps || ex.targetReps || '10-12';

                        return (
                          <div 
                            key={exIdx} 
                            style={{
                              ...styles.exerciseRow,
                              backgroundColor: isDone ? 'rgba(0, 200, 83, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                              borderColor: isDone ? 'rgba(0, 200, 83, 0.2)' : 'transparent'
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                              {isDone ? <CheckSquare size={13} color="#00c853" /> : <Square size={13} color="var(--text-secondary)" />}
                            </span>
                            <span style={{ 
                              fontSize: '0.78rem', 
                              fontWeight: isDone ? 700 : 500,
                              color: isDone ? '#FFFFFF' : 'var(--text-secondary)',
                              textDecoration: isDone ? 'none' : 'none',
                              flex: 1
                            }}>
                              {exName}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                              {exSets} sets × {exReps} reps
                            </span>
                            {isDone && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#00c853', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Check size={11} /> Done
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* D. MEAL PHOTOS STREAM */}
                <div style={styles.innerBlock}>
                  <div style={styles.blockTitleRow}>
                    <Utensils size={14} color="#ff9100" />
                    <span style={styles.blockTitle}>Meal Photos Stream</span>
                  </div>

                  {mealSlotKeys.length === 0 ? (
                    <div style={styles.mutedText}>No meal photos uploaded today.</div>
                  ) : (
                    <div style={styles.photoStream}>
                      {mealSlotKeys.map(slotId => {
                        const rawUrl = mealPhotosMap[slotId];
                        const imgUrl = getDirectImageUrl(rawUrl);
                        const slotLabel = MEAL_SLOT_LABELS[slotId] || slotId;

                        return (
                          <div key={slotId} style={styles.photoThumbCard} onClick={() => setViewingPhotoUrl(imgUrl)}>
                            <div style={styles.photoImgContainer}>
                              <img src={imgUrl} alt={slotLabel} style={styles.photoImg} />
                              <div style={styles.photoOverlayIcon}>
                                <Eye size={12} color="#FFF" />
                              </div>
                            </div>
                            <div style={styles.photoCaption}>{slotLabel.split(' ')[0]}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* E. 10-DAY POSTURE PHOTOS STREAM */}
                {card.checkin?.photos && Object.values(card.checkin.photos).some(Boolean) && (
                  <div style={styles.innerBlock}>
                    <div style={styles.blockTitleRow}>
                      <Camera size={14} color="#00b0ff" />
                      <span style={styles.blockTitle}>10-Day Posture & Body Photos</span>
                    </div>
                    <div style={styles.photoStream}>
                      {Object.entries(card.checkin.photos).map(([side, pUrl]) => {
                        if (!pUrl) return null;
                        const imgUrl = getDirectImageUrl(pUrl);
                        return (
                          <div key={side} style={styles.photoThumbCard} onClick={() => setViewingPhotoUrl(imgUrl)}>
                            <div style={styles.photoImgContainer}>
                              <img src={imgUrl} alt={side} style={styles.photoImg} />
                              <div style={styles.photoOverlayIcon}>
                                <Eye size={12} color="#FFF" />
                              </div>
                            </div>
                            <div style={styles.photoCaption}>{side.toUpperCase()}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* F. SUPPLEMENTS COMPLIANCE */}
                {dailyLog?.takenSupplements && Object.keys(dailyLog.takenSupplements).length > 0 && (
                  <div style={styles.innerBlock}>
                    <div style={styles.blockTitleRow}>
                      <span style={{ fontSize: '13px' }}>💊</span>
                      <span style={styles.blockTitle}>Supplements Compliance</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {Object.entries(dailyLog.takenSupplements).map(([name, taken]) => (
                        <span
                          key={name}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: '12px',
                            backgroundColor: taken ? 'rgba(171, 71, 188, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: taken ? '#ce93d8' : 'var(--text-secondary)',
                            border: `1px solid ${taken ? 'rgba(171, 71, 188, 0.35)' : 'var(--border)'}`,
                          }}
                        >
                          {taken ? '✓' : '✗'} {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* G. TRAINER REVIEW & COMMENTS CONVERSATION THREAD */}
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: reviewed ? 'rgba(0, 200, 83, 0.04)' : 'rgba(224, 0, 8, 0.04)',
                  border: `1px solid ${card.hasUnreadClientReply ? 'rgba(224, 0, 8, 0.4)' : (reviewed ? 'rgba(0, 200, 83, 0.25)' : 'rgba(224, 0, 8, 0.25)')}`,
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: reviewed ? '#00c853' : 'var(--accent, #E00008)' }}>
                      <MessageSquare size={15} />
                      <span>{reviewed ? 'Trainer Review & Comments Thread' : 'Write Trainer Review & Feedback'}</span>
                    </div>

                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: card.hasUnreadClientReply ? '#ff1744' : 'var(--text-secondary)' }}>
                      {card.hasUnreadClientReply ? '🔔 Client Replied to Review' : (reviewed ? '✓ Synced to Client Dashboard' : '⏳ Pending Trainer Feedback')}
                    </span>
                  </div>

                  {/* Comments & Replies History */}
                  {card.comments && card.comments.length > 0 && (
                    <div style={styles.commentThreadList}>
                      {card.comments.map((comment, idx) => {
                        const isTrainer = comment.sender === 'trainer' || comment.senderRole === 'trainer';
                        return (
                          <div
                            key={comment.id || idx}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '10px',
                              backgroundColor: isTrainer ? 'rgba(0, 200, 83, 0.08)' : 'rgba(224, 0, 8, 0.08)',
                              borderLeft: `3px solid ${isTrainer ? '#00c853' : 'var(--accent, #E00008)'}`,
                              fontSize: '0.8rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                              <strong style={{ fontSize: '0.72rem', color: isTrainer ? '#00c853' : 'var(--accent, #E00008)' }}>
                                {isTrainer ? '👑 Coach Radha Krishna' : `🏋️ ${comment.senderName || card.clientName} (Client)`}
                              </strong>
                              <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)' }}>
                                {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <span style={{ color: '#FFFFFF', lineHeight: 1.4 }}>{comment.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reply Input Form */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <Input 
                        placeholder={reviewed ? "Type reply or next advice for client..." : "Type trainer review & remarks for client..."} 
                        value={remarksMap[cardId] || ''} 
                        onChange={(e) => setRemarksMap({ ...remarksMap, [cardId]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleReviewCard(card);
                          }
                        }}
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <Button 
                      onClick={() => handleReviewCard(card)}
                      loading={reviewingMap[cardId]}
                      size="sm"
                      style={{
                        backgroundColor: reviewed ? '#00c853' : 'var(--accent, #E00008)',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        boxShadow: reviewed ? '0 0 14px rgba(0,200,83,0.35)' : '0 0 14px rgba(224,0,8,0.35)'
                      }}
                    >
                      <Send size={14} /> {reviewed ? 'Send Reply' : 'Submit Review'}
                    </Button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 5. PAGINATION */}
      {totalItems > 0 && (
        <Pagination 
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newSize) => { setItemsPerPage(newSize); setCurrentPage(1); }}
          itemsPerPageOptions={[5, 10, 25]}
        />
      )}

      {/* 6. PHOTO VIEWER MODAL */}
      {viewingPhotoUrl && (
        <Modal isOpen={!!viewingPhotoUrl} onClose={() => setViewingPhotoUrl(null)} title="Photo Full View" size="md">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
            <img 
              src={viewingPhotoUrl} 
              alt="Photo Full Preview" 
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '10px', objectFit: 'contain', border: '1px solid var(--border)' }} 
            />
          </div>
        </Modal>
      )}

      {/* 7. CLIENT QUICK PROFILE POPUP MODAL */}
      {selectedProfileClient && (
        <Modal
          isOpen={!!selectedProfileClient}
          onClose={() => setSelectedProfileClient(null)}
          title={`Client Profile: ${selectedProfileClient.displayName || selectedProfileClient.name || 'Member'}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', backgroundColor: 'var(--card-hover)', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <Avatar 
                src={selectedProfileClient.photoURL || selectedProfileClient.profileImage || selectedProfileClient.photo || selectedProfileClient.avatar} 
                name={selectedProfileClient.displayName || selectedProfileClient.name} 
                size="lg" 
                onClick={() => {
                  const p = selectedProfileClient.photoURL || selectedProfileClient.profileImage || selectedProfileClient.photo || selectedProfileClient.avatar;
                  if (p) setViewingPhotoUrl(p);
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                    {selectedProfileClient.displayName || selectedProfileClient.name}
                  </h3>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    backgroundColor: selectedProfileClient.status === 'active' ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 214, 0, 0.15)',
                    color: selectedProfileClient.status === 'active' ? '#00c853' : '#ffd600',
                    border: `1px solid ${selectedProfileClient.status === 'active' ? 'rgba(0, 200, 83, 0.3)' : 'rgba(255, 214, 0, 0.3)'}`
                  }}>
                    {(selectedProfileClient.status || 'ACTIVE').toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <span>📧 {selectedProfileClient.email || '--'}</span>
                  <span>📞 {selectedProfileClient.phone || '--'}</span>
                  <span>🆔 Code: <strong>{selectedProfileClient.clientCode || '100'}</strong></span>
                </div>
              </div>
            </div>

            {/* Plan Info Card */}
            <div style={{ padding: '14px', backgroundColor: 'rgba(224, 0, 8, 0.06)', borderRadius: '12px', border: '1px solid rgba(224, 0, 8, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Assigned Membership Plan
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                {selectedProfileClient.currentPlan || 'No Plan Assigned'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Start Date</span>
                  <strong style={{ color: 'var(--text)' }}>{selectedProfileClient.planStart || '--'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Expiry Date</span>
                  <strong style={{ color: 'var(--text)' }}>{selectedProfileClient.planExpiry || '--'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Location / City</span>
                  <strong style={{ color: 'var(--text)' }}>{selectedProfileClient.location || '--'}</strong>
                </div>
              </div>
            </div>

            {/* Physical Stats & Goal Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '12px', backgroundColor: 'var(--card-hover)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>GENDER / AGE</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}>
                  {selectedProfileClient.gender || 'Male'} ({selectedProfileClient.age || '--'} yrs)
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>HEIGHT / WEIGHT</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}>
                  {selectedProfileClient.height ? `${selectedProfileClient.height} cm` : '--'} / {selectedProfileClient.weight ? `${selectedProfileClient.weight} kg` : '--'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>PRIMARY GOAL</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#00c853' }}>
                  {selectedProfileClient.goal || 'Fat Loss'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>DIET TYPE</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ff9100' }}>
                  {selectedProfileClient.diet || 'VEG'}
                </div>
              </div>
            </div>

            {/* Health & Injuries Section */}
            {(selectedProfileClient.hasInjuries === 'YES' || selectedProfileClient.hasHealthIssues === 'YES' || selectedProfileClient.injuriesDetails || selectedProfileClient.healthIssuesDetails) && (
              <div style={{ padding: '12px 14px', backgroundColor: 'rgba(255, 145, 0, 0.08)', borderRadius: '12px', border: '1px solid rgba(255, 145, 0, 0.25)', fontSize: '0.8rem' }}>
                <strong style={{ color: '#ff9100', display: 'block', marginBottom: '4px' }}>⚠️ Health & Injury Alerts:</strong>
                {selectedProfileClient.injuriesDetails && <div>• <strong>Injuries:</strong> {selectedProfileClient.injuriesDetails}</div>}
                {selectedProfileClient.healthIssuesDetails && <div>• <strong>Health Concerns:</strong> {selectedProfileClient.healthIssuesDetails}</div>}
                {selectedProfileClient.medications && <div>• <strong>Medications:</strong> {selectedProfileClient.medications}</div>}
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
              <Button variant="outline" size="sm" onClick={() => setSelectedProfileClient(null)}>
                Close Profile
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  headerIconGlow: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, var(--accent, #E00008), #ff5252)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 16px rgba(224, 0, 8, 0.35)',
    flexShrink: 0
  },
  title: { fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)', letterSpacing: '-0.3px' },
  subtitle: { fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' },
  livePulseBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: 'rgba(0, 200, 83, 0.12)',
    border: '1px solid rgba(0, 200, 83, 0.35)',
    color: '#00c853',
    fontSize: '0.65rem',
    fontWeight: 800,
    letterSpacing: '0.5px'
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#00c853',
    boxShadow: '0 0 8px #00c853'
  },
  pulseDotRed: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#ff1744',
    boxShadow: '0 0 8px #ff1744'
  },
  unreadReplyBadge: {
    backgroundColor: 'rgba(224, 0, 8, 0.15)',
    border: '1px solid rgba(224, 0, 8, 0.4)',
    color: 'var(--accent, #E00008)',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '0.68rem',
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px'
  },
  statusPillsRow: { display: 'flex', gap: '6px', backgroundColor: 'rgba(0,0,0,0.25)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' },
  pillBtn: {
    padding: '5px 12px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  },
  pillBtnActive: { 
    backgroundColor: 'var(--accent-surface)', 
    color: 'var(--accent)', 
    borderColor: 'rgba(224, 0, 8, 0.35)',
    boxShadow: '0 0 10px rgba(224, 0, 8, 0.15)'
  },
  pillBtnActivePending: { 
    backgroundColor: 'rgba(255, 214, 0, 0.15)', 
    color: '#ffd600', 
    borderColor: 'rgba(255, 214, 0, 0.35)',
    boxShadow: '0 0 10px rgba(255, 214, 0, 0.15)'
  },
  pillBtnActiveReviewed: { 
    backgroundColor: 'rgba(0, 200, 83, 0.15)', 
    color: '#00c853', 
    borderColor: 'rgba(0, 200, 83, 0.35)',
    boxShadow: '0 0 10px rgba(0, 200, 83, 0.15)'
  },
  pillCount: {
    padding: '1px 6px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    fontSize: '0.65rem',
    fontWeight: 800
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px'
  },
  filterCard: {
    padding: '10px 14px',
    borderRadius: '14px'
  },
  presetChips: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  presetChip: {
    padding: '4px 10px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: '0.72rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  presetChipActive: {
    backgroundColor: 'rgba(224, 0, 8, 0.15)',
    borderColor: 'var(--accent)',
    color: '#FFF',
    fontWeight: 700
  },
  dateInput: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text)',
    fontSize: '0.75rem',
    outline: 'none',
    cursor: 'pointer'
  },
  cardList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  masterCard: { 
    padding: '14px 16px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px', 
    borderRadius: '16px',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
    transition: 'all 0.2s ease'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  avatarWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  clientName: { margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.2px' },
  dateTag: { fontSize: '0.72rem', color: '#ffd600', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', backgroundColor: 'rgba(255, 214, 0, 0.1)' },
  codeTag: { fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 },
  planPill: { 
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: '5px', 
    fontSize: '0.7rem', 
    color: '#00c853', 
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '8px',
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    border: '1px solid rgba(0, 200, 83, 0.25)'
  },
  statusBadge: { padding: '3px 10px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap' },
  metricsRow: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(5, 1fr)', 
    gap: '8px', 
    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
    padding: '10px', 
    borderRadius: '12px', 
    border: '1px solid var(--border)' 
  },
  miniStat: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    textAlign: 'center', 
    gap: '3px',
    padding: '4px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)'
  },
  miniStatIconBox: {
    width: '26px',
    height: '26px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '2px'
  },
  miniStatVal: { fontSize: '0.95rem', fontWeight: 900 },
  miniStatLbl: { fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 },
  stepsProofPill: {
    marginTop: '4px',
    padding: '2px 8px',
    borderRadius: '8px',
    backgroundColor: 'rgba(77, 171, 247, 0.15)',
    border: '1px solid rgba(77, 171, 247, 0.4)',
    color: '#4dabf7',
    fontSize: '0.65rem',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px'
  },
  innerBlock: { 
    padding: '10px 12px', 
    backgroundColor: 'var(--card-hover)', 
    borderRadius: '12px', 
    border: '1px solid var(--border)' 
  },
  blockTitleRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  blockTitle: { fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.2px' },
  progressBarBg: {
    width: '100px',
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #00c853, #69f0ae)',
    borderRadius: '4px',
    transition: 'width 0.4s ease'
  },
  exerciseList: { display: 'flex', flexDirection: 'column', gap: '4px' },
  exerciseRow: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    padding: '6px 10px', 
    borderRadius: '8px', 
    border: '1px solid transparent',
    transition: 'all 0.15s ease'
  },
  mutedText: { fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '4px 0' },
  photoStream: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', paddingTop: '4px' },
  photoThumbCard: { minWidth: '75px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' },
  photoImgContainer: {
    position: 'relative',
    width: '75px',
    height: '75px',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.12)'
  },
  photoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  photoOverlayIcon: {
    position: 'absolute',
    bottom: '4px',
    right: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: '4px',
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  photoCaption: { fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' },
  commentThreadList: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }
};
