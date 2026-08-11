'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientById, getDailyLog, getClientCheckins, getPlans, getClientPlans, getDocuments } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Loading';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { 
  Activity, 
  Droplets, 
  Moon, 
  Zap, 
  Smile, 
  Heart, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Circle,
  Dumbbell,
  Utensils,
  Camera,
  Flame,
  MessageCircle,
  PlusCircle,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  Layers,
  History,
  ActivitySquare,
  ExternalLink,
  Bell
} from 'lucide-react';

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

export default function ClientDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [masterPlans, setMasterPlans] = useState([]);
  const [clientPlansHistory, setClientPlansHistory] = useState([]);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [allUserLogs, setAllUserLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      const todayDateString = new Date().toISOString().split('T')[0];
      
      Promise.all([
        getClientById(user.uid),
        getDailyLog(user.uid, todayDateString),
        getClientCheckins(user.uid),
        getPlans(),
        getClientPlans(user.uid),
        getDocuments('Notifications'),
        getDocuments('DailyLogs')
      ]).then(([profileData, logData, checkinsData, plansData, cPlansData, notifsData, allLogsData]) => {
        setProfile(profileData);
        setTodayLog(logData);
        setCheckins(checkinsData || []);
        setMasterPlans(plansData || []);
        
        const myLogs = (allLogsData || []).filter(l => l.clientId === user.uid);
        setAllUserLogs(myLogs);

        const clientNotifs = (notifsData || []).filter(n => n.recipient === 'all' || n.recipient === user.uid);
        clientNotifs.sort((a, b) => new Date(b.sentAt || b.createdAt) - new Date(a.sentAt || a.createdAt));
        setNotifications(clientNotifs);

        // Combine profile.planHistory and cPlansData
        let combinedPlans = profileData?.planHistory || [];
        if (combinedPlans.length === 0 && cPlansData?.length > 0) {
          combinedPlans = cPlansData;
        } else if (combinedPlans.length === 0 && profileData?.currentPlan) {
          combinedPlans = [{
            id: 'current',
            planName: profileData.currentPlan,
            planStart: profileData.planStart,
            planExpiry: profileData.planExpiry,
            status: 'active',
            planFeatures: profileData.planFeatures
          }];
        }

        // Merge any extra cPlansData items not already present
        if (cPlansData?.length > 0) {
          cPlansData.forEach(cp => {
            const exists = combinedPlans.some(p => p.planName === cp.planName && p.planStart === cp.planStart);
            if (!exists) {
              combinedPlans.push(cp);
            }
          });
        }

        setClientPlansHistory(combinedPlans);
      }).catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <Spinner />
    </div>
  );

  // Active or Selected Plan Data
  const currentSelectedPlan = clientPlansHistory[selectedPlanIndex] || (profile?.currentPlan ? {
    planName: profile.currentPlan,
    planStart: profile.planStart,
    planExpiry: profile.planExpiry,
    status: 'active',
    planFeatures: profile.planFeatures
  } : null);

  const isViewingPastPlan = selectedPlanIndex > 0;
  const hasPlan = !!currentSelectedPlan?.planName;

  let daysRemaining = 0;
  let currentWeek = 0;
  let totalWeeks = 0;
  let progressPercentage = 0;
  
  if (hasPlan && currentSelectedPlan.planStart && currentSelectedPlan.planExpiry) {
    const start = currentSelectedPlan.planStart.toDate ? currentSelectedPlan.planStart.toDate() : new Date(currentSelectedPlan.planStart);
    const end = currentSelectedPlan.planExpiry.toDate ? currentSelectedPlan.planExpiry.toDate() : new Date(currentSelectedPlan.planExpiry);
    const today = new Date();
    
    const diffTime = end - today;
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    totalWeeks = Math.ceil(totalDays / 7);
    
    const daysElapsed = Math.max(0, Math.ceil((today - start) / (1000 * 60 * 60 * 24)));
    currentWeek = Math.min(totalWeeks, Math.ceil(daysElapsed / 7));
    
    progressPercentage = totalDays > 0 ? Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100)) : 0;
  }

  // Strict Posture Feature Verification for Selected Plan
  const hasPostureCheckin = (() => {
    if (!hasPlan) return false;
    
    const feats = currentSelectedPlan?.planFeatures || profile?.planFeatures;
    if (feats && typeof feats.hasPostureCheckin === 'boolean') {
      return feats.hasPostureCheckin === true;
    }

    const clientPlanName = (currentSelectedPlan?.planName || profile?.currentPlan || '').toLowerCase();
    const matchedPlan = (masterPlans || []).find(mp => {
      const pName = (mp.plan_name || mp.name || '').toLowerCase();
      return pName && clientPlanName.includes(pName);
    });

    if (matchedPlan && typeof matchedPlan.hasPostureCheckin === 'boolean') {
      return matchedPlan.hasPostureCheckin === true;
    }

    return false;
  })();

  const planFeatures = currentSelectedPlan?.planFeatures || profile?.planFeatures || {
    hasDiet: hasPlan,
    hasWorkout: hasPlan,
    hasTracking: hasPlan,
    hasPostureCheckin,
    hasDailyLog: hasPlan
  };

  // Strictly filter checkins to ONLY match the selected plan's date window so past plan data is isolated
  const planStartStr = currentSelectedPlan?.planStart || '';
  const planExpiryStr = currentSelectedPlan?.planExpiry || '';

  const selectedPlanCheckins = checkins.filter(c => {
    const cDate = c.date || (c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toISOString().split('T')[0] : '');
    if (!cDate) return true;
    if (planStartStr && cDate < planStartStr) return false;
    if (planExpiryStr && cDate > planExpiryStr) return false;
    return true;
  });

  // Activity calculations
  const steps = todayLog?.steps || 0;
  const stepsTarget = 10000;
  const stepsPercent = Math.min(100, (steps / stepsTarget) * 100);
  
  const water = todayLog?.water || 0;
  const waterTarget = 3;
  const waterPercent = Math.min(100, (water / waterTarget) * 100);

  const sleepHours = todayLog?.sleepHours || 0;
  const workoutWeight = todayLog?.workoutWeight || 0;

  // Validated Weight Chart Data for current selected plan only
  const validWeightList = [...selectedPlanCheckins, ...(todayLog ? [todayLog] : [])]
    .map(c => {
      const dateObj = c.date?.toDate ? c.date.toDate() : new Date(c.date);
      const wVal = parseFloat(c.weight || c.measurements?.weight || c.dailyWeight || 0);
      return {
        dateObj,
        date: isNaN(dateObj.getTime()) ? 'Log' : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        weight: wVal
      };
    })
    .filter(item => !isNaN(item.weight) && item.weight > 0)
    .sort((a, b) => a.dateObj - b.dateObj);

  let chartData = validWeightList.slice(-7);
  if (chartData.length === 1) {
    const single = chartData[0];
    chartData = [
      { date: 'Start', weight: single.weight },
      { date: single.date, weight: single.weight }
    ];
  }

  const userProfileWeight = profile?.weight ? parseFloat(profile.weight) : 0;
  const latestWeight = validWeightList.length > 0 
    ? validWeightList[validWeightList.length - 1].weight 
    : (userProfileWeight > 0 ? userProfileWeight : '--');

  // Task completion calculation
  const isDietDone = !!(todayLog?.mealPhotos && Object.keys(todayLog.mealPhotos).length > 0);
  const isWorkoutDone = !!(todayLog?.workoutCompleted || (todayLog?.completedExercises && todayLog.completedExercises.length > 0));
  const isTrackingDone = !!(todayLog?.steps || todayLog?.water || todayLog?.sleepHours || todayLog?.dailyNotes);

  let totalEnabledTasks = 0;
  let completedCount = 0;

  if (planFeatures.hasDiet) {
    totalEnabledTasks++;
    if (isDietDone) completedCount++;
  }
  if (planFeatures.hasWorkout) {
    totalEnabledTasks++;
    if (isWorkoutDone) completedCount++;
  }
  if (planFeatures.hasTracking) {
    totalEnabledTasks++;
    if (isTrackingDone) completedCount++;
  }

  const tasksPercent = totalEnabledTasks > 0 ? Math.round((completedCount / totalEnabledTasks) * 100) : 100;

  // 10-day posture check-in lock calculation for selected plan
  const latestCheckinDate = selectedPlanCheckins[0]?.date ? new Date(selectedPlanCheckins[0].date) : null;
  const daysPassedSinceCheckin = latestCheckinDate 
    ? Math.floor((new Date().getTime() - latestCheckinDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  const isCheckinLocked = latestCheckinDate && daysPassedSinceCheckin < 10;
  const checkinDaysLeft = 10 - daysPassedSinceCheckin;
  const nextCheckinDateObj = latestCheckinDate ? new Date(latestCheckinDate.getTime() + 10 * 24 * 60 * 60 * 1000) : new Date();
  const nextCheckinFormatted = latestCheckinDate ? formatDateNice(nextCheckinDateObj) : 'Today (Due Now)';

  const clientFirstName = (profile?.displayName || profile?.name || 'Member').split(' ')[0];

  // Latest Trainer Review Candidate
  const latestTrainerReview = (() => {
    const candidateList = [
      ...(todayLog ? [todayLog] : []),
      ...(checkins || []),
      ...(allUserLogs || [])
    ]
    .filter(item => item && (item.reviewed || (item.remarks && item.remarks.trim() !== '')))
    .sort((a, b) => {
      const dateA = a.reviewedAt || a.date || (a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000).toISOString() : '');
      const dateB = b.reviewedAt || b.date || (b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000).toISOString() : '');
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return candidateList[0] || null;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '80px' }} className="animate-fade-up">
      


      {/* PAST PLAN NOTICE BANNER */}
      {isViewingPastPlan && (
        <Card style={{ padding: '12px 16px', backgroundColor: 'rgba(255, 145, 0, 0.15)', border: '1px solid rgba(255, 145, 0, 0.4)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={20} color="#ff9100" />
          <div>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: '#ff9100' }}>Viewing Historical Dashboard Data</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              You are inspecting historical dashboard stats, checklist, and posture photos for past plan <strong>{currentSelectedPlan.planName}</strong>.
            </span>
          </div>
        </Card>
      )}

      {/* 1. HERO GREETING BANNER */}
      <Card style={{ 
        padding: '18px', 
        background: 'linear-gradient(135deg, rgba(224, 0, 8, 0.18) 0%, rgba(18, 18, 20, 0.9) 100%)',
        border: '1px solid rgba(224, 0, 8, 0.3)',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent, #E00008)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              <Sparkles size={14} /> MRK FITNESS CLIENT PORTAL
            </div>
            <h1 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF' }}>
              Welcome back, {clientFirstName}! 🔥
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary, #AAAAAA)' }}>
              Let&apos;s crush your daily nutrition, workout split, and activity goals today.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>WEIGHT</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>{latestWeight} kg</div>
            </div>
            <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>GOAL</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#00c853' }}>{profile?.goal || 'Fat Loss'}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. TRAINER REVIEW & FEEDBACK CARD */}
      <Card style={{ 
        padding: '18px', 
        background: 'linear-gradient(135deg, rgba(0, 200, 83, 0.12) 0%, rgba(18, 18, 20, 0.95) 100%)',
        border: '1px solid rgba(0, 200, 83, 0.35)',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 200, 83, 0.12)'
      }} className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(0, 200, 83, 0.2)', 
              border: '1px solid rgba(0, 200, 83, 0.4)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.1rem', 
              fontWeight: 900, 
              color: '#00c853',
              boxShadow: '0 0 12px rgba(0, 200, 83, 0.25)'
            }}>
              💬
            </div>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Head Coach / Trainer Feedback
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {latestTrainerReview?.date || latestTrainerReview?.reviewedAt 
                  ? `Reviewed for ${formatDateNice(latestTrainerReview.date || latestTrainerReview.reviewedAt)}` 
                  : 'Daily Monitoring & Feedback'}
              </div>
            </div>
          </div>

          <Badge variant={latestTrainerReview?.remarks ? 'success' : 'secondary'} style={{ padding: '4px 10px', fontSize: '0.7rem', fontWeight: 800 }}>
            {latestTrainerReview?.remarks ? '✓ Trainer Reviewed' : '⏳ Log Pending'}
          </Badge>
        </div>

        <div style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.4)', 
          border: '1px solid rgba(0, 200, 83, 0.25)', 
          borderRadius: '12px', 
          padding: '14px',
          position: 'relative'
        }}>
          {latestTrainerReview?.remarks ? (
            <>
              <div style={{ fontSize: '0.88rem', color: '#E0E0E0', lineHeight: '1.5', fontStyle: 'italic' }}>
                &ldquo;{latestTrainerReview.remarks}&rdquo;
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Reviewed by Head Coach
                </span>
                <span style={{ fontSize: '0.75rem', color: '#00c853', fontWeight: 800 }}>
                  — Radha Krishna Maram
                </span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '6px 0' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                No trainer remarks logged yet for today. Submit your daily log to receive direct trainer feedback!
              </div>
              <Link href="/client/daily-log" style={{ textDecoration: 'none' }}>
                <Button size="sm" style={{ backgroundColor: 'var(--accent)', color: '#FFF', fontWeight: 700 }}>
                  Submit Today&apos;s Log 📱
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>



      {/* 2. MEMBERSHIP PLAN CARD WITH POPUP TOGGLE BUTTON */}
      {hasPlan ? (
        <Card style={{ 
          padding: '16px', 
          backgroundColor: 'var(--card, #121214)',
          border: isViewingPastPlan ? '1px solid #ff9100' : '1px solid var(--border, #2a2a30)',
          borderRadius: '16px'
        }} className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Badge variant={isViewingPastPlan ? 'warning' : 'success'} style={{ padding: '2px 8px', fontSize: '0.68rem' }}>
                  {isViewingPastPlan ? 'PAST PLAN HISTORY' : 'ACTIVE PLAN'}
                </Badge>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} color="var(--accent)" /> Week {currentWeek} of {totalWeeks}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>{currentSelectedPlan.planName}</h2>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsPlanModalOpen(true)} 
                  style={{ 
                    padding: '3px 10px', 
                    fontSize: '0.72rem', 
                    fontWeight: 800, 
                    borderColor: isViewingPastPlan ? '#ff9100' : 'var(--accent)',
                    color: isViewingPastPlan ? '#ff9100' : 'var(--accent)'
                  }}
                >
                  View All Plans 🔄
                </Button>
              </div>
            </div>

            <div style={{ textAlign: 'right', backgroundColor: isViewingPastPlan ? 'rgba(255, 145, 0, 0.12)' : 'rgba(224, 0, 8, 0.12)', padding: '6px 12px', borderRadius: '10px', border: isViewingPastPlan ? '1px solid rgba(255, 145, 0, 0.3)' : '1px solid rgba(224, 0, 8, 0.25)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: isViewingPastPlan ? '#ff9100' : 'var(--accent, #E00008)', lineHeight: '1' }}>
                {daysRemaining}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', marginTop: '2px', fontWeight: 700 }}>
                {isViewingPastPlan ? 'Days Total' : 'Days Remaining'}
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Membership Duration Progress</span>
              <strong style={{ color: '#FFFFFF' }}>{Math.round(progressPercentage)}%</strong>
            </div>
            <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${progressPercentage}%`, 
                height: '100%', 
                backgroundColor: isViewingPastPlan ? '#ff9100' : 'var(--accent, #E00008)',
                borderRadius: '10px',
                transition: 'width 0.8s ease-in-out',
                boxShadow: isViewingPastPlan ? '0 0 10px rgba(255, 145, 0, 0.6)' : '0 0 10px rgba(224, 0, 8, 0.6)'
              }} />
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--card)', border: '1px dashed var(--border)', borderRadius: '16px' }}>
          <ActivitySquare size={24} color="var(--text-secondary)" style={{ marginBottom: '6px' }} />
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#FFFFFF' }}>No Active Plan Assigned</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            Contact Head Coach Radha Krishna Maram to assign your customized membership plan.
          </p>
        </Card>
      )}

      {/* 3. TODAY'S DASHBOARD TASKS GRID */}
      {totalEnabledTasks > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Today&apos;s Program Checklist
            </h3>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: tasksPercent === 100 ? '#00c853' : 'var(--accent)' }}>
              {tasksPercent}% Completed
            </span>
          </div>

          <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${tasksPercent}%`, 
              height: '100%', 
              backgroundColor: tasksPercent === 100 ? '#00c853' : 'var(--accent)',
              borderRadius: '10px',
              transition: 'width 0.8s ease-in-out'
            }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(totalEnabledTasks, 3)}, 1fr)`, gap: '10px' }}>
            {planFeatures.hasDiet && (
              <Link href="/client/diet" style={{ textDecoration: 'none' }}>
                <Card style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', borderRadius: '14px' }} className="glass-card">
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: isDietDone ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Utensils size={18} color={isDietDone ? '#00c853' : 'var(--accent)'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#FFFFFF', marginBottom: '2px' }}>Diet Plan</div>
                    <div style={{ fontSize: '0.72rem', color: isDietDone ? '#00c853' : 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      {isDietDone ? <CheckCircle2 size={12} color="#00c853" /> : <Circle size={12} />}
                      {isDietDone ? 'Submitted' : 'Pending'}
                    </div>
                  </div>
                </Card>
              </Link>
            )}

            {planFeatures.hasWorkout && (
              <Link href="/client/workout" style={{ textDecoration: 'none' }}>
                <Card style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', borderRadius: '14px' }} className="glass-card">
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: isWorkoutDone ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Dumbbell size={18} color={isWorkoutDone ? '#00c853' : '#448aff'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#FFFFFF', marginBottom: '2px' }}>Workout</div>
                    <div style={{ fontSize: '0.72rem', color: isWorkoutDone ? '#00c853' : 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      {isWorkoutDone ? <CheckCircle2 size={12} color="#00c853" /> : <Circle size={12} />}
                      {isWorkoutDone ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                </Card>
              </Link>
            )}

            {planFeatures.hasTracking && (
              <Link href="/client/daily-log" style={{ textDecoration: 'none' }}>
                <Card style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', borderRadius: '14px' }} className="glass-card">
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: isTrackingDone ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={18} color={isTrackingDone ? '#00c853' : '#ffb300'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#FFFFFF', marginBottom: '2px' }}>Activity</div>
                    <div style={{ fontSize: '0.72rem', color: isTrackingDone ? '#00c853' : 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      {isTrackingDone ? <CheckCircle2 size={12} color="#00c853" /> : <Circle size={12} />}
                      {isTrackingDone ? 'Logged' : 'Pending'}
                    </div>
                  </div>
                </Card>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* 4. DAILY ACTIVITY METRICS SUMMARY */}
      {planFeatures.hasTracking && (
        <section>
          <Card style={{ padding: '16px', borderRadius: '16px' }} className="glass-card">
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0 0 14px 0', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={16} color="var(--accent)" /> Daily Activity & Workout Metrics
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {/* Steps Metric */}
              <div style={{ padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: profile?.targetSteps ? '6px' : '0' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    👟 Daily Steps
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#4dabf7' }}>
                    {steps ? Number(steps).toLocaleString() : '0'}{profile?.targetSteps ? ` / ${Number(profile.targetSteps).toLocaleString()} steps` : ' steps'}
                  </span>
                </div>
                {profile?.targetSteps && (
                  <div style={{ height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (steps / profile.targetSteps) * 100)}%`, height: '100%', backgroundColor: '#4dabf7', borderRadius: '4px' }} />
                  </div>
                )}
              </div>

              {/* Water Intake Metric */}
              <div style={{ padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: profile?.targetWater ? '6px' : '0' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Droplets size={14} color="#0288d1" /> Water Intake
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0288d1' }}>
                    {water ? `${water} L` : '0 L'}{profile?.targetWater ? ` / ${profile.targetWater} L` : ''}
                  </span>
                </div>
                {profile?.targetWater && (
                  <div style={{ height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (water / profile.targetWater) * 100)}%`, height: '100%', backgroundColor: '#0288d1', borderRadius: '4px' }} />
                  </div>
                )}
              </div>

              {/* Workout Weight */}
              <div style={{ padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Dumbbell size={14} color="#00c853" /> Workout Weight Lifted
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#00c853' }}>
                    {workoutWeight ? `${workoutWeight} kg` : '--'}
                  </span>
                </div>
              </div>

              {/* Sleep Duration */}
              <div style={{ padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Moon size={14} color="#7c4dff" /> Sleep Duration
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#7c4dff' }}>
                    {sleepHours ? `${sleepHours} hrs` : '--'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 5. WEIGHT TREND ANALYTICS */}
      <section>
        <Card style={{ padding: '16px', borderRadius: '16px' }} className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0 0 2px 0', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} color="var(--accent)" /> Weight Progress Trend
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {isViewingPastPlan ? 'Historical weight logs for selected past plan' : 'Weight updates logged for current active plan'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF' }}>
                {latestWeight} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>kg</span>
              </div>
            </div>
          </div>
          
          <div style={{ height: '160px', width: '100%', marginLeft: '-20px' }}>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', padding: '6px' }}
                    itemStyle={{ color: 'var(--accent)' }}
                  />
                  <Area type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                Submit check-ins to track your weight progress line.
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* 6. 10-DAY POSTURE & MEASUREMENTS CHECK-IN QUICK ACTION */}
      <section>
        <Card style={{ padding: '16px', borderRadius: '16px', borderLeft: '4px solid var(--accent, #E00008)' }} className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(224, 0, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={22} color="var(--accent, #E00008)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>
                    10-Day Body Check-in & Measurements
                  </h3>
                  <Badge variant={latestCheckinDate ? 'success' : 'warning'} style={{ fontSize: '0.68rem' }}>
                    {latestCheckinDate ? `Submitted: ${formatDateNice(latestCheckinDate)}` : 'DUE TODAY'}
                  </Badge>
                </div>
                {latestCheckinDate && (
                  <div style={{ fontSize: '0.8rem', color: '#FFFFFF', fontWeight: 700, marginTop: '2px' }}>
                    📅 Last Check-in Submitted: <span style={{ color: '#00c853' }}>{formatDateNice(latestCheckinDate)}</span>
                  </div>
                )}
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {latestCheckinDate 
                    ? `Check-in recorded on ${formatDateNice(latestCheckinDate)}` 
                    : 'Submit your 10-day body photos & 14-point measurements now!'}
                </p>
              </div>
            </div>

            <Link href="/client/checkin" style={{ textDecoration: 'none' }}>
              <Button size="sm" style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 800 }}>
                {latestCheckinDate ? 'View History / Update' : 'Submit Check-in Now'} <ChevronRight size={16} />
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* 7. ALL MEMBERSHIP PLANS & HISTORY POPUP MODAL */}
      {isPlanModalOpen && (
        <Modal 
          isOpen={isPlanModalOpen} 
          onClose={() => setIsPlanModalOpen(false)} 
          title="My Membership Plans & History"
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Select any membership plan below to switch your dashboard view and inspect historical workout splits, diet plans, and check-in photos.
            </p>

            {clientPlansHistory.length === 0 ? (
              <Card style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No membership plan history recorded yet.
              </Card>
            ) : (
              clientPlansHistory.map((planItem, idx) => {
                const isSelected = idx === selectedPlanIndex;
                const isCurrentActive = idx === 0;
                const feats = planItem.planFeatures || {};

                return (
                  <Card 
                    key={idx}
                    onClick={() => {
                      setSelectedPlanIndex(idx);
                      setIsPlanModalOpen(false);
                    }}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(224, 0, 8, 0.1)' : 'var(--card)',
                      border: isSelected ? '2px solid var(--accent, #E00008)' : '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge variant={isCurrentActive ? 'success' : 'warning'}>
                          {isCurrentActive ? '🟢 ACTIVE PLAN' : '📁 PAST PLAN'}
                        </Badge>
                        <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#FFFFFF' }}>
                          {planItem.planName || planItem.name}
                        </h4>
                      </div>

                      {isSelected ? (
                        <Badge variant="success" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
                          ✓ Currently Inspecting Dashboard
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
                          Switch to Plan ⚡
                        </Button>
                      )}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span>🗓️ Duration: <strong>{planItem.planStart || 'Start'}</strong> to <strong>{planItem.planExpiry || 'Expiry'}</strong></span>
                      {planItem.amountPaid !== undefined && <span>💰 Paid: <strong>₹{planItem.amountPaid}</strong></span>}
                    </div>

                    {/* Feature Badges */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                      <Badge variant={feats.hasDiet !== false ? 'info' : 'outline'} style={{ fontSize: '0.65rem' }}>
                        {feats.hasDiet !== false ? '✓ Diet Plan' : '✗ No Diet'}
                      </Badge>
                      <Badge variant={feats.hasWorkout !== false ? 'info' : 'outline'} style={{ fontSize: '0.65rem' }}>
                        {feats.hasWorkout !== false ? '✓ Workout Split' : '✗ No Workout'}
                      </Badge>
                      <Badge variant={feats.hasTracking !== false ? 'info' : 'outline'} style={{ fontSize: '0.65rem' }}>
                        {feats.hasTracking !== false ? '✓ Daily Activity' : '✗ No Activity'}
                      </Badge>
                      <Badge variant={feats.hasPostureCheckin === true ? 'danger' : 'outline'} style={{ fontSize: '0.65rem' }}>
                        {feats.hasPostureCheckin === true ? '📸 10-Day Posture Photos' : '✗ No Posture'}
                      </Badge>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </Modal>
      )}

    </div>
  );
}
