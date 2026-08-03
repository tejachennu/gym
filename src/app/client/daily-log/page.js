'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  submitDailyLog, 
  getDailyLog, 
  getClientDailyLogs, 
  submitCheckin, 
  getClientCheckins 
} from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Loading';
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
  Zap
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

  // Active Modal view state: null | 'activity' | 'wellness' | 'posture' | 'sizing'
  const [activeModal, setActiveModal] = useState(null);

  // Data states
  const [todayLog, setTodayLog] = useState(null);
  const [dailyLogsHistory, setDailyLogsHistory] = useState([]);
  const [checkinsHistory, setCheckinsHistory] = useState([]);

  // Form states
  const [activityForm, setActivityForm] = useState({ steps: '', water: '', sleepHours: '' });
  const [wellnessForm, setWellnessForm] = useState({ sleepQuality: 'Good', energyLevel: 'Medium', mood: 'Good', dailyNotes: '' });
  
  // Posture photos state
  const [posturePhotos, setPosturePhotos] = useState({ front: '', back: '', left: '', right: '' });
  const [uploadingPhotos, setUploadingPhotos] = useState({});

  // Sizing measurements state
  const [sizingForm, setSizingForm] = useState({
    weight: '', chest: '', waist: '', abdomen: '', hip: '', lArm: '', rArm: '', lThigh: '', rThigh: ''
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
          sleepHours: log.sleepHours || ''
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
      toast.success('Activity log saved!');
      await loadAllData();
      setActiveModal(null);
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
      toast.success('Wellness log saved!');
      await loadAllData();
      setActiveModal(null);
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
        setPosturePhotos(prev => ({ ...prev, [side]: data.fileUrl }));
        toast.success(`${side.toUpperCase()} photo uploaded!`);
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
    if (!posturePhotos.front && !posturePhotos.back && !posturePhotos.left && !posturePhotos.right) {
      return toast.warning('Please upload at least one posture photo');
    }
    setSubmitting(true);
    try {
      await submitCheckin({
        clientId: user.uid,
        date: todayDateString,
        photos: posturePhotos,
        type: 'posture'
      });
      toast.success('10-Day Body Posture check-in submitted!');
      setPosturePhotos({ front: '', back: '', left: '', right: '' });
      await loadAllData();
      setActiveModal(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit posture check-in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSizing = async () => {
    if (!user?.uid) return;
    if (!sizingForm.weight) {
      return toast.warning('Please enter body weight');
    }
    setSubmitting(true);
    try {
      await submitCheckin({
        clientId: user.uid,
        date: todayDateString,
        measurements: sizingForm,
        weight: sizingForm.weight,
        type: 'sizing'
      });
      toast.success('Body measurements check-in submitted!');
      setSizingForm({ weight: '', chest: '', waist: '', abdomen: '', hip: '', lArm: '', rArm: '', lThigh: '', rThigh: '' });
      await loadAllData();
      setActiveModal(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save measurements');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <Spinner />
    </div>
  );

  // Status indicators
  const isActivityLogged = !!(todayLog?.steps || todayLog?.water || todayLog?.sleepHours);
  const isWellnessLogged = !!(todayLog?.energyLevel || todayLog?.mood || todayLog?.dailyNotes);

  const latestCheckin = checkinsHistory.length > 0 ? checkinsHistory[0] : null;
  const daysSinceCheckin = latestCheckin 
    ? Math.max(0, Math.floor((new Date() - new Date(latestCheckin.date || latestCheckin.createdAt?.seconds * 1000 || new Date())) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '85px' }} className="animate-fade-up">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>Tracking Hub</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          Select a category to log details, submit check-ins, or view history
        </p>
      </div>

      {/* 4 Interactive Section Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* 1. Activity Card */}
        <div 
          onClick={() => setActiveModal('activity')}
          style={styles.trackingCard}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ ...styles.iconCircle, backgroundColor: 'rgba(77, 171, 247, 0.12)', border: '1px solid rgba(77, 171, 247, 0.25)' }}>
              <Activity size={20} color="#4dabf7" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#FFFFFF', fontWeight: 700 }}>Activity</h3>
                {isActivityLogged ? (
                  <span style={styles.doneTag}>✓ Today's Logged</span>
                ) : (
                  <span style={styles.pendingTag}>Pending</span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>
                {isActivityLogged 
                  ? `${todayLog.steps || 0} steps • ${todayLog.water || 0}L water • ${todayLog.sleepHours || 0}h sleep`
                  : 'Log steps, water intake & sleep hours'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
        </div>

        {/* 2. Wellness Card */}
        <div 
          onClick={() => setActiveModal('wellness')}
          style={styles.trackingCard}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ ...styles.iconCircle, backgroundColor: 'rgba(255, 135, 135, 0.12)', border: '1px solid rgba(255, 135, 135, 0.25)' }}>
              <Smile size={20} color="#ff8787" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#FFFFFF', fontWeight: 700 }}>Wellness</h3>
                {isWellnessLogged ? (
                  <span style={styles.doneTag}>✓ Today's Logged</span>
                ) : (
                  <span style={styles.pendingTag}>Pending</span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>
                {isWellnessLogged 
                  ? `Energy: ${todayLog.energyLevel || '--'} • Mood: ${todayLog.mood || '--'}`
                  : 'Record energy level, mood & daily notes'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
        </div>

        {/* 3. Body Posture Card (4 Sides Pics - Every 10 Days) */}
        <div 
          onClick={() => setActiveModal('posture')}
          style={{ ...styles.trackingCard, borderLeft: '3px solid var(--accent, #E00008)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ ...styles.iconCircle, backgroundColor: 'rgba(224, 0, 8, 0.12)', border: '1px solid rgba(224, 0, 8, 0.25)' }}>
              <Camera size={20} color="var(--accent, #E00008)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#FFFFFF', fontWeight: 700 }}>Body Posture (4-Side Pics)</h3>
                <span style={{ fontSize: '0.68rem', background: 'rgba(224, 0, 8, 0.15)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '10px', border: '1px solid rgba(224, 0, 8, 0.3)' }}>Every 10 Days</span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>
                {daysSinceCheckin !== null 
                  ? `Last submitted ${daysSinceCheckin} days ago`
                  : 'Upload Front, Back, Left & Right posture photos'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
        </div>

        {/* 4. Sizing & Measurements Card */}
        <div 
          onClick={() => setActiveModal('sizing')}
          style={{ ...styles.trackingCard, borderLeft: '3px solid #ffb300' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ ...styles.iconCircle, backgroundColor: 'rgba(255, 179, 0, 0.12)', border: '1px solid rgba(255, 179, 0, 0.25)' }}>
              <Ruler size={20} color="#ffb300" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#FFFFFF', fontWeight: 700 }}>Sizing & Measurements</h3>
                <span style={{ fontSize: '0.68rem', background: 'rgba(255, 179, 0, 0.15)', color: '#ffb300', padding: '2px 6px', borderRadius: '10px', border: '1px solid rgba(255, 179, 0, 0.3)' }}>Body Stats</span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>
                {latestCheckin?.weight 
                  ? `Latest Weight: ${latestCheckin.weight} kg`
                  : 'Track body circumferences (Chest, Waist, Hips, etc.)'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
        </div>

      </div>

      {/* ================= MODALS & HISTORY VIEWS ================= */}

      {/* 1. Activity Modal */}
      <Modal
        isOpen={activeModal === 'activity'}
        onClose={() => setActiveModal(null)}
        title="Activity Log & History"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#FFFFFF' }}>Log Today's Activity</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Input type="number" label="Daily Steps" placeholder="e.g. 8000" value={activityForm.steps} onChange={(e) => setActivityForm({...activityForm, steps: e.target.value})} size="compact" />
              <Input type="number" label="Water Intake (Litres)" placeholder="e.g. 2.5" value={activityForm.water} onChange={(e) => setActivityForm({...activityForm, water: e.target.value})} size="compact" />
              <Input type="number" label="Sleep Hours" placeholder="e.g. 7" value={activityForm.sleepHours} onChange={(e) => setActivityForm({...activityForm, sleepHours: e.target.value})} size="compact" />
              <Button onClick={handleSaveActivity} loading={submitting} style={{ backgroundColor: '#4dabf7', color: 'white', marginTop: '6px', borderRadius: '10px', fontSize: '0.85rem' }}>
                Save Activity
              </Button>
            </div>
          </div>

          {/* Activity History */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={14} /> Submission History
            </h4>
            {dailyLogsHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {dailyLogsHistory.map((item, idx) => (
                  <div key={idx} style={styles.historyRow}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.date || item.id}</span>
                    <span style={{ fontSize: '0.8rem', color: '#FFFFFF' }}>
                      👣 {item.steps || 0} steps • 💧 {item.water || 0}L • 🌙 {item.sleepHours || 0}h
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic', margin: 0 }}>No past activity logs found.</p>
            )}
          </div>
        </div>
      </Modal>

      {/* 2. Wellness Modal */}
      <Modal
        isOpen={activeModal === 'wellness'}
        onClose={() => setActiveModal(null)}
        title="Wellness Log & History"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#FFFFFF' }}>Log Today's Wellness</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Select label="Sleep Quality" value={wellnessForm.sleepQuality} onChange={(e) => setWellnessForm({...wellnessForm, sleepQuality: e.target.value})} options={['Excellent', 'Good', 'Fair', 'Poor']} size="compact" />
              <Select label="Energy Level" value={wellnessForm.energyLevel} onChange={(e) => setWellnessForm({...wellnessForm, energyLevel: e.target.value})} options={['High', 'Medium', 'Low']} size="compact" />
              <Select label="Mood" value={wellnessForm.mood} onChange={(e) => setWellnessForm({...wellnessForm, mood: e.target.value})} options={['Great', 'Good', 'Okay', 'Bad']} size="compact" />
              <Textarea label="Daily Notes" placeholder="Any specific issues or achievements?" value={wellnessForm.dailyNotes} onChange={(e) => setWellnessForm({...wellnessForm, dailyNotes: e.target.value})} rows={2} size="compact" />
              <Button onClick={handleSaveWellness} loading={submitting} style={{ backgroundColor: '#ff8787', color: 'white', marginTop: '6px', borderRadius: '10px', fontSize: '0.85rem' }}>
                Save Wellness
              </Button>
            </div>
          </div>

          {/* Wellness History */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={14} /> Submission History
            </h4>
            {dailyLogsHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {dailyLogsHistory.map((item, idx) => (
                  <div key={idx} style={styles.historyRow}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.date || item.id}</span>
                    <span style={{ fontSize: '0.8rem', color: '#FFFFFF' }}>
                      ⚡ {item.energyLevel || '--'} • 😊 {item.mood || '--'} {item.dailyNotes ? `("${item.dailyNotes}")` : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic', margin: 0 }}>No past wellness logs found.</p>
            )}
          </div>
        </div>
      </Modal>

      {/* 3. Body Posture Modal (4 Sides Pics - Every 10 Days) */}
      <Modal
        isOpen={activeModal === 'posture'}
        onClose={() => setActiveModal(null)}
        title="10-Day Body Posture (4 Sides)"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#FFFFFF' }}>Submit 4-Side Body Posture Photos</h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Recommended once every 10 days to track physique changes.</p>
            
            {/* 4 Photo Upload Slots */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
              {['front', 'back', 'left', 'right'].map((side) => {
                const url = posturePhotos[side];
                const isUploading = uploadingPhotos[side];
                return (
                  <div key={side} style={{ padding: '8px', border: '1px dashed var(--border)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px', textTransform: 'capitalize' }}>
                      {side} View
                    </div>
                    {url ? (
                      <img src={getDirectImageUrl(url)} alt={side} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
                    ) : (
                      <div>
                        <input type="file" accept="image/*" id={`posture-${side}`} style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(e, side)} disabled={isUploading} />
                        <label htmlFor={`posture-${side}`} style={{ fontSize: '0.72rem', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#FFFFFF' }}>
                          {isUploading ? <Spinner /> : <Upload size={12} />} {isUploading ? 'Uploading...' : 'Upload'}
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button onClick={handleSavePosture} loading={submitting} style={{ backgroundColor: 'var(--accent, #E00008)', color: 'white', width: '100%', borderRadius: '10px', fontSize: '0.85rem' }}>
              Submit Posture Check-in
            </Button>
          </div>

          {/* Posture History */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={14} /> Check-in History
            </h4>
            {checkinsHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                {checkinsHistory.map((c, idx) => (
                  <div key={idx} style={{ ...styles.historyRow, flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>{c.date || 'Check-in'}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {c.photos?.front && <img src={getDirectImageUrl(c.photos.front)} alt="Front" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />}
                      {c.photos?.back && <img src={getDirectImageUrl(c.photos.back)} alt="Back" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />}
                      {c.photos?.left && <img src={getDirectImageUrl(c.photos.left)} alt="Left" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />}
                      {c.photos?.right && <img src={getDirectImageUrl(c.photos.right)} alt="Right" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic', margin: 0 }}>No posture check-in history found.</p>
            )}
          </div>
        </div>
      </Modal>

      {/* 4. Sizing Modal */}
      <Modal
        isOpen={activeModal === 'sizing'}
        onClose={() => setActiveModal(null)}
        title="Sizing & Body Measurements"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#FFFFFF' }}>Submit Body Measurements</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <Input type="number" label="Weight (kg) *" placeholder="75" value={sizingForm.weight} onChange={(e) => setSizingForm({...sizingForm, weight: e.target.value})} size="compact" />
              <Input type="number" label="Chest (cm)" placeholder="95" value={sizingForm.chest} onChange={(e) => setSizingForm({...sizingForm, chest: e.target.value})} size="compact" />
              <Input type="number" label="Waist (cm)" placeholder="80" value={sizingForm.waist} onChange={(e) => setSizingForm({...sizingForm, waist: e.target.value})} size="compact" />
              <Input type="number" label="Abdomen (cm)" placeholder="82" value={sizingForm.abdomen} onChange={(e) => setSizingForm({...sizingForm, abdomen: e.target.value})} size="compact" />
              <Input type="number" label="Hip (cm)" placeholder="90" value={sizingForm.hip} onChange={(e) => setSizingForm({...sizingForm, hip: e.target.value})} size="compact" />
              <Input type="number" label="Left Arm (cm)" placeholder="32" value={sizingForm.lArm} onChange={(e) => setSizingForm({...sizingForm, lArm: e.target.value})} size="compact" />
              <Input type="number" label="Right Arm (cm)" placeholder="32" value={sizingForm.rArm} onChange={(e) => setSizingForm({...sizingForm, rArm: e.target.value})} size="compact" />
              <Input type="number" label="Left Thigh (cm)" placeholder="55" value={sizingForm.lThigh} onChange={(e) => setSizingForm({...sizingForm, lThigh: e.target.value})} size="compact" />
              <Input type="number" label="Right Thigh (cm)" placeholder="55" value={sizingForm.rThigh} onChange={(e) => setSizingForm({...sizingForm, rThigh: e.target.value})} size="compact" />
            </div>
            <Button onClick={handleSaveSizing} loading={submitting} style={{ backgroundColor: '#ffb300', color: 'white', width: '100%', marginTop: '10px', borderRadius: '10px', fontSize: '0.85rem' }}>
              Save Body Measurements
            </Button>
          </div>

          {/* Sizing History */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={14} /> Measurements History
            </h4>
            {checkinsHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {checkinsHistory.map((c, idx) => (
                  <div key={idx} style={styles.historyRow}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.date || 'Record'}</span>
                    <span style={{ fontSize: '0.8rem', color: '#FFFFFF' }}>
                      ⚖️ {c.weight || c.measurements?.weight || '--'}kg • Chest: {c.measurements?.chest || '--'}cm • Waist: {c.measurements?.waist || '--'}cm
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic', margin: 0 }}>No measurement history found.</p>
            )}
          </div>
        </div>
      </Modal>

    </div>
  );
}

const styles = {
  trackingCard: {
    padding: '14px',
    borderRadius: '12px',
    backgroundColor: 'rgba(18, 18, 20, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  iconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTag: {
    fontSize: '0.68rem',
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
    color: '#00c853',
    padding: '2px 6px',
    borderRadius: '10px',
    fontWeight: 600,
  },
  pendingTag: {
    fontSize: '0.68rem',
    backgroundColor: 'rgba(255, 179, 0, 0.15)',
    color: '#ffb300',
    padding: '2px 6px',
    borderRadius: '10px',
    fontWeight: 600,
  },
  historyRow: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  }
};
