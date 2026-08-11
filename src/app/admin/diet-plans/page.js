'use client';

import { useState, useEffect } from 'react';
import { 
  getAllClients, 
  createDietPlan, 
  getClientDietPlans, 
  updateDietPlan, 
  deleteDietPlan,
  getDietTemplates,
  createDietTemplate,
  updateDietTemplate,
  deleteDietTemplate
} from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Select, Input, Textarea } from '@/components/ui/Input';
import { CardSkeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { 
  Utensils, 
  Plus, 
  Trash2, 
  Save, 
  Flame, 
  Clock, 
  Calendar, 
  Edit, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Send
} from 'lucide-react';

const MEAL_SLOTS = [
  { id: 'breakfast', name: 'Breakfast', icon: '🍳', defaultTime: '08:00 AM' },
  { id: 'preWorkout', name: 'Pre Workout', icon: '⚡', defaultTime: '05:00 PM' },
  { id: 'postWorkout', name: 'Post Workout', icon: '🥤', defaultTime: '06:30 PM' },
  { id: 'lunch', name: 'Lunch', icon: '🥗', defaultTime: '01:00 PM' },
  { id: 'dinner', name: 'Dinner', icon: '🍲', defaultTime: '08:00 PM' },
];

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

export default function DietPlansPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('client-diets'); // 'client-diets' | 'templates'
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [clientPlans, setClientPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Diet Builder Modal Popup state
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planTitle, setPlanTitle] = useState('Custom Diet Plan');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [mealsState, setMealsState] = useState(getEmptyMealsState());
  const [supplements, setSupplements] = useState([]);
  const [statusBanner, setStatusBanner] = useState(null);

  // Template Modal State (Admin CRUD for templates)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    templateName: '',
    description: '',
    mealsState: getEmptyMealsState(),
    supplements: []
  });

  function getEmptyMealsState() {
    return {
      breakfast: { foods: [{ name: 'Oats with Almond Milk', qty: '1 Bowl', calories: 350, protein: 12, carbs: 55, fat: 8 }], instructions: '' },
      preWorkout: { foods: [{ name: 'Black Coffee + 1 Banana', qty: '1 Serving', calories: 110, protein: 1, carbs: 27, fat: 0 }], instructions: '' },
      postWorkout: { foods: [{ name: 'Whey Protein Shake', qty: '1 Scoop', calories: 160, protein: 28, carbs: 4, fat: 2 }], instructions: '' },
      lunch: { foods: [{ name: 'Grilled Chicken with Rice & Vegetables', qty: '1 Plate', calories: 550, protein: 45, carbs: 60, fat: 12 }], instructions: '' },
      dinner: { foods: [{ name: 'Paneer / Fish Salad with Olive Oil', qty: '1 Bowl', calories: 420, protein: 30, carbs: 20, fat: 18 }], instructions: '' },
    };
  }

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [clientData, templateData] = await Promise.all([
        getAllClients(),
        getDietTemplates()
      ]);
      setClients(clientData);
      setTemplates(templateData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load diet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      loadClientDietHistory(selectedClient);
    } else {
      setClientPlans([]);
    }
  }, [selectedClient]);

  const loadClientDietHistory = async (clientId) => {
    try {
      setLoading(true);
      const history = await getClientDietPlans(clientId);
      setClientPlans(history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Open Modal to Add New Diet Plan
  const handleOpenAddModal = () => {
    if (!selectedClient) {
      return toast.warning('Please select a client from the dropdown first.');
    }
    setEditingPlanId(null);
    setPlanTitle('Custom Diet Plan');
    setFromDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setToDate(d.toISOString().split('T')[0]);
    setMealsState(getEmptyMealsState());
    setSupplements([]);
    setStatusBanner(null);
    setIsDietModalOpen(true);
  };

  // Open Modal to Edit Existing Diet Plan
  const handleOpenEditModal = (plan) => {
    setEditingPlanId(plan.id);
    setPlanTitle(plan.planTitle || 'Custom Diet Plan');
    setFromDate(plan.fromDate || new Date().toISOString().split('T')[0]);
    setToDate(plan.toDate || new Date().toISOString().split('T')[0]);
    if (plan.mealsState) setMealsState(plan.mealsState);
    else setMealsState(getEmptyMealsState());
    setSupplements(plan.supplements || []);
    setStatusBanner(null);
    setIsDietModalOpen(true);
  };

  // Map Template into Modal Builder
  const handleApplyTemplate = (templateId) => {
    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return;
    setPlanTitle(tmpl.templateName);
    if (tmpl.mealsState) setMealsState(tmpl.mealsState);
    if (tmpl.supplements) setSupplements(tmpl.supplements);
    toast.success(`Loaded "${tmpl.templateName}" template into builder!`);
  };

  // Supplements handlers
  const handleAddSupplement = () => {
    setSupplements(prev => [...prev, { name: '', dosage: '', timing: 'Morning', instructions: '' }]);
  };

  const handleRemoveSupplement = (index) => {
    setSupplements(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSupplementChange = (index, field, value) => {
    setSupplements(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Food handlers inside meal slots
  const handleAddFood = (slotId) => {
    setMealsState((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        foods: [
          ...(prev[slotId]?.foods || []),
          { name: '', qty: '', calories: 0, protein: 0, carbs: 0, fat: 0 }
        ]
      }
    }));
  };

  const handleRemoveFood = (slotId, foodIndex) => {
    setMealsState((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        foods: prev[slotId].foods.filter((_, idx) => idx !== foodIndex)
      }
    }));
  };

  const handleFoodChange = (slotId, foodIndex, field, value) => {
    setMealsState((prev) => {
      const updatedFoods = [...(prev[slotId]?.foods || [])];
      updatedFoods[foodIndex] = {
        ...updatedFoods[foodIndex],
        [field]: ['calories', 'protein', 'carbs', 'fat'].includes(field) ? Number(value) : value
      };
      return {
        ...prev,
        [slotId]: {
          ...prev[slotId],
          foods: updatedFoods
        }
      };
    });
  };

  const handleInstructionsChange = (slotId, text) => {
    setMealsState((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        instructions: text
      }
    }));
  };

  const handleTemplateFoodChange = (slotId, foodIndex, field, value) => {
    setTemplateForm((prev) => {
      const currentMeals = prev.mealsState || getEmptyMealsState();
      const slotData = currentMeals[slotId] || { foods: [], instructions: '' };
      const updatedFoods = [...(slotData.foods || [])];
      updatedFoods[foodIndex] = {
        ...updatedFoods[foodIndex],
        [field]: ['calories', 'protein', 'carbs', 'fat'].includes(field) ? (value === '' ? '' : Number(value)) : value
      };
      return {
        ...prev,
        mealsState: {
          ...currentMeals,
          [slotId]: {
            ...slotData,
            foods: updatedFoods
          }
        }
      };
    });
  };

  const handleAddTemplateFood = (slotId) => {
    setTemplateForm((prev) => {
      const currentMeals = prev.mealsState || getEmptyMealsState();
      const slotData = currentMeals[slotId] || { foods: [], instructions: '' };
      return {
        ...prev,
        mealsState: {
          ...currentMeals,
          [slotId]: {
            ...slotData,
            foods: [...(slotData.foods || []), { name: '', qty: '', calories: '', protein: '', carbs: '', fat: '' }]
          }
        }
      };
    });
  };

  const handleRemoveTemplateFood = (slotId, foodIndex) => {
    setTemplateForm((prev) => {
      const currentMeals = prev.mealsState || getEmptyMealsState();
      const slotData = currentMeals[slotId] || { foods: [], instructions: '' };
      return {
        ...prev,
        mealsState: {
          ...currentMeals,
          [slotId]: {
            ...slotData,
            foods: (slotData.foods || []).filter((_, i) => i !== foodIndex)
          }
        }
      };
    });
  };

  const handleTemplateInstructionsChange = (slotId, text) => {
    setTemplateForm((prev) => {
      const currentMeals = prev.mealsState || getEmptyMealsState();
      const slotData = currentMeals[slotId] || { foods: [], instructions: '' };
      return {
        ...prev,
        mealsState: {
          ...currentMeals,
          [slotId]: {
            ...slotData,
            instructions: text
          }
        }
      };
    });
  };

  // Total macros calculation
  const calculateTotals = (mState = mealsState) => {
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    MEAL_SLOTS.forEach((slot) => {
      const foods = mState[slot.id]?.foods || [];
      foods.forEach((f) => {
        calories += f.calories || 0;
        protein += f.protein || 0;
        carbs += f.carbs || 0;
        fat += f.fat || 0;
      });
    });
    return { calories, protein, carbs, fat };
  };

  const totals = calculateTotals();

  // Save Diet Plan for Client (inside Modal)
  const handleSaveClientDietPlan = async (e) => {
    if (e) e.preventDefault();
    setStatusBanner(null);

    if (!selectedClient) {
      const msg = 'Mandatory Field Missing: Please select a client first.';
      toast.warning(msg);
      setStatusBanner({ type: 'error', message: msg });
      return;
    }
    if (!planTitle.trim()) {
      const msg = 'Mandatory Field Missing: Please enter a Diet Plan Title.';
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

    let hasAtLeastOneFood = false;
    MEAL_SLOTS.forEach((slot) => {
      const foods = mealsState[slot.id]?.foods || [];
      if (foods.some((f) => f.name && f.name.trim().length > 0)) {
        hasAtLeastOneFood = true;
      }
    });

    if (!hasAtLeastOneFood) {
      const msg = 'Mandatory Field Missing: Please add at least 1 food item with a name in any meal slot.';
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

      const cleanedMealsState = {};
      MEAL_SLOTS.forEach((slot) => {
        const slotData = mealsState[slot.id] || { foods: [], instructions: '' };
        cleanedMealsState[slot.id] = {
          instructions: slotData.instructions || '',
          foods: (slotData.foods || []).map((f) => ({
            name: f.name || '',
            qty: f.qty || '',
            calories: Number(f.calories) || 0,
            protein: Number(f.protein) || 0,
            carbs: Number(f.carbs) || 0,
            fat: Number(f.fat) || 0,
          }))
        };
      });

      const planData = {
        clientId: selectedClient,
        clientName: selectedClientObj?.displayName || selectedClientObj?.name || selectedClientObj?.email || 'Client',
        planTitle: planTitle.trim(),
        fromDate,
        toDate,
        status,
        mealsState: cleanedMealsState,
        totals: calculateTotals(cleanedMealsState),
        supplements: supplements,
        meals: MEAL_SLOTS.map((slot) => ({
          slotId: slot.id,
          slotName: slot.name,
          foods: (cleanedMealsState[slot.id]?.foods || []).map((f) => f.name ? `${f.name} (${f.qty || '1 serving'})` : '').filter(Boolean).join(', '),
          calories: (cleanedMealsState[slot.id]?.foods || []).reduce((acc, f) => acc + (f.calories || 0), 0),
          protein: (cleanedMealsState[slot.id]?.foods || []).reduce((acc, f) => acc + (f.protein || 0), 0),
          carbs: (cleanedMealsState[slot.id]?.foods || []).reduce((acc, f) => acc + (f.carbs || 0), 0),
          fat: (cleanedMealsState[slot.id]?.foods || []).reduce((acc, f) => acc + (f.fat || 0), 0),
          instructions: cleanedMealsState[slot.id]?.instructions || ''
        })),
        updatedAtStr: new Date().toISOString()
      };

      if (editingPlanId) {
        await updateDietPlan(editingPlanId, planData);
        toast.success(`Diet Plan "${planTitle}" updated for client!`);
      } else {
        await createDietPlan(planData);
        toast.success(`New Diet Plan "${planTitle}" assigned!`);
      }
      setIsDietModalOpen(false);
      await loadClientDietHistory(selectedClient);
    } catch (err) {
      console.error('Error saving diet plan:', err);
      const errorMsg = `Save Error: ${err.message || 'Failed to save diet plan to Firestore'}`;
      toast.error(errorMsg);
      setStatusBanner({ type: 'error', message: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClientPlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this assigned diet plan?')) return;
    try {
      await deleteDietPlan(planId);
      toast.success('Diet plan deleted successfully');
      await loadClientDietHistory(selectedClient);
    } catch (err) {
      toast.error('Failed to delete diet plan');
    }
  };



  // Save Template Modal handler (Admin CRUD for master templates)
  const handleSaveTemplateModal = async (e) => {
    e.preventDefault();
    if (!templateForm.templateName) return toast.warning('Template name is required');
    setSaving(true);
    try {
      const totals = calculateTotals(templateForm.mealsState);
      const data = { ...templateForm, totals, updatedAtStr: new Date().toISOString() };
      if (editingTemplateId) {
        await updateDietTemplate(editingTemplateId, data);
        toast.success(`Template "${templateForm.templateName}" updated!`);
      } else {
        await createDietTemplate(data);
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
    if (!confirm('Are you sure you want to delete this diet template?')) return;
    try {
      await deleteDietTemplate(templateId);
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
              <Utensils size={22} color="var(--accent, #E00008)" />
            </div>
            <h1 style={styles.title}>Diet Plans Management</h1>
          </div>
          <p style={{ color: 'var(--text-secondary, #AAAAAA)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Manage client assigned diet plans & reusable master diet templates
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={styles.tabGroup}>
          <button 
            style={{ ...styles.tabBtn, ...(activeTab === 'client-diets' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('client-diets')}
          >
            <Calendar size={16} /> Client Diet Plans
          </button>
          <button 
            style={{ ...styles.tabBtn, ...(activeTab === 'templates' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('templates')}
          >
            <Sparkles size={16} /> Master Templates ({templates.length})
          </button>
        </div>
      </header>

      {/* TAB 1: CLIENT DIET PLANS DASHBOARD */}
      {activeTab === 'client-diets' && (
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
                  <Plus size={18} /> + Add Diet Plan
                </Button>
              )}
            </div>
          </Card>

          {/* Client Existing Diet Plans Listing Grid */}
          {selectedClient ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                  Assigned Diet Plans for <span style={{ color: 'var(--accent, #E00008)' }}>{selectedClientObj?.displayName || selectedClientObj?.name || 'Client'}</span> ({clientPlans.length})
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: '#FFFFFF', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {plan.planTitle || 'Diet Plan'}
                          </h3>
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

                      {/* Macros pill bar */}
                      <div style={styles.planMacroBar}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent, #E00008)', fontWeight: 800 }}>
                          <Flame size={16} /> {plan.totals?.calories || 0} Kcal
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#ff5252', fontWeight: 600 }}>P: {plan.totals?.protein || 0}g</div>
                        <div style={{ fontSize: '0.8rem', color: '#448aff', fontWeight: 600 }}>C: {plan.totals?.carbs || 0}g</div>
                        <div style={{ fontSize: '0.8rem', color: '#ffb300', fontWeight: 600 }}>F: {plan.totals?.fat || 0}g</div>
                      </div>

                      {/* Summary Meals List */}
                      <div style={styles.summaryMealsList}>
                        {MEAL_SLOTS.map((slot) => {
                          const slotData = plan.mealsState?.[slot.id];
                          const foodCount = (slotData?.foods || []).filter(f => f.name).length;
                          return (
                            <div key={slot.id} style={styles.summarySlotRow}>
                              <span>{slot.icon} {slot.name}</span>
                              <span style={{ color: foodCount > 0 ? '#00c853' : 'var(--text-muted)' }}>
                                {foodCount > 0 ? `${foodCount} items` : 'No items'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Action Buttons: Update & Delete */}
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
                  <Utensils size={48} color="var(--text-muted, #666666)" />
                  <h3 style={{ margin: '16px 0 6px', color: '#FFFFFF' }}>No Assigned Diet Plans Found</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Click <strong>"+ Add Diet Plan"</strong> above to assign a customized 5-meal slot diet plan to {selectedClientObj?.displayName || 'this client'}.
                  </p>
                  <Button onClick={handleOpenAddModal}>+ Add Diet Plan Now</Button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Utensils size={48} color="var(--text-muted, #666666)" />
              <h3 style={{ margin: '16px 0 6px', color: '#FFFFFF' }}>Select a Client to Manage Diet Plans</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Choose a client from the dropdown above to view, update, or assign diet plans.
              </p>
            </div>
          )}
        </>
      )}

      {/* TAB 2: PRE-EXISTING DIET TEMPLATES (ADMIN MASTER CRUD) */}
      {activeTab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
              Master diet templates for 1-click client assignment and mapping.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button onClick={() => {
                setEditingTemplateId(null);
                setTemplateForm({ templateName: '', description: '', mealsState: getEmptyMealsState() });
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
                  <div style={styles.tmplBadge}>{tmpl.totals?.calories || 0} Kcal</div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '8px 0 16px', lineHeight: 1.4 }}>
                  {tmpl.description || 'Master template for quick client mapping.'}
                </p>

                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px' }}>
                  <span>🥩 P: {tmpl.totals?.protein || 0}g</span>
                  <span>🍞 C: {tmpl.totals?.carbs || 0}g</span>
                  <span>🥑 F: {tmpl.totals?.fat || 0}g</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <Button 
                    variant="outline" 
                    fullWidth 
                    onClick={() => {
                      setEditingTemplateId(tmpl.id);
                      setTemplateForm({
                        templateName: tmpl.templateName,
                        description: tmpl.description || '',
                        mealsState: tmpl.mealsState || getEmptyMealsState()
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
                <h3 style={{ margin: '16px 0 6px', color: '#FFFFFF' }}>No Master Diet Templates Found</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Create a new template to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL 1: DIET PLAN BUILDER POPUP (FOR ASSIGNING & EDITING CLIENT DIETS) */}
      <Modal
        isOpen={isDietModalOpen}
        onClose={() => setIsDietModalOpen(false)}
        title={editingPlanId ? `Edit Diet Plan for ${selectedClientObj?.displayName || 'Client'}` : `Add New Diet Plan for ${selectedClientObj?.displayName || 'Client'}`}
        size="xl"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Alert Banner */}
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
              <button 
                onClick={() => setStatusBanner(null)} 
                style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Config Bar inside Modal */}
          <div style={styles.modalConfigGrid}>
            <Input 
              label="Diet Plan Title *" 
              placeholder="e.g. High Protein Phase 1" 
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
            />

            <Select 
              label="Load Master Template (Optional)" 
              onChange={(e) => e.target.value && handleApplyTemplate(e.target.value)}
              options={[
                { label: '-- Select Template to Import --', value: '' },
                ...templates.map((t) => ({
                  label: `${t.templateName} (${t.totals?.calories || 0} kcal)`,
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

          {/* Target Macro Summary Bar inside Modal */}
          <div style={styles.modalMacroBar}>
            <div style={styles.macroStat}>
              <div style={styles.macroVal}><Flame size={16} color="var(--accent, #E00008)" /> {totals.calories}</div>
              <div style={styles.macroLbl}>Target Kcal</div>
            </div>
            <div style={styles.macroStat}>
              <div style={{ ...styles.macroVal, color: '#ff5252' }}>{totals.protein}g</div>
              <div style={styles.macroLbl}>Protein</div>
            </div>
            <div style={styles.macroStat}>
              <div style={{ ...styles.macroVal, color: '#448aff' }}>{totals.carbs}g</div>
              <div style={styles.macroLbl}>Carbs</div>
            </div>
            <div style={styles.macroStat}>
              <div style={{ ...styles.macroVal, color: '#ffb300' }}>{totals.fat}g</div>
              <div style={styles.macroLbl}>Fats</div>
            </div>
          </div>

          {/* 5 Meal Slots Builder inside Modal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {MEAL_SLOTS.map((slot) => {
              const slotData = mealsState[slot.id] || { foods: [], instructions: '' };
              const slotCalories = (slotData.foods || []).reduce((acc, f) => acc + (f.calories || 0), 0);

              return (
                <div key={slot.id} style={styles.modalMealCard}>
                  <div style={styles.mealHeader}>
                    <div style={styles.mealTitleGroup}>
                      <span style={{ fontSize: '1.3rem' }}>{slot.icon}</span>
                      <div>
                        <h3 style={styles.mealTitle}>{slot.name}</h3>
                        <span style={styles.mealTime}><Clock size={12} /> Time: {slot.defaultTime}</span>
                      </div>
                    </div>
                    <div style={styles.mealCalorieBadge}>
                      {slotCalories} Kcal
                    </div>
                  </div>

                  <div style={styles.foodList}>
                    {slotData.foods.map((food, fIdx) => (
                      <div key={fIdx} style={styles.foodItemRow}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                          <Input 
                            placeholder="Food Item (e.g. Oats / Chicken)" 
                            value={food.name} 
                            onChange={(e) => handleFoodChange(slot.id, fIdx, 'name', e.target.value)}
                          />
                          <Input 
                            placeholder="Qty (e.g. 1 Bowl)" 
                            value={food.qty} 
                            onChange={(e) => handleFoodChange(slot.id, fIdx, 'qty', e.target.value)}
                          />
                        </div>
                        
                        <div style={styles.macroInputGrid}>
                          <Input 
                            type="number" 
                            placeholder="Cal" 
                            value={food.calories || ''} 
                            onChange={(e) => handleFoodChange(slot.id, fIdx, 'calories', e.target.value)}
                          />
                          <Input 
                            type="number" 
                            placeholder="P(g)" 
                            value={food.protein || ''} 
                            onChange={(e) => handleFoodChange(slot.id, fIdx, 'protein', e.target.value)}
                          />
                          <Input 
                            type="number" 
                            placeholder="C(g)" 
                            value={food.carbs || ''} 
                            onChange={(e) => handleFoodChange(slot.id, fIdx, 'carbs', e.target.value)}
                          />
                          <Input 
                            type="number" 
                            placeholder="F(g)" 
                            value={food.fat || ''} 
                            onChange={(e) => handleFoodChange(slot.id, fIdx, 'fat', e.target.value)}
                          />
                          <button 
                            type="button" 
                            onClick={() => handleRemoveFood(slot.id, fIdx)}
                            style={styles.trashBtn}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAddFood(slot.id)}
                      style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={14} /> Add Food Item
                    </Button>
                  </div>

                  <Textarea 
                    placeholder="Instructions / remarks for this meal slot..." 
                    value={slotData.instructions || ''}
                    onChange={(e) => handleInstructionsChange(slot.id, e.target.value)}
                    style={{ marginTop: '10px' }}
                  />
                </div>
              );
            })}
          </div>

          {/* Supplements Builder Section */}
          <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>💊</span>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>Supplements Prescription (Optional)</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddSupplement}>
                <Plus size={14} /> Add Supplement
              </Button>
            </div>

            {supplements.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                No supplements added yet. Click "+ Add Supplement" to prescribe vitamins, protein, or health supplements.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {supplements.map((supp, sIdx) => (
                  <div key={sIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 2fr auto', gap: '8px', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <Input 
                      placeholder="Supplement Name (e.g. Multivitamin / Whey)" 
                      value={supp.name} 
                      onChange={(e) => handleSupplementChange(sIdx, 'name', e.target.value)}
                    />
                    <Input 
                      placeholder="Dosage (e.g. 1 Tablet)" 
                      value={supp.dosage} 
                      onChange={(e) => handleSupplementChange(sIdx, 'dosage', e.target.value)}
                    />
                    <Input 
                      placeholder="Timing (e.g. Morning / Post-Workout)" 
                      value={supp.timing} 
                      onChange={(e) => handleSupplementChange(sIdx, 'timing', e.target.value)}
                    />
                    <Input 
                      placeholder="Instructions (e.g. With milk after food)" 
                      value={supp.instructions} 
                      onChange={(e) => handleSupplementChange(sIdx, 'instructions', e.target.value)}
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSupplement(sIdx)}
                      style={styles.trashBtn}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Save Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <Button variant="outline" onClick={() => setIsDietModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveClientDietPlan} loading={saving} style={{ padding: '10px 24px' }}>
              <Send size={15} /> Submit Diet Plan for Client
            </Button>
          </div>
        </div>
      </Modal>

      {/* POPUP MODAL 2: CREATE / EDIT MASTER TEMPLATE MODAL */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title={editingTemplateId ? "Edit Master Diet Template" : "Create Master Diet Template"}
        size="xl"
      >
        <form onSubmit={handleSaveTemplateModal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Template Name *" 
            placeholder="e.g. High Protein Lean Mass (2500 Kcal)" 
            value={templateForm.templateName}
            onChange={(e) => setTemplateForm({ ...templateForm, templateName: e.target.value })}
            required
          />
          <Textarea 
            label="Description" 
            placeholder="Template target audience and nutritional goals..." 
            value={templateForm.description}
            onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
            rows={2}
          />

          {/* Target Macro Summary Bar for Template */}
          {(() => {
            const tmplTotals = calculateTotals(templateForm.mealsState || getEmptyMealsState());
            return (
              <div style={styles.modalMacroBar}>
                <div style={styles.macroStat}>
                  <div style={styles.macroVal}><Flame size={16} color="var(--accent, #E00008)" /> {tmplTotals.calories}</div>
                  <div style={styles.macroLbl}>Target Kcal</div>
                </div>
                <div style={styles.macroStat}>
                  <div style={{ ...styles.macroVal, color: '#ff5252' }}>{tmplTotals.protein}g</div>
                  <div style={styles.macroLbl}>Protein</div>
                </div>
                <div style={styles.macroStat}>
                  <div style={{ ...styles.macroVal, color: '#448aff' }}>{tmplTotals.carbs}g</div>
                  <div style={styles.macroLbl}>Carbs</div>
                </div>
                <div style={styles.macroStat}>
                  <div style={{ ...styles.macroVal, color: '#ffb300' }}>{tmplTotals.fat}g</div>
                  <div style={styles.macroLbl}>Fats</div>
                </div>
              </div>
            );
          })()}

          {/* 5 Meal Slots Builder for Template */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {MEAL_SLOTS.map((slot) => {
              const currentMeals = templateForm.mealsState || getEmptyMealsState();
              const slotData = currentMeals[slot.id] || { foods: [], instructions: '' };
              const slotCalories = (slotData.foods || []).reduce((acc, f) => acc + (f.calories || 0), 0);

              return (
                <div key={slot.id} style={styles.modalMealCard}>
                  <div style={styles.mealHeader}>
                    <div style={styles.mealTitleGroup}>
                      <span style={{ fontSize: '1.3rem' }}>{slot.icon}</span>
                      <div>
                        <h3 style={styles.mealTitle}>{slot.name}</h3>
                        <span style={styles.mealTime}><Clock size={12} /> Time: {slot.defaultTime}</span>
                      </div>
                    </div>
                    <div style={styles.mealCalorieBadge}>
                      {slotCalories} Kcal
                    </div>
                  </div>

                  <div style={styles.foodList}>
                    {(slotData.foods || []).map((food, fIdx) => (
                      <div key={fIdx} style={styles.foodItemRow}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                          <Input 
                            placeholder="Food Item (e.g. Oats / Chicken)" 
                            value={food.name || ''} 
                            onChange={(e) => handleTemplateFoodChange(slot.id, fIdx, 'name', e.target.value)}
                          />
                          <Input 
                            placeholder="Qty (e.g. 1 Bowl)" 
                            value={food.qty || ''} 
                            onChange={(e) => handleTemplateFoodChange(slot.id, fIdx, 'qty', e.target.value)}
                          />
                        </div>
                        
                        <div style={styles.macroInputGrid}>
                          <Input 
                            type="number" 
                            placeholder="Cal" 
                            value={food.calories || ''} 
                            onChange={(e) => handleTemplateFoodChange(slot.id, fIdx, 'calories', e.target.value)}
                          />
                          <Input 
                            type="number" 
                            placeholder="P(g)" 
                            value={food.protein || ''} 
                            onChange={(e) => handleTemplateFoodChange(slot.id, fIdx, 'protein', e.target.value)}
                          />
                          <Input 
                            type="number" 
                            placeholder="C(g)" 
                            value={food.carbs || ''} 
                            onChange={(e) => handleTemplateFoodChange(slot.id, fIdx, 'carbs', e.target.value)}
                          />
                          <Input 
                            type="number" 
                            placeholder="F(g)" 
                            value={food.fat || ''} 
                            onChange={(e) => handleTemplateFoodChange(slot.id, fIdx, 'fat', e.target.value)}
                          />
                          <button 
                            type="button" 
                            onClick={() => handleRemoveTemplateFood(slot.id, fIdx)}
                            style={styles.trashBtn}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <Button 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={() => handleAddTemplateFood(slot.id)}
                      style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={14} /> Add Food Item
                    </Button>
                  </div>

                  <Textarea 
                    placeholder="Instructions / remarks for this meal slot..." 
                    value={slotData.instructions || ''}
                    onChange={(e) => handleTemplateInstructionsChange(slot.id, e.target.value)}
                    style={{ marginTop: '10px' }}
                  />
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <Button variant="outline" type="button" onClick={() => setIsTemplateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} style={{ padding: '10px 24px' }}>
              <Send size={15} /> Submit Template
            </Button>
          </div>
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
  planMacroBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '10px 14px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    border: '1px solid var(--border, #2a2a30)',
  },
  summaryMealsList: {
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
  modalMacroBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '14px',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '12px',
    border: '1px solid var(--border, #2a2a30)',
  },
  modalMealCard: {
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '14px',
    border: '1px solid var(--border, #2a2a30)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  mealHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border, #2a2a30)', paddingBottom: '10px' },
  mealTitleGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
  mealTitle: { fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#FFFFFF' },
  mealTime: { fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' },
  mealCalorieBadge: {
    backgroundColor: 'rgba(224, 0, 8, 0.15)',
    border: '1px solid rgba(224, 0, 8, 0.3)',
    color: 'var(--accent, #E00008)',
    fontWeight: 700,
    fontSize: '0.8rem',
    padding: '3px 10px',
    borderRadius: '20px',
  },
  foodList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  foodItemRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '8px 10px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    border: '1px solid var(--border, #2a2a30)',
  },
  macroInputGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '6px', alignItems: 'center' },
  trashBtn: { backgroundColor: 'transparent', border: 'none', color: '#ff1744', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  macroStat: { textAlign: 'center' },
  macroVal: { fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' },
  macroLbl: { fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '12px',
  },
  templateCard: { padding: '20px', display: 'flex', flexDirection: 'column' },
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
  },
};
