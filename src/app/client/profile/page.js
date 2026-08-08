'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { logoutUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { getClientById, updateClientProfile } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { validateField } from '@/lib/validation';
import { 
  User, 
  Phone, 
  LogOut, 
  Scale, 
  HeartPulse, 
  Brain, 
  CheckCircle2, 
  CreditCard, 
  Camera,
  Send,
  AlertCircle,
  Sparkles,
  Calendar,
  Briefcase,
  MapPin,
  Smartphone
} from 'lucide-react';

export default function ProfilePage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  const [form, setForm] = useState({
    name: '',
    clientCode: '',
    email: '',
    phone: '',
    age: '',
    gender: 'Male',
    dob: '',
    profession: '',
    location: '',
    height: '',
    weight: '',
    targetWeight: '',
    diet: 'Non-Veg',
    goal: 'Fat Loss',
    currentPlan: 'Cardio + Strength',
    planStart: '03 Aug 2026',
    planExpiry: '02 Sep 2026',
    joiningDate: '',
    daysAvailable: '5 Days / Week',
    hasInjuries: 'NO',
    injuriesDetails: '',
    hasHealthIssues: 'NO',
    healthIssuesDetails: '',
    medications: '',
    stressLevel: 5,
    stressSources: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadData() {
      if (user?.uid) {
        try {
          const clientData = await getClientById(user.uid);
          if (clientData) {
            setProfileImage(clientData.photoURL || clientData.profileImage || user.photoURL || null);
            setForm({
              name: clientData.displayName || clientData.name || user.displayName || '',
              clientCode: clientData.clientCode || `PH-${user.uid.slice(0, 6).toUpperCase()}`,
              email: clientData.email || user.email || '',
              phone: clientData.phone || '',
              age: clientData.age || '',
              gender: clientData.gender || 'Male',
              dob: clientData.dob || '',
              profession: clientData.profession || '',
              location: clientData.location || clientData.address || '',
              height: clientData.height || '',
              weight: clientData.weight || '',
              targetWeight: clientData.targetWeight || '',
              diet: clientData.diet || 'Non-Veg',
              goal: clientData.goal || 'Fat Loss',
              currentPlan: clientData.currentPlan || 'Cardio + Strength',
              planStart: clientData.planStart || '03 Aug 2026',
              planExpiry: clientData.planExpiry || '02 Sep 2026',
              joiningDate: clientData.planStart || clientData.joiningDate || new Date().toISOString().split('T')[0],
              daysAvailable: clientData.daysAvailable || '5 Days / Week',
              hasInjuries: clientData.hasInjuries || 'NO',
              injuriesDetails: clientData.injuriesDetails || '',
              hasHealthIssues: clientData.hasHealthIssues || 'NO',
              healthIssuesDetails: clientData.healthIssuesDetails || '',
              medications: clientData.medications || '',
              stressLevel: clientData.stressLevel || 5,
              stressSources: clientData.stressSources || ''
            });
          }
        } catch (error) {
          console.error("Error loading profile data:", error);
          toast.error("Failed to load profile data");
        } finally {
          setLoading(false);
        }
      } else if (!authLoading) {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user, authLoading]);

  // Instagram-style Profile Picture Upload
  const handleInstagramPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success && data.fileUrl) {
        setProfileImage(data.fileUrl);
        if (user?.uid) {
          await updateClientProfile(user.uid, { 
            photoURL: data.fileUrl, 
            profileImage: data.fileUrl 
          });
        }
        toast.success("Instagram profile photo updated!");
      } else {
        throw new Error(data.error || 'Photo upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload profile picture");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    const nameErr = validateField('Client Name', form.name, { required: true });
    if (nameErr) newErrors.name = nameErr;

    const phoneErr = validateField('Mobile Number', form.phone, { phone: true });
    if (phoneErr) newErrors.phone = phoneErr;

    const ageErr = validateField('Age', form.age, { numeric: true, maxDigits: 3, max: 120 });
    if (ageErr) newErrors.age = ageErr;

    const heightErr = validateField('Height', form.height, { numeric: true, allowDecimal: true, maxDigits: 3, max: 300 });
    if (heightErr) newErrors.height = heightErr;

    const weightErr = validateField('Weight', form.weight, { numeric: true, allowDecimal: true, maxDigits: 3, max: 500 });
    if (weightErr) newErrors.weight = weightErr;

    const targetWeightErr = validateField('Target Weight', form.targetWeight, { numeric: true, allowDecimal: true, maxDigits: 3, max: 500 });
    if (targetWeightErr) newErrors.targetWeight = targetWeightErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    if (!validateForm()) {
      toast.error('Please fix validation errors in the form.');
      return;
    }

    setSaving(true);
    try {
      await updateClientProfile(user.uid, {
        displayName: form.name,
        name: form.name,
        phone: form.phone,
        age: form.age,
        gender: form.gender,
        dob: form.dob,
        profession: form.profession,
        location: form.location,
        height: form.height,
        weight: form.weight,
        targetWeight: form.targetWeight,
        diet: form.diet,
        goal: form.goal,
        daysAvailable: form.daysAvailable,
        hasInjuries: form.hasInjuries,
        injuriesDetails: form.injuriesDetails,
        hasHealthIssues: form.hasHealthIssues,
        healthIssuesDetails: form.healthIssuesDetails,
        medications: form.medications,
        stressLevel: form.stressLevel,
        stressSources: form.stressSources,
        photoURL: profileImage,
        profileImage: profileImage,
        updatedAt: new Date().toISOString()
      });

      toast.success('Profile details submitted successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      toast.error(error);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={styles.container} className="animate-fade-up">
      
      {/* 1. INSTAGRAM-STYLE PROFILE BANNER HEADER */}
      <Card style={styles.headerCard} className="glass-card">
        <div style={styles.instaBannerRow}>
          
          {/* Instagram Avatar Ring */}
          <div style={styles.instaAvatarContainer}>
            <div style={styles.instaRing}>
              <Avatar src={profileImage} name={form.name || 'Client'} size="xl" />
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              id="insta-avatar-upload" 
              onChange={handleInstagramPhotoUpload} 
              style={{ display: 'none' }}
              disabled={uploadingPhoto}
            />
            <label htmlFor="insta-avatar-upload" style={styles.instaCameraBadge} title="Upload Profile Picture (Instagram style)">
              {uploadingPhoto ? <Spinner size={12} /> : <Camera size={14} color="#FFFFFF" />}
            </label>
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={styles.nameText}>{form.name || 'Client'}</h2>
              <span style={styles.codePill}>ID: {form.clientCode}</span>
            </div>
            <p style={styles.emailText}>{form.email}</p>
            <div style={styles.metaRow}>
              <span>📍 {form.location || 'Location Not Set'}</span>
              <span>•</span>
              <span>🏋️ {form.goal}</span>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="outline" 
              onClick={() => router.push('/install-pwa')}
              size="sm"
              style={{ backgroundColor: 'rgba(224, 0, 8, 0.15)', borderColor: 'var(--accent, #E00008)', color: '#FFFFFF' }}
            >
              📱 Install App
            </Button>

            <Button 
              variant={isEditing ? 'ghost' : 'outline'} 
              onClick={() => setIsEditing(!isEditing)}
              size="sm"
            >
              {isEditing ? 'Cancel Edit' : '✏️ Edit Profile'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleLogout}
              size="sm"
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
            >
              <LogOut size={14} /> Sign Out
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. MODE SWITCH: READ-ONLY DASHBOARD vs EDIT FORM */}
      {!isEditing ? (
        /* READ-ONLY COMPLETE PROFILE VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Active Membership Box */}
          <Card style={styles.subHeroCard} className="glass-card">
            <div style={styles.subHeroHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={styles.subIconBadge}>
                  <CreditCard size={18} color="#00c853" />
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#00c853', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Active Membership Plan
                  </span>
                  <h3 style={styles.subPlanTitle}>{form.currentPlan || 'Cardio + Strength'}</h3>
                </div>
              </div>

              <div style={styles.liveStatusPill}>
                <span style={styles.livePulseDot} />
                <span>Active Member</span>
              </div>
            </div>

            <div style={styles.subStatsRow}>
              <div style={styles.subStatBox}>
                <span style={styles.subStatLabel}>Start Date</span>
                <span style={styles.subStatVal}>{form.planStart || '03 Aug 2026'}</span>
              </div>
              <div style={styles.subStatDivider} />
              <div style={styles.subStatBox}>
                <span style={styles.subStatLabel}>Expiry Date</span>
                <span style={{ ...styles.subStatVal, color: '#00c853' }}>{form.planExpiry || '02 Sep 2026'}</span>
              </div>
            </div>
          </Card>

          {/* 1. Basic Personal Details */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <User size={16} color="var(--accent, #E00008)" />
              <h3 style={styles.sectionTitle}>Basic Personal Details</h3>
            </div>

            <div style={styles.gridSummary}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>📞 Mobile Number</span>
                <span style={styles.summaryVal}>{form.phone || 'Not Provided'}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>👤 Age / Gender</span>
                <span style={styles.summaryVal}>{form.age ? `${form.age} Years` : 'N/A'} • {form.gender}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>🎂 Date of Birth</span>
                <span style={styles.summaryVal}>{form.dob || 'Not Set'}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>💼 Profession</span>
                <span style={styles.summaryVal}>{form.profession || 'Not Set'}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>📍 Location / Address</span>
                <span style={styles.summaryVal}>{form.location || 'Not Set'}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>📅 Joining Date</span>
                <span style={styles.summaryVal}>{form.joiningDate}</span>
              </div>
            </div>
          </Card>

          {/* 2. Physical Metrics Summary */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <Scale size={16} color="#00c853" />
              <h3 style={styles.sectionTitle}>Physical Metrics & Fitness Goals</h3>
            </div>

            <div style={styles.gridSummary}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>📏 Height</span>
                <span style={styles.summaryVal}>{form.height ? `${form.height} cm` : 'Not Set'}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>⚖️ Current Weight</span>
                <span style={styles.summaryVal}>{form.weight ? `${form.weight} kg` : 'Not Set'}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>🎯 Target Weight</span>
                <span style={{ ...styles.summaryVal, color: '#00c853', fontWeight: 800 }}>{form.targetWeight ? `${form.targetWeight} kg` : 'Not Set'}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>🥗 Diet Preference</span>
                <span style={styles.summaryVal}>{form.diet}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>🔥 Fitness Goal</span>
                <span style={{ ...styles.summaryVal, color: 'var(--accent, #E00008)', fontWeight: 800 }}>{form.goal}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>📆 Days Available / Week</span>
                <span style={styles.summaryVal}>{form.daysAvailable}</span>
              </div>
            </div>
          </Card>

          {/* 3. Health & Injury Record */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <HeartPulse size={16} color="var(--danger)" />
              <h3 style={styles.sectionTitle}>Injuries & Medical Conditions</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              <div style={styles.healthBox}>
                <span style={styles.summaryLabel}>Injuries Record:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: form.hasInjuries === 'YES' ? 'var(--danger)' : '#00c853', fontWeight: 700, marginTop: '4px', fontSize: '0.82rem' }}>
                  {form.hasInjuries === 'YES' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                  <span>{form.hasInjuries === 'YES' ? `YES — ${form.injuriesDetails || 'Details not specified'}` : 'No Past Injuries Logged'}</span>
                </div>
              </div>

              <div style={styles.healthBox}>
                <span style={styles.summaryLabel}>Medical Conditions:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: form.hasHealthIssues === 'YES' ? '#ffd600' : '#00c853', fontWeight: 700, marginTop: '4px', fontSize: '0.82rem' }}>
                  {form.hasHealthIssues === 'YES' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                  <span>{form.hasHealthIssues === 'YES' ? `YES — ${form.healthIssuesDetails || 'Details not specified'}` : 'No Medical Conditions Logged'}</span>
                </div>
                {form.medications && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Medications: <span style={{ color: 'var(--text)' }}>{form.medications}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* 4. Stress Levels & Lifestyle */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <Brain size={16} color="#ab47bc" />
              <h3 style={styles.sectionTitle}>Stress Levels & Lifestyle</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={styles.summaryLabel}>Stress Level Rating:</span>
                <span style={styles.stressBadge}>
                  Level {form.stressLevel} / 10
                </span>
              </div>
              {form.stressSources && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Main Stress Sources: <span style={{ color: 'var(--text)' }}>{form.stressSources}</span>
                </div>
              )}
            </div>
          </Card>

          {/* PWA INSTALLATION BANNER */}
          <Card style={{ padding: '12px 14px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(224, 0, 8, 0.12) 0%, var(--card) 100%)', border: '1px solid rgba(224, 0, 8, 0.3)' }} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={20} color="var(--accent, #E00008)" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)' }}>Install Mobile App (PWA)</h4>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Add MRK Fitness App to your Android & iPhone Home Screen</p>
                </div>
              </div>
              <Button size="sm" onClick={() => router.push('/install-pwa')} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                Install App 📲
              </Button>
            </div>
          </Card>

          <Button onClick={() => setIsEditing(true)} size="md" style={{ padding: '10px' }}>
            ✏️ Edit Profile Information
          </Button>

        </div>
      ) : (
        /* EDIT FORM VIEW */
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Personal Details Edit */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <User size={16} color="var(--accent, #E00008)" />
              <h3 style={styles.sectionTitle}>Edit Personal Details</h3>
            </div>

            <div style={styles.gridTwo}>
              <Input 
                label="Client Name *" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={errors.name}
                required 
              />

              <Input 
                label="Client Code / ID" 
                value={form.clientCode} 
                disabled={true} 
              />

              <Input 
                label="Mobile Number (Only numbers) *" 
                value={form.phone} 
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                numeric={true}
                error={errors.phone}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <Input 
                  label="Age (Max 3 digits)" 
                  value={form.age} 
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  numeric={true}
                  error={errors.age}
                />

                <Select 
                  label="Gender" 
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  options={[
                    { label: 'Male', value: 'Male' },
                    { label: 'Female', value: 'Female' },
                    { label: 'Other', value: 'Other' }
                  ]}
                />
              </div>

              <Input 
                label="Date of Birth" 
                type="date"
                value={form.dob} 
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />

              <Input 
                label="Profession" 
                value={form.profession} 
                onChange={(e) => setForm({ ...form, profession: e.target.value })}
              />

              <Input 
                label="Location / Address" 
                value={form.location} 
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </Card>

          {/* Physical Metrics Edit */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <Scale size={16} color="#00c853" />
              <h3 style={styles.sectionTitle}>Edit Physical Metrics & Goals</h3>
            </div>

            <div style={styles.gridTwo}>
              <Input 
                label="Height cm (Max 3 digits)" 
                value={form.height} 
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                numeric={true}
                allowDecimal={true}
                error={errors.height}
              />

              <Input 
                label="Current Weight kg (Max 3 digits)" 
                value={form.weight} 
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                numeric={true}
                allowDecimal={true}
                error={errors.weight}
              />

              <Input 
                label="Target Weight kg (Max 3 digits)" 
                value={form.targetWeight} 
                onChange={(e) => setForm({ ...form, targetWeight: e.target.value })}
                numeric={true}
                allowDecimal={true}
                error={errors.targetWeight}
              />

              <Select 
                label="Diet Preference" 
                value={form.diet}
                onChange={(e) => setForm({ ...form, diet: e.target.value })}
                options={[
                  { label: 'Veg 🥗', value: 'Veg' },
                  { label: 'Non-Veg 🍗', value: 'Non-Veg' },
                  { label: 'Eggetarian 🍳', value: 'Eggetarian' },
                  { label: 'Vegan 🌱', value: 'Vegan' }
                ]}
              />

              <Select 
                label="Primary Goal" 
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                options={[
                  { label: 'Fat Loss 🔥', value: 'Fat Loss' },
                  { label: 'Muscle Gain 💪', value: 'Muscle Gain' },
                  { label: 'Strength 🏋️', value: 'Strength' },
                  { label: 'General Fitness ⚡', value: 'General Fitness' }
                ]}
              />

              <Select 
                label="Days Available / Week" 
                value={form.daysAvailable}
                onChange={(e) => setForm({ ...form, daysAvailable: e.target.value })}
                options={[
                  { label: '3 Days / Week', value: '3 Days / Week' },
                  { label: '4 Days / Week', value: '4 Days / Week' },
                  { label: '5 Days / Week', value: '5 Days / Week' },
                  { label: '6 Days / Week', value: '6 Days / Week' }
                ]}
              />
            </div>
          </Card>

          {/* Medical Record Edit */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <HeartPulse size={16} color="var(--danger)" />
              <h3 style={styles.sectionTitle}>Edit Health & Injury Record</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Current or Past Injuries?</label>
                <div style={{ display: 'flex', gap: '8px', margin: '4px 0' }}>
                  {['YES', 'NO'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm({ ...form, hasInjuries: val })}
                      style={{
                        flex: 1,
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        backgroundColor: form.hasInjuries === val ? 'rgba(255,23,68,0.15)' : 'var(--card-hover)',
                        borderColor: form.hasInjuries === val ? 'var(--danger)' : 'var(--border)',
                        color: form.hasInjuries === val ? 'var(--danger)' : 'var(--text)'
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>

                {form.hasInjuries === 'YES' && (
                  <Textarea 
                    label="Injury Details:"
                    value={form.injuriesDetails}
                    onChange={(e) => setForm({ ...form, injuriesDetails: e.target.value })}
                    rows={2}
                  />
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Medical Conditions?</label>
                <div style={{ display: 'flex', gap: '8px', margin: '4px 0' }}>
                  {['YES', 'NO'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm({ ...form, hasHealthIssues: val })}
                      style={{
                        flex: 1,
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        backgroundColor: form.hasHealthIssues === val ? 'var(--warning-glow)' : 'var(--card-hover)',
                        borderColor: form.hasHealthIssues === val ? 'var(--warning)' : 'var(--border)',
                        color: form.hasHealthIssues === val ? 'var(--warning)' : 'var(--text)'
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>

                {form.hasHealthIssues === 'YES' && (
                  <Textarea 
                    label="Condition Details:"
                    value={form.healthIssuesDetails}
                    onChange={(e) => setForm({ ...form, healthIssuesDetails: e.target.value })}
                    rows={2}
                  />
                )}

                <Input 
                  label="Current Medications (if any)"
                  value={form.medications}
                  onChange={(e) => setForm({ ...form, medications: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Stress Edit */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <Brain size={16} color="var(--accent)" />
              <h3 style={styles.sectionTitle}>Edit Stress & Lifestyle</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Rate Stress Level (1 = Low, 10 = High):</label>
              
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {Array.from({ length: 10 }).map((_, i) => {
                  const num = i + 1;
                  const active = Number(form.stressLevel) === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setForm({ ...form, stressLevel: num })}
                      style={{
                        flex: 1,
                        minWidth: '24px',
                        padding: '4px',
                        borderRadius: '6px',
                        backgroundColor: active ? 'var(--accent-surface)' : 'var(--card-hover)',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        color: active ? 'var(--accent)' : 'var(--text)',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              <Textarea 
                label="Main sources of stress:"
                value={form.stressSources}
                onChange={(e) => setForm({ ...form, stressSources: e.target.value })}
                rows={2}
              />
            </div>
          </Card>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="submit" loading={saving} style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}>
              <Send size={15} /> Submit Profile Changes
            </Button>
            <Button variant="ghost" type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* LOGOUT CARD */}
      <Card style={{ padding: '14px', marginTop: '10px' }} className="glass-card">
        <Button 
          variant="danger" 
          onClick={async () => {
            if (confirm('Are you sure you want to log out?')) {
              try {
                await logoutUser();
                router.push('/login');
              } catch (err) {
                console.error(err);
              }
            }
          }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '0.9rem', fontWeight: 800 }}
        >
          <LogOut size={18} /> Log Out of Account
        </Button>
      </Card>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '60px' },
  headerCard: { padding: '12px' },
  instaBannerRow: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  instaAvatarContainer: { position: 'relative', display: 'inline-block', flexShrink: 0 },
  instaRing: { 
    padding: '3px', 
    borderRadius: '50%', 
    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  instaCameraBadge: {
    position: 'absolute',
    bottom: '0px',
    right: '0px',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent, #E00008)',
    border: '2px solid var(--card, #121214)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-card)'
  },
  nameText: { margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' },
  codePill: { padding: '2px 6px', borderRadius: '6px', backgroundColor: 'rgba(0, 200, 83, 0.15)', border: '1px solid rgba(0, 200, 83, 0.3)', color: '#00c853', fontSize: '0.68rem', fontWeight: 800 },
  emailText: { margin: '1px 0 4px 0', fontSize: '0.75rem', color: 'var(--text-secondary)' },
  metaRow: { display: 'flex', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' },
  subHeroCard: { padding: '12px', background: 'linear-gradient(135deg, rgba(0, 200, 83, 0.1) 0%, var(--card) 100%)', border: '1px solid rgba(0, 200, 83, 0.3)' },
  subHeroHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  subIconBadge: { width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(0, 200, 83, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  subPlanTitle: { margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text)' },
  liveStatusPill: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '14px', backgroundColor: 'rgba(0, 200, 83, 0.2)', border: '1px solid #00c853', color: '#00c853', fontSize: '0.7rem', fontWeight: 700 },
  livePulseDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00c853' },
  subStatsRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)' },
  subStatBox: { textAlign: 'center', flex: 1 },
  subStatLabel: { fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' },
  subStatVal: { fontSize: '0.82rem', fontWeight: 800, color: 'var(--text)', marginTop: '1px', display: 'block' },
  subStatDivider: { width: '1px', height: '20px', backgroundColor: 'var(--border)' },
  sectionCard: { padding: '12px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' },
  sectionTitle: { fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--text)' },
  gridTwo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' },
  gridSummary: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' },
  summaryItem: { display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 10px', borderRadius: '8px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)' },
  summaryLabel: { fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 },
  summaryVal: { fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' },
  healthBox: { padding: '10px', borderRadius: '8px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)' },
  stressBadge: { padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(171, 71, 188, 0.2)', border: '1px solid #ab47bc', color: '#ab47bc', fontWeight: 800, fontSize: '0.75rem' }
};
