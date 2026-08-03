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
  CheckCircle2, 
  Clock, 
  Eye, 
  Search, 
  Dumbbell, 
  Utensils, 
  Camera, 
  CheckSquare, 
  Square,
  Sparkles,
  MessageSquare,
  Filter,
  Layers
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
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'reviewed'
  const [dateFilter, setDateFilter] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [masterCards, setMasterCards] = useState([]);
  const [remarksMap, setRemarksMap] = useState({});
  const [reviewingMap, setReviewingMap] = useState({});
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState(null);

  // Pagination State
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

      // Load active workout plans for each client
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

      // Group all submissions by `clientId_date`
      const cardGroupMap = {};

      // 1. Ingest Daily Logs
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

      // 2. Ingest Body Check-ins
      checkinsList.forEach(chk => {
        const cId = chk.clientId;
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

      // 3. Convert to Array and Attach Workout Plan data
      const masterList = Object.values(cardGroupMap).map(card => {
        const wPlan = workoutPlanMap[card.clientId] || null;
        return {
          ...card,
          workoutPlan: wPlan
        };
      });

      // Sort newest first
      masterList.sort((a, b) => b.timestamp - a.timestamp);

      setMasterCards(masterList);

      // Pre-fill remarks
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
      toast.success(`Daily log for ${card.clientName} reviewed!`);
      await fetchMasterDailyFeed();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save review status');
    } finally {
      setReviewingMap(prev => ({ ...prev, [card.id]: false }));
    }
  };

  // Filtered Cards
  const filteredCards = masterCards.filter(card => {
    if (statusFilter === 'pending' && card.reviewed) return false;
    if (statusFilter === 'reviewed' && !card.reviewed) return false;
    if (dateFilter && card.date !== dateFilter) return false;

    if (search) {
      const q = search.toLowerCase();
      const nameMatch = card.clientName.toLowerCase().includes(q);
      const dateMatch = card.date.toLowerCase().includes(q);
      if (!nameMatch && !dateMatch) return false;
    }

    return true;
  });

  // Pagination Slice
  const totalItems = filteredCards.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCards = filteredCards.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div style={styles.container} className="animate-fade-up">
      {/* Sleek Compact Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="var(--accent, #E00008)" />
          <h1 style={styles.title}>Daily Client Monitoring</h1>
        </div>

        {/* Compact Status Pill Filter */}
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

      {/* Compact Search & Date Bar */}
      <div style={styles.controlsBar}>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <Input 
            placeholder="Search client or date..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            icon={<Search size={14} />}
            style={{ fontSize: '0.8rem', padding: '6px 8px' }}
          />
        </div>

        <Input 
          type="date" 
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
          style={{ width: '130px', fontSize: '0.78rem', padding: '6px 6px' }}
        />

        {(dateFilter || search) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setDateFilter(''); setSearch(''); setCurrentPage(1); }}
            style={{ fontSize: '0.72rem', padding: '4px 6px' }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Main Single Master Cards List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <Spinner />
        </div>
      ) : paginatedCards.length === 0 ? (
        <EmptyState 
          title="No Logs Found" 
          message="No daily client logs match your search or filters." 
          icon="📱"
        />
      ) : (
        <div style={styles.cardList}>
          {paginatedCards.map(card => {
            const { dailyLog, checkin, workoutPlan, reviewed, clientName, date: cardDate, id: cardId } = card;

            // Workout stats calculation
            const completedExerciseIndices = dailyLog?.completedExercises || [];
            const workoutPlanTitle = workoutPlan?.title || workoutPlan?.planName || dailyLog?.workoutPlanTitle || 'Workout Plan';
            const totalExercises = workoutPlan?.exercises?.length || 0;
            const completedCount = completedExerciseIndices.length;
            const workoutProgress = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : (dailyLog?.workoutCompleted ? 100 : 0);

            // Meal photos map
            const mealPhotosMap = dailyLog?.mealPhotos || {};
            const mealSlotKeys = Object.keys(mealPhotosMap);

            return (
              <div key={cardId} style={styles.masterCard} className="glass-card">
                
                {/* 1. Header Row */}
                <div style={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    {/* Avatar */}
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

                  {/* Status Pill */}
                  <span style={{
                    ...styles.statusBadge, 
                    backgroundColor: reviewed ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 214, 0, 0.15)',
                    border: `1px solid ${reviewed ? 'rgba(0, 200, 83, 0.3)' : 'rgba(255, 214, 0, 0.3)'}`,
                    color: reviewed ? '#00c853' : '#ffd600',
                  }}>
                    {reviewed ? '✓ Reviewed' : '⏳ Pending'}
                  </span>
                </div>

                {/* 2. Compact Activity & Health Summary */}
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

                {/* 3. Workout Tracker Section */}
                <div style={styles.innerBlock}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={styles.blockTitleRow}>
                      <Dumbbell size={13} color="#00c853" />
                      <span style={styles.blockTitle}>Workout Progress</span>
                    </div>

                    {totalExercises > 0 && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: workoutProgress === 100 ? '#00c853' : 'var(--accent, #E00008)' }}>
                        {completedCount}/{totalExercises} Done ({workoutProgress}%)
                      </span>
                    )}
                  </div>

                  {totalExercises > 0 && (
                    <div style={{ height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${workoutProgress}%`,
                        backgroundColor: workoutProgress === 100 ? '#00c853' : 'var(--accent, #E00008)',
                        borderRadius: '10px',
                        transition: 'width 0.5s ease'
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
                            backgroundColor: isDone ? 'rgba(0, 200, 83, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            borderColor: isDone ? 'rgba(0, 200, 83, 0.25)' : 'rgba(255, 255, 255, 0.06)'
                          }}>
                            {isDone ? <CheckSquare size={13} color="#00c853" /> : <Square size={13} color="var(--text-secondary)" />}
                            <span style={{ fontSize: '0.78rem', color: isDone ? '#FFFFFF' : 'var(--text-secondary)', fontWeight: isDone ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {ex.name || `Exercise ${idx + 1}`}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
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

                {/* 4. Diet & Meal Photos */}
                <div style={styles.innerBlock}>
                  <div style={styles.blockTitleRow}>
                    <Utensils size={13} color="#ff9100" />
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

                {/* 5. Body Check-in (If available today) */}
                {checkin && (
                  <div style={styles.innerBlock}>
                    <div style={styles.blockTitleRow}>
                      <Camera size={13} color="#ab47bc" />
                      <span style={styles.blockTitle}>10-Day Body Posture Check-in</span>
                    </div>

                    {checkin.measurements && (
                      <div style={styles.measurePillRow}>
                        {checkin.measurements.weight && <span style={styles.measureTag}>Weight: {checkin.measurements.weight}kg</span>}
                        {checkin.measurements.waist && <span style={styles.measureTag}>Waist: {checkin.measurements.waist}"</span>}
                        {checkin.measurements.chest && <span style={styles.measureTag}>Chest: {checkin.measurements.chest}"</span>}
                      </div>
                    )}

                    {(checkin.photos || checkin.photoFront) && (
                      <div style={styles.photoGrid}>
                        {['front', 'back', 'left', 'right'].map(side => {
                          const rawUrl = checkin.photos?.[side] || checkin[`photo${side.charAt(0).toUpperCase() + side.slice(1)}`];
                          if (!rawUrl) return null;
                          const imgUrl = getDirectImageUrl(rawUrl);
                          return (
                            <div key={side} style={styles.photoThumbCard} onClick={() => setViewingPhotoUrl(imgUrl)}>
                              <img src={imgUrl} alt={side} style={styles.photoImg} />
                              <div style={styles.photoCaption}>{side.toUpperCase()}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Client Remarks */}
                {(dailyLog?.dailyNotes || dailyLog?.notes || checkin?.notes) && (
                  <div style={styles.notesBox}>
                    <MessageSquare size={13} color="var(--accent, #E00008)" />
                    <span style={{ fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.78rem' }}>
                      "{dailyLog?.dailyNotes || dailyLog?.notes || checkin?.notes}"
                    </span>
                  </div>
                )}

                {/* 7. Trainer Review Action Footer */}
                <div style={styles.actionRow}>
                  <Input 
                    placeholder="Trainer review remarks..." 
                    value={remarksMap[cardId] || ''} 
                    onChange={(e) => setRemarksMap({ ...remarksMap, [cardId]: e.target.value })}
                    style={{ flex: 1, fontSize: '0.8rem', padding: '6px 8px' }} 
                  />
                  <Button 
                    onClick={() => handleReviewCard(card)}
                    loading={reviewingMap[cardId]}
                    size="sm"
                    style={{
                      backgroundColor: reviewed ? 'rgba(0, 200, 83, 0.15)' : 'var(--accent, #E00008)',
                      color: reviewed ? '#00c853' : '#FFFFFF',
                      border: reviewed ? '1px solid rgba(0, 200, 83, 0.3)' : 'none',
                      whiteSpace: 'nowrap',
                      fontSize: '0.8rem'
                    }}
                  >
                    {reviewed ? '✓ Reviewed' : 'Review'}
                  </Button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
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

      {/* Photo Full-Screen Modal Preview */}
      {viewingPhotoUrl && (
        <Modal isOpen={!!viewingPhotoUrl} onClose={() => setViewingPhotoUrl(null)} title="Photo Full View" size="md">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
            <img 
              src={viewingPhotoUrl} 
              alt="Photo Full Preview" 
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '12px', objectFit: 'contain' }} 
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' },
  title: { fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.2px' },
  statusPillsRow: { display: 'flex', gap: '4px' },
  pillBtn: {
    padding: '4px 10px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'var(--text-secondary, #AAAAAA)',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  pillBtnActive: { backgroundColor: 'rgba(255, 255, 255, 0.12)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.25)' },
  pillBtnActivePending: { backgroundColor: 'rgba(255, 214, 0, 0.15)', color: '#ffd600', borderColor: 'rgba(255, 214, 0, 0.3)' },
  pillBtnActiveReviewed: { backgroundColor: 'rgba(0, 200, 83, 0.15)', color: '#00c853', borderColor: 'rgba(0, 200, 83, 0.3)' },
  controlsBar: { display: 'flex', gap: '6px', alignItems: 'center' },
  cardList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  masterCard: { 
    padding: '12px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px', 
    borderRadius: '14px',
    background: 'rgba(18, 18, 20, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.07)'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' },
  avatarCircle: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(224, 0, 8, 0.15)', color: 'var(--accent, #E00008)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', border: '1px solid rgba(224, 0, 8, 0.3)', flexShrink: 0 },
  clientName: { margin: 0, fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  dateTag: { fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.55)', fontWeight: 500, whiteSpace: 'nowrap' },
  planPill: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: '#00c853', fontWeight: 600, marginTop: '1px' },
  statusBadge: { padding: '3px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '6px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' },
  miniStat: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1px' },
  miniStatVal: { fontSize: '0.78rem', fontWeight: 800, color: '#FFFFFF' },
  miniStatLbl: { fontSize: '0.62rem', color: 'var(--text-secondary, #AAAAAA)' },
  innerBlock: { padding: '8px 10px', backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' },
  blockTitleRow: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' },
  blockTitle: { fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF' },
  exerciseList: { display: 'flex', flexDirection: 'column', gap: '4px' },
  exerciseRow: { display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '6px', border: '1px solid transparent' },
  mutedText: { fontSize: '0.75rem', color: 'var(--text-secondary, #AAAAAA)', fontStyle: 'italic' },
  photoStream: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' },
  photoThumbCard: { minWidth: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' },
  photoImg: { width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' },
  photoCaption: { fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary, #AAAAAA)', textAlign: 'center' },
  measurePillRow: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' },
  measureTag: { fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.85)', padding: '2px 6px', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '4px' },
  notesBox: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent, #E00008)' },
  actionRow: { display: 'flex', gap: '6px', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }
};
