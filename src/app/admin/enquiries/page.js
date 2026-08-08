'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getEnquiries, addEnquiry, updateEnquiry, deleteEnquiry, addDocument } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import Avatar from '@/components/ui/Avatar';
import { 
  HelpCircle, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  UserCheck, 
  Clock, 
  MessageSquare, 
  Filter, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Send, 
  RefreshCw,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'new', label: '🆕 New Enquiries' },
  { value: 'contacted', label: '📞 Contacted' },
  { value: 'followup', label: '⏰ Follow-up Required' },
  { value: 'converted', label: '✅ Converted to Member' },
  { value: 'closed', label: '❌ Closed / Inactive' }
];

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'website', label: '🌐 Website Form' },
  { value: 'walkin', label: '🚶 Walk-in Enquiry' }
];

export default function EnquiriesPage() {
  const router = useRouter();
  const toast = useToast();

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Modals state
  const [isAddWalkinOpen, setIsAddWalkinOpen] = useState(false);
  const [addingWalkin, setAddingWalkin] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [converting, setConverting] = useState(false);

  // Form for Walk-in Enquiry
  const [walkinForm, setWalkinForm] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Male',
    age: '',
    goal: 'Fat Loss',
    preferredPlan: 'Standard 1 Month Plan',
    followupDate: '',
    notes: '',
    status: 'new'
  });

  // Edit / Status Details form
  const [editForm, setEditForm] = useState({
    status: 'new',
    trainerNotes: '',
    followupDate: ''
  });

  useEffect(() => {
    fetchEnquiriesList();
  }, []);

  const fetchEnquiriesList = async () => {
    setLoading(true);
    try {
      const data = await getEnquiries();
      setEnquiries(data || []);
    } catch (err) {
      console.error('Failed to fetch enquiries:', err);
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  // Filtered list
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(item => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
        (item.name || '').toLowerCase().includes(q) || 
        (item.phone || '').toLowerCase().includes(q) || 
        (item.email || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.notes || item.message || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [enquiries, search, statusFilter, sourceFilter]);

  // Analytics KPIs
  const stats = useMemo(() => {
    const total = enquiries.length;
    const newCount = enquiries.filter(e => e.status === 'new' || !e.status).length;
    const walkinCount = enquiries.filter(e => e.source === 'walkin').length;
    const websiteCount = enquiries.filter(e => e.source === 'website').length;
    const convertedCount = enquiries.filter(e => e.status === 'converted').length;

    return { total, newCount, walkinCount, websiteCount, convertedCount };
  }, [enquiries]);

  // Handle Add Walk-in Enquiry Submit
  const handleAddWalkinSubmit = async (e) => {
    e.preventDefault();
    if (!walkinForm.name || !walkinForm.phone) {
      return toast.error('Please enter Prospect Name and Phone Number');
    }

    setAddingWalkin(true);
    try {
      await addEnquiry({
        name: walkinForm.name,
        phone: walkinForm.phone,
        email: walkinForm.email || '',
        gender: walkinForm.gender,
        age: walkinForm.age,
        goal: walkinForm.goal,
        preferredPlan: walkinForm.preferredPlan,
        followupDate: walkinForm.followupDate,
        notes: walkinForm.notes,
        status: walkinForm.status || 'new',
        source: 'walkin',
        category: `Walk-in: ${walkinForm.goal}`,
        createdAt: new Date().toISOString()
      });

      toast.success(`Walk-in enquiry for ${walkinForm.name} recorded!`);
      setIsAddWalkinOpen(false);
      setWalkinForm({
        name: '',
        phone: '',
        email: '',
        gender: 'Male',
        age: '',
        goal: 'Fat Loss',
        preferredPlan: 'Standard 1 Month Plan',
        followupDate: '',
        notes: '',
        status: 'new'
      });
      fetchEnquiriesList();
    } catch (err) {
      console.error('Failed to add walk-in enquiry:', err);
      toast.error('Failed to record walk-in enquiry');
    } finally {
      setAddingWalkin(false);
    }
  };

  // Open Edit / Details Modal
  const openEnquiryDetails = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setEditForm({
      status: enquiry.status || 'new',
      trainerNotes: enquiry.trainerNotes || enquiry.notes || '',
      followupDate: enquiry.followupDate || ''
    });
  };

  // Handle Update Enquiry Status
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;

    setUpdating(true);
    try {
      await updateEnquiry(selectedEnquiry.id, {
        status: editForm.status,
        trainerNotes: editForm.trainerNotes,
        followupDate: editForm.followupDate,
        updatedAt: new Date().toISOString()
      });

      toast.success('Enquiry updated successfully!');
      setSelectedEnquiry(null);
      fetchEnquiriesList();
    } catch (err) {
      console.error('Failed to update enquiry:', err);
      toast.error('Failed to update enquiry status');
    } finally {
      setUpdating(false);
    }
  };

  // Convert Enquiry directly to Client
  const handleConvertToClient = async (enquiry) => {
    if (!enquiry) return;
    if (!confirm(`Are you sure you want to convert ${enquiry.name} into a registered Gym Client?`)) return;

    setConverting(true);
    try {
      // Create user document in Users collection
      const clientCode = String(100 + Math.floor(Math.random() * 900));
      const newClientData = {
        displayName: enquiry.name,
        name: enquiry.name,
        email: enquiry.email || `${enquiry.phone}@mrkfitness.com`,
        phone: enquiry.phone || '',
        gender: enquiry.gender || 'Male',
        age: enquiry.age || '',
        goal: enquiry.goal || 'Fat Loss',
        clientCode: clientCode,
        role: 'client',
        status: 'active',
        currentPlan: enquiry.preferredPlan || 'Standard 1 Month Plan',
        createdAt: new Date().toISOString()
      };

      await addDocument('Users', newClientData);

      // Update Enquiry Status to Converted
      await updateEnquiry(enquiry.id, {
        status: 'converted',
        convertedAt: new Date().toISOString(),
        clientCode: clientCode
      });

      toast.success(`🎉 ${enquiry.name} converted to Member (Code: ${clientCode})!`);
      setSelectedEnquiry(null);
      fetchEnquiriesList();
    } catch (err) {
      console.error('Failed to convert enquiry to client:', err);
      toast.error('Failed to convert enquiry to client');
    } finally {
      setConverting(false);
    }
  };

  // Delete Enquiry
  const handleDeleteEnquiry = async (id, name) => {
    if (!confirm(`Are you sure you want to delete enquiry for ${name}?`)) return;
    try {
      await deleteEnquiry(id);
      toast.success('Enquiry deleted');
      if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
      fetchEnquiriesList();
    } catch (err) {
      toast.error('Failed to delete enquiry');
    }
  };

  const formatNiceDate = (dateVal) => {
    if (!dateVal) return 'Recently';
    try {
      let d;
      if (typeof dateVal === 'object' && dateVal?.seconds) {
        d = new Date(dateVal.seconds * 1000);
      } else if (typeof dateVal === 'object' && typeof dateVal?.toDate === 'function') {
        d = dateVal.toDate();
      } else {
        d = new Date(dateVal);
      }

      if (!d || isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'Recently';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: 'rgba(0, 176, 255, 0.15)', color: '#00b0ff', border: '1px solid rgba(0, 176, 255, 0.3)' }}>🆕 NEW</span>;
      case 'contacted':
        return <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: 'rgba(255, 214, 0, 0.15)', color: '#ffd600', border: '1px solid rgba(255, 214, 0, 0.3)' }}>📞 CONTACTED</span>;
      case 'followup':
        return <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: 'rgba(255, 145, 0, 0.15)', color: '#ff9100', border: '1px solid rgba(255, 145, 0, 0.3)' }}>⏰ FOLLOW-UP</span>;
      case 'converted':
        return <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: 'rgba(0, 200, 83, 0.15)', color: '#00c853', border: '1px solid rgba(0, 200, 83, 0.3)' }}>✅ CONVERTED</span>;
      case 'closed':
        return <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>❌ CLOSED</span>;
      default:
        return <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: 'rgba(0, 176, 255, 0.15)', color: '#00b0ff' }}>NEW</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <Spinner size={32} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading enquiries & walk-in records...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '40px' }} className="animate-fade-up">
      
      {/* Header Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle color="var(--accent, #E00008)" size={24} /> Gym Enquiries & Walk-ins
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Manage website form submissions and log walk-in gym prospects.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={fetchEnquiriesList}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button onClick={() => setIsAddWalkinOpen(true)}>
            <Plus size={16} /> + Add Walk-in Enquiry
          </Button>
        </div>
      </div>

      {/* KPI DASHBOARD STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
        <Card style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(224, 0, 8, 0.12)', borderRadius: '10px', color: 'var(--accent)' }}>
              <HelpCircle size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>TOTAL ENQUIRIES</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--text)', fontWeight: 800 }}>{stats.total} Records</strong>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(0, 176, 255, 0.12)', borderRadius: '10px', color: '#00b0ff' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>NEW UNACTIONED</span>
              <strong style={{ fontSize: '1.2rem', color: '#00b0ff', fontWeight: 800 }}>{stats.newCount} New</strong>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(255, 145, 0, 0.12)', borderRadius: '10px', color: '#ff9100' }}>
              <User size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>WALK-IN PROSPECTS</span>
              <strong style={{ fontSize: '1.2rem', color: '#ff9100', fontWeight: 800 }}>{stats.walkinCount} Walk-ins</strong>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(0, 200, 83, 0.12)', borderRadius: '10px', color: '#00c853' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>CONVERTED MEMBERS</span>
              <strong style={{ fontSize: '1.2rem', color: '#00c853', fontWeight: 800 }}>{stats.convertedCount} Converted</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <Card style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'center' }}>
          
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Input
              placeholder="Search by prospect name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          </div>

          {/* Status Filter Dropdown */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />

          {/* Source Filter Dropdown */}
          <Select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            options={SOURCE_OPTIONS}
          />

        </div>
      </Card>

      {/* ENQUIRIES TABLE LIST */}
      <Card style={{ padding: '0', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--card-hover)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 14px' }}>Prospect Info</th>
                <th style={{ padding: '12px 14px' }}>Contact Phone & Email</th>
                <th style={{ padding: '12px 14px' }}>Category / Preferred Plan</th>
                <th style={{ padding: '12px 14px' }}>Date & Source</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.length > 0 ? (
                filteredEnquiries.map(item => {
                  const name = item.name || 'Anonymous Prospect';
                  const isWalkin = item.source === 'walkin';

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                      
                      {/* Prospect Info */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar name={name} size="md" />
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '0.9rem' }}>{name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                backgroundColor: isWalkin ? 'rgba(255, 145, 0, 0.15)' : 'rgba(0, 176, 255, 0.15)',
                                color: isWalkin ? '#ff9100' : '#00b0ff',
                                border: `1px solid ${isWalkin ? 'rgba(255, 145, 0, 0.3)' : 'rgba(0, 176, 255, 0.3)'}`
                              }}>
                                {isWalkin ? '🚶 WALK-IN' : '🌐 WEBSITE'}
                              </span>
                              {item.gender && <span>• {item.gender}</span>}
                              {item.age && <span>• {item.age} yrs</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {item.phone ? (
                            <a 
                              href={`tel:${item.phone}`} 
                              style={{ color: 'var(--text)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Phone size={13} color="var(--accent)" /> {item.phone}
                            </a>
                          ) : <span style={{ color: 'var(--text-secondary)' }}>--</span>}

                          {item.email ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              📧 {item.email}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Category / Plan */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                          {item.category || item.preferredPlan || 'General Query'}
                        </div>
                        {item.notes || item.message ? (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                            "{item.notes || item.message}"
                          </div>
                        ) : null}
                      </td>

                      {/* Date & Source */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>
                          {formatNiceDate(item.createdAt || item.date || item.preferredDate)}
                        </div>
                        {(item.preferredDate || item.preferredTime) && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent, #E00008)', fontWeight: 800, marginTop: '2px' }}>
                            📅 Pref: {item.preferredDate || '--'} {item.preferredTime ? `(${item.preferredTime})` : ''}
                          </div>
                        )}
                        {item.followupDate && (
                          <div style={{ fontSize: '0.7rem', color: '#ff9100', fontWeight: 700, marginTop: '2px' }}>
                            ⏰ Followup: {item.followupDate}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px' }}>
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Button size="sm" variant="outline" onClick={() => openEnquiryDetails(item)}>
                            <Edit3 size={13} /> Manage
                          </Button>
                          {item.status !== 'converted' && (
                            <Button size="sm" onClick={() => handleConvertToClient(item)}>
                              <UserCheck size={13} /> Convert
                            </Button>
                          )}
                          <Button size="sm" variant="danger" onClick={() => handleDeleteEnquiry(item.id, name)}>
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>
                    <EmptyState
                      icon="📩"
                      title="No Enquiries Found"
                      message="No web enquiries or walk-in prospect records match your filter criteria."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL 1: ADD WALK-IN ENQUIRY */}
      {isAddWalkinOpen && (
        <Modal
          isOpen={isAddWalkinOpen}
          onClose={() => setIsAddWalkinOpen(false)}
          title="🚶 Add Walk-in Gym Prospect Enquiry"
          size="md"
        >
          <form onSubmit={handleAddWalkinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Prospect Full Name *"
                placeholder="e.g. Rahul Sharma"
                value={walkinForm.name}
                onChange={(e) => setWalkinForm({ ...walkinForm, name: e.target.value })}
                required
              />
              <Input
                label="Phone Number *"
                placeholder="e.g. 9876543210"
                value={walkinForm.phone}
                onChange={(e) => setWalkinForm({ ...walkinForm, phone: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <Input
                label="Email Address"
                placeholder="prospect@email.com"
                type="email"
                value={walkinForm.email}
                onChange={(e) => setWalkinForm({ ...walkinForm, email: e.target.value })}
              />
              <Select
                label="Gender"
                value={walkinForm.gender}
                onChange={(e) => setWalkinForm({ ...walkinForm, gender: e.target.value })}
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' }
                ]}
              />
              <Input
                label="Age (Years)"
                placeholder="e.g. 26"
                type="number"
                value={walkinForm.age}
                onChange={(e) => setWalkinForm({ ...walkinForm, age: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Select
                label="Primary Fitness Goal"
                value={walkinForm.goal}
                onChange={(e) => setWalkinForm({ ...walkinForm, goal: e.target.value })}
                options={[
                  { label: 'Fat Loss & Toning', value: 'Fat Loss' },
                  { label: 'Muscle Building & Hypertrophy', value: 'Muscle Gain' },
                  { label: 'General Health & Fitness', value: 'General Fitness' },
                  { label: 'Personal Training (1-on-1)', value: 'Personal Training' },
                  { label: 'Contest Prep / Powerlifting', value: 'Contest Prep' }
                ]}
              />

              <Select
                label="Preferred Plan / Package"
                value={walkinForm.preferredPlan}
                onChange={(e) => setWalkinForm({ ...walkinForm, preferredPlan: e.target.value })}
                options={[
                  { label: 'Standard 1 Month Plan', value: 'Standard 1 Month Plan' },
                  { label: 'Quarterly 3 Month Plan', value: 'Quarterly 3 Month Plan' },
                  { label: 'Half-Yearly 6 Month Plan', value: 'Half-Yearly 6 Month Plan' },
                  { label: 'Annual 12 Month Plan', value: 'Annual 12 Month Plan' }
                ]}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Follow-up Date"
                type="date"
                value={walkinForm.followupDate}
                onChange={(e) => setWalkinForm({ ...walkinForm, followupDate: e.target.value })}
              />

              <Select
                label="Initial Prospect Status"
                value={walkinForm.status}
                onChange={(e) => setWalkinForm({ ...walkinForm, status: e.target.value })}
                options={[
                  { label: '🆕 New Prospect', value: 'new' },
                  { label: '📞 Contacted / Discussion Done', value: 'contacted' },
                  { label: '⏰ Follow-up Scheduled', value: 'followup' },
                  { label: '✅ Ready to Join (Converted)', value: 'converted' }
                ]}
              />
            </div>

            <Textarea
              label="Front-Desk / Discussion Notes"
              placeholder="Enter notes about gym tour, pricing discussion, health concerns..."
              rows={3}
              value={walkinForm.notes}
              onChange={(e) => setWalkinForm({ ...walkinForm, notes: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
              <Button type="button" variant="outline" onClick={() => setIsAddWalkinOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={addingWalkin}>
                <Send size={15} /> Save Walk-in Enquiry
              </Button>
            </div>

          </form>
        </Modal>
      )}

      {/* MODAL 2: VIEW / MANAGE ENQUIRY DETAILS */}
      {selectedEnquiry && (
        <Modal
          isOpen={!!selectedEnquiry}
          onClose={() => setSelectedEnquiry(null)}
          title={`Enquiry: ${selectedEnquiry.name}`}
          size="md"
        >
          <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Header Prospect Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'var(--card-hover)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <Avatar name={selectedEnquiry.name} size="lg" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                    {selectedEnquiry.name}
                  </h3>
                  {getStatusBadge(selectedEnquiry.status)}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span>📞 {selectedEnquiry.phone || '--'}</span>
                  <span>📧 {selectedEnquiry.email || '--'}</span>
                  <span>Source: <strong>{(selectedEnquiry.source || 'website').toUpperCase()}</strong></span>
                </div>
              </div>
            </div>

            {/* Submission Message / Category */}
            <div style={{ padding: '10px 12px', backgroundColor: 'var(--card)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '4px' }}>
                {selectedEnquiry.category || 'Enquiry Detail'}
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)' }}>
                {selectedEnquiry.message || selectedEnquiry.notes || 'No message text provided.'}
              </p>
            </div>

            {/* Update Status Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Select
                label="Update Status"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                options={[
                  { label: '🆕 New', value: 'new' },
                  { label: '📞 Contacted', value: 'contacted' },
                  { label: '⏰ Follow-up Required', value: 'followup' },
                  { label: '✅ Converted to Member', value: 'converted' },
                  { label: '❌ Closed / Inactive', value: 'closed' }
                ]}
              />

              <Input
                label="Follow-up Date"
                type="date"
                value={editForm.followupDate}
                onChange={(e) => setEditForm({ ...editForm, followupDate: e.target.value })}
              />
            </div>

            <Textarea
              label="Trainer / Follow-up Notes"
              placeholder="Record notes from phone call, WhatsApp conversation, or gym visit..."
              rows={3}
              value={editForm.trainerNotes}
              onChange={(e) => setEditForm({ ...editForm, trainerNotes: e.target.value })}
            />

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
              {selectedEnquiry.status !== 'converted' ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleConvertToClient(selectedEnquiry)}
                  loading={converting}
                >
                  <UserCheck size={15} color="#00c853" /> Convert to Registered Member
                </Button>
              ) : (
                <span style={{ fontSize: '0.78rem', color: '#00c853', fontWeight: 800 }}>
                  ✓ Converted to Active Gym Member
                </span>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="button" variant="outline" onClick={() => setSelectedEnquiry(null)}>
                  Close
                </Button>
                <Button type="submit" loading={updating}>
                  <Send size={15} /> Save Changes
                </Button>
              </div>
            </div>

          </form>
        </Modal>
      )}

    </div>
  );
}
