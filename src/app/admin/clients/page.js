'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAllClients, 
  deleteClient, 
  clearSeedClients,
  getPlans,
  addDocument,
  updateClientProfile,
  assignPlan
} from '@/lib/firestore';
import { registerUserByAdmin } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { validateField } from '@/lib/validation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  User as UserIcon, 
  CreditCard,
  ChevronRight,
  Filter,
  Send,
  Trash2,
  Calendar,
  Percent,
  IndianRupee
} from 'lucide-react';

export default function ClientsPage() {
  const router = useRouter();
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [allPlansList, setAllPlansList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [clearingSeed, setClearingSeed] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProfileClient, setSelectedProfileClient] = useState(null);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState(null);
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [changePlanClient, setChangePlanClient] = useState(null);
  const [changePlanForm, setChangePlanForm] = useState({ planIdCombo: '', planStart: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const initialClientForm = {
    name: '',
    email: '',
    phone: '',
    clientCode: '100',
    age: '',
    dob: '',
    gender: 'Male',
    profession: '',
    location: '',
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
    password: '',
    planIdCombo: '',
    planStart: new Date().toISOString().split('T')[0],
    originalAmount: '',
    discountType: 'percentage',
    discountValue: '',
    amountPaid: '',
    paymentMethod: 'Cash',
    notes: ''
  };

  const [newClient, setNewClient] = useState(initialClientForm);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await getAllClients();
      setClients(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const data = await getPlans();
      // Filter out deactivated plans so ONLY active plans are available for assignment
      const activePlans = (data || []).filter(p => p.status !== 'inactive');
      setAllPlansList(activePlans);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClients();
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    setNewClient(prev => ({
      ...prev,
      planIdCombo: combo,
      originalAmount: priceStr,
      amountPaid: priceStr
    }));
  };

  // Remove Plan Handler
  const handleRemovePlan = async (client) => {
    if (!client) return;
    if (!confirm(`Are you sure you want to remove the assigned plan from ${client.displayName || client.name}?`)) return;
    try {
      setLoading(true);
      await updateClientProfile(client.id, {
        currentPlan: '',
        planStart: '',
        planExpiry: '',
        planId: ''
      });
      toast.success('Assigned plan removed successfully!');
      if (selectedProfileClient?.id === client.id) {
        setSelectedProfileClient(prev => ({
          ...prev,
          currentPlan: '',
          planStart: '',
          planExpiry: '',
          planId: ''
        }));
      }
      await fetchClients();
    } catch (err) {
      toast.error('Failed to remove assigned plan');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Disable / Enable Client Membership Handler
  const handleToggleClientDisable = async (client) => {
    if (!client) return;
    const isCurrentlyActive = client.status !== 'inactive';
    const newStatus = isCurrentlyActive ? 'inactive' : 'active';
    const actionText = isCurrentlyActive ? 'disable' : 'enable';

    if (!confirm(`Are you sure you want to ${actionText} membership status for ${client.displayName || client.name}?`)) return;

    try {
      setLoading(true);
      await updateClientProfile(client.id, {
        status: newStatus
      });
      toast.success(`Client membership ${isCurrentlyActive ? 'disabled' : 'enabled'} successfully!`);
      if (selectedProfileClient?.id === client.id) {
        setSelectedProfileClient(prev => ({
          ...prev,
          status: newStatus
        }));
      }
      await fetchClients();
    } catch (err) {
      toast.error(`Failed to ${actionText} client`);
    } finally {
      setLoading(false);
    }
  };

  // Change / Switch Plan Handler
  const handleExecuteChangePlan = async (e) => {
    e.preventDefault();
    if (!changePlanClient) return;
    if (!changePlanForm.planIdCombo) return toast.error('Please select a membership plan');

    try {
      setSaving(true);
      const [planId, tierIndexStr] = changePlanForm.planIdCombo.split('||');
      const tierIndex = parseInt(tierIndexStr, 10) || 0;
      const selectedPlan = allPlansList.find(p => p.id === planId);

      if (!selectedPlan) return toast.error('Selected plan not found');

      const tier = selectedPlan.pricing?.[tierIndex] || { durationVal: 1, durationUnit: 'Months', duration: '1 Month', price: selectedPlan.price || 0 };
      const durationVal = parseInt(tier.durationVal, 10) || 1;
      const durationUnit = tier.durationUnit || 'Months';

      const startDate = new Date(changePlanForm.planStart);
      const expiryDateObj = new Date(startDate);
      if (durationUnit === 'Days') {
        expiryDateObj.setDate(expiryDateObj.getDate() + durationVal);
      } else if (durationUnit === 'Years') {
        expiryDateObj.setFullYear(expiryDateObj.getFullYear() + durationVal);
      } else {
        expiryDateObj.setMonth(expiryDateObj.getMonth() + durationVal);
      }

      const planExpiry = expiryDateObj.toISOString().split('T')[0];
      const planNameFormatted = `${selectedPlan.plan_name || selectedPlan.name} (${tier.duration || `${durationVal} ${durationUnit}`})`;

      const existingHistory = changePlanClient.planHistory || [];
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
        planStart: changePlanForm.planStart,
        planExpiry: planExpiry,
        originalAmount: tier.price || 0,
        finalAmount: tier.price || 0,
        amountPaid: tier.price || 0,
        balance: 0,
        paymentStatus: 'Paid',
        status: 'active',
        planFeatures: newPlanFeatures,
        assignedAt: new Date().toISOString()
      };

      updatedHistory.unshift(newPlanHistoryItem);

      const updatedFields = {
        currentPlan: planNameFormatted,
        planId: selectedPlan.id,
        planStart: changePlanForm.planStart,
        planExpiry: planExpiry,
        status: 'active',
        planFeatures: newPlanFeatures,
        planHistory: updatedHistory
      };

      await updateClientProfile(changePlanClient.id, updatedFields);
      try {
        await assignPlan({ clientId: changePlanClient.id, ...newPlanHistoryItem });
      } catch (e) {
        console.warn('Assign plan sub-record warning:', e);
      }

      toast.success(`Plan updated to "${planNameFormatted}" successfully!`);

      if (selectedProfileClient?.id === changePlanClient.id) {
        setSelectedProfileClient(prev => ({
          ...prev,
          ...updatedFields
        }));
      }

      setIsChangePlanModalOpen(false);
      setChangePlanClient(null);
      await fetchClients();
    } catch (err) {
      toast.error('Failed to change plan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const calculateFinalAmount = () => {
    const original = parseFloat(newClient.originalAmount) || 0;
    const discountVal = parseFloat(newClient.discountValue) || 0;

    if (newClient.discountType === 'percentage') {
      const discountAmt = (original * discountVal) / 100;
      return Math.max(0, original - discountAmt);
    } else {
      return Math.max(0, original - discountVal);
    }
  };

  const calculateBalance = () => {
    const finalAmt = calculateFinalAmount();
    const paid = parseFloat(newClient.amountPaid) || 0;
    return Math.max(0, finalAmt - paid);
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    
    // Validations
    const nameErr = validateField('Client Name', newClient.name, { required: true });
    const emailErr = validateField('Email Address', newClient.email, { email: true, required: true });
    const passErr = validateField('Password', newClient.password, { required: true });
    const ageErr = validateField('Age', newClient.age, { numeric: true, maxDigits: 3, max: 120 });
    const phoneErr = validateField('Phone Number', newClient.phone, { phone: true });

    if (nameErr || emailErr || passErr || ageErr || phoneErr) {
      toast.error(nameErr || emailErr || passErr || ageErr || phoneErr);
      return;
    }

    if (newClient.password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setCreating(true);
    try {
      // 1. Create User with full intake fields
      const createdUser = await registerUserByAdmin({
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        clientCode: newClient.clientCode || '100',
        age: newClient.age,
        dob: newClient.dob || '',
        gender: newClient.gender || 'Male',
        profession: newClient.profession || '',
        location: newClient.location || '',
        height: newClient.height || '',
        weight: newClient.weight || '',
        targetWeight: newClient.targetWeight || '',
        diet: newClient.diet || 'VEG',
        goal: newClient.goal || 'Fat Loss',
        daysAvailable: newClient.daysAvailable || '',
        hasInjuries: newClient.hasInjuries || 'NO',
        injuriesDetails: newClient.injuriesDetails || '',
        hasHealthIssues: newClient.hasHealthIssues || 'NO',
        healthIssuesDetails: newClient.healthIssuesDetails || '',
        medications: newClient.medications || '',
        stressLevel: newClient.stressLevel || 5,
        stressSources: newClient.stressSources || '',
        password: newClient.password
      });

      const clientId = createdUser.id || createdUser.uid;

      // 2. If a plan was selected, assign plan & create billing invoice
      if (newClient.planIdCombo && clientId) {
        const [planId, tierIndexStr] = newClient.planIdCombo.split('||');
        const tierIndex = parseInt(tierIndexStr, 10) || 0;

        const selectedPlan = allPlansList.find(p => p.id === planId);
        if (selectedPlan) {
          const tier = selectedPlan.pricing?.[tierIndex] || {
            durationVal: parseInt(selectedPlan.durationVal, 10) || 1,
            durationUnit: selectedPlan.durationUnit || 'Months',
            price: selectedPlan.price || 0
          };

          const start = new Date(newClient.planStart);
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

          const originalAmt = parseFloat(newClient.originalAmount) || 0;
          const discountVal = parseFloat(newClient.discountValue) || 0;
          const finalAmt = calculateFinalAmount();
          const discountAmt = originalAmt - finalAmt;
          const paidAmt = parseFloat(newClient.amountPaid) || 0;
          const balanceAmt = Math.max(0, finalAmt - paidAmt);
          const planNameFormatted = `${selectedPlan.plan_name || selectedPlan.name} (${durationVal} ${durationUnit})`;

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
            planStart: newClient.planStart,
            planExpiry: expiry.toISOString().split('T')[0],
            originalAmount: originalAmt,
            discountType: newClient.discountType,
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

          // Update Client Profile with plan info
          await updateClientProfile(clientId, {
            currentPlan: planNameFormatted,
            planStart: newClient.planStart,
            planExpiry: expiry.toISOString().split('T')[0],
            amountPaid: paidAmt,
            balance: balanceAmt,
            paymentStatus: balanceAmt <= 0 ? 'Paid' : 'Partial',
            planFeatures: newPlanFeatures,
            planHistory: [newPlanHistoryItem]
          });

          await assignPlan({ clientId, ...newPlanHistoryItem });

          // Create Billing Record
          await addDocument('Billing', {
            clientId: clientId,
            clientName: newClient.name,
            clientEmail: newClient.email,
            clientPhone: newClient.phone || '',
            date: newClient.planStart,
            planName: planNameFormatted,
            originalAmount: originalAmt,
            discountType: newClient.discountType,
            discountValue: discountVal,
            discountAmount: discountAmt,
            finalAmount: finalAmt,
            amountPaid: paidAmt,
            balance: balanceAmt,
            paymentMethod: newClient.paymentMethod,
            notes: newClient.notes || '',
            status: balanceAmt <= 0 ? 'Paid' : 'Partial',
            updatedAtStr: new Date().toISOString()
          });
        }
      }

      toast.success(`Client "${newClient.name}" created successfully!`);
      setIsAddModalOpen(false);
      setNewClient(initialClientForm);
      await fetchClients();
    } catch (err) {
      toast.error(err?.message || (typeof err === 'string' ? err : 'Failed to create client'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClient = async (e, clientId, clientName) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete client "${clientName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteClient(clientId);
      toast.success(`Client "${clientName}" deleted successfully`);
      await fetchClients();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete client');
    }
  };

  const handleClearSeedData = async () => {
    if (!confirm('Are you sure you want to remove all seed test clients? Real registered clients will be preserved.')) {
      return;
    }

    setClearingSeed(true);
    try {
      const removedCount = await clearSeedClients();
      toast.success(`Removed ${removedCount} seed test clients!`);
      await fetchClients();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove seed data');
    } finally {
      setClearingSeed(false);
    }
  };

  const getMembershipStatus = (client) => {
    if (client.status === 'inactive') return { label: 'Inactive', variant: 'warning' };
    if (!client.currentPlan) return { label: 'Active', variant: 'success' };
    if (client.planExpiry) {
      const isExpired = new Date(client.planExpiry).getTime() < new Date().getTime();
      if (isExpired) return { label: 'Expired', variant: 'danger' };
    }
    return { label: 'Active Member', variant: 'success' };
  };

  const planOptions = [{ label: '-- No Plan / Assign Later --', value: '' }];
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

  const sortedClients = [...clients].sort((a, b) => {
    const getTimestamp = (obj) => {
      if (!obj?.createdAt) return 0;
      if (obj.createdAt.seconds) return obj.createdAt.seconds * 1000;
      if (typeof obj.createdAt === 'string') return new Date(obj.createdAt).getTime();
      if (typeof obj.createdAt.toMillis === 'function') return obj.createdAt.toMillis();
      return Date.now(); // Assume pending serverTimestamp is now
    };
    const tA = getTimestamp(a);
    const tB = getTimestamp(b);
    
    if (tA !== tB) {
      return tB - tA;
    }
    return String(b.clientCode || b.id || '').localeCompare(String(a.clientCode || a.id || ''));
  });

  const filteredClients = sortedClients.filter(c => {
    const s = search.toLowerCase();
    const matchesSearch = 
      (c.displayName || c.name || '')?.toLowerCase().includes(s) ||
      (c.email || '')?.toLowerCase().includes(s) ||
      (c.phone || '')?.toLowerCase().includes(s) ||
      (c.clientCode || '')?.toLowerCase().includes(s);
    
    const matchesStatus = statusFilter === 'all' || (c.status || 'active') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredClients.length;
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={styles.container} className="animate-fade-up">
      {/* Page Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.titleRow}>
            <div style={styles.titleIcon}>
              <Users size={18} color="var(--accent, #E00008)" />
            </div>
            <h1 style={styles.title}>Clients Directory</h1>
          </div>
          <p style={styles.subtitle}>
            Manage member profiles, health metrics & fitness plan assignments in tabular format
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button onClick={handleClearSeedData} variant="outline" size="sm" loading={clearingSeed} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
            <Trash2 size={14} /> Remove Seed Data
          </Button>
          <Button onClick={() => { setNewClient(initialClientForm); setIsAddModalOpen(true); }} size="sm">
            <UserPlus size={14} /> Submit New Client
          </Button>
        </div>
      </header>

      {/* Filter & Search Bar */}
      <div style={styles.controlsBar}>
        <div style={styles.searchWrapper}>
          <Input 
            placeholder="Search by name, email, or phone..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            icon={<Search size={16} />}
          />
        </div>

        <div style={styles.filterWrapper}>
          <div style={styles.filterLabel}>
            <Filter size={14} color="var(--text-secondary)" /> Status:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.filterSelect}
          >
            <option value="all">All Clients ({clients.length})</option>
            <option value="active">Active Members</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* TABULAR CLIENTS FORMAT */}
      <Card style={{ padding: '14px' }} className="glass-card">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : paginatedClients.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card-hover)' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Client Name</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Contact Info</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Plan & Expiry</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((client) => {
                  const memStatus = getMembershipStatus(client);
                  const clientName = client.displayName || client.name || 'No Name';

                  return (
                    <tr 
                      key={client.id} 
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => setSelectedProfileClient(client)}
                      className="table-row-hover"
                    >
                      {/* Client Name & Avatar */}
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar src={client.photoURL || client.profileImage} name={clientName} size="md" />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.88rem' }}>{clientName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              Code: {client.clientCode || 'Member'} {client.age ? `• ${client.age} yrs` : ''} {client.gender ? `(${client.gender})` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>
                          <Phone size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                          {client.phone || '--'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {client.email || '--'}
                        </div>
                      </td>

                      {/* Plan & Expiry */}
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)' }}>
                          {client.currentPlan || 'Not Assigned'}
                        </div>
                        {client.planExpiry && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            📅 Expiry: {client.planExpiry}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 10px' }}>
                        <Badge variant={memStatus.variant} size="sm">
                          {memStatus.label}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                          <Button size="sm" variant="outline" onClick={() => setSelectedProfileClient(client)}>
                            View Profile <ChevronRight size={14} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            style={{ color: 'var(--danger)', padding: '6px' }}
                            onClick={(e) => handleDeleteClient(e, client.id, clientName)}
                            title="Delete Client"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <Users size={36} color="var(--text-muted)" />
            <h3 style={{ margin: '8px 0 2px', color: 'var(--text)' }}>No Clients Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Try adjusting your search query or click &quot;Submit New Client&quot; above.
            </p>
          </div>
        )}

        {totalItems > 0 && (
          <Pagination
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
            itemsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
      </Card>

      {/* Add Client & Optional Plan/Billing Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Submit New Client Account & Optional Plan Assignment"
        size="lg"
      >
        <form onSubmit={handleCreateClient} style={styles.modalForm}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input 
              label="Full Name *" 
              placeholder="e.g. Rahul Sharma"
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              required
            />
            <Input 
              label="Email Address *" 
              type="email"
              placeholder="e.g. rahul@gmail.com"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              required
            />
          </div>

          <div style={styles.formRow}>
            <Input 
              label="Phone Number" 
              placeholder="10-digit mobile number"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              phone={true}
            />
            <Input 
              label="Age" 
              placeholder="e.g. 25"
              value={newClient.age}
              onChange={(e) => setNewClient({ ...newClient, age: e.target.value })}
              numeric={true}
              maxDigits={3}
            />
          </div>

          <div style={styles.formRow}>
            <Select 
              label="Gender"
              value={newClient.gender}
              onChange={(e) => setNewClient({ ...newClient, gender: e.target.value })}
              options={[
                { label: 'Male', value: 'Male' },
                { label: 'Female', value: 'Female' },
                { label: 'Other', value: 'Other' }
              ]}
            />

            <Input 
              label="Password *" 
              type="password"
              placeholder="Set client password"
              value={newClient.password}
              onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
              required
            />
          </div>

          {/* OPTIONAL MEMBERSHIP PLAN & BILLING ASSIGNMENT */}
          <Card style={{ padding: '12px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <CreditCard size={16} color="var(--accent)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)' }}>
                Assign Membership Plan & Billing (Optional)
              </span>
            </div>

            <SearchableSelect 
              label="Select Membership Plan" 
              placeholder="-- No Plan / Assign Later --"
              searchPlaceholder="Search plans by name or duration..."
              value={newClient.planIdCombo} 
              onChange={handlePlanSelectChange}
              options={planOptions}
            />

            {newClient.planIdCombo && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Input 
                    label="Plan Start Date *" 
                    type="date"
                    value={newClient.planStart} 
                    onChange={(e) => setNewClient({ ...newClient, planStart: e.target.value })}
                    required
                  />
                  <Input 
                    label="Original Amount (₹) *" 
                    placeholder="e.g. 1599"
                    value={newClient.originalAmount}
                    onChange={(e) => setNewClient({ ...newClient, originalAmount: e.target.value })}
                    numeric={true}
                    allowDecimal={true}
                    required
                  />
                </div>

                {/* Discount Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Select 
                    label="Discount Type"
                    value={newClient.discountType}
                    onChange={(e) => setNewClient({ ...newClient, discountType: e.target.value })}
                    options={[
                      { label: 'Percentage (%)', value: 'percentage' },
                      { label: 'Flat Amount (₹)', value: 'amount' }
                    ]}
                  />
                  <Input 
                    label={newClient.discountType === 'percentage' ? 'Discount %' : 'Discount Amount (₹)'}
                    placeholder={newClient.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 200'}
                    value={newClient.discountValue}
                    onChange={(e) => setNewClient({ ...newClient, discountValue: e.target.value })}
                    numeric={true}
                    allowDecimal={true}
                  />
                </div>

                {/* Price & Balance Live Summary */}
                <div style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Final Payable Price: </span>
                    <strong style={{ fontSize: '0.95rem', color: '#00c853' }}>₹{calculateFinalAmount().toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Pending Balance Due: </span>
                    <strong style={{ fontSize: '0.95rem', color: calculateBalance() > 0 ? 'var(--danger)' : '#00c853' }}>₹{calculateBalance().toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Input 
                    label="Amount Paid Now (₹) *" 
                    placeholder="e.g. 1599"
                    value={newClient.amountPaid}
                    onChange={(e) => setNewClient({ ...newClient, amountPaid: e.target.value })}
                    numeric={true}
                    allowDecimal={true}
                    required
                  />
                  <Select 
                    label="Payment Method"
                    value={newClient.paymentMethod}
                    onChange={(e) => setNewClient({ ...newClient, paymentMethod: e.target.value })}
                    options={[
                      { label: '💵 Cash', value: 'Cash' },
                      { label: '📱 UPI / Google Pay', value: 'UPI' },
                      { label: '💳 Card', value: 'Card' },
                      { label: '🏦 Bank Transfer', value: 'Bank Transfer' },
                      { label: '📝 Other', value: 'Other' }
                    ]}
                  />
                </div>

                <Input 
                  label="Payment / Receipt Note"
                  placeholder="e.g. Received via GPay Ref #9923"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                />
              </div>
            )}
          </Card>

          <div style={styles.modalActions}>
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              <Send size={15} /> Submit Client
            </Button>
          </div>
        </form>
      </Modal>

      {/* CLIENT PROFILE POPUP MODAL */}
      {selectedProfileClient && (
        <Modal
          isOpen={!!selectedProfileClient}
          onClose={() => setSelectedProfileClient(null)}
          title={`Client Profile: ${selectedProfileClient.displayName || selectedProfileClient.name || 'Member'}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'var(--card-hover)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <Avatar 
                src={selectedProfileClient.photoURL || selectedProfileClient.profileImage || selectedProfileClient.photo || selectedProfileClient.avatar} 
                name={selectedProfileClient.displayName || selectedProfileClient.name} 
                size="lg" 
                onClick={() => {
                  const p = selectedProfileClient.photoURL || selectedProfileClient.profileImage || selectedProfileClient.photo || selectedProfileClient.avatar;
                  if (p) setViewingPhotoUrl(p);
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                    {selectedProfileClient.displayName || selectedProfileClient.name}
                  </h3>
                  <Badge variant={selectedProfileClient.status === 'active' ? 'success' : 'secondary'} size="sm">
                    {(selectedProfileClient.status || 'ACTIVE').toUpperCase()}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span>📧 {selectedProfileClient.email || '--'}</span>
                  <span>📞 {selectedProfileClient.phone || '--'}</span>
                  <span>🆔 Code: {selectedProfileClient.clientCode || '100'}</span>
                </div>
              </div>
            </div>

            {/* Plan Info Card */}
            <div style={{ padding: '14px', backgroundColor: 'rgba(224, 0, 8, 0.06)', borderRadius: '12px', border: '1px solid rgba(224, 0, 8, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                  Assigned Membership Plan
                </div>
                
                {/* QUICK PLAN MANAGEMENT ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleToggleClientDisable(selectedProfileClient)}
                    style={{ padding: '4px 9px', borderRadius: '6px', backgroundColor: selectedProfileClient.status === 'inactive' ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 145, 0, 0.15)', border: selectedProfileClient.status === 'inactive' ? '1px solid rgba(0, 200, 83, 0.4)' : '1px solid rgba(255, 145, 0, 0.4)', color: selectedProfileClient.status === 'inactive' ? '#00c853' : '#ff9100', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                    title={selectedProfileClient.status === 'inactive' ? "Enable client membership" : "Disable client membership"}
                  >
                    {selectedProfileClient.status === 'inactive' ? '⚡ Enable' : '⏸️ Disable'}
                  </button>

                  {selectedProfileClient.currentPlan && (
                    <button 
                      onClick={() => handleRemovePlan(selectedProfileClient)}
                      style={{ padding: '4px 9px', borderRadius: '6px', backgroundColor: 'rgba(224, 0, 8, 0.15)', border: '1px solid rgba(224, 0, 8, 0.4)', color: '#ff1744', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                      title="Remove assigned plan from client"
                    >
                      🗑️ Remove Plan
                    </button>
                  )}
                </div>
              </div>

              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                {selectedProfileClient.currentPlan || 'No Plan Assigned'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px', fontSize: '0.75rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Start Date</span>
                  <strong style={{ color: 'var(--text)' }}>{selectedProfileClient.planStart || '--'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Expiry Date</span>
                  <strong style={{ color: 'var(--text)' }}>{selectedProfileClient.planExpiry || '--'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Location / City</span>
                  <strong style={{ color: 'var(--text)' }}>{selectedProfileClient.location || '--'}</strong>
                </div>
              </div>
            </div>

            {/* Physical Stats & Goal Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '10px', backgroundColor: 'var(--card-hover)', borderRadius: '10px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>GENDER / AGE</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)' }}>
                  {selectedProfileClient.gender || 'Male'} ({selectedProfileClient.age || '--'} yrs)
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>HEIGHT / WEIGHT</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)' }}>
                  {selectedProfileClient.height ? `${selectedProfileClient.height} cm` : '--'} / {selectedProfileClient.weight ? `${selectedProfileClient.weight} kg` : '--'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>PRIMARY GOAL</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#00c853' }}>
                  {selectedProfileClient.goal || 'Fat Loss'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>DIET TYPE</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ff9100' }}>
                  {selectedProfileClient.diet || 'VEG'}
                </div>
              </div>
            </div>

            {/* Health & Injuries Section */}
            {(selectedProfileClient.hasInjuries === 'YES' || selectedProfileClient.hasHealthIssues === 'YES' || selectedProfileClient.injuriesDetails || selectedProfileClient.healthIssuesDetails) && (
              <div style={{ padding: '10px 12px', backgroundColor: 'rgba(255, 145, 0, 0.08)', borderRadius: '10px', border: '1px solid rgba(255, 145, 0, 0.25)', fontSize: '0.78rem' }}>
                <strong style={{ color: '#ff9100', display: 'block', marginBottom: '2px' }}>⚠️ Health & Injury Alerts:</strong>
                {selectedProfileClient.injuriesDetails && <div>• <strong>Injuries:</strong> {selectedProfileClient.injuriesDetails}</div>}
                {selectedProfileClient.healthIssuesDetails && <div>• <strong>Health Concerns:</strong> {selectedProfileClient.healthIssuesDetails}</div>}
                {selectedProfileClient.medications && <div>• <strong>Medications:</strong> {selectedProfileClient.medications}</div>}
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              <Button variant="outline" size="sm" onClick={() => setSelectedProfileClient(null)}>
                Close
              </Button>
              <Button size="sm" onClick={() => { setSelectedProfileClient(null); router.push(`/admin/clients/${selectedProfileClient.id}`); }}>
                Full Management Profile <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {/* CHANGE / SWITCH PLAN MODAL */}
      {isChangePlanModalOpen && changePlanClient && (
        <Modal
          isOpen={isChangePlanModalOpen}
          onClose={() => setIsChangePlanModalOpen(false)}
          title={`Change Plan for ${changePlanClient.displayName || changePlanClient.name}`}
          size="md"
        >
          <form onSubmit={handleExecuteChangePlan} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '10px 12px', backgroundColor: 'var(--card-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Currently Assigned:</span>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--accent)' }}>
                {changePlanClient.currentPlan || 'No Plan Assigned'}
              </strong>
            </div>

            <Select
              label="Select New Membership Plan & Duration *"
              value={changePlanForm.planIdCombo}
              onChange={(e) => setChangePlanForm({ ...changePlanForm, planIdCombo: e.target.value })}
              options={[
                { label: '-- Select Plan & Duration Tier --', value: '' },
                ...allPlansList.flatMap(plan => {
                  if (plan.pricing && plan.pricing.length > 0) {
                    return plan.pricing.map((tier, tIdx) => ({
                      label: `${plan.plan_name || plan.name} — ${tier.duration || `${tier.durationVal || 1} ${tier.durationUnit || 'Months'}`} (₹${tier.price || 0})`,
                      value: `${plan.id}||${tIdx}`
                    }));
                  }
                  return [{
                    label: `${plan.plan_name || plan.name} (₹${plan.price || 0})`,
                    value: `${plan.id}||0`
                  }];
                })
              ]}
              required
            />

            <Input
              label="Plan Start Date *"
              type="date"
              value={changePlanForm.planStart}
              onChange={(e) => setChangePlanForm({ ...changePlanForm, planStart: e.target.value })}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button variant="outline" type="button" onClick={() => setIsChangePlanModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Updating Plan...' : 'Save & Assign New Plan'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* PHOTO FULL VIEW MODAL */}
      {viewingPhotoUrl && (
        <Modal isOpen={!!viewingPhotoUrl} onClose={() => setViewingPhotoUrl(null)} title="Photo Full View" size="md">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
            <img 
              src={viewingPhotoUrl} 
              alt="Photo Full Preview" 
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', objectFit: 'contain' }} 
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  titleIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'var(--accent-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: 800,
    color: 'var(--text)',
  },
  subtitle: {
    margin: '2px 0 0',
    color: 'var(--text-secondary)',
    fontSize: '0.78rem',
  },
  controlsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    flex: 1,
    minWidth: '220px',
  },
  filterWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  filterLabel: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 600,
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--card)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    fontSize: '0.8rem',
    outline: 'none',
    cursor: 'pointer',
  },
  emptyState: {
    padding: '40px 16px',
    textAlign: 'center',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '8px',
  },
};
