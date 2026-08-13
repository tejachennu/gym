'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { submitCheckin, getClientCheckins, deleteCheckin } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Input, Select } from '@/components/ui/Input';
import ImageUpload from '@/components/ui/ImageUpload';
import { useToast } from '@/components/ui/Toast';
import { validateField } from '@/lib/validation';
import { Camera, Ruler, Send, History, Calendar, Eye, Sparkles, CheckCircle2, Lock, TrendingUp, Filter, Trash2 } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

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

export default function CheckinPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history' | 'graphs'
  const [checkinsHistory, setCheckinsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  
  // Deletion state
  const [deleteCheckinId, setDeleteCheckinId] = useState(null);
  const [deletingCheckin, setDeletingCheckin] = useState(false);

  // Uploading state tracking for the 4 posture photos
  const [uploadingPhotosState, setUploadingPhotosState] = useState({
    front: false,
    back: false,
    left: false,
    right: false
  });
  const isAnyPhotoUploading = Object.values(uploadingPhotosState).some(Boolean);

  // Date Range Filters & Metric selection for Sizing Charts
  const [selectedMeasurementKey, setSelectedMeasurementKey] = useState('weight');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return new Date(d.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [photos, setPhotos] = useState({ front: '', back: '', left: '', right: '' });
  const [measurements, setMeasurements] = useState({
    weight: '',
    neck: '',
    shoulder: '',
    chest: '',
    waist: '',
    stomach: '',
    highHip: '',
    rBicep: '',
    lBicep: '',
    rForearm: '',
    lForearm: '',
    rThigh: '',
    lThigh: '',
    rCalf: '',
    lCalf: ''
  });

  const loadHistory = async () => {
    if (!user?.uid) return;
    try {
      setLoadingHistory(true);
      const data = await getClientCheckins(user.uid);
      setCheckinsHistory(data || []);
    } catch (err) {
      console.error('Failed to load check-in history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteCheckin = async () => {
    if (!deleteCheckinId) return;
    setDeletingCheckin(true);
    try {
      await deleteCheckin(deleteCheckinId);
      toast.success('Check-in record deleted successfully');
      setDeleteCheckinId(null);
      await loadHistory();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete check-in record');
    } finally {
      setDeletingCheckin(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;

    const weightErr = validateField('Weight', measurements.weight, { numeric: true, allowDecimal: true, maxDigits: 3, required: true, max: 500 });
    if (weightErr) {
      toast.error(weightErr);
      return;
    }
    
    setSubmitting(true);
    try {
      await submitCheckin(user.uid, {
        date: new Date().toISOString(),
        photos,
        measurements
      });
      toast.success('10-Day Check-in submitted successfully!');
      setPhotos({ front: '', back: '', left: '', right: '' });
      setMeasurements({
        weight: '', neck: '', shoulder: '', chest: '', waist: '', stomach: '', highHip: '',
        rBicep: '', lBicep: '', rForearm: '', lForearm: '', rThigh: '', lThigh: '', rCalf: '', lCalf: ''
      });
      await loadHistory();
      setActiveTab('history');
    } catch (err) {
      toast.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate next check-in date from latest check-in
  const latestCheckin = checkinsHistory[0];
  const latestDateObj = latestCheckin?.date ? new Date(latestCheckin.date) : null;
  const nextCheckinDateObj = latestDateObj ? new Date(latestDateObj.getTime() + 10 * 24 * 60 * 60 * 1000) : null;

  const todayZero = new Date();
  todayZero.setHours(0, 0, 0, 0);

  let daysRemaining = null;
  let isDueTodayOrOverdue = false;
  if (nextCheckinDateObj) {
    const targetDate = new Date(nextCheckinDateObj);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - todayZero;
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isDueTodayOrOverdue = daysRemaining <= 0;
  }

  // Filter Sizing Chart Data for the progress graphs
  const sizingChartData = checkinsHistory
    .map(chk => {
      const dStr = chk.date || (chk.createdAt?.seconds ? new Date(chk.createdAt.seconds * 1000).toISOString().split('T')[0] : '');
      const m = chk.measurements || {};
      return {
        date: dStr ? dStr.split('-').slice(1).join('/') : 'Log',
        fullDate: dStr,
        val: m[selectedMeasurementKey] !== undefined && m[selectedMeasurementKey] !== '' ? Number(m[selectedMeasurementKey]) : 0
      };
    })
    .filter(item => item.fullDate >= fromDate && item.fullDate <= toDate && item.val > 0)
    .sort((a, b) => a.fullDate.localeCompare(b.fullDate));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '60px' }} className="animate-fade-up">
      {/* Page Header */}
      <div style={{ textAlign: 'center', padding: '4px 0' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 2px 0', color: 'var(--text)' }}>
          📸 10-Day Body Check-In & Progress History
        </h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
          Track body posture photos & 14-point measurements every 10 days
        </p>
      </div>

      {/* Tab Switcher: Submit Check-in vs View History vs Progress Graphs */}
      <div style={{ 
        display: 'flex', 
        gap: '6px', 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        padding: '4px', 
        borderRadius: '12px', 
        border: '1px solid var(--border)',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('new')}
          style={{
            flex: 1,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            padding: '8px 12px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'new' ? 'var(--accent, #E00008)' : 'transparent',
            color: activeTab === 'new' ? '#FFFFFF' : 'var(--text-secondary)',
            fontSize: '0.78rem',
            fontWeight: activeTab === 'new' ? 800 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Camera size={14} /> New Check-in
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            padding: '8px 12px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'history' ? 'var(--accent, #E00008)' : 'transparent',
            color: activeTab === 'history' ? '#FFFFFF' : 'var(--text-secondary)',
            fontSize: '0.78rem',
            fontWeight: activeTab === 'history' ? 800 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <History size={14} /> History ({checkinsHistory.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('graphs')}
          style={{
            flex: 1,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            padding: '8px 12px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'graphs' ? 'var(--accent, #E00008)' : 'transparent',
            color: activeTab === 'graphs' ? '#FFFFFF' : 'var(--text-secondary)',
            fontSize: '0.78rem',
            fontWeight: activeTab === 'graphs' ? 800 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <TrendingUp size={14} /> Progress Graphs
        </button>
      </div>

      {/* TAB 1: NEW CHECK-IN FORM */}
      {activeTab === 'new' && (
        <>
          {/* Submitted & Next Check-in Date Banner */}
          {latestCheckin && (
            <Card style={{ padding: '12px 16px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)', borderRadius: '12px' }} className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                
                {/* Last Check-in Submitted Box */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(0, 200, 83, 0.15)', color: '#00c853' }}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                      Last Check-in Submitted
                    </span>
                    <strong style={{ fontSize: '0.9rem', color: '#00c853', fontWeight: 800 }}>
                      {formatDateNice(latestCheckin.date)}
                    </strong>
                  </div>
                </div>

                {/* Next Check-in Due Box */}
                {nextCheckinDateObj && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: isDueTodayOrOverdue ? 'rgba(255, 23, 68, 0.15)' : 'rgba(0, 176, 255, 0.15)',
                      color: isDueTodayOrOverdue ? '#ff1744' : '#00b0ff'
                    }}>
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                        Next Check-in Due Date
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '0.9rem', color: isDueTodayOrOverdue ? '#ff1744' : '#00b0ff', fontWeight: 800 }}>
                          {formatDateNice(nextCheckinDateObj.toISOString())}
                        </strong>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          backgroundColor: isDueTodayOrOverdue ? 'rgba(255, 23, 68, 0.2)' : 'rgba(0, 176, 255, 0.2)',
                          color: isDueTodayOrOverdue ? '#ff1744' : '#00b0ff'
                        }}>
                          {daysRemaining === 0 ? 'Due Today 🔥' : daysRemaining < 0 ? `Overdue by ${Math.abs(daysRemaining)} days` : `in ${daysRemaining} days`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </Card>
          )}

          {/* IF CHECK-IN ALREADY SUBMITTED AND NEXT IS NOT DUE YET (daysRemaining > 0) */}
          {latestCheckin && daysRemaining > 0 ? (
            <Card style={{ padding: '24px', textAlign: 'center', borderRadius: '16px' }} className="glass-card">
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 23, 68, 0.15)',
                color: '#ff1744',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                border: '1px solid rgba(255, 23, 68, 0.3)'
              }}>
                <Lock size={32} />
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                🔒 Check-In Submission Locked
              </h3>

              <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
                You completed your 10-day posture photos & 14-point measurements on <strong style={{ color: '#00c853' }}>{formatDateNice(latestCheckin.date)}</strong>. New check-in submissions are locked until your next cycle date.
              </p>

              {/* Countdown Banner */}
              <div style={{
                padding: '14px 20px',
                borderRadius: '12px',
                backgroundColor: 'rgba(0, 176, 255, 0.12)',
                border: '1px solid rgba(0, 176, 255, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <Sparkles size={22} color="#00b0ff" />
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                    Next Check-In Unlocks On
                  </span>
                  <strong style={{ fontSize: '1.05rem', color: '#00b0ff', fontWeight: 800 }}>
                    {formatDateNice(nextCheckinDateObj.toISOString())}
                  </strong>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    marginLeft: '8px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0, 176, 255, 0.2)',
                    color: '#00b0ff'
                  }}>
                    in {daysRemaining} days
                  </span>
                </div>
              </div>

              {/* Measurement Guide Quick Button */}
              <div style={{ marginBottom: '20px' }}>
                <Button variant="outline" size="sm" onClick={() => setIsGuideModalOpen(true)}>
                  <Ruler size={14} /> 📐 View Measurement & Posture Guide
                </Button>
              </div>

              {/* Latest Submitted Photos Preview */}
              {latestCheckin.photos && Object.values(latestCheckin.photos).some(Boolean) && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Submitted Photos ({formatDateNice(latestCheckin.date)})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px', maxWidth: '440px', margin: '0 auto' }}>
                    {['front', 'back', 'left', 'right'].map((key) => (
                      <div key={key} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: 'var(--card-hover)', aspectRatio: '3/4', position: 'relative' }}>
                        {latestCheckin.photos[key] ? (
                          <img 
                            src={latestCheckin.photos[key]} 
                            alt={key} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => { setPreviewPhotoUrl(latestCheckin.photos[key]); }}
                          />
                        ) : (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                            No Photo
                          </div>
                        )}
                        <span style={{ position: 'absolute', bottom: 2, left: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.6rem', textAlign: 'center', borderRadius: '4px', textTransform: 'capitalize' }}>
                          {key}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('history')}>
                  <History size={14} /> View History ({checkinsHistory.length})
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Measurement & Body Posture Reference Guide Banner */}
              <Card style={{ padding: '12px 16px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(224, 0, 8, 0.15)', color: 'var(--accent, #E00008)' }}>
                      <Ruler size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)' }}>
                        📐 Measurement & Body Posture Reference Guide
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                        Check tape placement & posture photo rules for accurate tracking
                      </p>
                    </div>
                  </div>

                  <Button size="sm" variant="outline" onClick={() => setIsGuideModalOpen(true)} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    <Eye size={14} /> View Guide Image
                  </Button>
                </div>
              </Card>

          {/* Progress Photos Card */}
          <Card style={{ padding: '12px' }} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Camera size={16} color="var(--accent, #E00008)" />
              <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)' }}>Progress Photos</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>1. Front View</p>
                <ImageUpload 
                  value={photos.front} 
                  onUpload={(url) => setPhotos({...photos, front: url})} 
                  onUploading={(isUploading) => setUploadingPhotosState(prev => ({ ...prev, front: isUploading }))}
                  compact={true} 
                />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>2. Back View</p>
                <ImageUpload 
                  value={photos.back} 
                  onUpload={(url) => setPhotos({...photos, back: url})} 
                  onUploading={(isUploading) => setUploadingPhotosState(prev => ({ ...prev, back: isUploading }))}
                  compact={true} 
                />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>3. Left Side</p>
                <ImageUpload 
                  value={photos.left} 
                  onUpload={(url) => setPhotos({...photos, left: url})} 
                  onUploading={(isUploading) => setUploadingPhotosState(prev => ({ ...prev, left: isUploading }))}
                  compact={true} 
                />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>4. Right Side</p>
                <ImageUpload 
                  value={photos.right} 
                  onUpload={(url) => setPhotos({...photos, right: url})} 
                  onUploading={(isUploading) => setUploadingPhotosState(prev => ({ ...prev, right: isUploading }))}
                  compact={true} 
                />
              </div>
            </div>
          </Card>

          {/* 14-Point Measurements Input Card */}
          <Card style={{ padding: '12px' }} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Ruler size={16} color="#00c853" />
              <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)' }}>
                14-Point Body Measurements (cm)
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Input type="number" numeric={true} allowDecimal={true} label="Body Weight kg (Max 3 digits) *" value={measurements.weight} onChange={(e) => setMeasurements({...measurements, weight: e.target.value})} required />
              </div>

              <Input type="number" numeric={true} allowDecimal={true} label="1. Neck (cm)" value={measurements.neck} onChange={(e) => setMeasurements({...measurements, neck: e.target.value})} />
              <Input type="number" numeric={true} allowDecimal={true} label="2. Shoulder (cm)" value={measurements.shoulder} onChange={(e) => setMeasurements({...measurements, shoulder: e.target.value})} />
              <Input type="number" numeric={true} allowDecimal={true} label="3. Chest (cm)" value={measurements.chest} onChange={(e) => setMeasurements({...measurements, chest: e.target.value})} />
              <Input type="number" numeric={true} allowDecimal={true} label="4. Waist (cm)" value={measurements.waist} onChange={(e) => setMeasurements({...measurements, waist: e.target.value})} />
              <Input type="number" numeric={true} allowDecimal={true} label="5. Stomach (cm)" value={measurements.stomach} onChange={(e) => setMeasurements({...measurements, stomach: e.target.value})} />
              <Input type="number" numeric={true} allowDecimal={true} label="6. High Hip (cm)" value={measurements.highHip} onChange={(e) => setMeasurements({...measurements, highHip: e.target.value})} />

              <Input type="number" numeric={true} allowDecimal={true} label="7. Right Bicep" value={measurements.rBicep} onChange={(e) => setMeasurements({...measurements, rBicep: e.target.value})} />
              <Input type="number" numeric={true} allowDecimal={true} label="8. Left Bicep" value={measurements.lBicep} onChange={(e) => setMeasurements({...measurements, lBicep: e.target.value})} />

              <Input type="number" numeric={true} allowDecimal={true} label="9. Right Forearm" value={measurements.rForearm} onChange={(e) => setMeasurements({...measurements, rForearm: e.target.value})} />
              <Input type="number" numeric={true} allowDecimal={true} label="10. Left Forearm" value={measurements.lForearm} onChange={(e) => setMeasurements({...measurements, lForearm: e.target.value})} />

              <Input type="number" numeric={true} allowDecimal={true} label="11. Right Thigh" value={measurements.rThigh} onChange={(e) => setMeasurements({...measurements, rThigh: e.target.value})} />
              <Input type="number" numeric={true} allowDecimal={true} label="12. Left Thigh" value={measurements.lThigh} onChange={(e) => setMeasurements({...measurements, lThigh: e.target.value})} />

              <Input type="number" numeric={true} allowDecimal={true} label="13. Right Calf" value={measurements.rCalf} onChange={(e) => setMeasurements({...measurements, rCalf: e.target.value})} />
              <Input type="number" numeric={true} allowDecimal={true} label="14. Left Calf" value={measurements.lCalf} onChange={(e) => setMeasurements({...measurements, lCalf: e.target.value})} />
            </div>
            {/* Submit Button */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button 
                onClick={handleSubmit} 
                loading={submitting} 
                disabled={isAnyPhotoUploading}
                style={{ 
                  flex: 1,
                  backgroundColor: isAnyPhotoUploading ? 'var(--card-hover)' : 'var(--accent)',
                  color: isAnyPhotoUploading ? 'var(--text-secondary)' : '#fff',
                  cursor: isAnyPhotoUploading ? 'not-allowed' : 'pointer'
                }}
              >
                {isAnyPhotoUploading ? (
                  'Waiting for uploads to finish...'
                ) : (
                  <><Send size={16} /> Submit 10-Day Check-in</>
                )}
              </Button>
            </div>
          </Card>
        </>
      )}
    </>
  )}

      {/* TAB 2: PAST CHECK-INS HISTORY LIST */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loadingHistory ? (
            <Card style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading check-in history...
            </Card>
          ) : checkinsHistory.length === 0 ? (
            <Card style={{ padding: '24px', textAlign: 'center' }}>
              <History size={36} color="var(--text-secondary)" style={{ marginBottom: '8px', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#FFFFFF' }}>No Previous Check-ins Recorded</h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                You haven&apos;t submitted any 10-day body check-ins yet. Click &quot;+ New Check-in&quot; to log your baseline!
              </p>
              <Button size="sm" onClick={() => setActiveTab('new')}>
                + Submit Baseline Check-in
              </Button>
            </Card>
          ) : (
            checkinsHistory.map((item, idx) => {
              const cDate = item.date || item.createdAt;
              const meas = item.measurements || {};
              const p = item.photos || {};

              return (
                <Card key={item.id || idx} style={{ padding: '14px', borderRadius: '14px' }} className="glass-card">
                  {/* Card Header: Date & Weight */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="var(--accent, #E00008)" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF' }}>
                          Check-in: {formatDateNice(cDate)}
                        </span>
                        {idx === 0 && (
                          <Badge variant="success" style={{ fontSize: '0.65rem' }}>LATEST</Badge>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {meas.weight && (
                        <div style={{ background: 'rgba(0, 200, 83, 0.15)', border: '1px solid rgba(0, 200, 83, 0.3)', padding: '4px 10px', borderRadius: '10px', color: '#00c853', fontWeight: 800, fontSize: '0.85rem' }}>
                          Weight: {meas.weight} kg
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => setDeleteCheckinId(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary, #AAAAAA)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--danger, #ff1744)';
                          e.currentTarget.style.backgroundColor = 'rgba(255, 23, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-secondary, #AAAAAA)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="Delete Check-in Record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Body Photos Thumbnails */}
                  {(p.front || p.back || p.left || p.right) && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        📸 Posture Photos:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        {[
                          { key: 'front', label: 'Front' },
                          { key: 'back', label: 'Back' },
                          { key: 'left', label: 'Left Side' },
                          { key: 'right', label: 'Right Side' }
                        ].map(({ key, label }) => (
                          <div key={key} style={{ textAlign: 'center' }}>
                            {p[key] ? (
                              <img
                                src={p[key]}
                                alt={label}
                                onClick={() => setPreviewPhotoUrl(p[key])}
                                style={{
                                  width: '100%',
                                  height: '70px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border)',
                                  cursor: 'pointer'
                                }}
                              />
                            ) : (
                              <div style={{ height: '70px', background: 'var(--card-hover)', borderRadius: '8px', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                No Photo
                              </div>
                            )}
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Measurements Summary Grid */}
                  <div style={{ fontSize: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      📏 Measurements (cm):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '4px' }}>
                      {meas.neck && <div style={{ background: 'var(--card-hover)', padding: '3px 6px', borderRadius: '4px' }}>Neck: <strong>{meas.neck} cm</strong></div>}
                      {meas.chest && <div style={{ background: 'var(--card-hover)', padding: '3px 6px', borderRadius: '4px' }}>Chest: <strong>{meas.chest} cm</strong></div>}
                      {meas.waist && <div style={{ background: 'var(--card-hover)', padding: '3px 6px', borderRadius: '4px' }}>Waist: <strong>{meas.waist} cm</strong></div>}
                      {meas.stomach && <div style={{ background: 'var(--card-hover)', padding: '3px 6px', borderRadius: '4px' }}>Stomach: <strong>{meas.stomach} cm</strong></div>}
                      {meas.rBicep && <div style={{ background: 'var(--card-hover)', padding: '3px 6px', borderRadius: '4px' }}>R Bicep: <strong>{meas.rBicep} cm</strong></div>}
                      {meas.lBicep && <div style={{ background: 'var(--card-hover)', padding: '3px 6px', borderRadius: '4px' }}>L Bicep: <strong>{meas.lBicep} cm</strong></div>}
                      {meas.rThigh && <div style={{ background: 'var(--card-hover)', padding: '3px 6px', borderRadius: '4px' }}>R Thigh: <strong>{meas.rThigh} cm</strong></div>}
                      {meas.lThigh && <div style={{ background: 'var(--card-hover)', padding: '3px 6px', borderRadius: '4px' }}>L Thigh: <strong>{meas.lThigh} cm</strong></div>}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: PROGRESS GRAPHS */}
      {activeTab === 'graphs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Date Filter Bar */}
          <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} color="var(--accent, #E00008)" style={{ opacity: 0.8 }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Filter by Date Range
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '130px' }}>
                <Input 
                  type="date" 
                  label="From Date" 
                  value={fromDate} 
                  onChange={(e) => setFromDate(e.target.value)} 
                />
              </div>
              <div style={{ flex: 1, minWidth: '130px' }}>
                <Input 
                  type="date" 
                  label="To Date" 
                  value={toDate} 
                  onChange={(e) => setToDate(e.target.value)} 
                />
              </div>
            </div>
          </Card>

          {/* SIZING METRIC SELECTION GRAPH */}
          <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} color="var(--accent, #E00008)" />
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                  Sizing Metrics Progress
                </h4>
              </div>
              <Select 
                value={selectedMeasurementKey} 
                onChange={(e) => setSelectedMeasurementKey(e.target.value)} 
                options={[
                  { label: 'Weight (kg)', value: 'weight' },
                  { label: 'Waist (cm)', value: 'waist' },
                  { label: 'Chest (cm)', value: 'chest' },
                  { label: 'Stomach (cm)', value: 'stomach' },
                  { label: 'Neck (cm)', value: 'neck' },
                  { label: 'Shoulder (cm)', value: 'shoulder' },
                  { label: 'Right Bicep (cm)', value: 'rBicep' },
                  { label: 'Left Bicep (cm)', value: 'lBicep' },
                  { label: 'Right Thigh (cm)', value: 'rThigh' },
                  { label: 'Left Thigh (cm)', value: 'lThigh' },
                  { label: 'Right Forearm (cm)', value: 'rForearm' },
                  { label: 'Left Forearm (cm)', value: 'lForearm' },
                  { label: 'Right Calf (cm)', value: 'rCalf' },
                  { label: 'Left Calf (cm)', value: 'lCalf' },
                  { label: 'High Hip (cm)', value: 'highHip' },
                ]}
                containerStyle={{ margin: 0, width: '150px' }}
              />
            </div>

            {sizingChartData.length > 0 ? (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sizingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="val" 
                      stroke="var(--accent, #E00008)" 
                      strokeWidth={3} 
                      dot={{ r: 4, stroke: 'var(--accent, #E00008)', strokeWidth: 2, fill: 'var(--bg, #0A0A0C)' }} 
                      activeDot={{ r: 6, stroke: 'var(--accent, #E00008)', strokeWidth: 2, fill: 'var(--text, #ffffff)' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <TrendingUp size={24} color="var(--text-secondary)" style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                  No measurement data found for selected metric in this date range.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MEASUREMENT & POSTURE GUIDE MODAL */}
      <Modal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        title="📐 14-Point Body Measurement & Posture Guide"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <img 
            src="/images/bodyposturesmeasurment.jpeg" 
            alt="Body Postures & Measurements Reference Guide" 
            style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '12px', border: '1px solid var(--border)' }}
          />
          <Button variant="ghost" size="sm" onClick={() => setIsGuideModalOpen(false)}>Close Guide</Button>
        </div>
      </Modal>

      {/* FULL PHOTO PREVIEW MODAL */}
      <Modal
        isOpen={!!previewPhotoUrl}
        onClose={() => setPreviewPhotoUrl(null)}
        title="Posture Photo Preview"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {previewPhotoUrl && (
            <img 
              src={previewPhotoUrl} 
              alt="Posture Preview" 
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }}
            />
          )}
          <Button variant="ghost" size="sm" onClick={() => setPreviewPhotoUrl(null)}>Close</Button>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={!!deleteCheckinId}
        onClose={() => setDeleteCheckinId(null)}
        onConfirm={handleDeleteCheckin}
        title="Delete Check-in Record"
        message="Are you sure you want to delete this check-in record? This action will permanently remove the posture photos and sizing measurements, and cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deletingCheckin}
      />
    </div>
  );
}
