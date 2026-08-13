'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  submitDailyLog, 
  getDailyLog, 
  getClientDailyLogs, 
  submitCheckin, 
  getClientCheckins,
  getClientById,
  getPlans,
  getClientDietPlans
} from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import { 
  Activity, 
  Droplets, 
  Moon, 
  Zap, 
  Smile, 
  Heart, 
  TrendingUp, 
  Camera, 
  Upload, 
  PlusCircle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Filter, 
  ChevronRight,
  ArrowLeft,
  X,
  FileText,
  Dumbbell
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  AreaChart, 
  Area,
  BarChart,
  Bar
} from 'recharts';

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

export default function TrackingPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const [activeModal, setActiveModal] = useState(null); // 'activity_wellness' | 'posture_sizing'
  const [showInputPopup, setShowInputPopup] = useState(false);

  const [selectedMeasurementKey, setSelectedMeasurementKey] = useState('weight');

  // Date Range Filters for Analytics Graphs (Default 1 Month)
  const getDefaultFromDate = () => {
    const d = new Date();
    return new Date(d.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  };
  const getDefaultToDate = () => new Date().toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(getDefaultFromDate);
  const [toDate, setToDate] = useState(getDefaultToDate);

  const [profile, setProfile] = useState(null);
  const [masterPlans, setMasterPlans] = useState([]);
  const [todayLog, setTodayLog] = useState(null);
  const [dailyLogsHistory, setDailyLogsHistory] = useState([]);
  const [checkinsHistory, setCheckinsHistory] = useState([]);

  // Combined Activity & Wellness State
  const [activityWellnessForm, setActivityWellnessForm] = useState({
    steps: '',
    stepsScreenshot: '',
    water: '',
    sleepHours: '',
    sleepQuality: 'Good',
    energyLevel: 'Medium',
    mood: 'Good',
    dailyNotes: ''
  });
  const [uploadingStepsScreenshot, setUploadingStepsScreenshot] = useState(false);

  // Combined Posture Photos & Sizing Measurements State
  const [posturePhotos, setPosturePhotos] = useState({ front: '', back: '', left: '', right: '' });
  const [uploadingPhotos, setUploadingPhotos] = useState({});
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState(null);

  const [sizingForm, setSizingForm] = useState({
    weight: '', neck: '', shoulder: '', chest: '', waist: '', stomach: '', highHip: '',
    rBicep: '', lBicep: '', rForearm: '', lForearm: '', rThigh: '', lThigh: '', rCalf: '', lCalf: ''
  });

  const [dietPlans, setDietPlans] = useState([]);
  const [takenSupplements, setTakenSupplements] = useState({});

  const todayDateString = new Date().toISOString().split('T')[0];

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [profileData, tLog, logsHist, chkHist, plansData, dPlans] = await Promise.all([
        getClientById(user.uid),
        getDailyLog(user.uid, todayDateString),
        getClientDailyLogs(user.uid),
        getClientCheckins(user.uid),
        getPlans(),
        getClientDietPlans(user.uid)
      ]);

      setProfile(profileData);
      setMasterPlans(plansData || []);
      setTodayLog(tLog);
      setDailyLogsHistory(logsHist || []);
      setCheckinsHistory(chkHist || []);
      setDietPlans(dPlans || []);

      if (tLog) {
        setActivityWellnessForm({
          steps: tLog.steps !== undefined ? String(tLog.steps) : '',
          stepsScreenshot: tLog.stepsScreenshot || '',
          water: tLog.water !== undefined ? String(tLog.water) : '',
          sleepHours: tLog.sleepHours !== undefined ? String(tLog.sleepHours) : '',
          sleepQuality: tLog.sleepQuality || 'Good',
          energyLevel: tLog.energyLevel || 'Medium',
          mood: tLog.mood || 'Good',
          dailyNotes: tLog.dailyNotes || ''
        });
        setTakenSupplements(tLog.takenSupplements || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  // Strict Feature Verification
  const hasPlan = profile?.currentPlan && profile?.currentPlan !== 'None' && profile?.currentPlan !== 'Not Assigned';

  const hasPostureCheckin = (() => {
    if (!hasPlan) return false;
    
    if (profile?.planFeatures && typeof profile.planFeatures.hasPostureCheckin === 'boolean') {
      return profile.planFeatures.hasPostureCheckin === true;
    }

    const clientPlanName = (profile?.currentPlan || '').toLowerCase();
    const matchedPlan = (masterPlans || []).find(mp => {
      const pName = (mp.plan_name || mp.name || '').toLowerCase();
      return pName && clientPlanName.includes(pName);
    });

    if (matchedPlan && typeof matchedPlan.hasPostureCheckin === 'boolean') {
      return matchedPlan.hasPostureCheckin === true;
    }

    return false;
  })();

  const handlePhotoUpload = async (e, side) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhotos(prev => ({ ...prev, [side]: true }));
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setPosturePhotos(prev => ({ ...prev, [side]: base64 }));
        toast.success(`Photo selected!`);
        setUploadingPhotos(prev => ({ ...prev, [side]: false }));
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image');
      setUploadingPhotos(prev => ({ ...prev, [side]: false }));
    }
  };

  // Save Unified Activity & Wellness Log
  const handleSaveActivityWellness = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    try {
      await submitDailyLog(user.uid, {
        date: todayDateString,
        steps: activityWellnessForm.steps ? Number(activityWellnessForm.steps) : 0,
        stepsScreenshot: activityWellnessForm.stepsScreenshot || '',
        water: activityWellnessForm.water ? Number(activityWellnessForm.water) : 0,
        sleepHours: activityWellnessForm.sleepHours ? Number(activityWellnessForm.sleepHours) : 0,
        sleepQuality: activityWellnessForm.sleepQuality,
        energyLevel: activityWellnessForm.energyLevel,
        mood: activityWellnessForm.mood,
        dailyNotes: activityWellnessForm.dailyNotes || '',
        takenSupplements: takenSupplements
      });

      toast.success('Daily Activity & Wellness Log saved successfully!');
      setShowInputPopup(false);
      await loadAllData();
    } catch (err) {
      console.error(err);
      toast.error(err || 'Failed to save log');
    } finally {
      setSubmitting(false);
    }
  };

  // Save Unified 10-Day Posture & Sizing Check-in
  const handleSavePostureSizing = async (e) => {
    if (e) e.preventDefault();

    if (!posturePhotos.front && !posturePhotos.back && !posturePhotos.left && !posturePhotos.right) {
      toast.error('Please upload at least 1 body posture photo (Front, Back, Left, or Right).');
      return;
    }

    setSubmitting(true);
    try {
      await submitCheckin(user.uid, {
        date: todayDateString,
        photos: posturePhotos,
        measurements: {
          weight: sizingForm.weight ? Number(sizingForm.weight) : 0,
          neck: sizingForm.neck ? Number(sizingForm.neck) : 0,
          shoulder: sizingForm.shoulder ? Number(sizingForm.shoulder) : 0,
          chest: sizingForm.chest ? Number(sizingForm.chest) : 0,
          waist: sizingForm.waist ? Number(sizingForm.waist) : 0,
          stomach: sizingForm.stomach ? Number(sizingForm.stomach) : 0,
          highHip: sizingForm.highHip ? Number(sizingForm.highHip) : 0,
          rBicep: sizingForm.rBicep ? Number(sizingForm.rBicep) : 0,
          lBicep: sizingForm.lBicep ? Number(sizingForm.lBicep) : 0,
          rForearm: sizingForm.rForearm ? Number(sizingForm.rForearm) : 0,
          lForearm: sizingForm.lForearm ? Number(sizingForm.lForearm) : 0,
          rThigh: sizingForm.rThigh ? Number(sizingForm.rThigh) : 0,
          lThigh: sizingForm.lThigh ? Number(sizingForm.lThigh) : 0,
          rCalf: sizingForm.rCalf ? Number(sizingForm.rCalf) : 0,
          lCalf: sizingForm.lCalf ? Number(sizingForm.lCalf) : 0,
        }
      });

      toast.success('10-Day Body Posture & Sizing Check-in submitted successfully!');
      setShowInputPopup(false);
      setPosturePhotos({ front: '', back: '', left: '', right: '' });
      setSizingForm({ weight: '', neck: '', shoulder: '', chest: '', waist: '', stomach: '', highHip: '', rBicep: '', lBicep: '', rForearm: '', lForearm: '', rThigh: '', lThigh: '', rCalf: '', lCalf: '' });
      await loadAllData();
    } catch (err) {
      console.error(err);
      toast.error(err || 'Failed to submit check-in');
    } finally {
      setSubmitting(false);
    }
  };

  // Check-in status lock
  const latestCheckinDate = checkinsHistory[0]?.createdAt?.toDate 
    ? checkinsHistory[0].createdAt.toDate() 
    : (checkinsHistory[0]?.date ? new Date(checkinsHistory[0].date) : null);

  const daysPassedSinceCheckin = latestCheckinDate 
    ? Math.floor((new Date().getTime() - latestCheckinDate.getTime()) / (1000 * 60 * 60 * 24)) 
    : 999;
  
  const isCheckinLocked = latestCheckinDate && daysPassedSinceCheckin < 10;
  const daysToGo = 10 - daysPassedSinceCheckin;

  const isTodayActivityWellnessDone = !!(todayLog?.steps || todayLog?.water || todayLog?.sleepHours || todayLog?.dailyNotes);

  // Filter Activity Chart Data
  const activityChartData = dailyLogsHistory
    .filter(log => {
      if (!log.date) return false;
      return log.date >= fromDate && log.date <= toDate;
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(log => ({
      date: log.date.split('-').slice(1).join('/'),
      steps: log.steps || 0,
      water: log.water || 0,
      sleepHours: log.sleepHours || 0
    }));

  // Filter Sizing Chart Data
  const sizingChartData = checkinsHistory
    .map(chk => {
      const dStr = chk.date || (chk.createdAt?.seconds ? new Date(chk.createdAt.seconds * 1000).toISOString().split('T')[0] : '');
      const m = chk.measurements || {};
      return {
        date: dStr ? dStr.split('-').slice(1).join('/') : 'Log',
        fullDate: dStr,
        val: m[selectedMeasurementKey] !== undefined ? Number(m[selectedMeasurementKey]) : 0
      };
    })
    .filter(item => item.fullDate >= fromDate && item.fullDate <= toDate && item.val > 0)
    .sort((a, b) => a.fullDate.localeCompare(b.fullDate));

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <Spinner />
      {/* FULL VIEW PHOTO LIGHTBOX MODAL */}
      {viewingPhotoUrl && (
        <Modal 
          isOpen={!!viewingPhotoUrl} 
          onClose={() => setViewingPhotoUrl(null)} 
          title="Photo Full View" 
          size="md"
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
            <img 
              src={getDirectImageUrl(viewingPhotoUrl)} 
              alt="Photo Full View" 
              style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: '8px', objectFit: 'contain' }} 
            />
          </div>
        </Modal>
      )}
    </div>
  );

  return (
    <>
      <div style={styles.container} className="animate-fade-up">
      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={styles.iconCircle}>
            <Activity size={18} color="var(--accent)" />
          </div>
          <h1 style={styles.title}>Client Health & Tracking Hub</h1>
        </div>
        <p style={styles.subtitle}>Unified Daily Activity & Wellness Logs + 10-Day Body Posture & Sizing Check-ins</p>
      </header>

      {/* 2 Main Unified Navigation Hub Cards */}
      <div style={styles.hubGrid}>
        
        {/* UNIFIED CARD 1: DAILY ACTIVITY & WELLNESS */}
        <Card onClick={() => { setActiveModal('activity_wellness'); setShowInputPopup(false); }} style={styles.hubCard} className="glass-card">
          <div style={{ ...styles.hubIconWrapper, backgroundColor: 'rgba(0, 200, 83, 0.15)' }}>
            <Activity size={20} color="#00c853" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <h3 style={styles.hubTitle}>Daily Activity & Wellness Log</h3>
              {isTodayActivityWellnessDone ? <Badge variant="success">✓ Submitted Today</Badge> : <Badge variant="warning">Pending Today</Badge>}
            </div>
            <p style={styles.hubSub}>
              {todayLog?.steps || 0} steps • {todayLog?.water || 0}L water • {todayLog?.sleepHours || 0}h sleep{todayLog?.takenSupplements && Object.keys(todayLog.takenSupplements).length > 0 ? ` • 💊 ${Object.values(todayLog.takenSupplements).filter(Boolean).length}/${Object.keys(todayLog.takenSupplements).length} taken` : ''}
            </p>
          </div>
          <ChevronRight size={18} color="var(--text-secondary)" />
        </Card>

        {/* UNIFIED CARD 2: 10-DAY BODY POSTURE & SIZING (GATED) */}
        {hasPostureCheckin && (
          <Link href="/client/checkin" style={{ textDecoration: 'none', display: 'block' }}>
            <Card style={{ ...styles.hubCard, borderLeft: '3px solid var(--accent, #E00008)' }} className="glass-card">
              <div style={{ ...styles.hubIconWrapper, backgroundColor: 'rgba(224, 0, 8, 0.15)' }}>
                <Camera size={20} color="var(--accent, #E00008)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <h3 style={styles.hubTitle}>10-Day Body Posture & Measurements Check-in</h3>
                  {isCheckinLocked ? (
                    <Badge variant="warning">🔒 {daysToGo} Days Left</Badge>
                  ) : (
                    <Badge variant="danger">Submit Check-in</Badge>
                  )}
                </div>
                <p style={styles.hubSub}>
                  {latestCheckinDate ? `Last check-in ${daysPassedSinceCheckin} day(s) ago` : 'No posture & sizing check-in submitted yet'}
                </p>
              </div>
              <ChevronRight size={18} color="var(--text-secondary)" />
            </Card>
          </Link>
        )}

      </div>

      </div>

      {/* OVERLAY SHEETS */}
      {mounted && activeModal === 'activity_wellness' && createPortal((
        <div style={styles.fullScreenOverlay} className="animate-fade-up">
              <header style={styles.sheetHeader}>
                <button onClick={() => setActiveModal(null)} style={styles.sheetBackBtn}>
                  <ArrowLeft size={18} color="var(--text)" />
                  <h3 style={styles.sheetTitle}>Daily Activity & Wellness Log</h3>
                </button>
              </header>

              <div style={styles.sheetContent}>
                {/* Date Filter Bar */}
                <Card style={{ padding: '8px 12px' }} className="glass-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Filter size={14} color="var(--accent)" /> Analytics Date Range:
                    </span>
                    <Input 
                      type="date" 
                      label="From Date" 
                      value={fromDate} 
                      onChange={(e) => setFromDate(e.target.value)} 
                      containerStyle={{ flex: 1, minWidth: '120px' }}
                    />
                    <Input 
                      type="date" 
                      label="To Date" 
                      value={toDate} 
                      onChange={(e) => setToDate(e.target.value)} 
                      containerStyle={{ flex: 1, minWidth: '120px' }}
                    />
                    <Button variant="outline" size="sm" onClick={() => { setFromDate(defaultFromDate); setToDate(defaultToDate); }} style={{ alignSelf: 'flex-end' }}>
                      Reset (1 Month)
                    </Button>
                  </div>
                </Card>

                <Button 
                  onClick={() => !isTodayActivityWellnessDone && setShowInputPopup(true)} 
                  disabled={isTodayActivityWellnessDone}
                  style={{ 
                    padding: '10px', 
                    fontSize: '0.85rem',
                    backgroundColor: isTodayActivityWellnessDone ? '#00c853' : 'var(--accent)',
                    color: '#fff',
                    opacity: isTodayActivityWellnessDone ? 0.8 : 1,
                    cursor: isTodayActivityWellnessDone ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isTodayActivityWellnessDone ? (
                    <>✓ Daily Activity & Wellness Submitted Today</>
                  ) : (
                    <><PlusCircle size={16} /> Log Today&apos;s Activity & Wellness</>
                  )}
                </Button>



                {/* GRAPH 2: STEPS */}
                <Card style={styles.chartCard} className="glass-card">
                  <h4 style={styles.chartTitle}>👟 Daily Steps Analytics</h4>
                  {activityChartData.length > 0 ? (
                    <div style={{ width: '100%', height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} />
                          <YAxis stroke="var(--text-secondary)" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }} formatter={(val) => [`${val} steps`, 'Steps']} />
                          <Bar dataKey="steps" fill="#4dabf7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No step data found for date range.</p>}
                </Card>

                {/* GRAPH 3: WATER INTAKE */}
                <Card style={styles.chartCard} className="glass-card">
                  <h4 style={{ ...styles.chartTitle, color: '#0288d1' }}>💧 Water Intake Analytics (Litres)</h4>
                  {activityChartData.length > 0 ? (
                    <div style={{ width: '100%', height: 130 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activityChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} />
                          <YAxis stroke="var(--text-secondary)" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }} formatter={(val) => [`${val} L`, 'Water']} />
                          <Line type="monotone" dataKey="water" stroke="#0288d1" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No water intake data found.</p>}
                </Card>
              </div>

              {/* INPUT POPUP FOR ACTIVITY & WELLNESS */}
              {showInputPopup && (
                <Modal isOpen={showInputPopup} onClose={() => setShowInputPopup(false)} title="Log Today's Activity & Wellness" size="md">
                  <form onSubmit={handleSaveActivityWellness} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'end' }}>
                        <Input label="Steps (e.g. 10000)" type="number" value={activityWellnessForm.steps} onChange={(e) => setActivityWellnessForm({ ...activityWellnessForm, steps: e.target.value })} />
                        <Input label="Water (Litres e.g. 3)" type="number" step="0.1" value={activityWellnessForm.water} onChange={(e) => setActivityWellnessForm({ ...activityWellnessForm, water: e.target.value })} />
                      </div>

                      {/* Steps Screenshot Upload Option */}
                      <div style={{ padding: '8px', backgroundColor: 'var(--card-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <Camera size={14} color="var(--accent)" /> Upload Daily Steps Screenshot (Optional)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            id="steps-screenshot-input"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadingStepsScreenshot(true);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setActivityWellnessForm(prev => ({ ...prev, stepsScreenshot: reader.result }));
                                  setUploadingStepsScreenshot(false);
                                  toast.success('Steps screenshot attached!');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label 
                            htmlFor="steps-screenshot-input"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--border)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {uploadingStepsScreenshot ? <Spinner size={12} /> : <Upload size={12} color="var(--accent)" />}
                            {activityWellnessForm.stepsScreenshot ? '✓ Change Screenshot' : '📸 Upload Steps Proof'}
                          </label>
                          {activityWellnessForm.stepsScreenshot && (
                            <span 
                              onClick={() => setViewingPhotoUrl(activityWellnessForm.stepsScreenshot)} 
                              style={{ fontSize: '0.72rem', color: '#00c853', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              View Screenshot 👁️
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      <Input label="Sleep Duration (Hours e.g. 7.5)" type="number" step="0.5" value={activityWellnessForm.sleepHours} onChange={(e) => setActivityWellnessForm({ ...activityWellnessForm, sleepHours: e.target.value })} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      <Select label="Sleep Quality" value={activityWellnessForm.sleepQuality} onChange={(e) => setActivityWellnessForm({ ...activityWellnessForm, sleepQuality: e.target.value })} options={[{ label: 'Good', value: 'Good' }, { label: 'Average', value: 'Average' }, { label: 'Poor', value: 'Poor' }]} />
                      <Select label="Energy Level" value={activityWellnessForm.energyLevel} onChange={(e) => setActivityWellnessForm({ ...activityWellnessForm, energyLevel: e.target.value })} options={[{ label: 'High', value: 'High' }, { label: 'Medium', value: 'Medium' }, { label: 'Low', value: 'Low' }]} />
                      <Select label="Mood" value={activityWellnessForm.mood} onChange={(e) => setActivityWellnessForm({ ...activityWellnessForm, mood: e.target.value })} options={[{ label: 'Great 😁', value: 'Great' }, { label: 'Good 🙂', value: 'Good' }, { label: 'Tired 😫', value: 'Tired' }]} />
                    </div>

                    <Textarea label="Daily Wellness Notes / Remarks" placeholder="How did you feel today? Any soreness or achievement?" value={activityWellnessForm.dailyNotes} onChange={(e) => setActivityWellnessForm({ ...activityWellnessForm, dailyNotes: e.target.value })} rows={2} />

                    {/* Supplements Checklist (if active plan has any) */}
                    {dietPlans && dietPlans[0]?.supplements && dietPlans[0].supplements.length > 0 && (
                      <div style={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '4px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF', display: 'block', marginBottom: '8px' }}>
                          💊 Supplements Taken Today
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {dietPlans[0].supplements.map((supp, sIdx) => {
                            const isTaken = !!takenSupplements[supp.name];
                            return (
                              <label 
                                key={sIdx} 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px', 
                                  fontSize: '0.78rem', 
                                  cursor: 'pointer',
                                  color: isTaken ? '#FFFFFF' : 'var(--text-secondary)'
                                }}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isTaken}
                                  onChange={() => setTakenSupplements(prev => ({ ...prev, [supp.name]: !prev[supp.name] }))}
                                  style={{ accentColor: '#ab47bc', cursor: 'pointer' }}
                                />
                                <div>
                                  <strong>{supp.name}</strong> {supp.dosage ? `(${supp.dosage})` : ''} - <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{supp.timing}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <Button type="submit" loading={submitting} style={{ width: '100%', marginTop: '4px' }}>
                      Save Daily Activity & Wellness Log
                    </Button>
                  </form>
                </Modal>
              )}
            </div>
        ), document.body)}
    </>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '80px' },
  header: { display: 'flex', flexDirection: 'column', gap: '2px' },
  iconCircle: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text)' },
  subtitle: { fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 },
  hubGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  hubCard: { padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '12px' },
  hubIconWrapper: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  hubTitle: { fontSize: '0.88rem', fontWeight: 800, margin: 0, color: 'var(--text)' },
  hubSub: { fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  fullScreenOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg)', zIndex: 999, display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  sheetHeader: { position: 'sticky', top: 0, zIndex: 10, padding: '12px 16px', backgroundColor: 'var(--card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' },
  sheetBackBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  sheetTitle: { fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text)' },
  sheetContent: { padding: '14px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  chartCard: { padding: '12px' },
  chartTitle: { fontSize: '0.82rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text)' }
};
