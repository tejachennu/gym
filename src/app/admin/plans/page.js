'use client';

import { useEffect, useState } from 'react';
import { getPlans, createPlan, updatePlan, deleteDocument } from '@/lib/firestore';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import PlanCard from '@/components/ui/PlanCard';
import { CreditCard, Plus, RefreshCw, Trash2, Check, Send } from 'lucide-react';

export default function PlansPage() {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);

  // Helper to parse existing string durations into value/unit format
  const parseDuration = (durationStr) => {
    if (!durationStr) return { val: 1, unit: 'Months' };
    
    // Try to match number and word
    const match = durationStr.match(/(\d+)\s*(Day|Month|Year|day|month|year)s?/i);
    if (match) {
      const val = Number(match[1]);
      let unit = match[2].toLowerCase();
      if (unit.startsWith('day')) unit = 'Days';
      else if (unit.startsWith('month')) unit = 'Months';
      else if (unit.startsWith('year')) unit = 'Years';
      return { val, unit };
    }
    
    // Fallbacks
    if (durationStr.toLowerCase().includes('hour')) return { val: 1, unit: 'Days' };
    return { val: 1, unit: 'Months' };
  };

  const [formData, setFormData] = useState({
    plan_name: '',
    category: 'MRK FITNESS',
    badge: '',
    description: '',
    pricing: [{ durationVal: 1, durationUnit: 'Months', price: 1299 }],
    features: ['Full Gym Access', 'Strength Training', 'Trainer Guidance']
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await getPlans();
      setPlans(data);

      // Auto-migrate any legacy plans lacking durationVal or durationUnit
      let migratedAny = false;
      for (const plan of data) {
        let needsMigration = false;
        const migratedPricing = (plan.pricing || []).map(tier => {
          if (tier.durationVal === undefined || tier.durationUnit === undefined) {
            needsMigration = true;
            const parsed = parseDuration(tier.duration);
            return {
              ...tier,
              durationVal: parsed.val,
              durationUnit: parsed.unit,
              duration: tier.duration || `${parsed.val} ${parsed.unit}`
            };
          }
          return tier;
        });
        
        if (needsMigration) {
          migratedAny = true;
          console.log(`Migrating plan pricing for: ${plan.plan_name || plan.name}`);
          await updatePlan(plan.id, {
            ...plan,
            pricing: migratedPricing
          });
        }
      }
      if (migratedAny) {
        // Refetch once after migrating all documents
        const updatedData = await getPlans();
        setPlans(updatedData);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPlanId(null);
    setFormData({
      plan_name: '',
      category: 'POWERHOUSE FITNESS',
      badge: '',
      description: '',
      pricing: [{ durationVal: 1, durationUnit: 'Months', price: 1599 }],
      features: ['Full Gym Access', 'Strength Training', 'Trainer Guidance'],
      hasDiet: true,
      hasWorkout: true,
      hasTracking: true,
      hasPostureCheckin: true,
      hasDailyLog: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlanId(plan.id);
    const parsedPricing = (plan.pricing || []).map(tier => {
      const parsed = parseDuration(tier.duration || `${tier.durationVal || 1} ${tier.durationUnit || 'Months'}`);
      return {
        durationVal: tier.durationVal || parsed.val,
        durationUnit: tier.durationUnit || parsed.unit,
        price: tier.price || 0
      };
    });
    if (parsedPricing.length === 0) {
      parsedPricing.push({ durationVal: 1, durationUnit: 'Months', price: plan.startingPrice || 0 });
    }
    setFormData({
      plan_name: plan.plan_name || plan.name || '',
      category: plan.category || 'POWERHOUSE FITNESS',
      badge: plan.badge || '',
      description: plan.description || '',
      pricing: parsedPricing,
      features: plan.features && plan.features.length > 0 ? plan.features : ['Full Gym Access'],
      hasDiet: plan.hasDiet ?? true,
      hasWorkout: plan.hasWorkout ?? true,
      hasTracking: plan.hasTracking ?? true,
      hasPostureCheckin: plan.hasPostureCheckin ?? true,
      hasDailyLog: plan.hasDailyLog ?? true
    });
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!formData.plan_name) {
      return toast.error('Plan name is required');
    }
    setSaving(true);
    try {
      // Structure pricing payload to preserve both structured and formatted fields
      const formattedPricing = formData.pricing.map(tier => {
        const val = Number(tier.durationVal) || 1;
        const unit = tier.durationUnit || 'Months';
        return {
          durationVal: val,
          durationUnit: unit,
          duration: `${val} ${unit}`, // Keeps backward compatibility with other pages
          price: Number(tier.price) || 0
        };
      });

      const planData = {
        ...formData,
        pricing: formattedPricing
      };

      if (editingPlanId) {
        await updatePlan(editingPlanId, planData);
        toast.success(`Plan "${formData.plan_name}" updated successfully!`);
      } else {
        await createPlan(planData);
        toast.success(`Plan "${formData.plan_name}" created successfully!`);
      }
      setIsModalOpen(false);
      await fetchPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this membership plan?')) return;
    try {
      setLoading(true);
      await deleteDocument('Plans', planId);
      toast.success('Plan deleted successfully');
      await fetchPlans();
    } catch (err) {
      toast.error('Failed to delete plan');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      setLoading(true);
      const { seedPlans: runSeed } = await import('@/lib/seedPlans');
      await runSeed();
      toast.success('Sample plans seeded successfully!');
      await fetchPlans();
    } catch (err) {
      toast.error('Error seeding plans: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Pricing helper handlers
  const handleAddPricingTier = () => {
    setFormData({
      ...formData,
      pricing: [...formData.pricing, { durationVal: 3, durationUnit: 'Months', price: 2999 }]
    });
  };

  const handleRemovePricingTier = (index) => {
    if (formData.pricing.length <= 1) return toast.warning('At least one pricing tier is required');
    setFormData({
      ...formData,
      pricing: formData.pricing.filter((_, i) => i !== index)
    });
  };

  const handlePricingChange = (index, field, value) => {
    const updated = [...formData.pricing];
    updated[index] = { 
      ...updated[index], 
      [field]: field === 'durationVal' || field === 'price' ? Number(value) : value 
    };
    setFormData({ ...formData, pricing: updated });
  };

  // Features helper handlers
  const handleAddFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, 'New Feature Item']
    });
  };

  const handleRemoveFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const handleFeatureChange = (index, value) => {
    const updated = [...formData.features];
    updated[index] = value;
    setFormData({ ...formData, features: updated });
  };

  return (
    <div style={styles.container} className="animate-fade-up">
      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(224, 0, 8, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(224, 0, 8, 0.2)'
            }}>
              <CreditCard size={22} color="var(--accent, #E00008)" />
            </div>
            <h1 style={styles.title}>Membership Plans</h1>
          </div>
          <p style={{ color: 'var(--text-secondary, #AAAAAA)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Manage gym passes, pricing tiers & dynamic duration options
          </p>
        </div>
        <div style={styles.actions}>
          <Button onClick={handleOpenCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Create Plan
          </Button>
        </div>
      </header>

      {/* Grid */}
      {loading ? (
        <div style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div style={styles.grid}>
          {plans.map(plan => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              isAdmin={true}
              onEdit={handleOpenEditModal}
              onDelete={handleDeletePlan}
            />
          ))}
          {plans.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--card, #121214)', borderRadius: '20px', border: '1px solid var(--border, #2a2a30)' }}>
              <CreditCard size={48} color="var(--text-muted, #666666)" />
              <h3 style={{ margin: '16px 0 6px', color: '#FFFFFF' }}>No Membership Plans Found</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                Click "Seed Demo Plans" above to populate all 6 default passes into Firestore.
              </p>
              <Button onClick={handleSeed}>Seed Demo Plans Now</Button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingPlanId ? "Edit Membership Plan" : "Create New Membership Plan"}
      >
        <form onSubmit={handleSavePlan} style={styles.form}>
          <Input 
            label="Plan Name *" 
            placeholder="e.g. Cardio + Strength" 
            value={formData.plan_name}
            onChange={(e) => setFormData({...formData, plan_name: e.target.value})}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input 
              label="Category" 
              placeholder="e.g. MRK FITNESS" 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            />
            <Input 
              label="Badge (Optional)" 
              placeholder="e.g. Most Popular" 
              value={formData.badge}
              onChange={(e) => setFormData({...formData, badge: e.target.value})}
            />
          </div>

          <Textarea 
            label="Plan Description" 
            placeholder="Brief summary of what this membership pass covers..." 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />

          {/* Pricing Tiers Builder */}
          <div style={styles.subSection}>
            <div style={styles.subSectionHeader}>
              <span style={styles.subSectionTitle}>Pricing Tiers & Durations</span>
              <button 
                type="button" 
                onClick={handleAddPricingTier} 
                style={styles.addSmallBtn}
              >
                <Plus size={14} /> Add Tier
              </button>
            </div>
            
            {formData.pricing.map((tier, idx) => (
              <div key={idx} style={styles.tierRow}>
                <Input 
                  type="number"
                  placeholder="Val" 
                  value={tier.durationVal}
                  onChange={(e) => handlePricingChange(idx, 'durationVal', e.target.value)}
                  style={{ width: '80px' }}
                />
                <Select 
                  value={tier.durationUnit || 'Months'}
                  onChange={(e) => handlePricingChange(idx, 'durationUnit', e.target.value)}
                  options={[
                    { label: 'Days', value: 'Days' },
                    { label: 'Months', value: 'Months' },
                    { label: 'Years', value: 'Years' }
                  ]}
                  style={{ flex: 1 }}
                />
                <Input 
                  type="number"
                  placeholder="Price (₹)" 
                  value={tier.price}
                  onChange={(e) => handlePricingChange(idx, 'price', e.target.value)}
                  style={{ width: '120px' }}
                />
                <button
                  type="button"
                  onClick={() => handleRemovePricingTier(idx)}
                  style={styles.removeIconBtn}
                  title="Remove tier"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Features / Inclusions Builder */}
          <div style={styles.subSection}>
            <div style={styles.subSectionHeader}>
              <span style={styles.subSectionTitle}>Plan Inclusions / Features</span>
              <button 
                type="button" 
                onClick={handleAddFeature} 
                style={styles.addSmallBtn}
              >
                <Plus size={14} /> Add Inclusion
              </button>
            </div>

            {formData.features.map((feat, idx) => (
              <div key={idx} style={styles.tierRow}>
                <Input 
                  placeholder="Feature description (e.g. Full Gym Access)" 
                  value={feat}
                  onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  style={styles.removeIconBtn}
                  title="Remove feature"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* CLIENT PORTAL FEATURE ACCESS TOGGLES */}
          <div style={styles.subSection}>
            <div style={styles.subSectionHeader}>
              <span style={styles.subSectionTitle}>Client Portal Feature Toggles</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', backgroundColor: 'var(--card-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
                <input 
                  type="checkbox" 
                  checked={formData.hasDiet ?? true}
                  onChange={(e) => setFormData({ ...formData, hasDiet: e.target.checked })}
                />
                🥗 Enable Diet Plan Access
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
                <input 
                  type="checkbox" 
                  checked={formData.hasWorkout ?? true}
                  onChange={(e) => setFormData({ ...formData, hasWorkout: e.target.checked })}
                />
                🏋️ Enable Workout Plan Access
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
                <input 
                  type="checkbox" 
                  checked={formData.hasTracking ?? true}
                  onChange={(e) => setFormData({ ...formData, hasTracking: e.target.checked })}
                />
                📊 Enable Tracking & Daily Activity Logs
              </label>

              {(formData.hasTracking ?? true) && (
                <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px', borderLeft: '2px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.hasPostureCheckin ?? true}
                      onChange={(e) => setFormData({ ...formData, hasPostureCheckin: e.target.checked })}
                    />
                    📸 10-Day Body Posture Submissions
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.hasDailyLog ?? true}
                      onChange={(e) => setFormData({ ...formData, hasDailyLog: e.target.checked })}
                    />
                    📝 Daily Activity & Water Logs
                  </label>
                </div>
              )}
            </div>
          </div>

          <Button type="submit" fullWidth loading={saving} style={{ marginTop: '12px' }}>
            <Send size={15} /> Submit Plan
          </Button>
        </form>
      </Modal>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  title: { fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  actions: { display: 'flex', gap: '12px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  subSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border, #2a2a30)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  subSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subSectionTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#FFFFFF',
  },
  addSmallBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(224, 0, 8, 0.15)',
    border: '1px solid rgba(224, 0, 8, 0.3)',
    color: '#FFFFFF',
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  tierRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  removeIconBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ff1744',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
