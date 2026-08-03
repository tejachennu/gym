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
  getPlans
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
  Activity
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

  // Forms state
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    phone: '',
    age: '',
    gender: 'Male',
    height: '',
    weight: '',
    notes: '',
    status: 'active'
  });

  const [assignPlanForm, setAssignPlanForm] = useState({
    planIdCombo: '',
    planStart: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (id) {
      fetchClientData(id);
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
      setAllPlansList(membershipPlans || []);

      if (clientData) {
        setProfileForm({
          displayName: clientData.displayName || clientData.name || '',
          phone: clientData.phone || '',
          age: clientData.age || '',
          gender: clientData.gender || 'Male',
          height: clientData.height || '',
          weight: clientData.weight || '',
          notes: clientData.notes || '',
          status: clientData.status || 'active'
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load client profile details');
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
        weight: Number(profileForm.weight) || ''
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

  const handleAssignPlanSave = async (e) => {
    e.preventDefault();
    if (!assignPlanForm.planIdCombo) return toast.warning('Please select a membership plan');
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

      const updatedData = {
        currentPlan: `${selectedPlan.plan_name || selectedPlan.name} (${durationVal} ${durationUnit})`,
        planStart: assignPlanForm.planStart,
        planExpiry: expiry.toISOString().split('T')[0],
        status: 'active'
      };

      await updateClientProfile(id, updatedData);
      toast.success(`Successfully assigned plan "${updatedData.currentPlan}" to client!`);
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

  return (
    <div style={styles.container}>
      {/* Header Profile */}
      <Card style={styles.headerCard} className="glass-card">
        <div style={styles.profileSection}>
          <Avatar src={client.photoURL} name={client.displayName || client.name} size="xl" />
          <div style={styles.profileInfo}>
            <h1 style={styles.name}>{client.displayName || client.name || 'No Name'}</h1>
            <p style={styles.email}>{client.email}</p>
            <div style={styles.badges}>
              <Badge variant={client.status === 'active' ? 'success' : 'warning'}>
                {(client.status || 'inactive').toUpperCase()}
              </Badge>
              {client.currentPlan && <Badge variant="primary">{client.currentPlan}</Badge>}
            </div>
          </div>
        </div>
        <div style={styles.headerActions}>
          <Button variant="outline" onClick={() => setIsEditProfileModalOpen(true)}>
            <Edit size={16} /> Edit Profile
          </Button>
          <Button onClick={() => setIsAssignPlanModalOpen(true)}>
            <Calendar size={16} /> Assign Plan
          </Button>
        </div>
      </Card>

      {/* Tabs list (Matches correctly by key: 'overview' / 'diet') */}
      <Tabs tabs={tabs} defaultTab="overview" />

      {/* MODAL 1: EDIT PROFILE */}
      <Modal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        title="Edit Client Profile Details"
        size="md"
      >
        <form onSubmit={handleEditProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input 
            label="Full Name *" 
            value={profileForm.displayName} 
            onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
            required
          />
          <Input 
            label="Phone Number" 
            value={profileForm.phone} 
            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input 
              label="Age" 
              type="number"
              value={profileForm.age} 
              onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
            />
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
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input 
              label="Height (cm)" 
              type="number"
              value={profileForm.height} 
              onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })}
            />
            <Input 
              label="Weight (kg)" 
              type="number"
              value={profileForm.weight} 
              onChange={(e) => setProfileForm({ ...profileForm, weight: e.target.value })}
            />
          </div>
          <Select 
            label="Status" 
            value={profileForm.status} 
            onChange={(e) => setProfileForm({ ...profileForm, status: e.target.value })}
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' }
            ]}
          />
          <Textarea 
            label="Trainer / Admin Notes" 
            value={profileForm.notes} 
            onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
          />
          <Button type="submit" loading={saving} fullWidth style={{ marginTop: '10px' }}>
            <Save size={16} /> Save Profile Changes
          </Button>
        </form>
      </Modal>

      {/* MODAL 2: ASSIGN PLAN */}
      <Modal
        isOpen={isAssignPlanModalOpen}
        onClose={() => setIsAssignPlanModalOpen(false)}
        title="Assign Membership Plan"
        size="md"
      >
        <form onSubmit={handleAssignPlanSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <SearchableSelect 
            label="Select Plan *" 
            placeholder="Search & Select Plan..."
            searchPlaceholder="Search plans by name or duration..."
            value={assignPlanForm.planIdCombo} 
            onChange={(e) => setAssignPlanForm({ ...assignPlanForm, planIdCombo: e.target.value })}
            options={planOptions}
            required
          />
          <Input 
            label="Start Date *" 
            type="date"
            value={assignPlanForm.planStart} 
            onChange={(e) => setAssignPlanForm({ ...assignPlanForm, planStart: e.target.value })}
            required
          />
          <Button type="submit" loading={saving} fullWidth style={{ marginTop: '10px' }}>
            Assign Plan Now
          </Button>
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
          {viewerUrl && (
            isImageUrl(viewerUrl) ? (
              <img 
                src={viewerUrl} 
                alt="Attached Lab Document" 
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px' }} 
              />
            ) : (
              <iframe 
                src={getEmbedUrl(viewerUrl)} 
                style={{ width: '100%', height: '65vh', borderRadius: '8px', border: '1px solid var(--border, #2a2a30)' }} 
                allow="autoplay"
              />
            )
          )}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
            {viewerUrl && (
              <a 
                href={viewerUrl} 
                target="_blank" 
                rel="noreferrer" 
                style={{
                  color: 'var(--accent, #E00008)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileText size={16} /> Open in New Tab
              </a>
            )}
            <Button onClick={() => setIsViewerOpen(false)}>Close Preview</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------------- TAB COMPONENTS ----------------

function OverviewTab({ client }) {
  return (
    <div style={styles.overviewGrid}>
      {/* 1. Personal & Contact Details */}
      <Card style={styles.card} className="glass-card">
        <h3 style={styles.cardTitle}>📋 Personal & Contact Info</h3>
        <div style={styles.infoList}>
          <div style={styles.infoRow}><span style={styles.label}>Client Code:</span> <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{client.clientCode || `PH-${(client.id || '').slice(0, 6).toUpperCase()}`}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Phone:</span> <span style={{ color: '#FFFFFF' }}>{client.phone || 'N/A'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Age:</span> <span style={{ color: '#FFFFFF' }}>{client.age || 'N/A'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Gender:</span> <span style={{ color: '#FFFFFF' }}>{client.gender || 'N/A'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Date of Birth:</span> <span style={{ color: '#FFFFFF' }}>{client.dob || 'N/A'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Profession:</span> <span style={{ color: '#FFFFFF' }}>{client.profession || 'N/A'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Location:</span> <span style={{ color: '#FFFFFF' }}>{client.location || client.address || 'N/A'}</span></div>
        </div>
      </Card>
      
      {/* 2. Fitness Goals & Metrics */}
      <Card style={styles.card} className="glass-card">
        <h3 style={styles.cardTitle}>🏋️ Metrics & Fitness Goals</h3>
        <div style={styles.infoList}>
          <div style={styles.infoRow}><span style={styles.label}>Height:</span> <span style={{ color: '#FFFFFF' }}>{client.height ? `${client.height} cm` : 'N/A'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Current Weight:</span> <span style={{ color: '#FFFFFF' }}>{client.weight ? `${client.weight} kg` : 'N/A'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Target Weight:</span> <span style={{ color: 'var(--success, #00c853)', fontWeight: 700 }}>{client.targetWeight ? `${client.targetWeight} kg` : 'N/A'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Diet Preference:</span> <span style={{ color: '#FFFFFF' }}>{client.diet || 'N/A'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Primary Goal:</span> <span style={{ color: 'var(--accent, #E00008)', fontWeight: 700 }}>{client.goal || 'N/A'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Days Available:</span> <span style={{ color: '#FFFFFF' }}>{client.daysAvailable || 'N/A'}</span></div>
        </div>
      </Card>

      {/* 3. Medical & Injury History */}
      <Card style={{ ...styles.card, gridColumn: '1 / -1' }} className="glass-card">
        <h3 style={styles.cardTitle}>🏥 Medical & Health History</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Injuries Record:</span>
            <div style={{ color: client.hasInjuries === 'YES' ? '#ff1744' : '#00c853', fontWeight: 700 }}>
              {client.hasInjuries === 'YES' ? `YES — ${client.injuriesDetails || 'No details provided'}` : 'NO INJURIES LOGGED'}
            </div>
          </div>

          <div>
            <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Medical Conditions:</span>
            <div style={{ color: client.hasHealthIssues === 'YES' ? '#ffd600' : '#00c853', fontWeight: 700 }}>
              {client.hasHealthIssues === 'YES' ? `YES — ${client.healthIssuesDetails || 'No details provided'}` : 'NO MEDICAL CONDITIONS LOGGED'}
            </div>
            {client.medications && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                Medications: <span style={{ color: '#FFFFFF' }}>{client.medications}</span>
              </div>
            )}
          </div>

          <div>
            <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Stress Level (1-10):</span>
            <div style={{ color: '#ab47bc', fontWeight: 800, fontSize: '1rem' }}>
              Level {client.stressLevel || 5} / 10
            </div>
            {client.stressSources && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                Sources: <span style={{ color: '#FFFFFF' }}>{client.stressSources}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 4. Membership Details */}
      <Card style={styles.card} className="glass-card">
        <h3 style={styles.cardTitle}>💳 Membership Status</h3>
        <div style={styles.infoList}>
          <div style={styles.infoRow}><span style={styles.label}>Current Plan:</span> <span style={{ color: '#FFFFFF' }}>{client.currentPlan || 'None'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Start Date:</span> <span style={{ color: '#FFFFFF' }}>{client.planStart || 'N/A'}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Expiry Date:</span> <span style={{ color: '#FFFFFF' }}>{client.planExpiry || 'N/A'}</span></div>
        </div>
      </Card>

      {/* 5. Admin Notes */}
      <Card style={styles.card} className="glass-card">
        <h3 style={styles.cardTitle}>📝 Admin Notes</h3>
        <p style={{ color: 'var(--text-secondary, #AAAAAA)', fontStyle: 'italic', margin: 0, fontSize: '0.85rem' }}>
          {client.notes || 'No admin notes added for this client.'}
        </p>
      </Card>
    </div>
  );
}

function DietTab({ dietPlans }) {
  return (
    <div style={styles.tabContentGrid}>
      {dietPlans.length > 0 ? (
        dietPlans.map((plan) => (
          <Card key={plan.id} style={styles.historyCard} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#FFFFFF' }}>{plan.planTitle}</h4>
              <Badge variant={plan.status === 'active' ? 'success' : 'secondary'}>
                {(plan.status || 'ACTIVE').toUpperCase()}
              </Badge>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '8px 0' }}>
              <span>📅 Valid: {plan.fromDate} ➔ {plan.toDate}</span>
              <span style={{ color: 'var(--accent, #E00008)' }}>🔥 {plan.totals?.calories || 0} Kcal</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
              <span>P: {plan.totals?.protein}g</span>
              <span>C: {plan.totals?.carbs}g</span>
              <span>F: {plan.totals?.fat}g</span>
            </div>
          </Card>
        ))
      ) : (
        <div style={styles.placeholder}>No assigned diet plans found for this client.</div>
      )}
    </div>
  );
}

function WorkoutTab({ workoutPlans }) {
  return (
    <div style={styles.tabContentGrid}>
      {workoutPlans.length > 0 ? (
        workoutPlans.map((plan) => (
          <Card key={plan.id} style={styles.historyCard} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#FFFFFF' }}>{plan.planTitle}</h4>
              <Badge variant={plan.status === 'active' ? 'success' : 'secondary'}>
                {(plan.status || 'ACTIVE').toUpperCase()}
              </Badge>
            </div>
            <p style={{ margin: '8px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              📅 Valid: {plan.fromDate} ➔ {plan.toDate}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#FFFFFF' }}>
              {(plan.exercises || []).map((ex, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>• {ex.name}</span>
                  <span>{ex.sets} sets x {ex.reps} reps ({ex.weight || 'BW'})</span>
                </div>
              ))}
            </div>
          </Card>
        ))
      ) : (
        <div style={styles.placeholder}>No assigned workout plans found for this client.</div>
      )}
    </div>
  );
}

function LogsTab({ dailyLogs }) {
  return (
    <div style={styles.tabContentGrid}>
      {dailyLogs.length > 0 ? (
        dailyLogs.map((log) => (
          <Card key={log.id} style={styles.historyCard} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#FFFFFF' }}>📅 Date: {log.date}</h4>
              <Badge variant="primary">Logged</Badge>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', margin: '12px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div>💧 Water: {log.waterIntake || 0} L</div>
              <div>😴 Sleep: {log.sleepHours || 0} hrs</div>
              <div>🔥 Steps: {log.steps || 0}</div>
            </div>
            {log.mealsLogged && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Meals Eaten:</strong> {Object.keys(log.mealsLogged).filter(k => log.mealsLogged[k]).join(', ') || 'None'}
              </div>
            )}
          </Card>
        ))
      ) : (
        <div style={styles.placeholder}>No daily log submissions found for this client.</div>
      )}
    </div>
  );
}

function CheckinsTab({ checkins }) {
  return (
    <div style={styles.tabContentGrid}>
      {checkins.length > 0 ? (
        checkins.map((chk) => (
          <Card key={chk.id} style={styles.historyCard} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#FFFFFF' }}>📅 Date: {chk.date}</h4>
              <Badge variant="success">Check-in</Badge>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', margin: '12px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div>⚖️ Weight: {chk.weight || 'N/A'} kg</div>
              <div>📏 Chest: {chk.chest || 'N/A'} cm</div>
              <div>📏 Waist: {chk.waist || 'N/A'} cm</div>
            </div>
            {chk.notes && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                " {chk.notes} "
              </p>
            )}
          </Card>
        ))
      ) : (
        <div style={styles.placeholder}>No body check-in submissions found for this client.</div>
      )}
    </div>
  );
}

function BloodTab({ bloodReports, onViewAttachment }) {
  return (
    <div style={styles.tabContentGrid}>
      {bloodReports.length > 0 ? (
        bloodReports.map((rep) => (
          <Card key={rep.id} style={styles.historyCard} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#FFFFFF' }}>📋 {rep.reportName || 'Blood Test'}</h4>
              <Badge variant="danger">Report</Badge>
            </div>
            <p style={{ margin: '6px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              📅 Uploaded: {rep.date || 'N/A'}
            </p>
            {rep.notes && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{rep.notes}</p>}
            {rep.fileUrl && (
              <button 
                type="button"
                onClick={() => onViewAttachment && onViewAttachment(rep.fileUrl)}
                style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  color: 'var(--accent, #E00008)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  textAlign: 'left'
                }}
              >
                View Attachment PDF/Image
              </button>
            )}
          </Card>
        ))
      ) : (
        <div style={styles.placeholder}>No uploaded blood reports found for this client.</div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  headerCard: {
    padding: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '24px',
  },
  profileSection: { display: 'flex', gap: '24px', alignItems: 'center' },
  profileInfo: { display: 'flex', flexDirection: 'column', gap: '8px' },
  name: { margin: 0, fontSize: '2rem', letterSpacing: '-0.02em', fontWeight: 800 },
  email: { margin: 0, color: 'var(--text-secondary, #AAAAAA)' },
  badges: { display: 'flex', gap: '8px', marginTop: '8px' },
  headerActions: { display: 'flex', gap: '12px' },
  placeholder: { padding: '40px', textAlign: 'center', color: 'var(--text-secondary, #AAAAAA)', backgroundColor: 'var(--card, #121214)', borderRadius: 'var(--radius-sm, 12px)', border: '1px solid var(--border, #2a2a30)' },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginTop: '24px',
  },
  card: { padding: '24px' },
  cardTitle: { margin: '0 0 16px 0', fontSize: '1.2rem', borderBottom: '1px solid var(--border, #2a2a30)', paddingBottom: '12px' },
  infoList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  infoRow: { display: 'flex', justify: 'space-between', justifyContent: 'space-between' },
  label: { color: 'var(--text-secondary, #AAAAAA)', fontWeight: 500 },
  tabContentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
    marginTop: '24px'
  },
  historyCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  }
};
