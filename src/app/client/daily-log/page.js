'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  submitDailyLog, 
  getDailyLog, 
  getClientDailyLogs, 
  submitCheckin, 
  getClientCheckins 
} from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Loading';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  Activity, 
  Smile, 
  Camera, 
  Ruler, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  History, 
  Clock,
  Upload,
  Droplets,
  Moon,
  Zap,
  ArrowLeft,
  X,
  Lock,
  Flame,
  TrendingUp,
  Image as ImageIcon,
  Plus,
  PlusCircle
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

export default function TrackingPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Active Full-Screen Sheet state: null | 'activity' | 'wellness' | 'posture' | 'sizing'
  const [activeModal, setActiveModal] = useState(null);

  // Input Popup Modal state inside Full-Screen View: boolean
  const [showInputPopup, setShowInputPopup] = useState(false);

  // Submitted info detail view & image zoom lightbox state
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);

  // Selected measurement toggle state for 14 anatomical points + weight graph
  const [selectedMeasurementKey, setSelectedMeasurementKey] = useState('weight');

  // Data states
  const [todayLog, setTodayLog] = useState(null);
  const [dailyLogsHistory, setDailyLogsHistory] = useState([]);
  const [checkinsHistory, setCheckinsHistory] = useState([]);

  // Form states
  const [activityForm, setActivityForm] = useState({ steps: '', water: '', sleepHours: '', treadmillPhoto: '' });
  const [wellnessForm, setWellnessForm] = useState({ sleepQuality: 'Good', energyLevel: 'Medium', mood: 'Good', dailyNotes: '' });
  
  // Posture photos state (Includes 5th slot: Treadmill Wheel Picture)
  const [posturePhotos, setPosturePhotos] = useState({ front: '', back: '', left: '', right: '', treadmillWheel: '' });
  const [uploadingPhotos, setUploadingPhotos] = useState({});

  // Sizing measurements state (14 anatomical points + weight)
  const [sizingForm, setSizingForm] = useState({
    weight: '', neck: '', shoulder: '', chest: '', waist: '', stomach: '', highHip: '',
    rBicep: '', lBicep: '', rForearm: '', lForearm: '', rThigh: '', lThigh: '', rCalf: '', lCalf: ''
  });

  const todayDateString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user?.uid) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [log, logsList, checkinsList] = await Promise.all([
        getDailyLog(user.uid, todayDateString),
        getClientDailyLogs(user.uid),
        getClientCheckins(user.uid)
      ]);

      setTodayLog(log);
      setDailyLogsHistory(logsList || []);
      setCheckinsHistory(checkinsList || []);

      if (log) {
        setActivityForm({
          steps: log.steps || '',
          water: log.water || '',
          sleepHours: log.sleepHours || '',
          treadmillPhoto: log.treadmillPhoto || ''
        });
        setWellnessForm({
          sleepQuality: log.sleepQuality || 'Good',
          energyLevel: log.energyLevel || 'Medium',
          mood: log.mood || 'Good',
          dailyNotes: log.dailyNotes || ''
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  // 10-DAY LOCKOUT CALCULATIONS
  const latestCheckinDate = checkinsHistory.length > 0 && checkinsHistory[0].date
    ? new Date(checkinsHistory[0].date)
    : null;

  const now = new Date();
  const daysPassedSinceCheckin = latestCheckinDate
    ? Math.max(0, Math.floor((now - latestCheckinDate) / (1000 * 60 * 60 * 24)))
    : 99;

  const daysToGo = Math.max(0, 10 - daysPassedSinceCheckin);
  const isCheckinLocked = daysToGo > 0;

  // Submit Handlers
  const handleSaveActivity = async () => {
    if (!user?.uid) return;
    setSubmitting(true);
    try {
      await submitDailyLog(user.uid, todayDateString, {
        ...todayLog,
        ...activityForm,
        date: todayDateString
      });
      toast.success('Activity log saved successfully!');
      await loadAllData();
      setShowInputPopup(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save activity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveWellness = async () => {
    if (!user?.uid) return;
    setSubmitting(true);
    try {
      await submitDailyLog(user.uid, todayDateString, {
        ...todayLog,
        ...wellnessForm,
        date: todayDateString
      });
      toast.success('Wellness log saved successfully!');
      await loadAllData();
      setShowInputPopup(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save wellness');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e, side) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhotos(prev => ({ ...prev, [side]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        if (side === 'activityTreadmill') {
          setActivityForm(prev => ({ ...prev, treadmillPhoto: data.fileUrl }));
        } else {
          setPosturePhotos(prev => ({ ...prev, [side]: data.fileUrl }));
        }
        toast.success(`Photo uploaded successfully!`);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingPhotos(prev => ({ ...prev, [side]: false }));
    }
  };

  const handleSavePosture = async () => {
    if (!user?.uid) return;
    if (isCheckinLocked) {
      return toast.error(`Check-in locked! Unlock in ${daysToGo} day(s).`);
    }
    if (!posturePhotos.front && !posturePhotos.back && !posturePhotos.left && !posturePhotos.right && !posturePhotos.treadmillWheel) {
      return toast.warning('Please upload at least one posture photo or treadmill picture');
    }
    setSubmitting(true);
    try {
      await submitCheckin(user.uid, {
        date: new Date().toISOString(),
        photos: posturePhotos,
        type: 'posture'
      });
      toast.success('10-Day Body Posture check-in submitted!');
      setPosturePhotos({ front: '', back: '', left: '', right: '', treadmillWheel: '' });
      await loadAllData();
      setShowInputPopup(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit posture check-in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSizing = async () => {
    if (!user?.uid) return;
    if (isCheckinLocked) {
      return toast.error(`Check-in locked! Unlock in ${daysToGo} day(s).`);
    }
    if (!sizingForm.weight) {
      return toast.warning('Please enter body weight');
    }
    setSubmitting(true);
    try {
      await submitCheckin(user.uid, {
        date: new Date().toISOString(),
        measurements: sizingForm,
        weight: sizingForm.weight,
        type: 'sizing'
      });
      toast.success('14-Point Body measurements submitted!');
      setSizingForm({
        weight: '', neck: '', shoulder: '', chest: '', waist: '', stomach: '', highHip: '',
        rBicep: '', lBicep: '', rForearm: '', lForearm: '', rThigh: '', lThigh: '', rCalf: '', lCalf: ''
      });
      await loadAllData();
      setShowInputPopup(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit sizing check-in');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><Spinner /></div>;

  const isTodayActivityDone = !!(todayLog?.steps || todayLog?.water || todayLog?.sleepHours || todayLog?.treadmillPhoto);
  const isTodayWellnessDone = !!(todayLog?.energyLevel || todayLog?.mood || todayLog?.dailyNotes);

  // Prepared Chart Data Series
  const activityChartData = [...dailyLogsHistory]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7)
    .map(log => ({
      date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      steps: Number(log.steps) || 0,
      water: Number(log.water) || 0,
      sleep: Number(log.sleepHours) || 0
    }));

  const MEASUREMENT_METRICS = [
    { key: 'weight', label: 'Scale Weight', unit: 'kg' },
    { key: 'neck', label: '1. Neck', unit: 'cm' },
    { key: 'shoulder', label: '2. Shoulder', unit: 'cm' },
    { key: 'chest', label: '3. Chest', unit: 'cm' },
    { key: 'waist', label: '4. Waist', unit: 'cm' },
    { key: 'stomach', label: '5. Stomach', unit: 'cm' },
    { key: 'highHip', label: '6. High Hip', unit: 'cm' },
    { key: 'rBicep', label: '7. Right Bicep', unit: 'cm' },
    { key: 'lBicep', label: '8. Left Bicep', unit: 'cm' },
    { key: 'rForearm', label: '9. Right Forearm', unit: 'cm' },
    { key: 'lForearm', label: '10. Left Forearm', unit: 'cm' },
    { key: 'rThigh', label: '11. Right Thigh', unit: 'cm' },
    { key: 'lThigh', label: '12. Left Thigh', unit: 'cm' },
    { key: 'rCalf', label: '13. Right Calf', unit: 'cm' },
    { key: 'lCalf', label: '14. Left Calf', unit: 'cm' },
  ];

  const currentMetric = MEASUREMENT_METRICS.find(m => m.key === selectedMeasurementKey) || MEASUREMENT_METRICS[0];

  const measurementChartSeries = [...checkinsHistory]
    .map(c => {
      const dVal = selectedMeasurementKey === 'weight'
        ? parseFloat(c.weight || c.measurements?.weight || 0)
        : parseFloat(c.measurements?.[selectedMeasurementKey] || 0);
      return {
        date: new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: dVal
      };
    })
    .filter(d => !isNaN(d.value) && d.value > 0)
    .slice(-10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '90px' }} className="animate-fade-up">
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 4px 0', color: '#FFFFFF' }}>
          📊 Client Tracking Hub
        </h2>
        <p style={{ margin: 0, color: 'var(--text-secondary, #AAAAAA)', fontSize: '0.825rem' }}>
          Select a category to view full-screen analytics, log entries, and submit check-ins
        </p>
      </div>

      {/* 4 CATEGORY TRACKING CARDS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* 1. Activity Log Card */}
        <Card onClick={() => { setActiveModal('activity'); setShowInputPopup(false); }} style={styles.hubCard} className="glass-card">
          <div style={styles.hubIconWrapper}>
            <Activity size={22} color="var(--accent, #E00008)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <h3 style={styles.hubTitle}>Activity & Workout Picture</h3>
              {isTodayActivityDone && <Badge variant="success">Logged Today</Badge>}
            </div>
            <p style={styles.hubSub}>
              {todayLog?.steps || 0} steps • {todayLog?.water || 0}L water • {todayLog?.sleepHours || 0}h sleep
            </p>
          </div>
          <ChevronRight size={18} color="var(--text-secondary)" />
        </Card>

        {/* 2. Wellness Log Card */}
        <Card onClick={() => { setActiveModal('wellness'); setShowInputPopup(false); }} style={styles.hubCard} className="glass-card">
          <div style={{ ...styles.hubIconWrapper, backgroundColor: 'rgba(255, 214, 0, 0.15)', borderColor: 'rgba(255, 214, 0, 0.3)' }}>
            <Smile size={22} color="#ffd600" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <h3 style={styles.hubTitle}>Wellness & Mood</h3>
              {isTodayWellnessDone && <Badge variant="success">Logged Today</Badge>}
            </div>
            <p style={styles.hubSub}>
              Energy: {todayLog?.energyLevel || 'Medium'} • Mood: {todayLog?.mood || 'Good'}
            </p>
          </div>
          <ChevronRight size={18} color="var(--text-secondary)" />
        </Card>

        {/* 3. Body Posture (4-Side Pics) Card */}
        <Card onClick={() => { setActiveModal('posture'); setShowInputPopup(false); }} style={{ ...styles.hubCard, borderLeft: '4px solid var(--accent, #E00008)' }} className="glass-card">
          <div style={{ ...styles.hubIconWrapper, backgroundColor: 'rgba(224, 0, 8, 0.15)', borderColor: 'rgba(224, 0, 8, 0.3)' }}>
            <Camera size={22} color="var(--accent, #E00008)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <h3 style={styles.hubTitle}>Body Posture (4-Side Pics)</h3>
              {isCheckinLocked ? (
                <Badge variant="warning">🔒 {daysToGo} Days to Go</Badge>
              ) : (
                <Badge variant="danger">Every 10 Days</Badge>
              )}
            </div>
            <p style={styles.hubSub}>
              {latestCheckinDate ? `Last submitted ${daysPassedSinceCheckin} day(s) ago` : 'No posture check-in submitted yet'}
            </p>
          </div>
          <ChevronRight size={18} color="var(--text-secondary)" />
        </Card>

        {/* 4. Sizing & Measurements Card */}
        <Card onClick={() => { setActiveModal('sizing'); setShowInputPopup(false); }} style={{ ...styles.hubCard, borderLeft: '4px solid #00c853' }} className="glass-card">
          <div style={{ ...styles.hubIconWrapper, backgroundColor: 'rgba(0, 200, 83, 0.15)', borderColor: 'rgba(0, 200, 83, 0.3)' }}>
            <Ruler size={22} color="#00c853" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <h3 style={styles.hubTitle}>Sizing & 14-Point Measurements</h3>
              {isCheckinLocked ? (
                <Badge variant="warning">🔒 {daysToGo} Days to Go</Badge>
              ) : (
                <Badge variant="success">Body Stats</Badge>
              )}
            </div>
            <p style={styles.hubSub}>
              Latest Weight: {checkinsHistory[0]?.weight || checkinsHistory[0]?.measurements?.weight || '--'} kg
            </p>
          </div>
          <ChevronRight size={18} color="var(--text-secondary)" />
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* 100vh FULL-SCREEN MOBILE OVERLAY SHEETS VIA REACT PORTAL                  */}
      {/* ========================================================================= */}
      {mounted && activeModal && createPortal(
        <>
          {/* FULL SCREEN SHEET 1: ACTIVITY & TREADMILL PIC */}
          {activeModal === 'activity' && (
            <div style={styles.fullScreenOverlay} className="animate-fade-up">
          <header style={styles.sheetHeader}>
            <button onClick={() => setActiveModal(null)} style={styles.sheetBackBtn}>
              <ArrowLeft size={22} color="#FFFFFF" />
              <h3 style={styles.sheetTitle}>Activity & Workout Analytics</h3>
            </button>
          </header>

          <div style={styles.sheetContent}>
            
            {/* Prominent Top CTA Button to open Input Popup Modal */}
            <Button onClick={() => setShowInputPopup(true)} style={{ padding: '16px', fontSize: '1rem', fontWeight: 900, borderRadius: '12px' }}>
              <PlusCircle size={20} /> Add Activity & Treadmill Pic
            </Button>

            {/* 3 ANALYTICAL GRAPHS FOR STEPS, WATER & SLEEP */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* GRAPH 1: STEPS */}
              <Card style={styles.chartCard} className="glass-card">
                <h4 style={styles.chartTitle}>👣 7-Day Daily Steps Analytics</h4>
                {activityChartData.length > 0 ? (
                  <div style={{ width: '100%', height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                        <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                        <Bar dataKey="steps" fill="var(--accent, #E00008)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No steps data logged yet.</p>
                )}
              </Card>

              {/* GRAPH 2: WATER INTAKE */}
              <Card style={styles.chartCard} className="glass-card">
                <h4 style={styles.chartTitle}>💧 7-Day Water Intake Analytics (Litres)</h4>
                {activityChartData.length > 0 ? (
                  <div style={{ width: '100%', height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0288d1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#0288d1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                        <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} domain={[0, 'dataMax + 1']} />
                        <Tooltip contentStyle={{ backgroundColor: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="water" stroke="#0288d1" strokeWidth={2} fillOpacity={1} fill="url(#waterGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No water intake logged yet.</p>
                )}
              </Card>

              {/* GRAPH 3: SLEEP HOURS */}
              <Card style={styles.chartCard} className="glass-card">
                <h4 style={styles.chartTitle}>🌙 7-Day Sleep Duration Analytics (Hours)</h4>
                {activityChartData.length > 0 ? (
                  <div style={{ width: '100%', height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7c4dff" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#7c4dff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                        <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} domain={[0, 12]} />
                        <Tooltip contentStyle={{ backgroundColor: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="sleep" stroke="#7c4dff" strokeWidth={2} fillOpacity={1} fill="url(#sleepGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No sleep hours logged yet.</p>
                )}
              </Card>

            </div>

            {/* Submission History */}
            <div>
              <h4 style={styles.historyHeading}><History size={18} /> Submission History (Click to view details)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dailyLogsHistory.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedDetail({ type: 'activity', title: `Activity Log — ${item.date}`, data: item })}
                    style={{ ...styles.historyRowItem, cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.date}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                      👣 {item.steps || 0} steps • 💧 {item.water || 0}L • 🌙 {item.sleepHours || 0}h
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* POPUP INPUT MODAL FOR ACTIVITY */}
          {showInputPopup && (
            <Modal isOpen={showInputPopup} onClose={() => setShowInputPopup(false)} title="Log Today's Activity" size="md">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Input type="number" label="Daily Steps" value={activityForm.steps} onChange={(e) => setActivityForm({...activityForm, steps: e.target.value})} placeholder="e.g. 8000" />
                <Input type="number" step="0.1" label="Water Intake (Litres)" value={activityForm.water} onChange={(e) => setActivityForm({...activityForm, water: e.target.value})} placeholder="e.g. 3.0" />
                <Input type="number" step="0.5" label="Sleep Hours" value={activityForm.sleepHours} onChange={(e) => setActivityForm({...activityForm, sleepHours: e.target.value})} placeholder="e.g. 7.5" />

                {/* Treadmill Wheel Picture Upload Slot */}
                <div style={{ padding: '14px', border: '1px dashed rgba(224,0,8,0.4)', borderRadius: '10px', backgroundColor: 'rgba(224,0,8,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                    🏃 Treadmill Wheel / Workout Photo
                  </div>
                  {activityForm.treadmillPhoto ? (
                    <div style={{ position: 'relative' }}>
                      <img src={getDirectImageUrl(activityForm.treadmillPhoto)} alt="Treadmill" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <label htmlFor="activity-treadmill-popup" style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer', color: '#FFFFFF' }}>
                        Change Pic
                      </label>
                    </div>
                  ) : (
                    <div>
                      <input type="file" accept="image/*" id="activity-treadmill-popup" style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(e, 'activityTreadmill')} disabled={uploadingPhotos['activityTreadmill']} />
                      <label htmlFor="activity-treadmill-popup" style={{ fontSize: '0.78rem', padding: '8px 16px', background: 'var(--accent, #E00008)', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#FFFFFF', fontWeight: 800 }}>
                        {uploadingPhotos['activityTreadmill'] ? <Spinner /> : <Upload size={14} />} {uploadingPhotos['activityTreadmill'] ? 'Uploading...' : 'Upload Treadmill Pic'}
                      </label>
                    </div>
                  )}
                </div>

                <Button onClick={handleSaveActivity} loading={submitting} style={{ padding: '14px', fontWeight: 800, fontSize: '0.95rem' }}>
                  Save Activity Log
                </Button>
              </div>
            </Modal>
          )}

        </div>
      )}

      {/* FULL SCREEN SHEET 2: WELLNESS & MOOD */}
      {activeModal === 'wellness' && (
        <div style={styles.fullScreenOverlay} className="animate-fade-up">
          <header style={styles.sheetHeader}>
            <button onClick={() => setActiveModal(null)} style={styles.sheetBackBtn}>
              <ArrowLeft size={22} color="#FFFFFF" />
              <h3 style={styles.sheetTitle}>Wellness & Mood Analytics</h3>
            </button>
          </header>

          <div style={styles.sheetContent}>
            
            {/* Prominent CTA Button */}
            <Button onClick={() => setShowInputPopup(true)} style={{ padding: '16px', fontSize: '1rem', fontWeight: 900, borderRadius: '12px' }}>
              <PlusCircle size={20} /> Add Wellness Log
            </Button>

            {/* Submission History */}
            <div>
              <h4 style={styles.historyHeading}><History size={18} /> Submission History (Click to view details)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dailyLogsHistory.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedDetail({ type: 'wellness', title: `Wellness Log — ${item.date}`, data: item })}
                    style={{ ...styles.historyRowItem, cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.date}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                      ⚡ {item.energyLevel || '--'} • 😊 {item.mood || '--'} {item.dailyNotes ? `("${item.dailyNotes}")` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* POPUP INPUT MODAL FOR WELLNESS */}
          {showInputPopup && (
            <Modal isOpen={showInputPopup} onClose={() => setShowInputPopup(false)} title="Log Today's Wellness" size="md">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Select label="Sleep Quality" value={wellnessForm.sleepQuality} onChange={(e) => setWellnessForm({...wellnessForm, sleepQuality: e.target.value})} options={[{ label: 'Excellent 🌟', value: 'Excellent' }, { label: 'Good 😊', value: 'Good' }, { label: 'Average 😐', value: 'Average' }, { label: 'Poor 😫', value: 'Poor' }]} />
                <Select label="Energy Level" value={wellnessForm.energyLevel} onChange={(e) => setWellnessForm({...wellnessForm, energyLevel: e.target.value})} options={[{ label: 'High 🔥', value: 'High' }, { label: 'Medium ⚡', value: 'Medium' }, { label: 'Low 😴', value: 'Low' }]} />
                <Select label="Mood" value={wellnessForm.mood} onChange={(e) => setWellnessForm({...wellnessForm, mood: e.target.value})} options={[{ label: 'Great 😄', value: 'Great' }, { label: 'Good 🙂', value: 'Good' }, { label: 'Stressed 😓', value: 'Stressed' }, { label: 'Tired 😴', value: 'Tired' }]} />
                <Textarea label="Daily Wellness Notes" value={wellnessForm.dailyNotes} onChange={(e) => setWellnessForm({...wellnessForm, dailyNotes: e.target.value})} placeholder="Notes about your day, recovery, or diet..." rows={3} />

                <Button onClick={handleSaveWellness} loading={submitting} style={{ padding: '14px', fontWeight: 800 }}>
                  Save Wellness Log
                </Button>
              </div>
            </Modal>
          )}

        </div>
      )}

      {/* FULL SCREEN SHEET 3: BODY POSTURE (4 SIDES) */}
      {activeModal === 'posture' && (
        <div style={styles.fullScreenOverlay} className="animate-fade-up">
          <header style={styles.sheetHeader}>
            <button onClick={() => setActiveModal(null)} style={styles.sheetBackBtn}>
              <ArrowLeft size={22} color="#FFFFFF" />
              <h3 style={styles.sheetTitle}>10-Day Body Posture History</h3>
            </button>
          </header>

          <div style={styles.sheetContent}>
            
            {/* Lockout Notice or Add Check-in CTA Button */}
            {isCheckinLocked ? (
              <Card style={styles.lockedCard} className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Lock size={22} color="#ffd600" />
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#ffd600', fontWeight: 900 }}>Check-in Locked</h4>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#FFFFFF', lineHeight: 1.5 }}>
                  You submitted your 10-day check-in <strong>{daysPassedSinceCheckin} day(s) ago</strong>. Next submission unlocks in <strong style={{ color: '#ffd600' }}>{daysToGo} day(s)</strong>.
                </p>
                <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${(daysPassedSinceCheckin / 10) * 100}%`, height: '100%', backgroundColor: '#ffd600' }} />
                </div>
              </Card>
            ) : (
              <Button onClick={() => setShowInputPopup(true)} style={{ padding: '16px', fontSize: '1rem', fontWeight: 900, borderRadius: '12px' }}>
                <PlusCircle size={20} /> Submit 10-Day Posture Check-in
              </Button>
            )}

            {/* Check-in History */}
            <div>
              <h4 style={styles.historyHeading}><History size={18} /> Check-in History (Click card to view details)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {checkinsHistory.map((c, idx) => {
                  const dateNice = c.date ? new Date(c.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Check-in';
                  const photosObj = c.photos || {};

                  return (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedDetail({ type: 'posture', title: `Body Posture Check-in — ${dateNice}`, data: c })}
                      style={{ ...styles.historyBox, cursor: 'pointer' }}
                      className="glass-card-hover"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF' }}>📅 {dateNice}</span>
                        <Badge variant={c.reviewed ? 'success' : 'warning'}>{c.reviewed ? 'Reviewed' : 'Pending Review'}</Badge>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginTop: '8px' }}>
                        {[
                          { key: 'front', tag: 'Front' },
                          { key: 'back', tag: 'Back' },
                          { key: 'left', tag: 'Left' },
                          { key: 'right', tag: 'Right' },
                          { key: 'treadmillWheel', tag: 'Cardio' }
                        ].map(({ key, tag }) => {
                          const pUrl = photosObj[key];
                          if (!pUrl) return null;
                          return (
                            <div key={key} style={{ textAlign: 'center' }}>
                              <img src={getDirectImageUrl(pUrl)} alt={tag} style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{tag}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* POPUP INPUT MODAL FOR POSTURE */}
          {showInputPopup && !isCheckinLocked && (
            <Modal isOpen={showInputPopup} onClose={() => setShowInputPopup(false)} title="Submit 10-Day Body Posture (4 Sides)" size="md">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Upload photos every 10 days to monitor physique changes.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { side: 'front', label: '1. Front View' },
                    { side: 'back', label: '2. Back View' },
                    { side: 'left', label: '3. Left View' },
                    { side: 'right', label: '4. Right View' },
                    { side: 'treadmillWheel', label: '5. Treadmill / Workout' }
                  ].map(({ side, label }) => {
                    const url = posturePhotos[side];
                    const isUploading = uploadingPhotos[side];
                    return (
                      <div key={side} style={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(255, 255, 255, 0.12)', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                          {label}
                        </div>
                        {url ? (
                          <div style={{ position: 'relative' }}>
                            <img src={getDirectImageUrl(url)} alt={side} style={{ width: '100%', height: '85px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                            <label htmlFor={`posture-popup-${side}`} style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', color: '#FFFFFF' }}>
                              Change
                            </label>
                          </div>
                        ) : (
                          <div style={{ padding: '8px 0' }}>
                            <input type="file" accept="image/*" id={`posture-popup-${side}`} style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(e, side)} disabled={isUploading} />
                            <label htmlFor={`posture-popup-${side}`} style={{ fontSize: '0.72rem', padding: '6px 12px', background: 'rgba(224, 0, 8, 0.15)', border: '1px solid rgba(224, 0, 8, 0.3)', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#FFFFFF', fontWeight: 700 }}>
                              {isUploading ? <Spinner /> : <Upload size={12} />} {isUploading ? 'Uploading...' : 'Upload'}
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button onClick={handleSavePosture} loading={submitting} style={{ padding: '14px', fontSize: '0.95rem', fontWeight: 800 }}>
                  Submit Check-in
                </Button>
              </div>
            </Modal>
          )}

        </div>
      )}

      {/* FULL SCREEN SHEET 4: SIZING & 14-POINT MEASUREMENTS */}
      {activeModal === 'sizing' && (
        <div style={styles.fullScreenOverlay} className="animate-fade-up">
          <header style={styles.sheetHeader}>
            <button onClick={() => setActiveModal(null)} style={styles.sheetBackBtn}>
              <ArrowLeft size={22} color="#FFFFFF" />
              <h3 style={styles.sheetTitle}>Sizing & 14-Point Measurements</h3>
            </button>
          </header>

          <div style={styles.sheetContent}>
            
            {/* Lockout Notice or Add Measurements CTA Button */}
            {isCheckinLocked ? (
              <Card style={styles.lockedCard} className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Lock size={22} color="#ffd600" />
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#ffd600', fontWeight: 900 }}>Check-in Locked</h4>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#FFFFFF', lineHeight: 1.5 }}>
                  Measurements are submitted once every 10 days. Next submission unlocks in <strong style={{ color: '#ffd600' }}>{daysToGo} day(s)</strong>.
                </p>
              </Card>
            ) : (
              <Button onClick={() => setShowInputPopup(true)} style={{ padding: '16px', fontSize: '1rem', fontWeight: 900, borderRadius: '12px' }}>
                <PlusCircle size={20} /> Submit 14-Point Measurements
              </Button>
            )}

            {/* 14-Point & Weight Progress Analytics with Interactive Metric Toggle */}
            <Card style={styles.chartCard} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={styles.chartTitle}>📈 {currentMetric.label} Progress Analytics</h4>
                <Badge variant="success">Unit: {currentMetric.unit}</Badge>
              </div>

              {/* TOGGLE CHIPS FOR 14 MEASUREMENT POINTS + WEIGHT */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '12px' }} className="no-scrollbar">
                {MEASUREMENT_METRICS.map(m => {
                  const active = m.key === selectedMeasurementKey;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setSelectedMeasurementKey(m.key)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: active ? 900 : 600,
                        whiteSpace: 'nowrap',
                        border: active ? '1px solid #00c853' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: active ? 'rgba(0, 200, 83, 0.25)' : 'rgba(255,255,255,0.03)',
                        color: active ? '#00c853' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* DYNAMIC CHART FOR SELECTED ANATOMICAL METRIC */}
              {measurementChartSeries.length > 0 ? (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={measurementChartSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="measGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00c853" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#00c853" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} axisLine={false} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} 
                        formatter={(val) => [`${val} ${currentMetric.unit}`, currentMetric.label]} 
                      />
                      <Area type="monotone" dataKey="value" stroke="#00c853" strokeWidth={2} fillOpacity={1} fill="url(#measGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', margin: 0, padding: '20px 0', textAlign: 'center' }}>
                  No logged history available for {currentMetric.label}.
                </p>
              )}
            </Card>

            {/* Sizing & Measurement History */}
            <div>
              <h4 style={styles.historyHeading}><History size={18} /> Measurement History (Click to view details)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {checkinsHistory.filter(c => c.measurements || c.weight).map((c, idx) => {
                  const dateNice = c.date ? new Date(c.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Check-in';
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedDetail({ type: 'sizing', title: `14-Point Measurements — ${dateNice}`, data: c })}
                      style={{ ...styles.historyRowItem, cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF' }}>📅 {dateNice}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00c853' }}>
                        Scale: {c.weight || c.measurements?.weight || '--'} kg
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* POPUP INPUT MODAL FOR MEASUREMENTS */}
          {showInputPopup && !isCheckinLocked && (
            <Modal isOpen={showInputPopup} onClose={() => setShowInputPopup(false)} title="Record 14-Point Measurements (cm)" size="md">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Input type="number" label="Body Weight (kg) *" value={sizingForm.weight} onChange={(e) => setSizingForm({...sizingForm, weight: e.target.value})} required />
                  </div>

                  <Input type="number" label="1. Neck" value={sizingForm.neck} onChange={(e) => setSizingForm({...sizingForm, neck: e.target.value})} />
                  <Input type="number" label="2. Shoulder" value={sizingForm.shoulder} onChange={(e) => setSizingForm({...sizingForm, shoulder: e.target.value})} />
                  <Input type="number" label="3. Chest" value={sizingForm.chest} onChange={(e) => setSizingForm({...sizingForm, chest: e.target.value})} />
                  <Input type="number" label="4. Waist" value={sizingForm.waist} onChange={(e) => setSizingForm({...sizingForm, waist: e.target.value})} />
                  <Input type="number" label="5. Stomach" value={sizingForm.stomach} onChange={(e) => setSizingForm({...sizingForm, stomach: e.target.value})} />
                  <Input type="number" label="6. High Hip" value={sizingForm.highHip} onChange={(e) => setSizingForm({...sizingForm, highHip: e.target.value})} />
                  <Input type="number" label="7. Right Bicep" value={sizingForm.rBicep} onChange={(e) => setSizingForm({...sizingForm, rBicep: e.target.value})} />
                  <Input type="number" label="8. Left Bicep" value={sizingForm.lBicep} onChange={(e) => setSizingForm({...sizingForm, lBicep: e.target.value})} />
                  <Input type="number" label="9. Right Forearm" value={sizingForm.rForearm} onChange={(e) => setSizingForm({...sizingForm, rForearm: e.target.value})} />
                  <Input type="number" label="10. Left Forearm" value={sizingForm.lForearm} onChange={(e) => setSizingForm({...sizingForm, lForearm: e.target.value})} />
                  <Input type="number" label="11. Right Thigh" value={sizingForm.rThigh} onChange={(e) => setSizingForm({...sizingForm, rThigh: e.target.value})} />
                  <Input type="number" label="12. Left Thigh" value={sizingForm.lThigh} onChange={(e) => setSizingForm({...sizingForm, lThigh: e.target.value})} />
                  <Input type="number" label="13. Right Calf" value={sizingForm.rCalf} onChange={(e) => setSizingForm({...sizingForm, rCalf: e.target.value})} />
                  <Input type="number" label="14. Left Calf" value={sizingForm.lCalf} onChange={(e) => setSizingForm({...sizingForm, lCalf: e.target.value})} />
                </div>

                <Button onClick={handleSaveSizing} loading={submitting} style={{ padding: '14px', fontSize: '0.95rem', fontWeight: 800, marginTop: '8px' }}>
                  Submit Measurements
                </Button>
              </div>
            </Modal>
          )}

        </div>
      )}

      {/* SUBMITTED INFO DETAIL MODAL */}
      {selectedDetail && (
        <Modal 
          isOpen={!!selectedDetail} 
          onClose={() => setSelectedDetail(null)} 
          title={selectedDetail.title} 
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 1. POSTURE CHECK-IN DETAIL */}
            {selectedDetail.type === 'posture' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status</span>
                  <Badge variant={selectedDetail.data.reviewed ? 'success' : 'warning'}>
                    {selectedDetail.data.reviewed ? 'Reviewed by Coach' : 'Pending Review'}
                  </Badge>
                </div>

                <h5 style={{ margin: '0', fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 800 }}>Submitted 4-Angle & Cardio Photos (Click photo to zoom)</h5>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { key: 'front', label: '1. Front View' },
                    { key: 'back', label: '2. Back View' },
                    { key: 'left', label: '3. Left View' },
                    { key: 'right', label: '4. Right View' },
                    { key: 'treadmillWheel', label: '5. Treadmill / Workout' }
                  ].map(({ key, label }) => {
                    const url = selectedDetail.data.photos?.[key];
                    if (!url) return null;
                    return (
                      <div 
                        key={key} 
                        onClick={() => setZoomImage({ url: getDirectImageUrl(url), label })}
                        style={{ cursor: 'pointer', textAlign: 'center', padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <img src={getDirectImageUrl(url)} alt={label} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px' }} />
                        <div style={{ fontSize: '0.72rem', color: '#FFFFFF', fontWeight: 700, marginTop: '4px' }}>{label} 🔍</div>
                      </div>
                    );
                  })}
                </div>

                {selectedDetail.data.notes && (
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(224, 0, 8, 0.08)', border: '1px solid rgba(224, 0, 8, 0.2)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 800 }}>Coach Notes</div>
                    <div style={{ fontSize: '0.85rem', color: '#FFFFFF', marginTop: '4px' }}>{selectedDetail.data.notes}</div>
                  </div>
                )}
              </>
            )}

            {/* 2. SIZING MEASUREMENTS DETAIL */}
            {selectedDetail.type === 'sizing' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(0,200,83,0.08)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Body Weight</span>
                  <span style={{ fontSize: '1.1rem', color: '#00c853', fontWeight: 900 }}>{selectedDetail.data.weight || selectedDetail.data.measurements?.weight || '--'} kg</span>
                </div>

                <h5 style={{ margin: '0', fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 800 }}>14-Point Body Measurements (cm)</h5>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { key: 'neck', label: '1. Neck' },
                    { key: 'shoulder', label: '2. Shoulder' },
                    { key: 'chest', label: '3. Chest' },
                    { key: 'waist', label: '4. Waist' },
                    { key: 'stomach', label: '5. Stomach' },
                    { key: 'highHip', label: '6. High Hip' },
                    { key: 'rBicep', label: '7. Right Bicep' },
                    { key: 'lBicep', label: '8. Left Bicep' },
                    { key: 'rForearm', label: '9. Right Forearm' },
                    { key: 'lForearm', label: '10. Left Forearm' },
                    { key: 'rThigh', label: '11. Right Thigh' },
                    { key: 'lThigh', label: '12. Left Thigh' },
                    { key: 'rCalf', label: '13. Right Calf' },
                    { key: 'lCalf', label: '14. Left Calf' }
                  ].map(({ key, label }) => {
                    const val = selectedDetail.data.measurements?.[key];
                    return (
                      <div key={key} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF' }}>{val ? `${val} cm` : '--'}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* 3. ACTIVITY LOG DETAIL */}
            {selectedDetail.type === 'activity' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Daily Steps</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--accent)' }}>{selectedDetail.data.steps || 0}</div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Water Intake</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0288d1' }}>{selectedDetail.data.water || 0} L</div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Sleep Duration</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#7c4dff' }}>{selectedDetail.data.sleepHours || 0} h</div>
                  </div>
                </div>

                {selectedDetail.data.treadmillPhoto && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>🏃 Treadmill Wheel / Workout Photo</div>
                    <img 
                      src={getDirectImageUrl(selectedDetail.data.treadmillPhoto)} 
                      alt="Treadmill" 
                      onClick={() => setZoomImage({ url: getDirectImageUrl(selectedDetail.data.treadmillPhoto), label: 'Treadmill Wheel Photo' })}
                      style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} 
                    />
                  </div>
                )}
              </>
            )}

            {/* 4. WELLNESS LOG DETAIL */}
            {selectedDetail.type === 'wellness' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Sleep Quality</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF' }}>{selectedDetail.data.sleepQuality || '--'}</div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Energy Level</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffd600' }}>{selectedDetail.data.energyLevel || '--'}</div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Mood</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#00c853' }}>{selectedDetail.data.mood || '--'}</div>
                  </div>
                </div>

                {selectedDetail.data.dailyNotes && (
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Wellness Notes</div>
                    <div style={{ fontSize: '0.85rem', color: '#FFFFFF', marginTop: '4px' }}>"{selectedDetail.data.dailyNotes}"</div>
                  </div>
                )}
              </>
            )}

          </div>
        </Modal>
      )}

      {/* HIGH-RES IMAGE ZOOM LIGHTBOX */}
      {zoomImage && (
        <Modal isOpen={!!zoomImage} onClose={() => setZoomImage(null)} title={zoomImage.label || 'Photo Preview'} size="lg">
          <div style={{ textAlign: 'center' }}>
            <img src={zoomImage.url} alt={zoomImage.label} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
        </Modal>
      )}

        </>,
        document.body
      )}

    </div>
  );
}

const styles = {
  hubCard: { padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'all 0.2s' },
  hubIconWrapper: { width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(224, 0, 8, 0.12)', border: '1px solid rgba(224, 0, 8, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  hubTitle: { fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#FFFFFF' },
  hubSub: { fontSize: '0.78rem', color: 'var(--text-secondary, #AAAAAA)', margin: 0 },
  fullScreenOverlay: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    zIndex: 99999, 
    backgroundColor: '#080808', 
    overflowY: 'auto', 
    display: 'flex', 
    flexDirection: 'column' 
  },
  sheetHeader: { 
    position: 'sticky', 
    top: 0, 
    zIndex: 100, 
    backgroundColor: 'rgba(18, 18, 20, 0.98)', 
    backdropFilter: 'blur(20px)', 
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
    padding: '16px', 
    display: 'flex', 
    alignItems: 'center', 
    justify: 'space-between' 
  },
  sheetBackBtn: { display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 0 },
  sheetTitle: { margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#FFFFFF', textAlign: 'left' },
  sheetCloseBtn: { background: 'rgba(255,255,255,0.08)', border: 'none', color: '#FFFFFF', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  sheetContent: { padding: '24px 16px 100px 16px', maxWidth: '750px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' },
  chartCard: { padding: '18px' },
  chartTitle: { margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 900, color: '#FFFFFF' },
  sectionCard: { padding: '18px' },
  cardHeaderTitle: { margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 900, color: '#FFFFFF' },
  historyHeading: { margin: '0 0 12px 0', fontSize: '0.95rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900 },
  historyRowItem: { padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  historyBox: { padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' },
  lockedCard: { padding: '18px', backgroundColor: 'rgba(255, 214, 0, 0.08)', border: '1px solid rgba(255, 214, 0, 0.35)' }
};
