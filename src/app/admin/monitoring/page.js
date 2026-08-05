'use client';

import { useState, useEffect } from 'react';
import { 
  getAllClients, 
  getDocuments, 
  getClientWorkoutPlan, 
  reviewDailyLog, 
  updateCheckin 
} from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
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
  Send
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
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

export default function MonitoringPage() {
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Date Filters (Default 1 Month)
  const defaultToDate = new Date().toISOString().split('T')[0];
  const defaultFromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);

  const [loading, setLoading] = useState(true);
  const [masterCards, setMasterCards] = useState([]);
  const [remarksMap, setRemarksMap] = useState({});
  const [reviewingMap, setReviewingMap] = useState({});
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    fetchMasterDailyFeed();
  }, []);

  const fetchMasterDailyFeed = async () => {
    try {
      setLoading(true);
      const [clientsList, dailyLogsList, checkinsList] = await Promise.all([
        getAllClients(),
        getDocuments('DailyLogs'),
        getDocuments('BodyCheckins')
      ]);

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
            remarks: log.remarks || ''
          };
        } else {
          cardGroupMap[key].dailyLog = log;
          if (log.reviewed) cardGroupMap[key].reviewed = true;
          if (log.remarks) cardGroupMap[key].remarks = log.remarks;
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
            remarks: chk.remarks || ''
          };
        } else {
          cardGroupMap[key].checkin = chk;
          if (chk.reviewed) cardGroupMap[key].reviewed = true;
          if (chk.remarks) cardGroupMap[key].remarks = chk.remarks;
        }
      });

      const masterList = Object.values(cardGroupMap).map(card => {
        const wPlan = workoutPlanMap[card.clientId] || null;
        return {
          ...card,
          workoutPlan: wPlan
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
    }
  };

  const handleReviewCard = async (card) => {
    setReviewingMap(prev => ({ ...prev, [card.id]: true }));
    try {
      const remarks = remarksMap[card.id] || '';
      
      const promises = [];
      if (card.dailyLog?.id) {
        promises.push(reviewDailyLog(card.dailyLog.id, {
          reviewed: true,
          remarks: remarks,
          reviewedAt: new Date().toISOString()
        }));
      }
      if (card.checkin?.id) {
        promises.push(updateCheckin(card.checkin.id, {
          reviewed: true,
          remarks: remarks,
          reviewedAt: new Date().toISOString()
        }));
      }

      await Promise.all(promises);
      toast.success(`Daily log for ${card.clientName} submitted review!`);
      await fetchMasterDailyFeed();
    } catch (err) {
      console.error(err);
      toast.error(err);
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

  const totalItems = filteredCards.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCards = filteredCards.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div style={styles.container} className="animate-fade-up">
      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--accent, #E00008)" />
          <h1 style={styles.title}>Daily Client Monitoring Feed</h1>
        </div>

        <div style={styles.statusPillsRow}>
          <button 
            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
            style={{ ...styles.pillBtn, ...(statusFilter === 'all' ? styles.pillBtnActive : {}) }}
          >
            All ({masterCards.length})
          </button>

          <button 
            onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
            style={{ ...styles.pillBtn, ...(statusFilter === 'pending' ? styles.pillBtnActivePending : {}) }}
          >
            Pending
          </button>

          <button 
            onClick={() => { setStatusFilter('reviewed'); setCurrentPage(1); }}
            style={{ ...styles.pillBtn, ...(statusFilter === 'reviewed' ? styles.pillBtnActiveReviewed : {}) }}
          >
            Reviewed
          </button>
        </div>
      </header>

      {/* Date Filter Bar */}
      <Card style={{ padding: '8px 12px' }} className="glass-card">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <Input 
              placeholder="Search client or date..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              icon={<Search size={14} />}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--accent)" />
            <Input 
              type="date" 
              label="From"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
              style={{ width: '130px' }}
            />
            <Input 
              type="date" 
              label="To"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
              style={{ width: '130px' }}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => { setFromDate(defaultFromDate); setToDate(defaultToDate); setSearch(''); setCurrentPage(1); }}
              style={{ alignSelf: 'flex-end' }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Cards List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner />
        </div>
      ) : paginatedCards.length === 0 ? (
        <EmptyState 
          title="No Logs Found" 
          message="No daily client logs match your search or date filter." 
          icon="📱"
        />
      ) : (
        <div style={styles.cardList}>
          {paginatedCards.map(card => {
            const { dailyLog, checkin, workoutPlan, reviewed, clientName, date: cardDate, id: cardId } = card;

            const completedExerciseIndices = dailyLog?.completedExercises || [];
            const workoutPlanTitle = workoutPlan?.title || workoutPlan?.planName || dailyLog?.workoutPlanTitle || 'Workout Plan';
            const totalExercises = workoutPlan?.exercises?.length || 0;
            const completedCount = completedExerciseIndices.length;
            const workoutProgress = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : (dailyLog?.workoutCompleted ? 100 : 0);

            const mealPhotosMap = dailyLog?.mealPhotos || {};
            const mealSlotKeys = Object.keys(mealPhotosMap);

            return (
              <div key={cardId} style={styles.masterCard} className="glass-card">
                
                <div style={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <div style={styles.avatarCircle}>
                      {clientName.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <h2 style={styles.clientName}>{clientName}</h2>
                        <span style={styles.dateTag}>
                          {formatDateNice(cardDate)}
                        </span>
                      </div>

                      {workoutPlan && (
                        <div style={styles.planPill}>
                          <Dumbbell size={11} color="#00c853" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {workoutPlanTitle}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span style={{
                    ...styles.statusBadge, 
                    backgroundColor: reviewed ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 214, 0, 0.15)',
                    border: `1px solid ${reviewed ? 'rgba(0, 200, 83, 0.3)' : 'rgba(255, 214, 0, 0.3)'}`,
                    color: reviewed ? '#00c853' : '#ffd600',
                  }}>
                    {reviewed ? '✓ Reviewed' : '⏳ Pending'}
                  </span>
                </div>

                <div style={styles.metricsRow}>
                  <div style={styles.miniStat}>
                    <span>👣</span>
                    <span style={styles.miniStatVal}>{dailyLog?.steps ? Number(dailyLog.steps).toLocaleString() : '—'}</span>
                    <span style={styles.miniStatLbl}>Steps</span>
                  </div>

                  <div style={styles.miniStat}>
                    <span>😴</span>
                    <span style={styles.miniStatVal}>{dailyLog?.sleepHours ? `${dailyLog.sleepHours}h` : '—'}</span>
                    <span style={styles.miniStatLbl}>Sleep</span>
                  </div>

                  <div style={styles.miniStat}>
                    <span>💧</span>
                    <span style={styles.miniStatVal}>{dailyLog?.water ? `${dailyLog.water}L` : '—'}</span>
                    <span style={styles.miniStatLbl}>Water</span>
                  </div>

                  <div style={styles.miniStat}>
                    <span>⚡</span>
                    <span style={styles.miniStatVal}>{dailyLog?.energyLevel || '—'}</span>
                    <span style={styles.miniStatLbl}>Energy</span>
                  </div>

                  <div style={styles.miniStat}>
                    <span>😊</span>
                    <span style={styles.miniStatVal}>{dailyLog?.mood || '—'}</span>
                    <span style={styles.miniStatLbl}>Mood</span>
                  </div>
                </div>

                <div style={styles.innerBlock}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={styles.blockTitleRow}>
                      <Dumbbell size={12} color="#00c853" />
                      <span style={styles.blockTitle}>Workout Progress</span>
                    </div>

                    {totalExercises > 0 && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: workoutProgress === 100 ? '#00c853' : 'var(--accent, #E00008)' }}>
                        {completedCount}/{totalExercises} Done ({workoutProgress}%)
                      </span>
                    )}
                  </div>

                  {totalExercises > 0 && (
                    <div style={{ height: '4px', backgroundColor: 'var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '6px' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${workoutProgress}%`,
                        backgroundColor: workoutProgress === 100 ? '#00c853' : 'var(--accent, #E00008)',
                        borderRadius: '10px',
                      }} />
                    </div>
                  )}

                  {workoutPlan?.exercises && workoutPlan.exercises.length > 0 ? (
                    <div style={styles.exerciseList}>
                      {workoutPlan.exercises.map((ex, idx) => {
                        const isDone = completedExerciseIndices.includes(idx);
                        return (
                          <div key={idx} style={{
                            ...styles.exerciseRow,
                            backgroundColor: isDone ? 'rgba(0, 200, 83, 0.08)' : 'var(--card-hover)',
                            borderColor: isDone ? 'rgba(0, 200, 83, 0.25)' : 'var(--border)'
                          }}>
                            {isDone ? <CheckSquare size={12} color="#00c853" /> : <Square size={12} color="var(--text-secondary)" />}
                            <span style={{ fontSize: '0.75rem', color: isDone ? 'var(--text)' : 'var(--text-secondary)', fontWeight: isDone ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {ex.name || `Exercise ${idx + 1}`}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                              {ex.sets}×{ex.reps} {ex.weight ? `@${ex.weight}` : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={styles.mutedText}>
                      {dailyLog?.workoutCompleted ? '✓ Workout Completed' : 'No workout exercises logged today.'}
                    </div>
                  )}
                </div>

                <div style={styles.innerBlock}>
                  <div style={styles.blockTitleRow}>
                    <Utensils size={12} color="#ff9100" />
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
                            <img src={imgUrl} alt={slotLabel} style={styles.photoImg} />
                            <div style={styles.photoCaption}>{slotLabel.split(' ')[0]}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Trainer Action Footer */}
                <div style={styles.actionRow}>
                  <Input 
                    placeholder="Trainer review remarks..." 
                    value={remarksMap[cardId] || ''} 
                    onChange={(e) => setRemarksMap({ ...remarksMap, [cardId]: e.target.value })}
                  />
                  <Button 
                    onClick={() => handleReviewCard(card)}
                    loading={reviewingMap[cardId]}
                    size="sm"
                    style={{
                      backgroundColor: reviewed ? 'rgba(0, 200, 83, 0.15)' : 'var(--accent, #E00008)',
                      color: reviewed ? '#00c853' : '#FFFFFF',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Send size={14} /> {reviewed ? 'Submitted' : 'Submit Review'}
                  </Button>
                </div>

              </div>
            );
          })}
        </div>
      )}

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

      {viewingPhotoUrl && (
        <Modal isOpen={!!viewingPhotoUrl} onClose={() => setViewingPhotoUrl(null)} title="Photo Full View" size="md">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
            <img 
              src={viewingPhotoUrl} 
              alt="Photo Full Preview" 
              style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px', objectFit: 'contain' }} 
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '30px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' },
  title: { fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text)', letterSpacing: '-0.2px' },
  statusPillsRow: { display: 'flex', gap: '4px' },
  pillBtn: {
    padding: '4px 8px',
    borderRadius: '8px',
    backgroundColor: 'var(--card-hover)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: '0.72rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  pillBtnActive: { backgroundColor: 'var(--accent-surface)', color: 'var(--accent)', borderColor: 'var(--accent)' },
  pillBtnActivePending: { backgroundColor: 'rgba(255, 214, 0, 0.15)', color: '#ffd600', borderColor: 'rgba(255, 214, 0, 0.3)' },
  pillBtnActiveReviewed: { backgroundColor: 'rgba(0, 200, 83, 0.15)', color: '#00c853', borderColor: 'rgba(0, 200, 83, 0.3)' },
  cardList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  masterCard: { 
    padding: '10px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px', 
    borderRadius: '10px',
    background: 'var(--card)',
    border: '1px solid var(--border)'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' },
  avatarCircle: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-surface)', color: 'var(--accent, #E00008)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 },
  clientName: { margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  dateTag: { fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' },
  planPill: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#00c853', fontWeight: 600 },
  statusBadge: { padding: '2px 6px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap' },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', backgroundColor: 'var(--card-hover)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' },
  miniStat: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1px' },
  miniStatVal: { fontSize: '0.75rem', fontWeight: 800, color: 'var(--text)' },
  miniStatLbl: { fontSize: '0.6rem', color: 'var(--text-secondary)' },
  innerBlock: { padding: '6px 8px', backgroundColor: 'var(--card-hover)', borderRadius: '8px', border: '1px solid var(--border)' },
  blockTitleRow: { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' },
  blockTitle: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text)' },
  exerciseList: { display: 'flex', flexDirection: 'column', gap: '2px' },
  exerciseRow: { display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 6px', borderRadius: '4px', border: '1px solid transparent' },
  mutedText: { fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' },
  photoStream: { display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' },
  photoThumbCard: { minWidth: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' },
  photoImg: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' },
  photoCaption: { fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' },
  actionRow: { display: 'flex', gap: '6px', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '6px' }
};
