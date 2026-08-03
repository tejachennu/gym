'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientById, getDailyLog, getClientCheckins } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Loading';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Droplets, Moon, Zap, Smile, Heart, TrendingUp, Calendar, ArrowRight, ActivitySquare, CheckCircle2, Circle } from 'lucide-react';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      const todayDateString = new Date().toISOString().split('T')[0];
      
      Promise.all([
        getClientById(user.uid),
        getDailyLog(user.uid, todayDateString),
        getClientCheckins(user.uid)
      ]).then(([profileData, logData, checkinsData]) => {
        setProfile(profileData);
        setTodayLog(logData);
        setCheckins(checkinsData || []);
      }).catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <Spinner />
    </div>
  );

  // 1. Active Plan calculations
  const hasPlan = profile?.currentPlan && profile?.planStart && profile?.planExpiry;
  let daysRemaining = 0;
  let currentWeek = 0;
  let totalWeeks = 0;
  let progressPercentage = 0;
  
  if (hasPlan) {
    const start = profile.planStart.toDate ? profile.planStart.toDate() : new Date(profile.planStart);
    const end = profile.planExpiry.toDate ? profile.planExpiry.toDate() : new Date(profile.planExpiry);
    const today = new Date();
    
    const diffTime = end - today;
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    totalWeeks = Math.ceil(totalDays / 7);
    
    const daysElapsed = Math.max(0, Math.ceil((today - start) / (1000 * 60 * 60 * 24)));
    currentWeek = Math.min(totalWeeks, Math.ceil(daysElapsed / 7));
    
    progressPercentage = totalDays > 0 ? Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100)) : 0;
  }

  // Activity calculations
  const steps = todayLog?.steps || 0;
  const stepsTarget = 10000;
  const stepsPercent = Math.min(100, (steps / stepsTarget) * 100);
  
  const water = todayLog?.water || 0;
  const waterTarget = 3;
  const waterPercent = Math.min(100, (water / waterTarget) * 100);

  const sleepHours = todayLog?.sleepHours || 0;

  // Chart Data
  const chartData = [...checkins]
    .sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateA - dateB;
    })
    .slice(-7)
    .map(c => {
      const date = c.date?.toDate ? c.date.toDate() : new Date(c.date);
      return {
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        weight: parseFloat(c.weight || c.measurements?.weight || 0)
      };
    });

  const latestWeight = chartData.length > 0 ? chartData[chartData.length - 1].weight : '--';

  // Task completion calculation for Today's Tasks
  const isDietDone = !!(todayLog?.mealPhotos && Object.keys(todayLog.mealPhotos).length > 0);
  const isWorkoutDone = !!todayLog?.workoutCompleted;
  const isTrackingDone = !!(todayLog?.steps || todayLog?.water || todayLog?.sleepHours || todayLog?.dailyNotes);

  const completedTasksCount = (isDietDone ? 1 : 0) + (isWorkoutDone ? 1 : 0) + (isTrackingDone ? 1 : 0);
  const tasksPercent = Math.round((completedTasksCount / 3) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '80px' }}>
      
      {/* 1. Active Plan Banner */}
      <section>
        {hasPlan ? (
          <Card style={{ 
            padding: '14px', 
            background: 'linear-gradient(145deg, rgba(224, 0, 8, 0.1) 0%, rgba(20, 20, 24, 0.8) 100%)',
            border: '1px solid rgba(224, 0, 8, 0.2)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '12px'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 'bold' }}>{profile.currentPlan}</h2>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Badge style={{ backgroundColor: 'rgba(0, 200, 83, 0.15)', color: 'var(--success)', fontSize: '0.7rem', padding: '2px 6px' }}>
                      Active
                    </Badge>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> Week {currentWeek} of {totalWeeks}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent)', lineHeight: '1' }}>
                    {daysRemaining}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                    Days Left
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Plan Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div style={{ height: '4px', backgroundColor: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${progressPercentage}%`, 
                    height: '100%', 
                    backgroundColor: 'var(--accent)',
                    borderRadius: '10px',
                    transition: 'width 1s ease-in-out',
                    boxShadow: '0 0 10px rgba(224, 0, 8, 0.5)'
                  }} />
                </div>
              </div>
            </div>
            
            <div style={{ 
              position: 'absolute', 
              top: '-50px', 
              right: '-20px', 
              width: '100px', 
              height: '100px', 
              background: 'radial-gradient(circle, rgba(224,0,8,0.15) 0%, rgba(0,0,0,0) 70%)',
              zIndex: 0
            }} />
          </Card>
        ) : (
          <Card style={{ padding: '14px', textAlign: 'center', background: 'var(--card)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
              <ActivitySquare size={16} color="var(--text-secondary)" />
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '0.95rem' }}>No Active Plan</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              You don't have an active plan assigned right now.
            </p>
          </Card>
        )}
      </section>

      {/* 2. Today's Tasks */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            Today's Tasks
          </h3>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: tasksPercent === 100 ? '#00c853' : 'var(--accent)' }}>
            {tasksPercent}% Completed
          </span>
        </div>

        {/* Task Completion Progress Bar */}
        <div style={{ height: '6px', backgroundColor: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${tasksPercent}%`, 
            height: '100%', 
            backgroundColor: tasksPercent === 100 ? '#00c853' : 'var(--accent)',
            borderRadius: '10px',
            transition: 'width 0.8s ease-in-out',
            boxShadow: tasksPercent === 100 ? '0 0 10px rgba(0, 200, 83, 0.6)' : '0 0 10px rgba(224, 0, 8, 0.5)'
          }} />
        </div>

        {/* 3-Column Task Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <Link href="/client/diet" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card style={{ 
              padding: '10px', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              textAlign: 'center',
              gap: '6px',
              borderRadius: '12px'
            }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '8px', 
                backgroundColor: isDietDone ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: '14px' }}>🥗</span>
              </div>
              <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                <div style={{ fontWeight: '600', fontSize: '0.78rem', marginBottom: '2px' }}>Diet</div>
                <div style={{ fontSize: '0.7rem', color: isDietDone ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  {isDietDone ? <CheckCircle2 size={12} color="var(--success)" /> : <Circle size={12} color="var(--warning)" />}
                  {isDietDone ? 'Done' : 'Pending'}
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/client/workout" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card style={{ 
              padding: '10px', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              textAlign: 'center',
              gap: '6px',
              borderRadius: '12px'
            }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '8px', 
                backgroundColor: isWorkoutDone ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: '14px' }}>💪</span>
              </div>
              <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                <div style={{ fontWeight: '600', fontSize: '0.78rem', marginBottom: '2px' }}>Workout</div>
                <div style={{ fontSize: '0.7rem', color: isWorkoutDone ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  {isWorkoutDone ? <CheckCircle2 size={12} color="var(--success)" /> : <Circle size={12} color="var(--warning)" />}
                  {isWorkoutDone ? 'Done' : 'Pending'}
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/client/daily-log" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card style={{ 
              padding: '10px', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              textAlign: 'center',
              gap: '6px',
              borderRadius: '12px'
            }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '8px', 
                backgroundColor: isTrackingDone ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: '14px' }}>📝</span>
              </div>
              <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                <div style={{ fontWeight: '600', fontSize: '0.78rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Tracking</div>
                <div style={{ fontSize: '0.7rem', color: isTrackingDone ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  {isTrackingDone ? <CheckCircle2 size={12} color="var(--success)" /> : <Circle size={12} color="var(--warning)" />}
                  {isTrackingDone ? 'Done' : 'Pending'}
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* 3. Activity Section */}
      <section>
        <Card style={{ padding: '14px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={16} color="var(--accent)" /> Daily Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Steps */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>👣</span>
                  <span style={{ fontSize: '0.8rem' }}>Steps</span>
                </div>
                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 'bold' }}>{steps}</span> <span style={{ color: 'var(--text-secondary)' }}>/ {stepsTarget}</span>
                </div>
              </div>
              <div style={{ height: '4px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${stepsPercent}%`, height: '100%', backgroundColor: '#4dabf7', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Water */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Droplets size={14} color="#4dabf7" />
                  <span style={{ fontSize: '0.8rem' }}>Water</span>
                </div>
                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 'bold' }}>{water}L</span> <span style={{ color: 'var(--text-secondary)' }}>/ {waterTarget}L</span>
                </div>
              </div>
              <div style={{ height: '4px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${waterPercent}%`, height: '100%', backgroundColor: '#4dabf7', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Sleep */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Moon size={14} color="#9775fa" />
                  <span style={{ fontSize: '0.8rem' }}>Sleep</span>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {sleepHours} <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>h</span>
                </div>
              </div>
            </div>

          </div>
        </Card>
      </section>

      {/* 4. Wellness Section */}
      <section>
        <Card style={{ padding: '14px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Heart size={16} color="#ff8787" /> Wellness
          </h3>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
            
            <div style={{ flex: '1', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={12} /> Energy
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ 
                  width: '6px', height: '6px', borderRadius: '50%', 
                  backgroundColor: todayLog?.energyLevel === 'High' ? 'var(--success)' : todayLog?.energyLevel === 'Medium' ? 'var(--warning)' : '#ff6b6b' 
                }} />
                <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>{todayLog?.energyLevel || '--'}</span>
              </div>
            </div>

            <div style={{ flex: '1', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Smile size={12} /> Mood
              </div>
              <div style={{ fontWeight: '500', fontSize: '0.85rem' }}>
                {todayLog?.mood ? `${todayLog.mood}` : '--'}
              </div>
            </div>

            <div style={{ flex: '1', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Moon size={12} /> Quality
              </div>
              <div style={{ fontWeight: '500', fontSize: '0.85rem' }}>
                {todayLog?.sleepQuality || '--'}
              </div>
            </div>

          </div>
        </Card>
      </section>

      {/* 5. Mini Weight Trend Chart */}
      <section>
        <Card style={{ padding: '14px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} color="var(--accent)" /> Weight Trend
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{latestWeight} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>kg</span></div>
            </div>
          </div>
          
          <div style={{ height: '150px', width: '100%', marginLeft: '-20px' }}>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '10px', padding: '6px' }}
                    itemStyle={{ color: 'var(--accent)' }}
                  />
                  <Area type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Not enough data
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* 6. Quick Actions */}
      <section>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '10px' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <Link href="/client/daily-log" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s', cursor: 'pointer', textAlign: 'center'
            }}>
              <span style={{ fontSize: '16px' }}>📝</span>
              <div style={{ fontWeight: '500', fontSize: '0.75rem' }}>Log Day</div>
            </div>
          </Link>
          
          <Link href="/client/checkin" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(224,0,8,0.1) 0%, rgba(255,255,255,0.01) 100%)',
              border: '1px solid rgba(224,0,8,0.2)',
              borderRadius: '12px', padding: '10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s', cursor: 'pointer', textAlign: 'center'
            }}>
              <span style={{ fontSize: '16px' }}>📸</span>
              <div style={{ fontWeight: '500', fontSize: '0.75rem' }}>Check-in</div>
            </div>
          </Link>

          <Link href="/client/history" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s', cursor: 'pointer', textAlign: 'center'
            }}>
              <span style={{ fontSize: '16px' }}>📊</span>
              <div style={{ fontWeight: '500', fontSize: '0.75rem' }}>History</div>
            </div>
          </Link>
        </div>
      </section>

    </div>
  );
}
