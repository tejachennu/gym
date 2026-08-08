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
  BookOpen,
  Send,
  Layers,
  Check,
  ChevronRight
} from 'lucide-react';

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

// Normalize any plan/template format to structured days
function normalizeWorkoutDays(item) {
  if (item?.days && Array.isArray(item.days) && item.days.length > 0) {
    return {
      planType: item.planType || (item.days.length > 1 ? 'multi' : 'single'),
      days: item.days.map((d, idx) => ({
        dayTitle: d.dayTitle || `Day ${idx + 1} Routine`,
        exercises: Array.isArray(d.exercises) ? d.exercises : []
      }))
    };
  }
  
  // Legacy single list format
  const legacyEx = Array.isArray(item?.exercises) ? item.exercises : [];
  return {
    planType: 'single',
    days: [
      {
        dayTitle: 'Day 1 Routine',
        exercises: legacyEx.length > 0 ? legacyEx : [
          { name: '', sets: 3, reps: '10', weight: '', rest: '60s', notes: '' }
        ]
      }
    ]
  };
}

export default function WorkoutPlansPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('client-workouts'); // 'client-workouts' | 'templates'
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [clientPlans, setClientPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Workout Builder Modal Popup state for Client Assigned Plans
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planTitle, setPlanTitle] = useState('Custom Workout Plan');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  
  // Day-by-Day State for Client Plan Builder
  const [planType, setPlanType] = useState('single'); // 'single' | 'multi'
  const [planDays, setPlanDays] = useState([
    {
      dayTitle: 'Day 1 Routine',
      exercises: [{ name: '', sets: 3, reps: '10', weight: '', rest: '60s', notes: '' }]
    }
  ]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [statusBanner, setStatusBanner] = useState(null);

  // Master Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    templateName: '',
    description: '',
    planType: 'single',
    days: [
      {
        dayTitle: 'Day 1 Routine',
        exercises: [{ name: 'Barbell Squat', sets: 4, reps: '8-10', weight: '80 kg', rest: '120s', notes: 'Go below parallel' }]
      }
    ]
  });
  const [tmplActiveDayIndex, setTmplActiveDayIndex] = useState(0);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadClientWorkoutHistory(selectedClient);
    } else {
      setClientPlans([]);
    }
  }, [selectedClient]);

  // Open Modal to Add New Workout Plan for Client
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
    setPlanType('single');
    setPlanDays([
      {
        dayTitle: 'Day 1 Routine',
        exercises: [{ name: '', sets: 3, reps: '10', weight: '', rest: '60s', notes: '' }]
      }
    ]);
    setActiveDayIndex(0);
    setStatusBanner(null);
    setIsWorkoutModalOpen(true);
  };

  // Open Modal to Edit Existing Workout Plan
  const handleOpenEditModal = (plan) => {
    setEditingPlanId(plan.id);
    setPlanTitle(plan.planTitle || 'Custom Workout Plan');
    setFromDate(plan.fromDate || new Date().toISOString().split('T')[0]);
    setToDate(plan.toDate || new Date().toISOString().split('T')[0]);
    
    const normalized = normalizeWorkoutDays(plan);
    setPlanType(normalized.planType);
    setPlanDays(normalized.days);
    setActiveDayIndex(0);

    setStatusBanner(null);
    setIsWorkoutModalOpen(true);
  };

  // Map Master Template into Modal Builder
  const handleApplyTemplate = (templateId) => {
    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return;
    setPlanTitle(tmpl.templateName);
    const normalized = normalizeWorkoutDays(tmpl);
    setPlanType(normalized.planType);
    setPlanDays(normalized.days);
    setActiveDayIndex(0);
    toast.success(`Loaded "${tmpl.templateName}" template into builder!`);
  };

  // --- CLIENT PLAN DAY & EXERCISE HANDLERS ---
  const handleAddPlanDay = () => {
    const nextDayNum = planDays.length + 1;
    const newDay = {
      dayTitle: `Day ${nextDayNum} Routine`,
      exercises: [{ name: '', sets: 3, reps: '10', weight: '', rest: '60s', notes: '' }]
    };
    setPlanDays([...planDays, newDay]);
    setActiveDayIndex(planDays.length);
  };

  const handleRemovePlanDay = (dayIdx) => {
    if (planDays.length <= 1) {
      return toast.warning('Workout plan must have at least 1 day routine.');
    }
    const updated = planDays.filter((_, i) => i !== dayIdx);
    setPlanDays(updated);
    setActiveDayIndex(prev => Math.min(prev, updated.length - 1));
  };

  const handlePlanDayTitleChange = (dayIdx, title) => {
    const updated = [...planDays];
    updated[dayIdx] = { ...updated[dayIdx], dayTitle: title };
    setPlanDays(updated);
  };

  const handleAddPlanExerciseRow = () => {
    const updated = [...planDays];
    const currentDay = updated[activeDayIndex] || { dayTitle: 'Day Routine', exercises: [] };
    updated[activeDayIndex] = {
      ...currentDay,
      exercises: [
        ...currentDay.exercises,
        { name: '', sets: 3, reps: '10', weight: '', rest: '60s', notes: '' }
      ]
    };
    setPlanDays(updated);
  };

  const handleRemovePlanExerciseRow = (exIdx) => {
    const updated = [...planDays];
    const currentDay = updated[activeDayIndex];
    if (!currentDay) return;
    updated[activeDayIndex] = {
      ...currentDay,
      exercises: currentDay.exercises.filter((_, i) => i !== exIdx)
    };
    setPlanDays(updated);
  };

  const handlePlanExerciseChange = (exIdx, field, value) => {
    const updated = [...planDays];
    const currentDay = updated[activeDayIndex];
    if (!currentDay) return;
    const curExercises = [...currentDay.exercises];
    curExercises[exIdx] = {
      ...curExercises[exIdx],
      [field]: field === 'sets' ? Number(value) || 0 : value
    };
    updated[activeDayIndex] = {
      ...currentDay,
      exercises: curExercises
    };
    setPlanDays(updated);
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

    const allFlatExercises = planDays.flatMap(d => d.exercises || []);
    const hasAtLeastOneExercise = allFlatExercises.some(ex => ex.name && ex.name.trim().length > 0);
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
        planType,
        days: planDays.map(d => ({
          dayTitle: d.dayTitle || 'Day Routine',
          exercises: (d.exercises || []).map(ex => ({
            name: ex.name || '',
            sets: Number(ex.sets) || 0,
            reps: ex.reps || '',
            weight: ex.weight || '',
            rest: ex.rest || '',
            url: ex.url || '',
            notes: ex.notes || ''
          }))
        })),
        // Flat array for complete backward compatibility
        exercises: allFlatExercises.map(ex => ({
          name: ex.name || '',
          sets: Number(ex.sets) || 0,
          reps: ex.reps || '',
          weight: ex.weight || '',
          rest: ex.rest || '',
          url: ex.url || '',
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



  // --- MASTER TEMPLATE MODAL HANDLERS ---
  const handleOpenCreateTemplateModal = () => {
    setEditingTemplateId(null);
    setTemplateForm({
      templateName: '',
      description: '',
      planType: 'single',
      days: [
        {
          dayTitle: 'Day 1 Routine',
          exercises: [{ name: '', sets: 3, reps: '10', weight: '', rest: '60s', notes: '' }]
        }
      ]
    });
    setTmplActiveDayIndex(0);
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplateModal = (tmpl) => {
    setEditingTemplateId(tmpl.id);
    const normalized = normalizeWorkoutDays(tmpl);
    setTemplateForm({
      templateName: tmpl.templateName || '',
      description: tmpl.description || '',
      planType: normalized.planType,
      days: normalized.days
    });
    setTmplActiveDayIndex(0);
    setIsTemplateModalOpen(true);
  };

  const handleAddTmplDay = () => {
    const nextDayNum = templateForm.days.length + 1;
    const newDay = {
      dayTitle: `Day ${nextDayNum} Routine`,
      exercises: [{ name: '', sets: 3, reps: '10', weight: '', rest: '60s', notes: '' }]
    };
    setTemplateForm({
      ...templateForm,
      days: [...templateForm.days, newDay]
    });
    setTmplActiveDayIndex(templateForm.days.length);
  };

  const handleRemoveTmplDay = (dayIdx) => {
    if (templateForm.days.length <= 1) {
      return toast.warning('Template must have at least 1 day routine.');
    }
    const updated = templateForm.days.filter((_, i) => i !== dayIdx);
    setTemplateForm({
      ...templateForm,
      days: updated
    });
    setTmplActiveDayIndex(prev => Math.min(prev, updated.length - 1));
  };

  const handleTmplDayTitleChange = (dayIdx, title) => {
    const updated = [...templateForm.days];
    updated[dayIdx] = { ...updated[dayIdx], dayTitle: title };
    setTemplateForm({
      ...templateForm,
      days: updated
    });
  };

  const handleAddTmplExerciseRow = () => {
    const updated = [...templateForm.days];
    const curDay = updated[tmplActiveDayIndex] || { dayTitle: 'Day Routine', exercises: [] };
    updated[tmplActiveDayIndex] = {
      ...curDay,
      exercises: [...curDay.exercises, { name: '', sets: 3, reps: '10', weight: '', rest: '60s', notes: '' }]
    };
    setTemplateForm({
      ...templateForm,
      days: updated
    });
  };

  const handleRemoveTmplExerciseRow = (exIdx) => {
    const updated = [...templateForm.days];
    const curDay = updated[tmplActiveDayIndex];
    if (!curDay) return;
    updated[tmplActiveDayIndex] = {
      ...curDay,
      exercises: curDay.exercises.filter((_, i) => i !== exIdx)
    };
    setTemplateForm({
      ...templateForm,
      days: updated
    });
  };

  const handleTmplExerciseChange = (exIdx, field, value) => {
    const updated = [...templateForm.days];
    const curDay = updated[tmplActiveDayIndex];
    if (!curDay) return;
    const curEx = [...curDay.exercises];
    curEx[exIdx] = {
      ...curEx[exIdx],
      [field]: field === 'sets' ? Number(value) || 0 : value
    };
    updated[tmplActiveDayIndex] = {
      ...curDay,
      exercises: curEx
    };
    setTemplateForm({
      ...templateForm,
      days: updated
    });
  };

  const handleSaveTemplateModal = async (e) => {
    if (e) e.preventDefault();
    if (!templateForm.templateName.trim()) return toast.warning('Template name is required');
    
    const allFlat = templateForm.days.flatMap(d => d.exercises || []);
    const hasAtLeastOne = allFlat.some(ex => ex.name && ex.name.trim().length > 0);
    if (!hasAtLeastOne) return toast.warning('Please add at least 1 exercise to the template');

    setSaving(true);
    try {
      const data = {
        templateName: templateForm.templateName.trim(),
        description: templateForm.description.trim(),
        planType: templateForm.planType,
        days: templateForm.days.map(d => ({
          dayTitle: d.dayTitle || 'Day Routine',
          exercises: (d.exercises || []).map(ex => ({
            name: ex.name || '',
            sets: Number(ex.sets) || 0,
            reps: ex.reps || '',
            weight: ex.weight || '',
            rest: ex.rest || '',
            url: ex.url || '',
            notes: ex.notes || ''
          }))
        })),
        exercises: allFlat.map(ex => ({
          name: ex.name || '',
          sets: Number(ex.sets) || 0,
          reps: ex.reps || '',
          weight: ex.weight || '',
          rest: ex.rest || '',
          url: ex.url || '',
          notes: ex.notes || ''
        })),
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
            Build 1-Day or Multi-Day Split routines for clients or save master workout templates.
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
                  {clientPlans.map((plan) => {
                    const normalized = normalizeWorkoutDays(plan);
                    const isMulti = normalized.planType === 'multi' || normalized.days.length > 1;
                    const totalEx = plan.exercises?.length || normalized.days.flatMap(d => d.exercises).length;

                    return (
                      <Card key={plan.id} style={styles.planCard} className="glass-card">
                        {/* Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#FFFFFF', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {plan.planTitle || 'Workout Plan'}
                              </h3>
                              <span style={styles.typeBadge}>
                                {isMulti ? `📅 ${normalized.days.length}-Day Split` : '🏋️ 1-Day Workout'}
                              </span>
                            </div>

                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.65)', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              <Calendar size={12} color="var(--accent, #E00008)" />
                              <span style={{ whiteSpace: 'nowrap' }}>{formatDateNice(plan.fromDate)}</span>
                              <span>➔</span>
                              <span style={{ whiteSpace: 'nowrap' }}>{formatDateNice(plan.toDate)}</span>
                            </div>
                          </div>

                          <Badge variant={plan.status === 'active' ? 'success' : plan.status === 'scheduled' ? 'warning' : 'secondary'}>
                            {(plan.status || 'ACTIVE').toUpperCase()}
                          </Badge>
                        </div>

                        {/* Exercise Summary Bar */}
                        <div style={styles.exerciseSummaryBar}>
                          <Dumbbell size={15} color="var(--accent, #E00008)" />
                          <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.85rem' }}>
                            {normalized.days.length} Day(s) • {totalEx} Total Exercise{totalEx !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Summary Days & Exercises List */}
                        <div style={styles.summaryExercisesList}>
                          {normalized.days.map((day, dIdx) => (
                            <div key={dIdx} style={{ marginBottom: dIdx < normalized.days.length - 1 ? '8px' : 0 }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent, #E00008)', marginBottom: '3px' }}>
                                {day.dayTitle} ({day.exercises.length} ex)
                              </div>
                              {day.exercises.slice(0, 2).map((ex, idx) => (
                                <div key={idx} style={styles.summarySlotRow}>
                                  <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                    • {ex.name}
                                  </span>
                                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                                    {ex.sets} × {ex.reps}
                                  </span>
                                </div>
                              ))}
                              {day.exercises.length > 2 && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  + {day.exercises.length - 2} more
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div style={styles.cardActions}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenEditModal(plan)}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}
                          >
                            <Edit size={14} /> Edit Plan
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteClientPlan(plan.id)}
                            style={{ color: '#ff1744', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                          >
                            <Trash2 size={14} /> Delete
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <Dumbbell size={48} color="var(--text-muted, #666666)" />
                  <h3 style={{ margin: '16px 0 6px', color: '#FFFFFF' }}>No Workout Plans Found</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Click <strong>&quot;+ Add Workout Plan&quot;</strong> above to assign a customized workout schedule to {selectedClientObj?.displayName || 'this client'}.
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
              Create reusable 1-Day or Multi-Day Workout Split templates for 1-click client assignment mapping.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button onClick={handleOpenCreateTemplateModal}>
                <Plus size={16} /> Create Master Template
              </Button>
            </div>
          </div>

          <div style={styles.templateGrid}>
            {templates.map((tmpl) => {
              const normalized = normalizeWorkoutDays(tmpl);
              const isMulti = normalized.planType === 'multi' || normalized.days.length > 1;
              const totalEx = tmpl.exercises?.length || normalized.days.flatMap(d => d.exercises).length;

              return (
                <Card key={tmpl.id} style={styles.templateCard} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: '#FFFFFF' }}>{tmpl.templateName}</h3>
                      <span style={styles.typeBadge}>
                        {isMulti ? `📅 ${normalized.days.length}-Day Split` : '🏋️ 1-Day Routine'}
                      </span>
                    </div>
                    <div style={styles.tmplBadge}>{totalEx} Ex</div>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '10px 0 12px', lineHeight: 1.4 }}>
                    {tmpl.description || 'Master workout routine template.'}
                  </p>

                  {/* Summary of Days */}
                  <div style={{ marginBottom: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                    {normalized.days.slice(0, 3).map((day, dIdx) => (
                      <div key={dIdx} style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', marginBottom: '4px' }}>
                        <strong style={{ color: 'var(--accent)' }}>{day.dayTitle}:</strong> {day.exercises.length} exercise(s)
                      </div>
                    ))}
                    {normalized.days.length > 3 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        + {normalized.days.length - 3} more days
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                    <Button 
                      variant="outline" 
                      fullWidth 
                      onClick={() => handleOpenEditTemplateModal(tmpl)}
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
              );
            })}

            {templates.length === 0 && (
              <div style={styles.emptyState}>
                <Sparkles size={48} color="var(--text-muted, #666666)" />
                <h3 style={{ margin: '16px 0 6px', color: '#FFFFFF' }}>No Workout Templates Found</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Create a new template to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL 1: WORKOUT PLAN BUILDER FOR CLIENT */}
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
              placeholder="e.g. Hypertrophy Phase 1 - Push/Pull Split" 
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

          {/* ROUTINE DURATION / SPLIT SELECTOR */}
          <div style={styles.routineTypeBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Layers size={14} color="var(--accent, #E00008)" />
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                Workout Plan Structure
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setPlanType('single')}
                style={{
                  ...styles.routineTypeBtn,
                  ...(planType === 'single' ? styles.routineTypeBtnActive : {})
                }}
              >
                🏋️ 1-Day Workout Routine
              </button>
              <button
                type="button"
                onClick={() => setPlanType('multi')}
                style={{
                  ...styles.routineTypeBtn,
                  ...(planType === 'multi' ? styles.routineTypeBtnActive : {})
                }}
              >
                📅 Multi-Day Split Routine (e.g. Day 1, Day 2, Day 3...)
              </button>
            </div>
          </div>

          {/* DAY TABS BAR (For Multi-Day or Single-Day) */}
          <div style={styles.dayTabsContainer}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {planDays.map((day, dIdx) => {
                const isActive = activeDayIndex === dIdx;
                const exCount = (day.exercises || []).length;
                return (
                  <button
                    key={dIdx}
                    type="button"
                    onClick={() => setActiveDayIndex(dIdx)}
                    style={{
                      ...styles.dayTabBtn,
                      ...(isActive ? styles.dayTabBtnActive : {})
                    }}
                  >
                    <span>{day.dayTitle || `Day ${dIdx + 1}`}</span>
                    <span style={{
                      ...styles.dayCountBadge,
                      ...(isActive ? styles.dayCountBadgeActive : {})
                    }}>
                      {exCount}
                    </span>
                  </button>
                );
              })}

              {planType === 'multi' && (
                <button
                  type="button"
                  onClick={handleAddPlanDay}
                  style={styles.addDayBtn}
                >
                  <Plus size={14} /> Add Day
                </button>
              )}
            </div>

            {/* Active Day Title & Delete Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Input
                label={`Day ${activeDayIndex + 1} Title / Split Name`}
                placeholder="e.g. Day 1 - Push (Chest, Shoulders & Triceps)"
                value={planDays[activeDayIndex]?.dayTitle || ''}
                onChange={(e) => handlePlanDayTitleChange(activeDayIndex, e.target.value)}
                containerStyle={{ flex: 1, margin: 0 }}
              />

              {planDays.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePlanDay(activeDayIndex)}
                  style={{ color: '#ff1744', marginTop: '22px', border: '1px solid rgba(255,23,68,0.2)', backgroundColor: 'rgba(255,23,68,0.08)' }}
                >
                  <Trash2 size={14} /> Remove Day
                </Button>
              )}
            </div>
          </div>

          {/* Exercises Builder List for Active Day */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Dumbbell size={16} color="var(--accent, #E00008)" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Exercises for {planDays[activeDayIndex]?.dayTitle || 'Active Day'}
                </h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddPlanExerciseRow}>
                <Plus size={14} /> Add Exercise Row
              </Button>
            </div>

            {(planDays[activeDayIndex]?.exercises || []).map((ex, idx) => (
              <div key={idx} style={styles.exerciseBuilderCard}>
                <div style={styles.exerciseCardHeader}>
                  <span style={styles.exerciseNumLabel}>Exercise #{idx + 1}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemovePlanExerciseRow(idx)} 
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
                      onChange={(e) => handlePlanExerciseChange(idx, 'name', e.target.value)}
                    />
                  </div>
                  <Input 
                    type="number" 
                    placeholder="Sets" 
                    value={ex.sets || ''} 
                    onChange={(e) => handlePlanExerciseChange(idx, 'sets', e.target.value)}
                  />
                  <Input 
                    placeholder="Reps (e.g. 8-10 / Fail)" 
                    value={ex.reps || ''} 
                    onChange={(e) => handlePlanExerciseChange(idx, 'reps', e.target.value)}
                  />
                  <Input 
                    placeholder="Weight (e.g. 60 kg)" 
                    value={ex.weight || ''} 
                    onChange={(e) => handlePlanExerciseChange(idx, 'weight', e.target.value)}
                  />
                  <Input 
                    placeholder="Rest (e.g. 90s)" 
                    value={ex.rest || ''} 
                    onChange={(e) => handlePlanExerciseChange(idx, 'rest', e.target.value)}
                  />
                  <div style={{ gridColumn: 'span 2' }}>
                    <Input 
                      placeholder="Video URL (optional)" 
                      value={ex.url || ''} 
                      onChange={(e) => handlePlanExerciseChange(idx, 'url', e.target.value)}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 8' }}>
                    <Textarea 
                      placeholder="Trainer notes, form cues, or target RPE..." 
                      value={ex.notes || ''} 
                      onChange={(e) => handlePlanExerciseChange(idx, 'notes', e.target.value)}
                      style={{ minHeight: '60px' }}
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
            <Button onClick={handleSaveClientWorkoutPlan} loading={saving} style={{ padding: '10px 24px' }}>
              <Send size={15} /> Submit Workout Plan for Client
            </Button>
          </div>
        </div>
      </Modal>

      {/* POPUP MODAL 2: CREATE / EDIT MASTER WORKOUT TEMPLATE */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title={editingTemplateId ? "Edit Master Workout Template" : "Create Master Workout Template"}
        size="lg"
      >
        <form onSubmit={handleSaveTemplateModal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Template Name *" 
            placeholder="e.g. Push Day Strength Routine or 3-Day Split" 
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

          {/* ROUTINE DURATION / SPLIT SELECTOR */}
          <div style={styles.routineTypeBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Layers size={14} color="var(--accent, #E00008)" />
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                Template Workout Structure
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setTemplateForm({ ...templateForm, planType: 'single' })}
                style={{
                  ...styles.routineTypeBtn,
                  ...(templateForm.planType === 'single' ? styles.routineTypeBtnActive : {})
                }}
              >
                🏋️ 1-Day Workout Routine
              </button>
              <button
                type="button"
                onClick={() => setTemplateForm({ ...templateForm, planType: 'multi' })}
                style={{
                  ...styles.routineTypeBtn,
                  ...(templateForm.planType === 'multi' ? styles.routineTypeBtnActive : {})
                }}
              >
                📅 Multi-Day Split Routine (e.g. Day 1, Day 2, Day 3...)
              </button>
            </div>
          </div>

          {/* DAY TABS BAR FOR TEMPLATE */}
          <div style={styles.dayTabsContainer}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {templateForm.days.map((day, dIdx) => {
                const isActive = tmplActiveDayIndex === dIdx;
                const exCount = (day.exercises || []).length;
                return (
                  <button
                    key={dIdx}
                    type="button"
                    onClick={() => setTmplActiveDayIndex(dIdx)}
                    style={{
                      ...styles.dayTabBtn,
                      ...(isActive ? styles.dayTabBtnActive : {})
                    }}
                  >
                    <span>{day.dayTitle || `Day ${dIdx + 1}`}</span>
                    <span style={{
                      ...styles.dayCountBadge,
                      ...(isActive ? styles.dayCountBadgeActive : {})
                    }}>
                      {exCount}
                    </span>
                  </button>
                );
              })}

              {templateForm.planType === 'multi' && (
                <button
                  type="button"
                  onClick={handleAddTmplDay}
                  style={styles.addDayBtn}
                >
                  <Plus size={14} /> Add Day
                </button>
              )}
            </div>

            {/* Active Day Title & Remove Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Input
                label={`Day ${tmplActiveDayIndex + 1} Title / Split Name`}
                placeholder="e.g. Day 1 - Push Day"
                value={templateForm.days[tmplActiveDayIndex]?.dayTitle || ''}
                onChange={(e) => handleTmplDayTitleChange(tmplActiveDayIndex, e.target.value)}
                containerStyle={{ flex: 1, margin: 0 }}
              />

              {templateForm.days.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveTmplDay(tmplActiveDayIndex)}
                  style={{ color: '#ff1744', marginTop: '22px', border: '1px solid rgba(255,23,68,0.2)', backgroundColor: 'rgba(255,23,68,0.08)' }}
                >
                  <Trash2 size={14} /> Remove Day
                </Button>
              )}
            </div>
          </div>

          {/* EXERCISES FOR ACTIVE DAY */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <h4 style={{ margin: 0, color: '#FFFFFF', fontSize: '0.92rem' }}>
              Exercises for {templateForm.days[tmplActiveDayIndex]?.dayTitle || 'Active Day'}
            </h4>
            <Button type="button" variant="outline" size="sm" onClick={handleAddTmplExerciseRow}>
              + Add Exercise Row
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
            {(templateForm.days[tmplActiveDayIndex]?.exercises || []).map((ex, idx) => (
              <div key={idx} style={styles.exerciseTmplRow}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr auto', gap: '8px', alignItems: 'center' }}>
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
                  <Input 
                    placeholder="Video URL" 
                    value={ex.url || ''} 
                    onChange={(e) => handleTmplExerciseChange(idx, 'url', e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleTmplRemoveExerciseRow(idx)} 
                    style={{ background: 'none', border: 'none', color: '#ff1744', cursor: 'pointer', padding: '4px' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" fullWidth loading={saving} style={{ marginTop: '10px' }}>
            <Send size={15} /> Submit Workout Template
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
    fontWeight: 700,
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' },
  templateGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' },
  planCard: { padding: '16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' },
  templateCard: { padding: '18px', borderRadius: '14px', display: 'flex', flexDirection: 'column' },
  tmplBadge: {
    padding: '3px 8px',
    borderRadius: '12px',
    backgroundColor: 'rgba(224, 0, 8, 0.15)',
    color: 'var(--accent, #E00008)',
    fontSize: '0.72rem',
    fontWeight: 700,
    border: '1px solid rgba(224, 0, 8, 0.3)'
  },
  typeBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)'
  },
  exerciseSummaryBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.04)'
  },
  summaryExercisesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.03)'
  },
  summarySlotRow: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    gap: '8px',
    padding: '2px 0'
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    marginTop: 'auto',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: 'var(--card, #121214)',
    borderRadius: '16px',
    border: '1px solid var(--border, #2a2a30)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  modalConfigGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid var(--border, #2a2a30)'
  },

  // ROUTINE TYPE & DAY TABS STYLES
  routineTypeBox: {
    padding: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '14px',
    border: '1px solid var(--border, #2a2a30)'
  },
  routineTypeBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid var(--border, #2a2a30)',
    backgroundColor: 'var(--card, #121214)',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit'
  },
  routineTypeBtnActive: {
    backgroundColor: 'var(--accent, #E00008)',
    color: '#FFFFFF',
    borderColor: 'var(--accent, #E00008)',
    boxShadow: '0 4px 14px rgba(224, 0, 8, 0.35)',
    fontWeight: 800
  },
  dayTabsContainer: {
    padding: '16px',
    backgroundColor: 'rgba(20, 20, 25, 0.85)',
    borderRadius: '16px',
    border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)'
  },
  dayTabBtn: {
    padding: '8px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: 'var(--text-secondary, #AAAAAA)',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
  },
  dayTabBtnActive: {
    background: 'linear-gradient(135deg, var(--accent, #E00008) 0%, #ff1744 100%)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#FFFFFF',
    fontWeight: 800,
    boxShadow: '0 4px 16px rgba(224, 0, 8, 0.45)'
  },
  dayCountBadge: {
    fontSize: '0.68rem',
    fontWeight: 800,
    padding: '2px 7px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'var(--text-secondary)'
  },
  dayCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    color: '#FFFFFF'
  },
  addDayBtn: {
    padding: '8px 16px',
    borderRadius: '12px',
    border: '1px dashed var(--accent, #E00008)',
    backgroundColor: 'rgba(224, 0, 8, 0.12)',
    color: 'var(--accent, #E00008)',
    fontSize: '0.8rem',
    fontWeight: 800,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(224, 0, 8, 0.15)'
  },

  exerciseBuilderCard: {
    padding: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid var(--border, #2a2a30)'
  },
  exerciseCardHeader: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  exerciseNumLabel: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--accent, #E00008)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  removeExRowBtn: {
    fontSize: '0.75rem',
    color: '#ff1744',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600
  },
  exerciseFormGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '10px'
  },
  exerciseTmplRow: {
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    border: '1px solid var(--border, #2a2a30)'
  }
};
