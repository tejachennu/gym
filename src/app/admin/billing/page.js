'use client';

import { useState, useEffect } from 'react';
import { getAllClients, addDocument, updateDocument, queryDocuments, deleteDocument } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { TableSkeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { validateField } from '@/lib/validation';
import { 
  IndianRupee, 
  Plus, 
  Trash2, 
  Receipt, 
  Filter, 
  Send,
  Percent,
  TrendingUp,
  AlertCircle,
  CreditCard,
  CheckCircle,
  Search
} from 'lucide-react';

export default function BillingPage() {
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'pending'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Payment Recording Modal State
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    newAmount: '',
    paymentMethod: 'Cash',
    notes: ''
  });

  // Date Filters (Default 1 Month)
  const defaultToDate = new Date().toISOString().split('T')[0];
  const defaultFromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    clientId: '',
    customClientName: '',
    customClientPhone: '',
    planName: '',
    originalAmount: '',
    discountType: 'percentage',  // 'percentage' or 'amount'
    discountValue: '',
    amountPaid: '',
    paymentMethod: 'Cash',
    notes: '',
    status: 'Paid'
  });

  useEffect(() => {
    fetchClients();
    fetchAllInvoices();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await getAllClients();
      setClients(data || []);
    } catch (err) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllInvoices = async () => {
    try {
      const data = await queryDocuments('Billing', [], 'createdAt', 'desc');
      setAllInvoices(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      loadClientInvoices(selectedClient);
    } else {
      setInvoices(allInvoices);
    }
    setCurrentPage(1);
  }, [selectedClient, allInvoices]);

  const loadClientInvoices = async (clientId) => {
    try {
      setLoading(true);
      const data = await queryDocuments('Billing', [{ field: 'clientId', operator: '==', value: clientId }], 'createdAt', 'desc');
      setInvoices(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalAmount = () => {
    const original = parseFloat(form.originalAmount) || 0;
    const discountVal = parseFloat(form.discountValue) || 0;

    if (form.discountType === 'percentage') {
      const discountAmt = (original * discountVal) / 100;
      return Math.max(0, original - discountAmt);
    } else {
      return Math.max(0, original - discountVal);
    }
  };

  const handleOpenAddModal = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      clientId: selectedClient || '',
      customClientName: '',
      customClientPhone: '',
      planName: '',
      originalAmount: '',
      discountType: 'percentage',
      discountValue: '',
      amountPaid: '',
      paymentMethod: 'Cash',
      notes: '',
      status: 'Paid'
    });
    setIsModalOpen(true);
  };

  const handleSubmitInvoice = async (e) => {
    e.preventDefault();

    const targetClientId = form.clientId || selectedClient || '';

    const amountErr = validateField('Original Amount', form.originalAmount, { required: true, numeric: true, allowDecimal: true });
    const paidErr = validateField('Amount Paid', form.amountPaid, { required: true, numeric: true, allowDecimal: true });
    const discountErr = form.discountValue ? validateField('Discount Value', form.discountValue, { numeric: true, allowDecimal: true }) : null;

    if (amountErr || paidErr || discountErr) {
      toast.error(amountErr || paidErr || discountErr);
      return;
    }

    if (!form.planName.trim()) {
      return toast.error('Please enter the plan or service name.');
    }

    setSaving(true);
    try {
      let clientName = form.customClientName.trim() || 'Walk-in Customer';
      let clientPhone = form.customClientPhone.trim() || '';
      let clientEmail = '';

      if (targetClientId) {
        const selectedClientObj = clients.find(c => c.id === targetClientId);
        if (selectedClientObj) {
          clientName = selectedClientObj.displayName || selectedClientObj.name || 'Client';
          clientPhone = selectedClientObj.phone || '';
          clientEmail = selectedClientObj.email || '';
        }
      }

      const finalAmount = calculateFinalAmount();
      const discountAmt = (parseFloat(form.originalAmount) || 0) - finalAmount;

      const data = {
        clientId: targetClientId || 'walkin',
        clientName: clientName,
        clientEmail: clientEmail,
        clientPhone: clientPhone,
        date: form.date,
        planName: form.planName.trim(),
        originalAmount: parseFloat(form.originalAmount) || 0,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue) || 0,
        discountAmount: discountAmt,
        finalAmount: finalAmount,
        amountPaid: parseFloat(form.amountPaid) || 0,
        balance: finalAmount - (parseFloat(form.amountPaid) || 0),
        paymentMethod: form.paymentMethod,
        notes: form.notes.trim(),
        status: (finalAmount - (parseFloat(form.amountPaid) || 0)) <= 0 ? 'Paid' : 'Partial',
        updatedAtStr: new Date().toISOString()
      };

      await addDocument('Billing', data);
      toast.success('Billing invoice submitted successfully!');
      setIsModalOpen(false);
      await fetchAllInvoices();
      if (selectedClient) await loadClientInvoices(selectedClient);
    } catch (err) {
      console.error(err);
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPaymentModal = (invoice) => {
    setPaymentModalInvoice(invoice);
    setPaymentForm({
      newAmount: String(invoice.balance || 0),
      paymentMethod: 'Cash',
      notes: ''
    });
  };

  const handleRecordBalancePayment = async (e) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    const payErr = validateField('New Payment Amount', paymentForm.newAmount, { required: true, numeric: true, allowDecimal: true });
    if (payErr) {
      return toast.error(payErr);
    }

    setSaving(true);
    try {
      const additionalPay = parseFloat(paymentForm.newAmount) || 0;
      const updatedPaid = (parseFloat(paymentModalInvoice.amountPaid) || 0) + additionalPay;
      const updatedBalance = Math.max(0, (parseFloat(paymentModalInvoice.finalAmount) || 0) - updatedPaid);
      const updatedStatus = updatedBalance <= 0 ? 'Paid' : 'Partial';

      const updatedNotes = paymentModalInvoice.notes 
        ? `${paymentModalInvoice.notes} | Added ₹${additionalPay} on ${new Date().toLocaleDateString()}`
        : `Added ₹${additionalPay} payment on ${new Date().toLocaleDateString()}`;

      await updateDocument('Billing', paymentModalInvoice.id, {
        amountPaid: updatedPaid,
        balance: updatedBalance,
        status: updatedStatus,
        paymentMethod: paymentForm.paymentMethod,
        notes: updatedNotes
      });

      toast.success(`Payment of ₹${additionalPay} recorded successfully!`);
      setPaymentModalInvoice(null);
      await fetchAllInvoices();
      if (selectedClient) await loadClientInvoices(selectedClient);
    } catch (err) {
      console.error(err);
      toast.error('Failed to record balance payment');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!confirm('Are you sure you want to delete this billing record?')) return;
    try {
      await deleteDocument('Billing', id);
      toast.success('Billing record deleted');
      await fetchAllInvoices();
      if (selectedClient) await loadClientInvoices(selectedClient);
    } catch (err) {
      toast.error('Failed to delete billing record');
    }
  };

  // Date filtered list
  const dateFilteredInvoices = (selectedClient ? invoices : allInvoices).filter(inv => {
    const d = inv.date || '';
    if (fromDate && d && d < fromDate) return false;
    if (toDate && d && d > toDate) return false;
    return true;
  });

  // Tab filtered list (All vs Pending Balances Only)
  const displayInvoices = activeTab === 'pending'
    ? dateFilteredInvoices.filter(inv => (parseFloat(inv.balance) || 0) > 0)
    : dateFilteredInvoices;

  const paginatedInvoices = displayInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Summary Stats
  const totalCollected = dateFilteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amountPaid) || 0), 0);
  const totalDiscount = dateFilteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.discountAmount) || 0), 0);
  const totalBalance = dateFilteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.balance) || 0), 0);

  // Defaulters / Pending list details
  const pendingInvoices = allInvoices.filter(inv => (parseFloat(inv.balance) || 0) > 0);
  const unpaidClientsCount = new Set(pendingInvoices.map(inv => inv.clientId)).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-fade-up">
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: 'var(--accent-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IndianRupee size={18} color="var(--accent)" />
            </div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Billing & Payments System</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0 0', fontSize: '0.78rem' }}>
            Full tabular view for discounts, amount paid, unpaid balances, and pending dues
          </p>
        </div>

        <Button onClick={handleOpenAddModal} size="sm">
          <Plus size={14} /> Submit New Billing
        </Button>
      </header>

      {/* Summary Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
        <Card style={{ padding: '12px', background: 'linear-gradient(135deg, rgba(0,200,83,0.1) 0%, var(--card) 100%)', border: '1px solid rgba(0,200,83,0.3)' }} className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <TrendingUp size={14} color="#00c853" />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Total Collected</span>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00c853' }}>₹{totalCollected.toLocaleString('en-IN')}</span>
        </Card>

        <Card style={{ padding: '12px', background: 'linear-gradient(135deg, rgba(255,214,0,0.1) 0%, var(--card) 100%)', border: '1px solid rgba(255,214,0,0.3)' }} className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Percent size={14} color="#d97706" />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Total Discounts</span>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d97706' }}>₹{totalDiscount.toLocaleString('en-IN')}</span>
        </Card>

        <Card style={{ padding: '12px', background: 'linear-gradient(135deg, rgba(255,23,68,0.1) 0%, var(--card) 100%)', border: '1px solid rgba(255,23,68,0.3)' }} className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <IndianRupee size={14} color="var(--danger)" />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Outstanding Balance</span>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--danger)' }}>₹{totalBalance.toLocaleString('en-IN')}</span>
        </Card>

        <Card 
          style={{ 
            padding: '12px', 
            background: activeTab === 'pending' ? 'var(--accent-surface)' : 'var(--card)', 
            border: `1px solid ${activeTab === 'pending' ? 'var(--accent)' : 'var(--border)'}`,
            cursor: 'pointer' 
          }} 
          className="glass-card"
          onClick={() => {
            setActiveTab(activeTab === 'pending' ? 'all' : 'pending');
            setCurrentPage(1);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <AlertCircle size={14} color="var(--accent)" />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Unpaid Clients</span>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)' }}>
            {unpaidClientsCount} <small style={{ fontSize: '0.72rem', fontWeight: 600 }}>Clients Owe Money</small>
          </span>
        </Card>
      </div>

      {/* Client Selector & Date Filter */}
      <Card style={{ padding: '12px' }} className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ flex: 1, minWidth: '200px', maxWidth: '350px' }}>
            <SearchableSelect 
              label="Filter by Client (or leave empty for all)"
              placeholder="Type name, phone, or email..."
              value={selectedClient} 
              onChange={(e) => setSelectedClient(e.target.value)}
              options={[
                { label: '🔍 Show All Clients', value: '' },
                ...clients.map((c) => ({
                  label: c.displayName || c.name || 'No Name',
                  value: c.id,
                  email: c.email || '',
                  phone: c.phone || ''
                }))
              ]}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--accent)" />
            <Input type="date" label="From Date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }} style={{ width: '130px' }} />
            <Input type="date" label="To Date" value={toDate} onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }} style={{ width: '130px' }} />
            <Button variant="outline" size="sm" onClick={() => { setFromDate(defaultFromDate); setToDate(defaultToDate); setCurrentPage(1); }} style={{ alignSelf: 'flex-end' }}>
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Tab Selector: All Records vs Pending Dues Only */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
        <button
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'all' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'all' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          📄 All Billing Records ({dateFilteredInvoices.length})
        </button>
        <button
          onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'pending' ? 'var(--danger)' : 'transparent',
            color: activeTab === 'pending' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ⚠️ Clients Who Still Owe Money ({pendingInvoices.length})
        </button>
      </div>

      {/* TABULAR BILLING INVOICES FORMAT */}
      <Card style={{ padding: '14px' }} className="glass-card">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : paginatedInvoices.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--card-hover)' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Date & Client Plan</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Original Amount</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Discount</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Final Price</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Amount Paid</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Balance Due</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((inv) => {
                  const hasPendingBalance = (parseFloat(inv.balance) || 0) > 0;

                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                      {/* Client Name & Plan */}
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.88rem' }}>
                          <Receipt size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          {inv.clientName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600 }}>
                          {inv.planName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          📅 {inv.date} • 💳 {inv.paymentMethod} {inv.clientPhone ? `• 📞 ${inv.clientPhone}` : ''}
                        </div>
                      </td>

                      {/* Original Amount */}
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--text)' }}>
                        ₹{(inv.originalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Discount */}
                      <td style={{ padding: '12px 10px', color: '#d97706', fontWeight: 600 }}>
                        {inv.discountType === 'percentage' ? `${inv.discountValue}%` : `₹${inv.discountValue}`}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          (−₹{(inv.discountAmount || 0).toLocaleString('en-IN')})
                        </div>
                      </td>

                      {/* Final Price */}
                      <td style={{ padding: '12px 10px', fontWeight: 800, color: 'var(--text)', fontSize: '0.88rem' }}>
                        ₹{(inv.finalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Amount Paid */}
                      <td style={{ padding: '12px 10px', fontWeight: 800, color: '#00c853' }}>
                        ₹{(inv.amountPaid || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Balance Due */}
                      <td style={{ padding: '12px 10px' }}>
                        {hasPendingBalance ? (
                          <Badge variant="danger" size="sm">
                            ⚠️ ₹{(inv.balance || 0).toLocaleString('en-IN')}
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            ✅ ₹0 (Paid)
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                          {hasPendingBalance && (
                            <Button size="sm" onClick={() => handleOpenPaymentModal(inv)} style={{ padding: '4px 10px', fontSize: '0.72rem', backgroundColor: '#00c853', color: '#fff' }}>
                              <CreditCard size={12} /> Pay Dues
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteInvoice(inv.id)} style={{ color: 'var(--danger)', padding: '6px' }} title="Delete Invoice">
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
            <IndianRupee size={36} color="var(--text-muted)" />
            <h3 style={{ margin: '10px 0 4px', color: 'var(--text)' }}>
              {activeTab === 'pending' ? '🎉 No Outstanding Dues Found!' : 'No Billing Records'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              {activeTab === 'pending' ? 'All clients have cleared their balances.' : 'Click "Submit New Billing" above to record a payment or invoice.'}
            </p>
          </div>
        )}

        {displayInvoices.length > 0 && (
          <Pagination
            totalItems={displayInvoices.length}
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

      {/* ADD BILLING MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit New Billing Invoice"
        size="md"
      >
        <form onSubmit={handleSubmitInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SearchableSelect 
            label="Client (Optional — Leave empty for Direct / Walk-in Billing)"
            placeholder="Search Registered Client (or leave empty for Walk-in)..."
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            options={[
              { label: '👤 Direct / Walk-in Billing (No Client Assigned)', value: '' },
              ...clients.map((c) => ({
                label: c.displayName || c.name || 'No Name',
                value: c.id,
                email: c.email || '',
                phone: c.phone || ''
              }))
            ]}
          />

          {!form.clientId && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input 
                label="Customer / Walk-in Name (Optional)" 
                placeholder="e.g. Walk-in Customer / Guest Name"
                value={form.customClientName}
                onChange={(e) => setForm({ ...form, customClientName: e.target.value })}
              />
              <Input 
                label="Customer Mobile (Optional)" 
                placeholder="e.g. 9876543210"
                value={form.customClientPhone}
                onChange={(e) => setForm({ ...form, customClientPhone: e.target.value })}
                numeric={true}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input 
              label="Billing Date *" 
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <Input 
              label="Plan / Service Name *" 
              placeholder="e.g. Cardio + Strength (1 Month)"
              value={form.planName}
              onChange={(e) => setForm({ ...form, planName: e.target.value })}
              required
            />
          </div>

          <Input 
            label="Original Amount (₹) *" 
            placeholder="e.g. 3000"
            value={form.originalAmount}
            onChange={(e) => setForm({ ...form, originalAmount: e.target.value })}
            numeric={true}
            allowDecimal={true}
            required
          />

          {/* Discount Section */}
          <Card style={{ padding: '10px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Percent size={14} color="#d97706" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' }}>Discount</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Select 
                label="Discount Type"
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                options={[
                  { label: 'Percentage (%)', value: 'percentage' },
                  { label: 'Flat Amount (₹)', value: 'amount' }
                ]}
              />
              <Input 
                label={form.discountType === 'percentage' ? 'Discount % (e.g. 10)' : 'Discount Amount (₹)'}
                placeholder={form.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 500'}
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                numeric={true}
                allowDecimal={true}
              />
            </div>

            {/* Live Calculation Preview */}
            {form.originalAmount && (
              <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>After Discount Final Amount:</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#00c853' }}>
                  ₹{calculateFinalAmount().toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </Card>

          <Input 
            label="Amount Paid (₹) *" 
            placeholder="e.g. 2700"
            value={form.amountPaid}
            onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
            numeric={true}
            allowDecimal={true}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Select 
              label="Payment Method"
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              options={[
                { label: '💵 Cash', value: 'Cash' },
                { label: '📱 UPI / Google Pay', value: 'UPI' },
                { label: '💳 Card', value: 'Card' },
                { label: '🏦 Bank Transfer', value: 'Bank Transfer' },
                { label: '📝 Other', value: 'Other' }
              ]}
            />
            <Select 
              label="Payment Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={[
                { label: '✅ Paid', value: 'Paid' },
                { label: '⏳ Partial', value: 'Partial' },
                { label: '❌ Pending', value: 'Pending' }
              ]}
            />
          </div>

          <Textarea 
            label="Notes / Remarks" 
            placeholder="e.g. First month trial discount..." 
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              <Send size={14} /> Submit Billing
            </Button>
          </div>
        </form>
      </Modal>

      {/* RECORD BALANCE PAYMENT MODAL */}
      {paymentModalInvoice && (
        <Modal
          isOpen={Boolean(paymentModalInvoice)}
          onClose={() => setPaymentModalInvoice(null)}
          title={`💳 Collect Balance Payment for ${paymentModalInvoice.clientName}`}
          size="md"
        >
          <form onSubmit={handleRecordBalancePayment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '10px', backgroundColor: 'var(--card-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                {paymentModalInvoice.planName}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span>Final Plan Price: <strong>₹{paymentModalInvoice.finalAmount}</strong></span>
                <span>Paid So Far: <strong style={{ color: '#00c853' }}>₹{paymentModalInvoice.amountPaid}</strong></span>
                <span>Remaining Due: <strong style={{ color: 'var(--danger)' }}>₹{paymentModalInvoice.balance}</strong></span>
              </div>
            </div>

            <Input 
              label="New Payment Amount (₹) *" 
              placeholder={`e.g. ${paymentModalInvoice.balance}`}
              value={paymentForm.newAmount}
              onChange={(e) => setPaymentForm({ ...paymentForm, newAmount: e.target.value })}
              numeric={true}
              allowDecimal={true}
              required
            />

            <Select 
              label="Payment Method"
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              options={[
                { label: '💵 Cash', value: 'Cash' },
                { label: '📱 UPI / Google Pay', value: 'UPI' },
                { label: '💳 Card', value: 'Card' },
                { label: '🏦 Bank Transfer', value: 'Bank Transfer' },
                { label: '📝 Other', value: 'Other' }
              ]}
            />

            <Textarea 
              label="Payment Note / Receipt No."
              placeholder="e.g. Received via UPI Ref #12345"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              rows={2}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <Button type="button" variant="outline" onClick={() => setPaymentModalInvoice(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving} style={{ backgroundColor: '#00c853' }}>
                <CheckCircle size={14} /> Confirm & Save Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  emptyState: {
    padding: '40px 16px',
    textAlign: 'center',
    width: '100%'
  }
};
