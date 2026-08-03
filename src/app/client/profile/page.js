'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { logoutUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { getClientById, updateClientProfile, getClientCheckins, getClientDailyLogs } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  LogOut, 
  Edit3, 
  Target, 
  Activity, 
  Sparkles, 
  Save,
  MapPin,
  Briefcase,
  Scale,
  Ruler,
  Utensils,
  AlertCircle,
  HeartPulse,
  Brain,
  CheckCircle2,
  XCircle,
  CreditCard,
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function ProfilePage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  useEffect(() => {
    async function loadData() {
      if (user?.uid) {
        try {
          const clientData = await getClientById(user.uid);
          if (clientData) {
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

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
        updatedAt: new Date().toISOString()
      });

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
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
      toast.error('Logout failed');
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
      
      {/* 1. Ultra-Premium Glass Banner Card */}
      <Card style={styles.headerCard} className="glass-card">
        <div style={styles.headerRow}>
          <div style={styles.avatarWrapper}>
            <Avatar name={form.name || 'Client'} size="xl" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button 
              variant={isEditing ? 'ghost' : 'outline'} 
              onClick={() => setIsEditing(!isEditing)}
              style={{ fontSize: '0.8rem', padding: '8px 14px', fontWeight: 800 }}
            >
              {isEditing ? 'Cancel Edit' : '✏️ Edit Profile'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleLogout}
              style={{ borderColor: 'rgba(255,23,68,0.4)', color: '#ff1744', fontSize: '0.8rem', padding: '8px 14px', fontWeight: 800 }}
            >
              <LogOut size={15} /> Sign Out
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. MODE SWITCH: READ-ONLY PROFILE DASHBOARD vs EDIT FORM */}
      {!isEditing ? (
        /* READ-ONLY DASHBOARD VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Active Subscription Glass Hero Box */}
          <Card style={styles.subHeroCard} className="glass-card">
            <div style={styles.subHeroHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.subIconBadge}>
                  <CreditCard size={20} color="#00c853" />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#00c853', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
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
              <div style={styles.subStatDivider} />
              <div style={styles.subStatBox}>
                <span style={styles.subStatLabel}>Days Left</span>
                <span style={{ ...styles.subStatVal, color: '#00c853' }}>30 Days</span>
              </div>
            </div>

            {/* Glowing Membership Progress Bar */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <span>Membership Progress</span>
                <span style={{ color: '#00c853', fontWeight: 800 }}>85% Validity Remaining</span>
              </div>
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressFill, width: '85%' }} />
              </div>
            </div>
          </Card>

          {/* Basic Personal Details Card */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <User size={18} color="var(--accent, #E00008)" />
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

          {/* Physical Metrics Summary */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <Scale size={18} color="#00c853" />
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
                <span style={{ ...styles.summaryVal, color: '#00c853', fontWeight: 900 }}>{form.targetWeight ? `${form.targetWeight} kg` : 'Not Set'}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>🥗 Diet Preference</span>
                <span style={styles.summaryVal}>{form.diet}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>🔥 Primary Fitness Goal</span>
                <span style={{ ...styles.summaryVal, color: 'var(--accent, #E00008)', fontWeight: 900 }}>{form.goal}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>📆 Days Available / Week</span>
                <span style={styles.summaryVal}>{form.daysAvailable}</span>
              </div>
            </div>
          </Card>

          {/* Health & Injury Summary */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <HeartPulse size={18} color="#ff1744" />
              <h3 style={styles.sectionTitle}>Injuries & Medical Conditions</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={styles.healthBox}>
                <span style={styles.summaryLabel}>Injuries Record:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: form.hasInjuries === 'YES' ? '#ff1744' : '#00c853', fontWeight: 800, marginTop: '6px', fontSize: '0.88rem' }}>
                  {form.hasInjuries === 'YES' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{form.hasInjuries === 'YES' ? `YES — ${form.injuriesDetails || 'Details not specified'}` : 'No Past Injuries Logged'}</span>
                </div>
              </div>

              <div style={styles.healthBox}>
                <span style={styles.summaryLabel}>Medical Conditions:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: form.hasHealthIssues === 'YES' ? '#ffd600' : '#00c853', fontWeight: 800, marginTop: '6px', fontSize: '0.88rem' }}>
                  {form.hasHealthIssues === 'YES' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{form.hasHealthIssues === 'YES' ? `YES — ${form.healthIssuesDetails || 'Details not specified'}` : 'No Medical Conditions Logged'}</span>
                </div>
                {form.medications && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Medications: <span style={{ color: '#FFFFFF' }}>{form.medications}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Stress Summary */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <Brain size={18} color="#ab47bc" />
              <h3 style={styles.sectionTitle}>Stress Levels & Lifestyle</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={styles.summaryLabel}>Stress Level Rating:</span>
                <span style={styles.stressBadge}>
                  Level {form.stressLevel} / 10
                </span>
              </div>
              {form.stressSources && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Main Stress Sources: <span style={{ color: '#FFFFFF' }}>{form.stressSources}</span>
                </div>
              )}
            </div>
          </Card>

          <Button onClick={() => setIsEditing(true)} style={{ padding: '14px', fontSize: '0.95rem', fontWeight: 800 }}>
            ✏️ Edit Profile Information
          </Button>

        </div>
      ) : (
        /* EDIT FORM VIEW */
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Basic Personal Details Edit */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <User size={18} color="var(--accent, #E00008)" />
              <h3 style={styles.sectionTitle}>Edit Personal Details</h3>
            </div>

            <div style={styles.gridTwo}>
              <Input 
                label="Client Name *" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required 
              />

              <Input 
                label="Client Code / ID" 
                value={form.clientCode} 
                disabled={true} 
              />

              <Input 
                label="Mobile Number *" 
                value={form.phone} 
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Input 
                  label="Age" 
                  type="number" 
                  value={form.age} 
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
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

              <Input 
                label="Joining Date" 
                type="date"
                value={form.joiningDate} 
                disabled={true}
              />
            </div>
          </Card>

          {/* Physical Metrics Edit */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <Scale size={18} color="#00c853" />
              <h3 style={styles.sectionTitle}>Edit Physical Metrics & Goals</h3>
            </div>

            <div style={styles.gridTwo}>
              <Input 
                label="Height (cm)" 
                type="number" 
                value={form.height} 
                onChange={(e) => setForm({ ...form, height: e.target.value })}
              />

              <Input 
                label="Current Weight (kg)" 
                type="number" 
                value={form.weight} 
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />

              <Input 
                label="Target Weight (kg)" 
                type="number" 
                value={form.targetWeight} 
                onChange={(e) => setForm({ ...form, targetWeight: e.target.value })}
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

          {/* Medical Edit */}
          <Card style={styles.sectionCard} className="glass-card">
            <div style={styles.sectionHeader}>
              <HeartPulse size={18} color="#ff1744" />
              <h3 style={styles.sectionTitle}>Edit Health & Injury Record</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={styles.subBlock}>
                <label style={styles.subLabel}>Current or Past Injuries?</label>
                <div style={{ display: 'flex', gap: '10px', margin: '6px 0' }}>
                  {['YES', 'NO'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm({ ...form, hasInjuries: val })}
                      style={{
                        ...styles.toggleBtn,
                        backgroundColor: form.hasInjuries === val ? 'rgba(255,23,68,0.2)' : 'rgba(255,255,255,0.03)',
                        borderColor: form.hasInjuries === val ? '#ff1744' : 'rgba(255,255,255,0.08)',
                        color: form.hasInjuries === val ? '#ff1744' : 'var(--text-secondary)'
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

              <div style={styles.subBlock}>
                <label style={styles.subLabel}>Medical Conditions?</label>
                <div style={{ display: 'flex', gap: '10px', margin: '6px 0' }}>
                  {['YES', 'NO'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm({ ...form, hasHealthIssues: val })}
                      style={{
                        ...styles.toggleBtn,
                        backgroundColor: form.hasHealthIssues === val ? 'rgba(255,214,0,0.2)' : 'rgba(255,255,255,0.03)',
                        borderColor: form.hasHealthIssues === val ? '#ffd600' : 'rgba(255,255,255,0.08)',
                        color: form.hasHealthIssues === val ? '#ffd600' : 'var(--text-secondary)'
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
              <Brain size={18} color="#ab47bc" />
              <h3 style={styles.sectionTitle}>Edit Stress & Lifestyle</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={styles.subLabel}>Rate Stress Level (1 = Low, 10 = Extremely High):</label>
              
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
                        minWidth: '28px',
                        padding: '6px',
                        borderRadius: '8px',
                        backgroundColor: active ? 'rgba(171, 71, 188, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${active ? '#ab47bc' : 'rgba(255, 255, 255, 0.08)'}`,
                        color: active ? '#ab47bc' : '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.8rem',
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

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button type="submit" loading={saving} style={{ flex: 1, padding: '14px', fontSize: '0.95rem', fontWeight: 800 }}>
              <Save size={18} /> Save Changes
            </Button>
            <Button variant="ghost" type="button" onClick={() => setIsEditing(false)} style={{ padding: '14px' }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '90px' },
  headerCard: { padding: '16px' },
  headerRow: { display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' },
  avatarWrapper: { flexShrink: 0 },
  nameText: { margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF' },
  codePill: { padding: '2px 8px', borderRadius: '8px', backgroundColor: 'rgba(0, 200, 83, 0.15)', border: '1px solid rgba(0, 200, 83, 0.3)', color: '#00c853', fontSize: '0.72rem', fontWeight: 800 },
  emailText: { margin: '2px 0 6px 0', fontSize: '0.8rem', color: 'var(--text-secondary, #AAAAAA)' },
  metaRow: { display: 'flex', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted, #AAAAAA)' },
  subHeroCard: { padding: '16px', background: 'linear-gradient(135deg, rgba(0, 200, 83, 0.12) 0%, rgba(18, 18, 20, 0.95) 100%)', border: '1px solid rgba(0, 200, 83, 0.35)' },
  subHeroHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  subIconBadge: { width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(0, 200, 83, 0.15)', border: '1px solid rgba(0, 200, 83, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  subPlanTitle: { margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF' },
  liveStatusPill: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', backgroundColor: 'rgba(0, 200, 83, 0.2)', border: '1px solid #00c853', color: '#00c853', fontSize: '0.75rem', fontWeight: 800 },
  livePulseDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00c853', boxShadow: '0 0 10px #00c853' },
  subStatsRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', padding: '10px 14px', borderRadius: '12px', backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)' },
  subStatBox: { textAlign: 'center', flex: 1 },
  subStatLabel: { fontSize: '0.68rem', color: 'var(--text-secondary, #AAAAAA)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' },
  subStatVal: { fontSize: '0.9rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px', display: 'block' },
  subStatDivider: { width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  progressTrack: { width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '4px', backgroundColor: '#00c853', boxShadow: '0 0 12px rgba(0, 200, 83, 0.5)', transition: 'width 0.4s ease' },
  sectionCard: { padding: '16px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '8px' },
  sectionTitle: { fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#FFFFFF' },
  gridTwo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' },
  gridSummary: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' },
  summaryItem: { display: 'flex', flexDirection: 'column', gap: '3px', padding: '10px 12px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' },
  summaryLabel: { fontSize: '0.72rem', color: 'var(--text-secondary, #AAAAAA)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 },
  summaryVal: { fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' },
  healthBox: { padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' },
  stressBadge: { padding: '4px 10px', borderRadius: '8px', backgroundColor: 'rgba(171, 71, 188, 0.2)', border: '1px solid #ab47bc', color: '#ab47bc', fontWeight: 800, fontSize: '0.8rem' },
  subBlock: { display: 'flex', flexDirection: 'column', gap: '4px' },
  subLabel: { fontSize: '0.8rem', color: 'var(--text-secondary, #AAAAAA)', fontWeight: 600 },
  toggleBtn: { flex: 1, padding: '6px 14px', borderRadius: '8px', border: '1px solid', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }
};
