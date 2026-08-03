'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { submitCheckin } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ImageUpload from '@/components/ui/ImageUpload';
import { useToast } from '@/components/ui/Toast';
import { Camera, Ruler, Send } from 'lucide-react';

export default function CheckinPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  
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

  const handleSubmit = async () => {
    if (!user) return;
    if (!measurements.weight) return toast.error('Weight is required');
    
    setSubmitting(true);
    try {
      await submitCheckin(user.uid, {
        date: new Date().toISOString(),
        photos,
        measurements
      });
      toast.success('10-Day Check-in submitted successfully!');
    } catch (err) {
      toast.error('Failed to submit check-in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '90px' }} className="animate-fade-up">
      <div style={{ textAlign: 'center', padding: '6px 0' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: '0 0 4px 0', color: '#FFFFFF' }}>
          📸 Body Check-In & Measurements
        </h2>
        <p style={{ margin: 0, color: 'var(--text-secondary, #AAAAAA)', fontSize: '0.8rem' }}>
          Upload your posture photos & 14-point body measurements every 10 days
        </p>
      </div>

      {/* Progress Photos Card */}
      <Card style={{ padding: '16px' }} className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Camera size={18} color="var(--accent, #E00008)" />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>Progress Photos</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          <div><p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 700 }}>1. Front View</p><ImageUpload onUpload={(url) => setPhotos({...photos, front: url})} /></div>
          <div><p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 700 }}>2. Back View</p><ImageUpload onUpload={(url) => setPhotos({...photos, back: url})} /></div>
          <div><p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 700 }}>3. Left Side</p><ImageUpload onUpload={(url) => setPhotos({...photos, left: url})} /></div>
          <div><p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 700 }}>4. Right Side</p><ImageUpload onUpload={(url) => setPhotos({...photos, right: url})} /></div>
        </div>
      </Card>

      {/* 14-Point Measurements Input Card */}
      <Card style={{ padding: '16px' }} className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Ruler size={18} color="#00c853" />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>
            14-Point Body Measurements (cm)
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input type="number" label="Body Weight (kg) *" value={measurements.weight} onChange={(e) => setMeasurements({...measurements, weight: e.target.value})} required />
          </div>

          <Input type="number" label="1. Neck (cm)" value={measurements.neck} onChange={(e) => setMeasurements({...measurements, neck: e.target.value})} />
          <Input type="number" label="2. Shoulder (cm)" value={measurements.shoulder} onChange={(e) => setMeasurements({...measurements, shoulder: e.target.value})} />
          <Input type="number" label="3. Chest (cm)" value={measurements.chest} onChange={(e) => setMeasurements({...measurements, chest: e.target.value})} />
          <Input type="number" label="4. Waist (cm)" value={measurements.waist} onChange={(e) => setMeasurements({...measurements, waist: e.target.value})} />
          <Input type="number" label="5. Stomach (cm)" value={measurements.stomach} onChange={(e) => setMeasurements({...measurements, stomach: e.target.value})} />
          <Input type="number" label="6. High Hip (cm)" value={measurements.highHip} onChange={(e) => setMeasurements({...measurements, highHip: e.target.value})} />

          <Input type="number" label="7. Right Bicep" value={measurements.rBicep} onChange={(e) => setMeasurements({...measurements, rBicep: e.target.value})} />
          <Input type="number" label="8. Left Bicep" value={measurements.lBicep} onChange={(e) => setMeasurements({...measurements, lBicep: e.target.value})} />

          <Input type="number" label="9. Right Forearm" value={measurements.rForearm} onChange={(e) => setMeasurements({...measurements, rForearm: e.target.value})} />
          <Input type="number" label="10. Left Forearm" value={measurements.lForearm} onChange={(e) => setMeasurements({...measurements, lForearm: e.target.value})} />

          <Input type="number" label="11. Right Thigh" value={measurements.rThigh} onChange={(e) => setMeasurements({...measurements, rThigh: e.target.value})} />
          <Input type="number" label="12. Left Thigh" value={measurements.lThigh} onChange={(e) => setMeasurements({...measurements, lThigh: e.target.value})} />

          <Input type="number" label="13. Right Calf" value={measurements.rCalf} onChange={(e) => setMeasurements({...measurements, rCalf: e.target.value})} />
          <Input type="number" label="14. Left Calf" value={measurements.lCalf} onChange={(e) => setMeasurements({...measurements, lCalf: e.target.value})} />
        </div>
      </Card>

      <Button onClick={handleSubmit} loading={submitting} style={{ padding: '14px', fontSize: '0.95rem', fontWeight: 800 }}>
        <Send size={16} /> Submit 10-Day Check-in
      </Button>
    </div>
  );
}
