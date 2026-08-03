'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { submitCheckin } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ImageUpload from '@/components/ui/ImageUpload';
import { useToast } from '@/components/ui/Toast';

export default function CheckinPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  const [photos, setPhotos] = useState({ front: '', back: '', left: '', right: '' });
  const [measurements, setMeasurements] = useState({
    weight: '', waist: '', abdomen: '', hip: '', chest: '', lArm: '', rArm: '', lThigh: '', rThigh: ''
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
      toast.success('Check-in submitted successfully!');
    } catch (err) {
      toast.error('Failed to submit check-in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 5px 0' }}>Body Transformation Check-in</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upload progress photos and measurements every 10 days</p>
      </div>

      <Card style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>Progress Photos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div><p style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}>Front View</p><ImageUpload onUpload={(url) => setPhotos({...photos, front: url})} /></div>
          <div><p style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}>Back View</p><ImageUpload onUpload={(url) => setPhotos({...photos, back: url})} /></div>
          <div><p style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}>Left Side</p><ImageUpload onUpload={(url) => setPhotos({...photos, left: url})} /></div>
          <div><p style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}>Right Side</p><ImageUpload onUpload={(url) => setPhotos({...photos, right: url})} /></div>
        </div>
      </Card>

      <Card style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem' }}>Measurements (cm)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <Input type="number" label="Weight (kg)" value={measurements.weight} onChange={(e) => setMeasurements({...measurements, weight: e.target.value})} style={{ gridColumn: '1 / -1' }} />
          <Input type="number" label="Chest" value={measurements.chest} onChange={(e) => setMeasurements({...measurements, chest: e.target.value})} />
          <Input type="number" label="Waist" value={measurements.waist} onChange={(e) => setMeasurements({...measurements, waist: e.target.value})} />
          <Input type="number" label="Abdomen" value={measurements.abdomen} onChange={(e) => setMeasurements({...measurements, abdomen: e.target.value})} />
          <Input type="number" label="Hip" value={measurements.hip} onChange={(e) => setMeasurements({...measurements, hip: e.target.value})} />
          <Input type="number" label="Left Arm" value={measurements.lArm} onChange={(e) => setMeasurements({...measurements, lArm: e.target.value})} />
          <Input type="number" label="Right Arm" value={measurements.rArm} onChange={(e) => setMeasurements({...measurements, rArm: e.target.value})} />
          <Input type="number" label="Left Thigh" value={measurements.lThigh} onChange={(e) => setMeasurements({...measurements, lThigh: e.target.value})} />
          <Input type="number" label="Right Thigh" value={measurements.rThigh} onChange={(e) => setMeasurements({...measurements, rThigh: e.target.value})} />
        </div>
      </Card>

      <Button onClick={handleSubmit} loading={submitting} style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '15px', fontSize: '1.1rem' }}>
        Submit Check-in
      </Button>
    </div>
  );
}
