'use client';

import { useEffect, useState, use } from 'react';
import { 
  getClientById, 
  updateClientProfile, 
  getClientDietPlans, 
  getClientWorkoutPlans, 
  getClientDailyLogs, 
  getClientCheckins, 
  getClientBloodReports,
  getPlans,
  addDocument,
  assignPlan
} from '@/lib/firestore';
import Tabs from '@/components/ui/Tabs';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import ImageUpload from '@/components/ui/ImageUpload';
import { validateField } from '@/lib/validation';
import { 
  User, 
  Calendar, 
  Utensils, 
  Dumbbell, 
  FileText, 
  TrendingUp, 
  Heart, 
  Edit, 
  Plus, 
  Save, 
  Clipboard,
  Activity,
  Send,
  Percent,
  IndianRupee,
  Briefcase,
  MapPin,
  HeartPulse,
  Brain,
  AlertTriangle,
  Camera
} from 'lucide-react';

export default function ClientDetailPage({ params }) {
  const { id } = use(params);
  const toast = useToast();
  
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lists for child tabs
  const [dietPlans, setDietPlans] = useState([]);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [bloodReports, setBloodReports] = useState([]);
  const [allPlansList, setAllPlansList] = useState([]);

  // Modals state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAssignPlanModalOpen, setIsAssignPlanModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');

  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      return url.replace(/\/view(\?.*)?$/, '/preview');
    }
    return url;
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.png') || cleanUrl.endsWith('.gif') || cleanUrl.endsWith('.webp');
  };

  // 18-Field Comprehensive Profile Form State
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    clientCode: '',
    phone: '',
    age: '',
    dob: '',
    gender: 'Male',
    profession: '',
    location: '',
    joiningDate: '',
    height: '',
    weight: '',
    targetWeight: '',
    diet: 'VEG',
    goal: 'Fat Loss',
    daysAvailable: '',
    hasInjuries: 'NO',
    injuriesDetails: '',
    hasHealthIssues: 'NO',
    healthIssuesDetails: '',
    medications: '',
    stressLevel: 5,
    stressSources: '',
    notes: '',
    status: 'active'
  });

  const [assignPlanForm, setAssignPlanForm] = useState({
    planIdCombo: '',
    planStart: new Date().toISOString().split('T')[0],
    originalAmount: '',
    discountType: 'percentage',
    discountValue: '',
    amountPaid: '',
    paymentMethod: 'Cash',
    notes: '',
    status: 'Paid'
  });

  useEffect(() => {
    if (id) {
      const cleanId = typeof id === 'string' && id.includes('_') ? id.split('_')[0] : id;
      fetchClientData(cleanId);
    }
  }, [id]);

  const fetchClientData = async (clientId) => {
    try {
      setLoading(true);
      const [
        clientData,
        diets,
        workouts,
        logs,
        checkinList,
        reports,
        membershipPlans
      ] = await Promise.all([
        getClientById(clientId),
        getClientDietPlans(clientId),
        getClientWorkoutPlans(clientId),
        getClientDailyLogs(clientId),
        getClientCheckins(clientId),
        getClientBloodReports(clientId),
        getPlans()
      ]);

      setClient(clientData);
      setDietPlans(diets || []);
      setWorkoutPlans(workouts || []);
      setDailyLogs(logs || []);
      setCheckins(checkinList || []);
      setBloodReports(reports || []);
      const activePlans = (membershipPlans || []).filter(p => p.status !== 'inactive');
      setAllPlansList(activePlans);

      if (clientData) {
        setProfileForm({
          displayName: clientData.displayName || clientData.name || '',
          clientCode: clientData.clientCode || '100',
          phone: clientData.phone || '',
          age: clientData.age || '',
          dob: clientData.dob || '',
          gender: clientData.gender || 'Male',
          profession: clientData.profession || '',
          location: clientData.location || clientData.address || '',
          joiningDate: clientData.joiningDate || clientData.planStart || '',
          height: clientData.height || '',
          weight: clientData.weight || '',
          targetWeight: clientData.targetWeight || '',
          diet: clientData.diet || clientData.dietPreference || 'VEG',
          goal: clientData.goal || clientData.fitnessGoals || 'Fat Loss',
          daysAvailable: clientData.daysAvailable || '',
          hasInjuries: clientData.hasInjuries || 'NO',
          injuriesDetails: clientData.injuriesDetails || clientData.injuryDetails || '',
          hasHealthIssues: clientData.hasHealthIssues || 'NO',
          healthIssuesDetails: clientData.healthIssuesDetails || clientData.healthDetails || '',
          medications: clientData.medications || '',
          stressLevel: clientData.stressLevel || 5,
          stressSources: clientData.stressSources || '',
          initialPhotos: clientData.initialPhotos || { front: '', back: '', leftSide: '', rightSide: '', side: '' },
          notes: clientData.notes || '',
          status: clientData.status || 'active'
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedData = {
        ...profileForm,
        age: Number(profileForm.age) || '',
        height: Number(profileForm.height) || '',
        weight: Number(profileForm.weight) || '',
        targetWeight: Number(profileForm.targetWeight) || '',
        stressLevel: Number(profileForm.stressLevel) || 5
      };
      await updateClientProfile(id, updatedData);
      toast.success('Client profile updated successfully!');
      setIsEditProfileModalOpen(false);
      await fetchClientData(id);
    } catch (err) {
      toast.error('Failed to update client profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePlanSelectChange = (e) => {
    const combo = e.target.value;
    let priceStr = '';

    if (combo) {
      const [planId, tierIndexStr] = combo.split('||');
      const tierIndex = parseInt(tierIndexStr, 10) || 0;
      const selectedPlan = allPlansList.find(p => p.id === planId);
      if (selectedPlan) {
        const tier = selectedPlan.pricing?.[tierIndex] || { price: selectedPlan.price || 0 };
        priceStr = String(tier.price || 0);
      }
    }

    setAssignPlanForm(prev => ({
      ...prev,
      planIdCombo: combo,
      originalAmount: priceStr,
      amountPaid: priceStr
    }));
  };

  const calculateFinalAmount = () => {
    const original = parseFloat(assignPlanForm.originalAmount) || 0;
    const discountVal = parseFloat(assignPlanForm.discountValue) || 0;

    if (assignPlanForm.discountType === 'percentage') {
      const discountAmt = (original * discountVal) / 100;
      return Math.max(0, original - discountAmt);
    } else {
      return Math.max(0, original - discountVal);
    }
  };

  const calculateBalance = () => {
    const finalAmt = calculateFinalAmount();
    const paid = parseFloat(assignPlanForm.amountPaid) || 0;
    return Math.max(0, finalAmt - paid);
  };

  const handleAssignPlanSave = async (e) => {
    e.preventDefault();
    if (!assignPlanForm.planIdCombo) return toast.warning('Please select a membership plan');

    const amountErr = validateField('Original Amount', assignPlanForm.originalAmount, { required: true, numeric: true, allowDecimal: true });
    const paidErr = validateField('Amount Paid', assignPlanForm.amountPaid, { required: true, numeric: true, allowDecimal: true });
    const discountErr = assignPlanForm.discountValue ? validateField('Discount Value', assignPlanForm.discountValue, { numeric: true, allowDecimal: true }) : null;

    if (amountErr || paidErr || discountErr) {
      toast.error(amountErr || paidErr || discountErr);
      return;
    }

    setSaving(true);
    try {
      const [planId, tierIndexStr] = assignPlanForm.planIdCombo.split('||');
      const tierIndex = parseInt(tierIndexStr, 10) || 0;

      const selectedPlan = allPlansList.find(p => p.id === planId);
      if (!selectedPlan) throw new Error('Selected plan not found');

      const tier = selectedPlan.pricing?.[tierIndex] || {
        durationVal: parseInt(selectedPlan.durationVal, 10) || 1,
        durationUnit: selectedPlan.durationUnit || 'Months',
        price: selectedPlan.price || 0
      };

      const start = new Date(assignPlanForm.planStart);
      const expiry = new Date(start);
      
      const durationVal = parseInt(tier.durationVal, 10) || 1;
      const durationUnit = tier.durationUnit || 'Months';
      
      if (durationUnit === 'Days') {
        expiry.setDate(expiry.getDate() + durationVal);
      } else if (durationUnit === 'Years') {
        expiry.setFullYear(expiry.getFullYear() + durationVal);
      } else {
        expiry.setMonth(expiry.getMonth() + durationVal);
      }

      const originalAmt = parseFloat(assignPlanForm.originalAmount) || 0;
      const discountVal = parseFloat(assignPlanForm.discountValue) || 0;
      const finalAmt = calculateFinalAmount();
      const discountAmt = originalAmt - finalAmt;
      const paidAmt = parseFloat(assignPlanForm.amountPaid) || 0;
      const balanceAmt = Math.max(0, finalAmt - paidAmt);
      const planNameFormatted = `${selectedPlan.plan_name || selectedPlan.name} (${durationVal} ${durationUnit})`;

      const existingHistory = client.planHistory || [];
      const updatedHistory = existingHistory.map(ph => ({ ...ph, status: 'past' }));

      const newPlanFeatures = {
        hasDiet: selectedPlan.hasDiet !== false,
        hasWorkout: selectedPlan.hasWorkout !== false,
        hasTracking: selectedPlan.hasTracking !== false,
        hasPostureCheckin: selectedPlan.hasPostureCheckin === true,
        hasDailyLog: selectedPlan.hasDailyLog !== false
      };

      const newPlanHistoryItem = {
        id: `plan_${Date.now()}`,
        planName: planNameFormatted,
        planId: selectedPlan.id,
        planStart: assignPlanForm.planStart,
        planExpiry: expiry.toISOString().split('T')[0],
        originalAmount: originalAmt,
        discountType: assignPlanForm.discountType,
        discountValue: discountVal,
        discountAmount: discountAmt,
        finalAmount: finalAmt,
        amountPaid: paidAmt,
        balance: balanceAmt,
        paymentStatus: balanceAmt <= 0 ? 'Paid' : 'Partial',
        status: 'active',
        planFeatures: newPlanFeatures,
        assignedAt: new Date().toISOString()
      };

      updatedHistory.unshift(newPlanHistoryItem);

      const updatedData = {
        currentPlan: planNameFormatted,
        planStart: assignPlanForm.planStart,
        planExpiry: expiry.toISOString().split('T')[0],
        amountPaid: paidAmt,
        balance: balanceAmt,
        paymentStatus: balanceAmt <= 0 ? 'Paid' : 'Partial',
        status: 'active',
        planFeatures: newPlanFeatures,
        planHistory: updatedHistory
      };

      await updateClientProfile(id, updatedData);
      await assignPlan({ clientId: id, ...newPlanHistoryItem });

      // Create Invoice entry in Billing collection
      await addDocument('Billing', {
        clientId: id,
        clientName: client.displayName || client.name || 'Client',
        clientEmail: client.email || '',
        clientPhone: client.phone || '',
        date: assignPlanForm.planStart,
        planName: planNameFormatted,
        originalAmount: originalAmt,
        discountType: assignPlanForm.discountType,
        discountValue: discountVal,
        discountAmount: discountAmt,
        finalAmount: finalAmt,
        amountPaid: paidAmt,
        balance: balanceAmt,
        paymentMethod: assignPlanForm.paymentMethod,
        notes: assignPlanForm.notes || '',
        status: balanceAmt <= 0 ? 'Paid' : 'Partial',
        updatedAtStr: new Date().toISOString()
      });

      toast.success(`Assigned plan "${planNameFormatted}" & generated invoice!`);
      setIsAssignPlanModalOpen(false);
      await fetchClientData(id);
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign membership plan');
    } finally {
      setSaving(false);
    }
  };

  const planOptions = [{ label: '-- Select Plan --', value: '' }];
  allPlansList.forEach(plan => {
    if (plan.pricing && plan.pricing.length > 0) {
      plan.pricing.forEach((tier, index) => {
        const val = tier.durationVal || 1;
        const unit = tier.durationUnit || 'Months';
        const price = tier.price || 0;
        planOptions.push({
          label: `${plan.plan_name || plan.name} - ${val} ${unit} (₹${price})`,
          value: `${plan.id}||${index}`
        });
      });
    } else {
      planOptions.push({
        label: `${plan.plan_name || plan.name} (₹${plan.price || 0})`,
        value: `${plan.id}||0`
      });
    }
  });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><Spinner /></div>;
  if (!client) return <div style={{ padding: '50px', textAlign: 'center' }}>Client not found.</div>;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <User size={16} />, content: <OverviewTab client={client} /> },
    { key: 'diet', label: 'Diet Plan', icon: <Utensils size={16} />, content: <DietTab dietPlans={dietPlans} /> },
    { key: 'workout', label: 'Workout Plan', icon: <Dumbbell size={16} />, content: <WorkoutTab workoutPlans={workoutPlans} /> },
    { key: 'logs', label: 'Daily Logs', icon: <FileText size={16} />, content: <LogsTab dailyLogs={dailyLogs} /> },
    { key: 'checkins', label: 'Check-ins', icon: <TrendingUp size={16} />, content: <CheckinsTab checkins={checkins} /> },
    { key: 'blood', label: 'Blood Reports', icon: <Heart size={16} />, content: <BloodTab bloodReports={bloodReports} onViewAttachment={(url) => { setViewerUrl(url); setIsViewerOpen(true); }} /> },
  ];

  const handleRemovePlan = async () => {
    if (!client) return;
    if (!confirm(`Are you sure you want to remove the assigned plan from ${client.displayName || client.name}?`)) return;
    try {
      setLoading(true);
      await updateClientProfile(id, {
        currentPlan: '',
        planStart: '',
        planExpiry: '',
        planId: ''
      });
      toast.success('Assigned plan removed successfully!');
      await fetchClientData(id);
    } catch (err) {
      toast.error('Failed to remove assigned plan');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClientDisable = async () => {
    if (!client) return;
    const isCurrentlyActive = client.status !== 'inactive';
    const newStatus = isCurrentlyActive ? 'inactive' : 'active';
    const actionText = isCurrentlyActive ? 'disable' : 'enable';

    if (!confirm(`Are you sure you want to ${actionText} membership status for ${client.displayName || client.name}?`)) return;

    try {
      setLoading(true);
      await updateClientProfile(id, {
        status: newStatus
      });
      toast.success(`Client membership ${isCurrentlyActive ? 'disabled' : 'enabled'} successfully!`);
      await fetchClientData(id);
    } catch (err) {
      toast.error(`Failed to ${actionText} client`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-up">
      {/* Header Profile Section */}
      <Card style={styles.profileHeaderCard} className="glass-card">
        <div style={styles.headerLeft}>
          <Avatar 
            src={client.photoURL || client.profileImage} 
            name={client.displayName || client.name} 
            size="lg" 
          />
          <div style={styles.headerInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={styles.name}>{client.displayName || client.name || 'Client Profile'}</h1>
              <Badge variant={client.status === 'active' ? 'success' : 'danger'}>
                {client.status?.toUpperCase() || 'ACTIVE'}
              </Badge>
            </div>
            <p style={styles.emailPhone}>
              {client.email} {client.phone ? `• ${client.phone}` : ''}
            </p>
            <div style={styles.quickTags}>
              <span>Code: <strong>{client.clientCode || '100'}</strong></span>
              <span>Age: <strong>{client.age ? `${client.age} yrs` : '--'}</strong></span>
              <span>Gender: <strong>{client.gender || 'Male'}</strong></span>
              <span>Plan: <strong style={{ color: 'var(--accent, #E00008)' }}>{client.currentPlan || 'Not Assigned'}</strong></span>
              {client.planExpiry && <span>Expiry: <strong>{client.planExpiry}</strong></span>}
            </div>
          </div>
        </div>

        <div style={styles.headerActions}>
          <Button 
            variant={client.status === 'inactive' ? 'success' : 'secondary'} 
            size="sm" 
            onClick={handleToggleClientDisable}
          >
            {client.status === 'inactive' ? '⚡ Enable Membership' : '⏸️ Disable Membership'}
          </Button>

          {client.currentPlan && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRemovePlan}
              style={{ color: '#ff1744' }}
            >
              🗑️ Remove Plan
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => setIsEditProfileModalOpen(true)}>
            <Edit size={14} /> Edit Profile
          </Button>
          <Button size="sm" onClick={() => {
            setAssignPlanForm({
              planIdCombo: '',
              planStart: new Date().toISOString().split('T')[0],
              originalAmount: '',
              discountType: 'percentage',
              discountValue: '',
              amountPaid: '',
              paymentMethod: 'Cash',
              notes: '',
              status: 'Paid'
            });
            setIsAssignPlanModalOpen(true);
          }}>
            <Clipboard size={14} /> Change / Assign Plan
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} />

      {/* MODAL 1: EDIT COMPREHENSIVE CLIENT PROFILE */}
      <Modal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        title="Edit Client Profile & Medical Assessment"
        size="lg"
      >
        <form onSubmit={handleEditProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Section 1: Personal Details */}
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
            👤 Personal & Contact Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input 
              label="Client Full Name *" 
              value={profileForm.displayName} 
              onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
              required
            />
            <Input 
              label="Client Code" 
              placeholder="e.g. 100"
              value={profileForm.clientCode} 
              onChange={(e) => setProfileForm({ ...profileForm, clientCode: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <Input 
              label="Phone Number" 
              value={profileForm.phone} 
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              phone={true}
            />
            <Input 
              label="Date of Birth" 
              type="date"
              value={profileForm.dob} 
              onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
            />
            <Input 
              label="Age" 
              value={profileForm.age} 
              onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
              numeric={true}
              maxDigits={3}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <Select 
              label="Gender"
              value={profileForm.gender}
              onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
              options={[
                { label: 'Male', value: 'Male' },
                { label: 'Female', value: 'Female' },
                { label: 'Other', value: 'Other' }
              ]}
            />
            <Input 
              label="Profession" 
              placeholder="e.g. Priest / IT Engineer"
              value={profileForm.profession} 
              onChange={(e) => setProfileForm({ ...profileForm, profession: e.target.value })}
            />
            <Input 
              label="Location / Address" 
              placeholder="e.g. Bodasakuru"
              value={profileForm.location} 
              onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
            />
          </div>

          {/* Section 2: Physical & Fitness Goals */}
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginTop: '6px' }}>
            🏋️ Physical Metrics & Fitness Goals
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <Input 
              label="Height (cm)" 
              placeholder="e.g. 170"
              value={profileForm.height} 
              onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })}
              numeric={true}
              allowDecimal={true}
              maxDigits={3}
            />
            <Input 
              label="Current Weight (kg)" 
              placeholder="e.g. 96.1"
              value={profileForm.weight} 
              onChange={(e) => setProfileForm({ ...profileForm, weight: e.target.value })}
              numeric={true}
              allowDecimal={true}
              maxDigits={3}
            />
            <Input 
              label="Target Weight (kg)" 
              placeholder="e.g. 70"
              value={profileForm.targetWeight} 
              onChange={(e) => setProfileForm({ ...profileForm, targetWeight: e.target.value })}
              numeric={true}
              allowDecimal={true}
              maxDigits={3}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <Select 
              label="Diet Preference"
              value={profileForm.diet}
              onChange={(e) => setProfileForm({ ...profileForm, diet: e.target.value })}
              options={[
                { label: '🥦 VEG', value: 'VEG' },
                { label: '🍗 NON-VEG', value: 'NON-VEG' },
                { label: '🥚 EGGETARIAN', value: 'EGGETARIAN' },
                { label: '🌱 VEGAN', value: 'VEGAN' }
              ]}
            />
            <Select 
              label="Primary Goal"
              value={profileForm.goal}
              onChange={(e) => setProfileForm({ ...profileForm, goal: e.target.value })}
              options={[
                { label: '🔥 Fat Loss', value: 'Fat Loss' },
                { label: '💪 Muscle Gain', value: 'Muscle Gain' },
                { label: '⚡ Strength', value: 'Strength' },
                { label: '🏃 General Fitness', value: 'General Fitness' }
              ]}
            />
            <Input 
              label="Days Available per Week" 
              placeholder="e.g. 6 Days/Week"
              value={profileForm.daysAvailable} 
              onChange={(e) => setProfileForm({ ...profileForm, daysAvailable: e.target.value })}
            />
          </div>

          {/* Section 3: Health, Medical & Stress */}
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginTop: '6px' }}>
            🩺 Medical, Health & Stress Assessment
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <Select 
                label="Any Current / Past Injuries?"
                value={profileForm.hasInjuries}
                onChange={(e) => setProfileForm({ ...profileForm, hasInjuries: e.target.value })}
                options={[
                  { label: 'NO', value: 'NO' },
                  { label: 'YES', value: 'YES' }
                ]}
              />
              {profileForm.hasInjuries === 'YES' && (
                <Input 
                  placeholder="Specify injury details..."
                  value={profileForm.injuriesDetails}
                  onChange={(e) => setProfileForm({ ...profileForm, injuriesDetails: e.target.value })}
                  style={{ marginTop: '6px' }}
                />
              )}
            </div>

            <div>
              <Select 
                label="Medical Conditions / Health Issues?"
                value={profileForm.hasHealthIssues}
                onChange={(e) => setProfileForm({ ...profileForm, hasHealthIssues: e.target.value })}
                options={[
                  { label: 'NO', value: 'NO' },
                  { label: 'YES', value: 'YES' }
                ]}
              />
              {profileForm.hasHealthIssues === 'YES' && (
                <Input 
                  placeholder="e.g. Knee pains, BP, Thyroid..."
                  value={profileForm.healthIssuesDetails}
                  onChange={(e) => setProfileForm({ ...profileForm, healthIssuesDetails: e.target.value })}
                  style={{ marginTop: '6px' }}
                />
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <Input 
              label="Current Medications (if any)" 
              placeholder="e.g. None"
              value={profileForm.medications} 
              onChange={(e) => setProfileForm({ ...profileForm, medications: e.target.value })}
            />
            <Select 
              label="Stress Level (1 = Low, 10 = High)"
              value={profileForm.stressLevel}
              onChange={(e) => setProfileForm({ ...profileForm, stressLevel: e.target.value })}
              options={[
                { label: '1 - Low', value: 1 },
                { label: '2 - Low', value: 2 },
                { label: '3 - Moderate', value: 3 },
                { label: '4 - Moderate', value: 4 },
                { label: '5 - Medium (Default)', value: 5 },
                { label: '6 - High', value: 6 },
                { label: '7 - High', value: 7 },
                { label: '8 - Very High', value: 8 },
                { label: '9 - Extremely High', value: 9 },
                { label: '10 - Maximum', value: 10 }
              ]}
            />
            <Input 
              label="Main Sources of Stress" 
              placeholder="e.g. Work, Sleep schedule"
              value={profileForm.stressSources} 
              onChange={(e) => setProfileForm({ ...profileForm, stressSources: e.target.value })}
            />
          </div>

          {/* Section 4: Initial Baseline Body Photos */}
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginTop: '6px' }}>
            📸 Initial Baseline Body Photos (4 Views)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 700 }}>1. Front View</p>
              <ImageUpload 
                value={profileForm.initialPhotos?.front}
                onUpload={(url) => setProfileForm({ ...profileForm, initialPhotos: { ...profileForm.initialPhotos, front: url } })}
              />
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 700 }}>2. Back View</p>
              <ImageUpload 
                value={profileForm.initialPhotos?.back}
                onUpload={(url) => setProfileForm({ ...profileForm, initialPhotos: { ...profileForm.initialPhotos, back: url } })}
              />
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 700 }}>3. Left Side View</p>
              <ImageUpload 
                value={profileForm.initialPhotos?.leftSide || profileForm.initialPhotos?.side}
                onUpload={(url) => setProfileForm({ ...profileForm, initialPhotos: { ...profileForm.initialPhotos, leftSide: url } })}
              />
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.72rem', fontWeight: 700 }}>4. Right Side View</p>
              <ImageUpload 
                value={profileForm.initialPhotos?.rightSide}
                onUpload={(url) => setProfileForm({ ...profileForm, initialPhotos: { ...profileForm.initialPhotos, rightSide: url } })}
              />
            </div>
          </div>

          <Textarea 
            label="General Trainer Remarks / Confidential Notes" 
            value={profileForm.notes} 
            onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
            rows={2}
          />

          <Button type="submit" loading={saving} fullWidth style={{ marginTop: '10px' }}>
            <Send size={15} /> Submit Profile Changes
          </Button>
        </form>
      </Modal>

      {/* MODAL 2: ASSIGN PLAN & BILLING */}
      <Modal
        isOpen={isAssignPlanModalOpen}
        onClose={() => setIsAssignPlanModalOpen(false)}
        title="Assign Membership Plan & Full Billing"
        size="lg"
      >
        <form onSubmit={handleAssignPlanSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SearchableSelect 
            label="Select Plan *" 
            placeholder="Search & Select Plan..."
            searchPlaceholder="Search plans by name or duration..."
            value={assignPlanForm.planIdCombo} 
            onChange={handlePlanSelectChange}
            options={planOptions}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input 
              label="Start Date *" 
              type="date"
              value={assignPlanForm.planStart} 
              onChange={(e) => setAssignPlanForm({ ...assignPlanForm, planStart: e.target.value })}
              required
            />
            <Input 
              label="Original Amount (₹) *" 
              placeholder="e.g. 1599"
              value={assignPlanForm.originalAmount}
              onChange={(e) => setAssignPlanForm({ ...assignPlanForm, originalAmount: e.target.value })}
              numeric={true}
              allowDecimal={true}
              required
            />
          </div>

          {/* Discount Section */}
          <Card style={{ padding: '10px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Percent size={14} color="#d97706" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' }}>Discount</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Select 
                label="Discount Type"
                value={assignPlanForm.discountType}
                onChange={(e) => setAssignPlanForm({ ...assignPlanForm, discountType: e.target.value })}
                options={[
                  { label: 'Percentage (%)', value: 'percentage' },
                  { label: 'Flat Amount (₹)', value: 'amount' }
                ]}
              />
              <Input 
                label={assignPlanForm.discountType === 'percentage' ? 'Discount %' : 'Discount Amount (₹)'}
                placeholder={assignPlanForm.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 200'}
                value={assignPlanForm.discountValue}
                onChange={(e) => setAssignPlanForm({ ...assignPlanForm, discountValue: e.target.value })}
                numeric={true}
                allowDecimal={true}
              />
            </div>

            {/* Final Amount & Pending Balance Summary */}
            <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Final Payable Price: </span>
                <strong style={{ fontSize: '0.95rem', color: '#00c853' }}>₹{calculateFinalAmount().toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Pending Balance Due: </span>
                <strong style={{ fontSize: '0.95rem', color: calculateBalance() > 0 ? 'var(--danger)' : '#00c853' }}>₹{calculateBalance().toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </Card>

          <Input 
            label="Amount Paid Now (₹) *" 
            placeholder="e.g. 1599"
            value={assignPlanForm.amountPaid}
            onChange={(e) => setAssignPlanForm({ ...assignPlanForm, amountPaid: e.target.value })}
            numeric={true}
            allowDecimal={true}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Select 
              label="Payment Method"
              value={assignPlanForm.paymentMethod}
              onChange={(e) => setAssignPlanForm({ ...assignPlanForm, paymentMethod: e.target.value })}
              options={[
                { label: '💵 Cash', value: 'Cash' },
                { label: '📱 UPI / Google Pay', value: 'UPI' },
                { label: '💳 Card', value: 'Card' },
                { label: '🏦 Bank Transfer', value: 'Bank Transfer' },
                { label: '📝 Other', value: 'Other' }
              ]}
            />
            <Input 
              label="Payment / Receipt Note"
              placeholder="e.g. Received via GPay Ref #9923"
              value={assignPlanForm.notes}
              onChange={(e) => setAssignPlanForm({ ...assignPlanForm, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <Button type="button" variant="outline" onClick={() => setIsAssignPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              <Send size={14} /> Assign Plan & Generate Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* PORTAL VIEWER MODAL */}
      <Modal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        title="Attached Lab Document Preview"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          {viewerUrl ? (
            isImageUrl(viewerUrl) ? (
              <img 
                src={viewerUrl} 
                alt="Document Preview" 
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }} 
              />
            ) : (
              <iframe
                src={getEmbedUrl(viewerUrl)}
                style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '8px' }}
                title="Lab Report PDF Preview"
              />
            )
          ) : (
            <p>No document URL provided</p>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            {viewerUrl && (
              <a href={viewerUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="sm">Open in New Tab ↗</Button>
              </a>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsViewerOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function OverviewTab({ client }) {
  const heightVal = parseFloat(client.height) || 0;
  const weightVal = parseFloat(client.weight) || 0;
  const bmi = (heightVal > 0 && weightVal > 0) ? (weightVal / ((heightVal / 100) ** 2)).toFixed(1) : 'N/A';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
      {/* CARD 1: Personal & Contact Information */}
      <Card style={{ padding: '14px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={16} color="var(--accent)" /> Personal & Contact Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={styles.metricRow}>
            <span>Client Name:</span>
            <strong>{client.displayName || client.name || '--'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Client Code:</span>
            <strong>{client.clientCode || '100'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Mobile No:</span>
            <strong>{client.phone || '--'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Email Address:</span>
            <strong>{client.email || '--'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Date of Birth:</span>
            <strong>{client.dob || '--'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Age / Gender:</span>
            <strong>{client.age ? `${client.age} yrs` : '--'} • {client.gender || 'Male'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Profession:</span>
            <strong>{client.profession || '--'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Location:</span>
            <strong>{client.location || client.address || '--'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Joining Date:</span>
            <strong>{client.joiningDate || client.planStart || '--'}</strong>
          </div>
        </div>
      </Card>

      {/* CARD 2: Physical & Fitness Goals */}
      <Card style={{ padding: '14px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Dumbbell size={16} color="#00c853" /> Physical Metrics & Fitness Goals
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={styles.metricRow}>
            <span>Height:</span>
            <strong>{client.height ? `${client.height} cm` : '--'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Starting / Current Weight:</span>
            <strong>{client.weight ? `${client.weight} kg` : '--'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Target Weight:</span>
            <strong style={{ color: 'var(--accent)' }}>{client.targetWeight ? `${client.targetWeight} kg` : '--'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>BMI Index:</span>
            <strong>{bmi}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Diet Preference:</span>
            <strong style={{ color: client.diet === 'VEG' ? '#00c853' : '#d97706' }}>
              {client.diet || client.dietPreference || 'VEG'}
            </strong>
          </div>
          <div style={styles.metricRow}>
            <span>Primary Goals:</span>
            <strong>{client.goal || client.fitnessGoals || 'Fat Loss'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Days Available:</span>
            <strong>{client.daysAvailable || '--'}</strong>
          </div>
        </div>
      </Card>

      {/* CARD 3: Medical, Health & Stress Assessment */}
      <Card style={{ padding: '14px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HeartPulse size={16} color="#ff1744" /> Medical & Health Assessment
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={styles.metricRow}>
            <span>Past / Current Injuries:</span>
            <strong style={{ color: client.hasInjuries === 'YES' ? 'var(--danger)' : '#00c853' }}>
              {client.hasInjuries || 'NO'}
            </strong>
          </div>
          {client.hasInjuries === 'YES' && (
            <div style={styles.metricRow}>
              <span>Injury Details:</span>
              <strong style={{ color: 'var(--danger)' }}>{client.injuriesDetails || '--'}</strong>
            </div>
          )}

          <div style={styles.metricRow}>
            <span>Medical Conditions:</span>
            <strong style={{ color: client.hasHealthIssues === 'YES' ? 'var(--danger)' : '#00c853' }}>
              {client.hasHealthIssues || 'NO'}
            </strong>
          </div>
          {client.hasHealthIssues === 'YES' && (
            <div style={styles.metricRow}>
              <span>Condition Details:</span>
              <strong style={{ color: 'var(--danger)' }}>{client.healthIssuesDetails || 'Knee pains'}</strong>
            </div>
          )}

          <div style={styles.metricRow}>
            <span>Current Medications:</span>
            <strong>{client.medications || 'None'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Stress Level (1-10):</span>
            <strong style={{ color: (client.stressLevel || 5) > 6 ? 'var(--danger)' : '#00c853' }}>
              {client.stressLevel || 5} / 10
            </strong>
          </div>
          <div style={styles.metricRow}>
            <span>Stress Sources:</span>
            <strong>{client.stressSources || '--'}</strong>
          </div>
        </div>
      </Card>

      {/* CARD 4: Membership & Billing Status */}
      <Card style={{ padding: '14px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IndianRupee size={16} color="#d97706" /> Membership & Billing Status
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={styles.metricRow}>
            <span>Active Plan:</span>
            <strong>{client.currentPlan || 'None Assigned'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Plan Duration:</span>
            <strong>{client.planStart || '--'} to {client.planExpiry || '--'}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Amount Paid:</span>
            <strong style={{ color: '#00c853' }}>₹{(client.amountPaid || 0).toLocaleString('en-IN')}</strong>
          </div>
          <div style={styles.metricRow}>
            <span>Outstanding Balance:</span>
            <strong style={{ color: (client.balance || 0) > 0 ? 'var(--danger)' : '#00c853' }}>
              ₹{(client.balance || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div style={styles.metricRow}>
            <span>Trainer Remarks:</span>
            <strong>{client.notes || 'No confidential notes provided.'}</strong>
          </div>
        </div>
      </Card>

      {/* CARD 5: Initial Baseline Posture Photos */}
      <Card style={{ padding: '14px', gridColumn: 'span 2' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Camera size={16} color="var(--accent)" /> Initial Baseline Body Photos (4 Views)
        </h3>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Baseline photos recorded upon client joining for progress tracking.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
          {[
            { key: 'front', label: 'Front View' },
            { key: 'back', label: 'Back View' },
            { key: 'leftSide', altKey: 'side', label: 'Left Side View' },
            { key: 'rightSide', label: 'Right Side View' }
          ].map(photo => {
            const photoUrl = client.initialPhotos?.[photo.key] || (photo.altKey ? client.initialPhotos?.[photo.altKey] : '');
            return (
              <div key={photo.key} style={{ textAlign: 'center', background: 'var(--card-hover)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {photo.label}
                </div>
                {photoUrl ? (
                  <img 
                    src={photoUrl} 
                    alt={photo.label} 
                    style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }}
                    onClick={() => window.open(photoUrl, '_blank')}
                  />
                ) : (
                  <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.7rem', fontStyle: 'italic' }}>
                    Not Uploaded
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function DietTab({ dietPlans }) {
  if (dietPlans.length === 0) return <Card style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No diet plans assigned to this client yet.</Card>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {dietPlans.map(plan => (
        <Card key={plan.id} style={{ padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{plan.planName}</h3>
            <Badge variant="success">Assigned</Badge>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
            {plan.meals?.length || 0} Meal Slots • Created on {plan.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
          </p>
        </Card>
      ))}
    </div>
  );
}

function WorkoutTab({ workoutPlans }) {
  if (workoutPlans.length === 0) return <Card style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No workout plans assigned to this client yet.</Card>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {workoutPlans.map(plan => (
        <Card key={plan.id} style={{ padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{plan.planName}</h3>
            <Badge variant="success">Active Plan</Badge>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
            {plan.exercises?.length || 0} Exercises • Created on {plan.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
          </p>
        </Card>
      ))}
    </div>
  );
}

function LogsTab({ dailyLogs }) {
  if (dailyLogs.length === 0) return <Card style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No daily activity logs recorded yet.</Card>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {dailyLogs.map(log => (
        <Card key={log.id} style={{ padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>📅 {log.date}</span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {log.steps && <span>👟 {log.steps} steps</span>}
              {log.water && <span>💧 {log.water}L</span>}
              {log.sleepHours && <span>🌙 {log.sleepHours}h</span>}
              {log.weight && <span>⚖️ {log.weight}kg</span>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CheckinsTab({ checkins }) {
  if (checkins.length === 0) return <Card style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No 10-day check-in records submitted yet.</Card>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {checkins.map(chk => (
        <Card key={chk.id} style={{ padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
              📸 Check-in ({chk.date || chk.createdAt?.toDate?.()?.toLocaleDateString() || 'Record'})
            </span>
            <Badge variant="success">Completed</Badge>
          </div>
          {chk.photos && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingTop: '6px' }}>
              {Object.entries(chk.photos).map(([side, url]) => (
                url ? <img key={side} src={url} alt={side} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} /> : null
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function BloodTab({ bloodReports, onViewAttachment }) {
  if (bloodReports.length === 0) return <Card style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No blood test reports uploaded yet.</Card>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {bloodReports.map(rpt => (
        <Card key={rpt.id} style={{ padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 2px 0', fontSize: '0.88rem' }}>{rpt.testName}</h4>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>📅 Date: {rpt.testDate}</p>
            </div>
            {rpt.reportUrl && (
              <Button size="sm" variant="outline" onClick={() => onViewAttachment(rpt.reportUrl)}>
                View Report
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingBottom: '40px',
  },
  profileHeaderCard: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  name: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--text)',
  },
  emailPhone: {
    margin: 0,
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
  },
  quickTags: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '4px',
    fontSize: '0.72rem',
    color: 'var(--text-secondary)',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.78rem',
    borderBottom: '1px dashed var(--border)',
    paddingBottom: '4px',
  },
};
