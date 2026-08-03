'use client';

import { useState, useEffect } from 'react';
import { 
  getAllClients, 
  createWorkoutPlan, 
  getClientWorkoutPlans, 
  updateWorkoutPlan, 
  deleteWorkoutPlan,
  getWorkoutTemplates,
  createWorkoutTemplate,
  updateWorkoutTemplate,
  deleteWorkoutTemplate
} from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Select, Input, Textarea } from '@/components/ui/Input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { CardSkeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { 
  Dumbbell, 
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  Calendar, 
  Edit, 
  Sparkles,
  Award,
  BookOpen
} from 'lucide-react';

export default function WorkoutPlansPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('client-workouts'); // 'client-workouts' | 'templates'
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [clientPlans, setClientPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Workout Builder Modal Popup state
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planTitle, setPlanTitle] = useState('Custom Workout Plan');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [exercisesState, setExercisesState] = useState([
    { name: 'Barbell Bench Press', sets: 4, reps: '8-10', weight: '60 kg', rest: '90s', notes: 'Keep elbows tucked' }
  ]);
  const [statusBanner, setStatusBanner] = useState(null);

  // Template Modal State (Admin CRUD for master templates)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    templateName: '',
    description: '',
    exercises: [
      { name: 'Barbell Squat', sets: 4, reps: '8-10', weight: '80 kg', rest: '120s', notes: 'Go below parallel' }
    ]
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [clientData, templateData] = await Promise.all([
        getAllClients(),
        getWorkoutTemplates()
      ]);
      setClients(clientData);
      setTemplates(templateData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load workout data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      loadClientWorkoutHistory(selectedClient);
    } else {
      setClientPlans([]);
    }
  }, [selectedClient]);

  const loadClientWorkoutHistory = async (clientId) => {
    try {
      setLoading(true);
      const history = await getClientWorkoutPlans(clientId);
      setClientPlans(history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Open Modal to Add New Workout Plan
  const handleOpenAddModal = () => {
    if (!selectedClient) {
      return toast.warning('Please select a client from the dropdown first.');
    }
    setEditingPlanId(null);
    setPlanTitle('Custom Workout Plan');
    setFromDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setToDate(d.toISOString().split('T')[0]);
    setExercisesState([
      { name: '', sets: 3, reps: '10', weight: '', rest: '60s', notes: '' }
    ]);
    setStatusBanner(null);
    setIsWorkoutModalOpen(true);
  };

  // Open Modal to Edit Existing Workout Plan
  const handleOpenEditModal = (plan) => {
    setEditingPlanId(plan.id);
    setPlanTitle(plan.planTitle || 'Custom Workout Plan');
    setFromDate(plan.fromDate || new Date().toISOString().split('T')[0]);
    setToDate(plan.toDate || new Date().toISOString().split('T')[0]);
    if (plan.exercises) setExercisesState(plan.exercises);
    else setExercisesState([{ name: '', sets: 3, reps: '10', weight: '', rest: '60s', notes: '' }]);
    setStatusBanner(null);
    setIsWorkoutModalOpen(true);
  };

  // Map Template into Modal Builder
  const handleApplyTemplate = (templateId) => {
    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return;
    setPlanTitle(tmpl.templateName);
    if (tmpl.exercises) setExercisesState(tmpl.exercises);
    toast.success(`Loaded "${tmpl.templateName}" template into builder!`);
  };

  // Exercise row handlers
  const handleAddExercise = () => {
    setExercisesState([
      ...exercisesState,
      { name: '', sets: 3, reps: '10', weight: '', rest: '60s', notes: '' }
    ]);
  };

  const handleRemoveExercise = (idx) => {
    setExercisesState(exercisesState.filter((_, i) => i !== idx));
  };

  const handleExerciseChange = (idx, field, value) => {
    const updated = [...exercisesState];
    updated[idx] = {
      ...updated[idx],
      [field]: field === 'sets' ? Number(value) || 0 : value
    };
    setExercisesState(updated);
  };

  // Save Workout Plan for Client
  const handleSaveClientWorkoutPlan = async (e) => {
    if (e) e.preventDefault();
    setStatusBanner(null);

    if (!selectedClient) {
      const msg = 'Mandatory Field Missing: Please select a client first.';
      toast.warning(msg);
      setStatusBanner({ type: 'error', message: msg });
      return;
    }
    if (!planTitle.trim()) {
      const msg = 'Mandatory Field Missing: Please enter a Workout Plan Title.';
      toast.warning(msg);
      setStatusBanner({ type: 'error', message: msg });
      return;
    }
    if (!fromDate || !toDate) {
      const msg = 'Mandatory Field Missing: Please select both From Date and To Date.';
      toast.warning(msg);
      setStatusBanner({ type: 'error', message: msg });
      return;
    }
    if (fromDate > toDate) {
      const msg = 'Invalid Date Range: From Date cannot be later than To Date.';
      toast.warning(msg);
      setStatusBanner({ type: 'error', message: msg });
      return;
    }

    const hasAtLeastOneExercise = exercisesState.some(ex => ex.name && ex.name.trim().length > 0);
    if (!hasAtLeastOneExercise) {
      const msg = 'Mandatory Field Missing: Please add at least 1 exercise with a name.';
      toast.warning(msg);
      setStatusBanner({ type: 'error', message: msg });
      return;
    }

    setSaving(true);
    try {
      const selectedClientObj = clients.find((c) => c.id === selectedClient);
      const todayStr = new Date().toISOString().split('T')[0];
      let status = 'active';
      if (fromDate > todayStr) status = 'scheduled';
      if (toDate < todayStr) status = 'completed';

      const planData = {
        clientId: selectedClient,
        clientName: selectedClientObj?.displayName || selectedClientObj?.name || selectedClientObj?.email || 'Client',
        planTitle: planTitle.trim(),
        fromDate,
        toDate,
        status,
        exercises: exercisesState.map(ex => ({
          name: ex.name || '',
          sets: Number(ex.sets) || 0,
          reps: ex.reps || '',
          weight: ex.weight || '',
          rest: ex.rest || '',
          notes: ex.notes || ''
        })),
        updatedAtStr: new Date().toISOString()
      };

      if (editingPlanId) {
        await updateWorkoutPlan(editingPlanId, planData);
        toast.success(`Workout Plan "${planTitle}" updated for client!`);
      } else {
        await createWorkoutPlan(planData);
        toast.success(`New Workout Plan "${planTitle}" assigned!`);
      }
      setIsWorkoutModalOpen(false);
      await loadClientWorkoutHistory(selectedClient);
    } catch (err) {
      console.error(err);
      const errorMsg = `Save Error: ${err.message || 'Failed to save workout plan'}`;
      toast.error(errorMsg);
      setStatusBanner({ type: 'error', message: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClientPlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this assigned workout plan?')) return;
    try {
      await deleteWorkoutPlan(planId);
      toast.success('Workout plan deleted successfully');
      await loadClientWorkoutHistory(selectedClient);
    } catch (err) {
      toast.error('Failed to delete workout plan');
    }
  };

  const handleSeedTemplates = async () => {
    try {
      setLoading(true);
      const { seedPlans } = await import('@/lib/seedPlans');
      await seedPlans();
      await fetchInitialData();
      toast.success('Sample workout templates seeded!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Save Template Modal handler
  const handleSaveTemplateModal = async (e) => {
    e.preventDefault();
    if (!templateForm.templateName) return toast.warning('Template name is required');
    
    const hasAtLeastOneExercise = templateForm.exercises.some(ex => ex.name && ex.name.trim().length > 0);
    if (!hasAtLeastOneExercise) return toast.warning('Please add at least 1 exercise to the template');

    setSaving(true);
    try {
      const data = { 
        ...templateForm, 
        updatedAtStr: new Date().toISOString() 
      };
      if (editingTemplateId) {
        await updateWorkoutTemplate(editingTemplateId, data);
        toast.success(`Template "${templateForm.templateName}" updated!`);
      } else {
        await createWorkoutTemplate(data);
        toast.success(`Template "${templateForm.templateName}" created!`);
      }
      setIsTemplateModalOpen(false);
      await fetchInitialData();
    } catch (err) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this workout template?')) return;
    try {
      await deleteWorkoutTemplate(templateId);
      toast.success('Template deleted');
      await fetchInitialData();
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const selectedClientObj = clients.find(c => c.id === selectedClient);

  // Template Form Exercise handlers
  const handleTmplAddExercise = () => {
    setTemplateForm({
      ...templateForm,
      exercises: [...templateForm.exercises, { name: '', sets: 3, reps: '10', weight: '', rest: '60s', notes: '' }]
    });
  };

  const handleTmplRemoveExercise = (idx) => {
    setTemplateForm({
      ...templateForm,
      exercises: templateForm.exercises.filter((_, i) => i !== idx)
    });
  };

  const handleTmplExerciseChange = (idx, field, value) => {
    const updated = [...templateForm.exercises];
    updated[idx] = {
      ...updated[idx],
      [field]: field === 'sets' ? Number(value) || 0 : value
    };
    setTemplateForm({
      ...templateForm,
      exercises: updated
    });
  };

  return (
    <div style={styles.container} className="animate-fade-up">
      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.headerIconWrapper}>
              <Dumbbell size={22} color="var(--accent, #E00008)" />
            </div>
            <h1 style={styles.title}>Workout Plans Management</h1>
          </div>
          <p style={{ color: 'var(--text-secondary, #AAAAAA)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Assign date-bound workout routines to clients or build master templates
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={styles.tabGroup}>
          <button 
            style={{ ...styles.tabBtn, ...(activeTab === 'client-workouts' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('client-workouts')}
          >
            <Calendar size={16} /> Client Workouts
          </button>
          <button 
            style={{ ...styles.tabBtn, ...(activeTab === 'templates' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('templates')}
          >
            <Sparkles size={16} /> Master Templates ({templates.length})
          </button>
        </div>
      </header>

      {/* TAB 1: CLIENT WORKOUT PLANS DASHBOARD */}
      {activeTab === 'client-workouts' && (
        <>
          {/* Client Selector Bar */}
          <Card style={{ padding: '20px', position: 'relative', zIndex: 100 }} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: '280px', maxWidth: '500px' }}>
                <SearchableSelect 
                  label="Search & Select Client *"
                  placeholder="Type name, phone, or email to search..."
                  value={selectedClient} 
                  onChange={(e) => setSelectedClient(e.target.value)}
                  options={clients.map((c) => ({
                    label: c.displayName || c.name || 'No Name',
                    value: c.id,
                    email: c.email || '',
                    phone: c.phone || ''
                  }))}
                  required
                />
              </div>

              {selectedClient && (
                <Button 
                  onClick={handleOpenAddModal}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={18} /> + Add Workout Plan
                </Button>
              )}
            </div>
          </Card>

          {/* Client Existing Workout Plans List */}
          {selectedClient ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                  Assigned Workout Plans for <span style={{ color: 'var(--accent, #E00008)' }}>{selectedClientObj?.displayName || selectedClientObj?.name || 'Client'}</span> ({clientPlans.length})
                </h2>
              </div>

              {loading ? (
                <div style={styles.grid}>
                  {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
              ) : clientPlans.length > 0 ? (
                <div style={styles.grid}>
                  {clientPlans.map((plan) => (
                    <Card key={plan.id} style={styles.planCard} className="glass-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: '#FFFFFF', fontWeight: 700 }}>
                            {plan.planTitle || 'Workout Plan'}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={14} color="var(--accent, #E00008)" />
                            Valid: <strong>{plan.fromDate}</strong> ➔ <strong>{plan.toDate}</strong>
                          </div>
                        </div>
                        <Badge variant={plan.status === 'active' ? 'success' : plan.status === 'scheduled' ? 'warning' : 'secondary'}>
                          {(plan.status || 'ACTIVE').toUpperCase()}
                        </Badge>
                      </div>

                      <div style={styles.exerciseSummaryBar}>
                        <Dumbbell size={16} color="var(--accent, #E00008)" />
                        <span style={{ fontWeight: 700, color: '#FFFFFF' }}>
                          {plan.exercises?.length || 0} Exercises Assigned
                        </span>
                      </div>

                      {/* Summary Exercises Row */}
                      <div style={styles.summaryExercisesList}>
                        {(plan.exercises || []).slice(0, 3).map((ex, idx) => (
                          <div key={idx} style={styles.summarySlotRow}>
                            <span>• {ex.name}</span>
                            <span style={{ color: 'var(--accent, #E00008)' }}>{ex.sets}x{ex.reps}</span>
                          </div>
                        ))}
                        {plan.exercises?.length > 3 && (
                          <div style={{ ...styles.summarySlotRow, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            + {plan.exercises.length - 3} more exercises
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div style={styles.cardActions}>
                        <Button 
                          variant="outline" 
                          onClick={() => handleOpenEditModal(plan)}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <Edit size={15} /> Edit / Update Plan
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleDeleteClientPlan(plan.id)}
                          style={{ color: '#ff1744', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Trash2 size={15} /> Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <Dumbbell size={48} color="var(--text-muted, #666666)" />
                  <h3 style={{ margin: '16px 0 6px', color: '#FFFFFF' }}>No Workout Plans Found</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Click <strong>"+ Add Workout Plan"</strong> above to assign a customized workout schedule to {selectedClientObj?.displayName || 'this client'}.
                  </p>
                  <Button onClick={handleOpenAddModal}>+ Add Workout Plan Now</Button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Dumbbell size={48} color="var(--text-muted, #666666)" />
              <h3 style={{ margin: '16px 0 6px', color: '#FFFFFF' }}>Select a Client to Manage Workouts</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Choose a client from the dropdown search above to view, update, or assign workout plans.
              </p>
            </div>
          )}
        </>
      )}

      {/* TAB 2: MASTER WORKOUT TEMPLATES */}
      {activeTab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
              Create reusable workout routine templates for 1-click client assignment mapping.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="outline" onClick={handleSeedTemplates}>
                🌱 Seed Templates
              </Button>
              <Button onClick={() => {
                setEditingTemplateId(null);
                setTemplateForm({ templateName: '', description: '', exercises: [{ name: '', sets: 3, reps: '10', weight: '', rest: '60s', notes: '' }] });
                setIsTemplateModalOpen(true);
              }}>
                <Plus size={16} /> Create Master Template
              </Button>
            </div>
          </div>

          <div style={styles.templateGrid}>
            {templates.map((tmpl) => (
              <Card key={tmpl.id} style={styles.templateCard} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#FFFFFF' }}>{tmpl.templateName}</h3>
                  <div style={styles.tmplBadge}>{tmpl.exercises?.length || 0} Ex</div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '8px 0 16px', lineHeight: 1.4 }}>
                  {tmpl.description || 'Master workout routine template.'}
                </p>

                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <Button 
                    variant="outline" 
                    fullWidth 
                    onClick={() => {
                      setEditingTemplateId(tmpl.id);
                      setTemplateForm({
                        templateName: tmpl.templateName,
                        description: tmpl.description || '',
                        exercises: tmpl.exercises || [{ name: '', sets: 3, reps: '10', weight: '', rest: '60s', notes: '' }]
                      });
                      setIsTemplateModalOpen(true);
                    }}
                  >
                    <Edit size={14} /> Edit Template
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleDeleteTemplate(tmpl.id)}
                    style={{ color: '#ff1744' }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            ))}

            {templates.length === 0 && (
              <div style={styles.emptyState}>
                <Sparkles size={48} color="var(--text-muted, #666666)" />
                <h3 style={{ margin: '16px 0 6px', color: '#FFFFFF' }}>No Workout Templates Found</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Click "Seed Templates" above to generate pre-built workout templates.
                </p>
                <Button onClick={handleSeedTemplates}>Seed Templates Now</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL 1: WORKOUT PLAN BUILDER */}
      <Modal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        title={editingPlanId ? `Edit Workout Plan for ${selectedClientObj?.displayName || 'Client'}` : `Add New Workout Plan for ${selectedClientObj?.displayName || 'Client'}`}
        size="xl"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {statusBanner && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: statusBanner.type === 'success' ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 23, 68, 0.15)',
              border: `1px solid ${statusBanner.type === 'success' ? '#00c853' : '#ff1744'}`,
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{statusBanner.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{statusBanner.message}</span>
              </div>
              <button onClick={() => setStatusBanner(null)} style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer' }}>✕</button>
            </div>
          )}

          {/* Configuration Form Bar */}
          <div style={styles.modalConfigGrid}>
            <Input 
              label="Workout Plan / Phase Title *" 
              placeholder="e.g. Hypertrophy Phase 1 - Push Day" 
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
            />

            <Select 
              label="Load Workout Template (Optional)" 
              onChange={(e) => e.target.value && handleApplyTemplate(e.target.value)}
              options={[
                { label: '-- Select Template to Import --', value: '' },
                ...templates.map((t) => ({
                  label: `${t.templateName} (${t.exercises?.length || 0} exercises)`,
                  value: t.id
                }))
              ]}
            />

            <Input 
              type="date" 
              label="From Date *" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />

            <Input 
              type="date" 
              label="To Date *" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {/* Exercises Builder List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>Exercises List</h3>
              <Button variant="outline" size="sm" onClick={handleAddExercise}>
                + Add Exercise Row
              </Button>
            </div>

            {exercisesState.map((ex, idx) => (
              <div key={idx} style={styles.exerciseBuilderCard}>
                <div style={styles.exerciseCardHeader}>
                  <span style={styles.exerciseNumLabel}>Exercise #{idx + 1}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveExercise(idx)} 
                    style={styles.removeExRowBtn}
                  >
                    Remove
                  </button>
                </div>

                <div style={styles.exerciseFormGrid}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Input 
                      placeholder="Exercise Name (e.g. Barbell Squat)" 
                      value={ex.name || ''} 
                      onChange={(e) => handleExerciseChange(idx, 'name', e.target.value)}
                    />
                  </div>
                  <Input 
                    type="number" 
                    placeholder="Sets" 
                    value={ex.sets || ''} 
                    onChange={(e) => handleExerciseChange(idx, 'sets', e.target.value)}
                  />
                  <Input 
                    placeholder="Reps (e.g. 8-10 / Fail)" 
                    value={ex.reps || ''} 
                    onChange={(e) => handleExerciseChange(idx, 'reps', e.target.value)}
                  />
                  <Input 
                    placeholder="Weight (e.g. 60 kg)" 
                    value={ex.weight || ''} 
                    onChange={(e) => handleExerciseChange(idx, 'weight', e.target.value)}
                  />
                  <Input 
                    placeholder="Rest (e.g. 90s)" 
                    value={ex.rest || ''} 
                    onChange={(e) => handleExerciseChange(idx, 'rest', e.target.value)}
                  />
                  <div style={{ gridColumn: 'span 6' }}>
                    <Textarea 
                      placeholder="Trainer notes, form cues, or target RPE..." 
                      value={ex.notes || ''} 
                      onChange={(e) => handleExerciseChange(idx, 'notes', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <Button variant="outline" onClick={() => setIsWorkoutModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveClientWorkoutPlan} loading={saving} style={{ padding: '12px 28px' }}>
              <Save size={18} /> Save Workout Plan for Client
            </Button>
          </div>
        </div>
      </Modal>

      {/* POPUP MODAL 2: CREATE / EDIT WORKOUT TEMPLATE */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title={editingTemplateId ? "Edit Master Workout Template" : "Create Master Workout Template"}
        size="lg"
      >
        <form onSubmit={handleSaveTemplateModal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Template Name *" 
            placeholder="e.g. Push Day Strength Routine" 
            value={templateForm.templateName}
            onChange={(e) => setTemplateForm({ ...templateForm, templateName: e.target.value })}
            required
          />
          
          <Textarea 
            label="Description" 
            placeholder="Describe the routine purpose or target muscle split..." 
            value={templateForm.description}
            onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <h4 style={{ margin: 0, color: '#FFFFFF' }}>Exercises</h4>
            <Button type="button" variant="outline" size="sm" onClick={handleTmplAddExercise}>
              + Add Exercise Row
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
            {templateForm.exercises.map((ex, idx) => (
              <div key={idx} style={styles.exerciseTmplRow}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                  <Input 
                    placeholder="Exercise Name" 
                    value={ex.name || ''} 
                    onChange={(e) => handleTmplExerciseChange(idx, 'name', e.target.value)}
                  />
                  <Input 
                    type="number" 
                    placeholder="Sets" 
                    value={ex.sets || ''} 
                    onChange={(e) => handleTmplExerciseChange(idx, 'sets', e.target.value)}
                  />
                  <Input 
                    placeholder="Reps" 
                    value={ex.reps || ''} 
                    onChange={(e) => handleTmplExerciseChange(idx, 'reps', e.target.value)}
                  />
                  <Input 
                    placeholder="Rest" 
                    value={ex.rest || ''} 
                    onChange={(e) => handleTmplExerciseChange(idx, 'rest', e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleTmplRemoveExercise(idx)} 
                    style={{ background: 'none', border: 'none', color: '#ff1744', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" fullWidth loading={saving} style={{ marginTop: '10px' }}>
            {editingTemplateId ? "Save Template Changes" : "Create Workout Template"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  headerIconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: 'rgba(224, 0, 8, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(224, 0, 8, 0.2)',
  },
  title: { fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  tabGroup: { display: 'flex', gap: '8px', backgroundColor: 'var(--card, #121214)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border, #2a2a30)' },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary, #AAAAAA)',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    backgroundColor: 'var(--accent, #E00008)',
    color: '#FFFFFF',
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },
  planCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  exerciseSummaryBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    border: '1px solid var(--border, #2a2a30)',
  },
  summaryExercisesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    fontSize: '0.825rem',
  },
  summarySlotRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: 'var(--text-secondary)',
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
    marginTop: 'auto',
    paddingTop: '10px',
    borderTop: '1px solid var(--border, #2a2a30)',
  },
  modalConfigGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  exerciseBuilderCard: {
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '14px',
    border: '1px solid var(--border, #2a2a30)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  exerciseCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border, #2a2a30)', paddingBottom: '10px' },
  exerciseNumLabel: { fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' },
  removeExRowBtn: { background: 'none', border: 'none', color: '#ff1744', fontSize: '0.8rem', cursor: 'pointer' },
  exerciseFormGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '8px',
  },
  exerciseTmplRow: {
    padding: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    border: '1px solid var(--border, #2a2a30)',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  templateCard: { padding: '20px', display: 'flex', flexDirection: 'column', minHeight: '180px' },
  tmplBadge: {
    backgroundColor: 'rgba(224, 0, 8, 0.15)',
    color: 'var(--accent, #E00008)',
    fontWeight: 700,
    fontSize: '0.8rem',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: 'var(--card, #121214)',
    borderRadius: 'var(--radius, 20px)',
    border: '1px solid var(--border, #2a2a30)',
    width: '100%',
  },
};
