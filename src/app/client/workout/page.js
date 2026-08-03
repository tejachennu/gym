'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientWorkoutPlan, getDailyLog, submitDailyLog } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { CheckCircle, Circle, Dumbbell } from 'lucide-react';

export default function WorkoutPlanPage() {
  const { user } = useAuth();
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const todayDateString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadData() {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const [plan, dailyLog] = await Promise.all([
          getClientWorkoutPlan(user.uid),
          getDailyLog(user.uid, todayDateString)
        ]);
        
        setWorkoutPlan(plan);
        if (dailyLog && dailyLog.completedExercises) {
          setCompletedExercises(dailyLog.completedExercises);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load workout data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, todayDateString]);

  const toggleExercise = (idx) => {
    setCompletedExercises(prev => {
      if (prev.includes(idx)) {
        return prev.filter(i => i !== idx);
      } else {
        return [...prev, idx];
      }
    });
  };

  const saveWorkoutLog = async () => {
    if (!user?.uid || !workoutPlan) return;
    try {
      setSaving(true);
      const allCompleted = completedExercises.length === workoutPlan.exercises.length;
      await submitDailyLog(user.uid, todayDateString, {
        completedExercises: completedExercises,
        workoutCompleted: allCompleted
      });
      toast.success('Workout progress saved!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spinner />
      </div>
    );
  }

  if (!workoutPlan || !workoutPlan.exercises || workoutPlan.exercises.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '12px', background: 'var(--card)', borderRadius: '10px', border: '1px solid var(--border)' }}>
        <Dumbbell size={32} color="var(--text-secondary)" style={{ marginBottom: '10px', opacity: 0.5 }} />
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>No Workout Plan</h3>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.8rem' }}>You don't have an active workout plan right now.</p>
      </div>
    );
  }

  const totalExercises = workoutPlan.exercises.length;
  const completedCount = completedExercises.length;
  const progressPercent = totalExercises === 0 ? 0 : Math.round((completedCount / totalExercises) * 100);
  const allCompleted = completedCount === totalExercises && totalExercises > 0;

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '80px' }}>
      
      {/* Workout Header */}
      <Card style={{ 
        padding: '12px', 
        background: 'rgba(255, 255, 255, 0.03)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '10px'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 'bold' }}>
            {workoutPlan.name || workoutPlan.title || 'Today\'s Workout'}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            {completedCount} of {totalExercises} completed
          </p>
        </div>
        <div style={{ position: 'relative', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="50" height="50" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="25" cy="25" r={radius}
              stroke="var(--border)"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="25" cy="25" r={radius}
              stroke={allCompleted ? '#00c853' : 'var(--accent)'}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.3s ease'
              }}
            />
          </svg>
          <div style={{ position: 'absolute', fontWeight: 'bold', fontSize: '0.75rem' }}>
            {progressPercent}%
          </div>
        </div>
      </Card>

      {/* Completion Celebration */}
      {allCompleted && (
        <div style={{
          background: 'linear-gradient(135deg, #00c853 0%, #1de9b6 100%)',
          padding: '12px',
          borderRadius: '10px',
          textAlign: 'center',
          color: '#000',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          boxShadow: '0 4px 16px rgba(0, 200, 83, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          🎉 Workout Complete! Great Job! 🎉
        </div>
      )}

      {/* Exercise Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {workoutPlan.exercises.map((ex, idx) => {
          const isCompleted = completedExercises.includes(idx);
          return (
            <Card key={idx} style={{ 
              padding: '12px', 
              display: 'flex', 
              flexDirection: 'column',
              gap: '10px',
              background: isCompleted ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${isCompleted ? 'rgba(0, 200, 83, 0.3)' : 'var(--border)'}`,
              borderRadius: '10px',
              opacity: isCompleted ? 0.6 : 1,
              transition: 'all 0.3s ease',
              transform: isCompleted ? 'scale(0.99)' : 'scale(1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '0.95rem', 
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    color: isCompleted ? 'var(--text-secondary)' : '#fff'
                  }}>
                    {ex.name}
                  </h3>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '3px 8px', borderRadius: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Sets: </span>
                      <strong>{ex.sets}</strong>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '3px 8px', borderRadius: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Reps: </span>
                      <strong>{ex.reps}</strong>
                    </div>
                    {ex.weight && (
                      <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '3px 8px', borderRadius: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Weight: </span>
                        <strong>{ex.weight}kg</strong>
                      </div>
                    )}
                  </div>
                  
                  {ex.notes && (
                    <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(224, 0, 8, 0.1)', borderLeft: '3px solid var(--accent)', borderRadius: '4px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                      <strong>Note:</strong> {ex.notes}
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => toggleExercise(idx)}
                  style={{ 
                    background: isCompleted ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 255, 255, 0.05)', 
                    border: `1px solid ${isCompleted ? '#00c853' : 'var(--border)'}`, 
                    borderRadius: '8px', 
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    color: isCompleted ? '#00c853' : 'var(--text-secondary)'
                  }}
                >
                  {isCompleted ? <CheckCircle size={20} /> : <Circle size={20} />}
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{ position: 'sticky', bottom: '12px', zIndex: 10, marginTop: '8px' }}>
        <Button 
          onClick={saveWorkoutLog} 
          disabled={saving}
          style={{ 
            width: '100%', 
            padding: '12px', 
            fontSize: '0.9rem', 
            fontWeight: 'bold',
            backgroundColor: allCompleted ? '#00c853' : 'var(--accent)', 
            color: 'white',
            borderRadius: '10px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
            border: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {saving ? <Spinner size={20} /> : 'Save Workout Progress'}
        </Button>
      </div>

    </div>
  );
}
