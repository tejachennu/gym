'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientDietPlans, getDailyLog, submitDailyLog } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { Calendar, Flame, CheckCircle2, Camera, Sparkles, Eye, Edit2, Trash2, X } from 'lucide-react';

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

export default function DietPlanPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // State for photo uploads & modal view
  const [uploadingPhotos, setUploadingPhotos] = useState({});
  const [uploadedPhotos, setUploadedPhotos] = useState({});
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState(null);

  const todayDateString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user?.uid) {
      Promise.all([
        getClientDietPlans(user.uid),
        getDailyLog(user.uid, todayDateString)
      ])
        .then(([plansData, dailyLog]) => {
          setPlans(plansData || []);
          if (dailyLog && dailyLog.mealPhotos) {
            setUploadedPhotos(dailyLog.mealPhotos || {});
          } else if (dailyLog && dailyLog.meals) {
            const photosMap = {};
            Object.keys(dailyLog.meals).forEach(slotId => {
              if (dailyLog.meals[slotId]?.imageUrl) {
                photosMap[slotId] = dailyLog.meals[slotId].imageUrl;
              }
            });
            setUploadedPhotos(photosMap);
          }
        })
        .catch(error => {
          console.error(error);
          if (toast?.error) {
            toast.error('Failed to load diet plans');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user, todayDateString]);

  const handlePhotoUpload = async (e, slotId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhotos(prev => ({ ...prev, [slotId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      if (data.success) {
        const updated = { ...uploadedPhotos, [slotId]: data.fileUrl };
        setUploadedPhotos(updated);

        // Persist to Firestore DailyLogs collection
        await submitDailyLog(user.uid, todayDateString, {
          mealPhotos: updated,
          dietCompleted: true,
          date: todayDateString
        });

        if (toast?.success) {
          toast.success('Meal photo saved!');
        }
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error(error);
      if (toast?.error) {
        toast.error('Failed to upload photo');
      }
    } finally {
      setUploadingPhotos(prev => ({ ...prev, [slotId]: false }));
    }
  };

  const handleDeletePhoto = async (slotId) => {
    try {
      const updated = { ...uploadedPhotos };
      delete updated[slotId];
      setUploadedPhotos(updated);

      await submitDailyLog(user.uid, todayDateString, {
        mealPhotos: updated,
        date: todayDateString
      });

      if (toast?.success) {
        toast.success('Photo deleted successfully');
      }
    } catch (error) {
      console.error(error);
      if (toast?.error) {
        toast.error('Failed to delete photo');
      }
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <Spinner />
    </div>
  );

  if (!plans || plans.length === 0) {
    return (
      <EmptyState 
        title="No Diet Plan Assigned" 
        message="Your trainer has not assigned an active diet plan yet. Check back soon!" 
        icon="🥗" 
      />
    );
  }

  const activePlan = plans[selectedPlanIndex] || plans[0];
  const totals = activePlan.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const mealsState = activePlan.mealsState || {};

  const calculateDays = (fromDate, toDate) => {
    if (!fromDate || !toDate) return null;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    if (isNaN(start) || isNaN(end)) return null;
    
    const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.round((today - start) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      total: totalDays > 0 ? totalDays : 0,
      current: Math.max(1, Math.min(currentDay, totalDays))
    };
  };

  const progress = calculateDays(activePlan.fromDate, activePlan.toDate);

  const MEAL_SLOTS = [
    { id: 'breakfast', name: 'Breakfast', icon: '🍳', accent: '#ffb300' },
    { id: 'preWorkout', name: 'Pre Workout', icon: '⚡', accent: '#ff5252' },
    { id: 'postWorkout', name: 'Post Workout', icon: '🥤', accent: '#448aff' },
    { id: 'lunch', name: 'Lunch', icon: '🥗', accent: '#00c853' },
    { id: 'dinner', name: 'Dinner', icon: '🍲', accent: '#b388ff' },
  ];

  const planProgressPercent = progress && progress.total > 0 ? Math.min(100, Math.max(0, Math.round((progress.current / progress.total) * 100))) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '85px' }} className="animate-fade-up">
      
      {/* Unified Single Top Dashboard Card */}
      <div style={{ 
        padding: '16px', 
        background: 'linear-gradient(145deg, rgba(224, 0, 8, 0.14) 0%, rgba(18, 18, 20, 0.85) 100%)', 
        borderRadius: '18px', 
        border: '1px solid rgba(224, 0, 8, 0.25)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Header Row: Title + Progress Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--accent, #E00008)" />
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
                {activePlan.planTitle || 'My Diet Plan'}
              </h1>
            </div>
            {activePlan.fromDate && activePlan.toDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '4px' }}>
                <Calendar size={12} color="var(--accent, #E00008)" />
                <span>{activePlan.fromDate} — {activePlan.toDate}</span>
              </div>
            )}
          </div>

          {progress && (
            <div style={{ 
              background: 'rgba(224, 0, 8, 0.18)', 
              padding: '6px 12px', 
              borderRadius: '20px', 
              border: '1px solid rgba(224, 0, 8, 0.35)',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#FFFFFF'
            }}>
              Day <span style={{ color: 'var(--accent, #E00008)' }}>{progress.current}</span> / {progress.total}
            </div>
          )}
        </div>

        {/* Plan Progress Bar */}
        {progress && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              <span>Plan Completion</span>
              <span style={{ fontWeight: 700, color: 'var(--accent, #E00008)' }}>{planProgressPercent}%</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${planProgressPercent}%`, 
                height: '100%', 
                backgroundColor: 'var(--accent, #E00008)',
                borderRadius: '10px',
                transition: 'width 1s ease-in-out',
                boxShadow: '0 0 10px rgba(224, 0, 8, 0.6)'
              }} />
            </div>
          </div>
        )}

        {/* Subtle Divider */}
        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '2px 0' }} />

        {/* 4 Macro Columns Integrated Inline */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
          <div style={{ textAlign: 'center', padding: '4px 2px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
              <Flame size={13} color="#ff5252" /> {totals.calories}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kcal</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '4px 2px', borderLeft: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#448aff' }}>{totals.protein}g</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Protein</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '4px 2px', borderLeft: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffb300' }}>{totals.carbs}g</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Carbs</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '4px 2px', borderLeft: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b388ff' }}>{totals.fat}g</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fat</div>
          </div>
        </div>
      </div>

      {/* Multiple Diets Tab Switcher (if > 1 plan) */}
      {plans.length > 1 && (
        <div style={styles.planSelectorRow}>
          {plans.map((p, idx) => (
            <button
              key={p.id || idx}
              onClick={() => setSelectedPlanIndex(idx)}
              style={{
                ...styles.planPill,
                ...(selectedPlanIndex === idx ? styles.planPillActive : {})
              }}
            >
              <span>{p.planTitle || `Phase ${idx + 1}`}</span>
              <Badge variant={p.status === 'active' ? 'success' : 'secondary'} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                {p.status || 'active'}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* Meals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {MEAL_SLOTS.map((slot) => {
          const slotData = mealsState[slot.id] || {};
          const foods = slotData.foods || [];
          const slotCalories = foods.reduce((acc, f) => acc + (parseFloat(f.calories) || 0), 0);
          const photoUrl = uploadedPhotos[slot.id];
          const hasUploadedPhoto = !!photoUrl;
          const isUploading = uploadingPhotos[slot.id];

          return (
            <div 
              key={slot.id} 
              style={{ 
                padding: '14px', 
                borderRadius: '14px', 
                background: 'rgba(18, 18, 20, 0.75)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderLeft: `3px solid ${slot.accent}`,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
              }}
            >
              {/* Meal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1rem' }}>{slot.icon}</span>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#FFFFFF', fontWeight: 700, letterSpacing: '-0.2px' }}>{slot.name}</h3>
                </div>
                
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {slotCalories} Kcal
                </div>
              </div>

              {/* Foods List */}
              {foods.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {foods.map((food, fIdx) => (
                    <div key={fIdx} style={styles.foodRow}>
                      <div style={{ flex: 1, minWidth: '110px' }}>
                        <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.88rem' }}>
                          {food.name} <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 400 }}>({food.qty})</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {food.calories > 0 && <span style={styles.macroBadgeItem}>{food.calories} kcal</span>}
                        {food.protein > 0 && <span style={{ ...styles.macroBadgeItem, color: '#ff5252', backgroundColor: 'rgba(255, 82, 82, 0.12)' }}>P: {food.protein}g</span>}
                        {food.carbs > 0 && <span style={{ ...styles.macroBadgeItem, color: '#448aff', backgroundColor: 'rgba(68, 138, 255, 0.12)' }}>C: {food.carbs}g</span>}
                        {food.fat > 0 && <span style={{ ...styles.macroBadgeItem, color: '#ffb300', backgroundColor: 'rgba(255, 179, 0, 0.12)' }}>F: {food.fat}g</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '10px', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                  No food logged for this slot
                </div>
              )}

              {/* Trainer Instructions */}
              {slotData.instructions && (
                <div style={{ marginTop: '10px', padding: '10px 12px', backgroundColor: 'rgba(68, 138, 255, 0.06)', borderLeft: '2px solid #448aff', borderRadius: '6px', fontSize: '0.78rem', color: '#e2e8f0', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.9rem' }}>💡</span>
                  <div>
                    <strong style={{ color: '#448aff', display: 'inline-block', marginRight: '4px' }}>Note:</strong>
                    <span style={{ lineHeight: '1.4' }}>{slotData.instructions}</span>
                  </div>
                </div>
              )}

              {/* Photo Upload / View / Edit / Delete Section */}
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {hasUploadedPhoto ? (
                  <>
                    {/* Image Thumbnail & View controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img 
                        src={getDirectImageUrl(photoUrl)} 
                        alt={`${slot.name} Meal`}
                        onClick={() => setViewingPhotoUrl(photoUrl)}
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '8px', 
                          objectFit: 'cover', 
                          cursor: 'pointer',
                          border: '1px solid rgba(0, 200, 83, 0.4)',
                          boxShadow: '0 2px 8px rgba(0, 200, 83, 0.2)'
                        }} 
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: '#00c853', fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} color="#00c853" /> Photo Uploaded
                        </span>
                        <span style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.68rem' }}>Tap image to view</span>
                      </div>
                    </div>

                    {/* Controls: View, Edit, Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => setViewingPhotoUrl(photoUrl)}
                        title="View Photo"
                        style={styles.actionIconButton}
                      >
                        <Eye size={13} color="#FFFFFF" />
                      </button>

                      {/* Edit / Re-upload input */}
                      <input 
                        type="file" 
                        accept="image/*" 
                        id={`edit-photo-${slot.id}`} 
                        style={{ display: 'none' }}
                        onChange={(e) => handlePhotoUpload(e, slot.id)}
                        disabled={isUploading}
                      />
                      <label 
                        htmlFor={`edit-photo-${slot.id}`}
                        title="Edit / Replace Photo"
                        style={{ ...styles.actionIconButton, cursor: isUploading ? 'not-allowed' : 'pointer' }}
                      >
                        {isUploading ? <Spinner /> : <Edit2 size={13} color="#ffb300" />}
                      </label>

                      <button
                        onClick={() => handleDeletePhoto(slot.id)}
                        title="Delete Photo"
                        style={{ ...styles.actionIconButton, borderColor: 'rgba(224, 0, 8, 0.3)', backgroundColor: 'rgba(224, 0, 8, 0.1)' }}
                      >
                        <Trash2 size={13} color="#ff5252" />
                      </button>
                    </div>
                  </>
                ) : (
                  /* Initial Upload Button (Per day 1 time) */
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      id={`photo-upload-${slot.id}`} 
                      style={{ display: 'none' }}
                      onChange={(e) => handlePhotoUpload(e, slot.id)}
                      disabled={isUploading}
                    />
                    <label 
                      htmlFor={`photo-upload-${slot.id}`}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        padding: '6px 12px', 
                        backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '16px',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: isUploading ? 0.7 : 1
                      }}
                      onMouseOver={(e) => {
                        if (!isUploading) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseOut={(e) => {
                        if (!isUploading) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      }}
                    >
                      {isUploading ? <Spinner /> : <Camera size={13} />}
                      {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Full Size Photo Preview */}
      <Modal
        isOpen={!!viewingPhotoUrl}
        onClose={() => setViewingPhotoUrl(null)}
        title="Meal Photo Preview"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {viewingPhotoUrl && (
            <img 
              src={getDirectImageUrl(viewingPhotoUrl)} 
              alt="Meal Photo Full Preview"
              style={{ 
                maxWidth: '100%', 
                maxHeight: '70vh', 
                borderRadius: '12px', 
                objectFit: 'contain',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)' 
              }} 
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

const styles = {
  planSelectorRow: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  planPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '16px',
    backgroundColor: 'rgba(18, 18, 20, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  },
  planPillActive: {
    borderColor: 'var(--accent, #E00008)',
    color: '#FFFFFF',
    fontWeight: 600,
    backgroundColor: 'rgba(224, 0, 8, 0.12)',
  },
  foodRow: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    flexWrap: 'wrap',
    gap: '6px',
  },
  macroBadgeItem: {
    fontSize: '0.68rem',
    fontWeight: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    padding: '2px 6px',
    borderRadius: '6px',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  actionIconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }
};
