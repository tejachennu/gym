'use client';

import { useState, useEffect } from 'react';
import { 
  getAllClients, 
  getClientCheckins, 
  submitCheckin, 
  updateCheckin, 
  deleteCheckin 
} from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { CardSkeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Save, 
  Calendar, 
  Edit, 
  Image as ImageIcon,
  Activity,
  Upload,
  Loader
} from 'lucide-react';

export default function CheckinsPage() {
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [checkinsList, setCheckinsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal Popup state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    chest: '',
    waist: '',
    arms: '',
    legs: '',
    photoFront: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
    photoBack: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
    photoLeft: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
    photoRight: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
    notes: ''
  });

  const [statusBanner, setStatusBanner] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await getAllClients();
      setClients(data || []);
    } catch (err) {
      toast.error('Failed to load clients list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      loadCheckinHistory(selectedClient);
    } else {
      setCheckinsList([]);
    }
  }, [selectedClient]);

  const loadCheckinHistory = async (clientId) => {
    try {
      setLoading(true);
      const history = await getClientCheckins(clientId);
      setCheckinsList(history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    if (!selectedClient) {
      return toast.warning('Please select a client from the dropdown first.');
    }
    setEditingId(null);
    setForm({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      chest: '',
      waist: '',
      arms: '',
      legs: '',
      photoFront: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
      photoBack: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
      photoLeft: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
      photoRight: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
      notes: ''
    });
    setStatusBanner(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (checkin) => {
    setEditingId(checkin.id);
    setForm({
      date: checkin.date || new Date().toISOString().split('T')[0],
      weight: checkin.weight || '',
      chest: checkin.chest || '',
      waist: checkin.waist || '',
      arms: checkin.arms || '',
      legs: checkin.legs || '',
      photoFront: checkin.photoFront || checkin.photos?.front || checkin.front || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
      photoBack: checkin.photoBack || checkin.photos?.back || checkin.back || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
      photoLeft: checkin.photoLeft || checkin.photoSide || checkin.photos?.left || checkin.photos?.side || checkin.left || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
      photoRight: checkin.photoRight || checkin.photos?.right || checkin.right || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
      notes: checkin.notes || ''
    });
    setStatusBanner(null);
    setIsModalOpen(true);
  };

  const [photoUploading, setPhotoUploading] = useState({
    photoFront: false,
    photoLeft: false,
    photoRight: false,
    photoBack: false
  });

  const handlePhotoUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(prev => ({ ...prev, [field]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
        if (data.success && data.fileUrl) {
          setForm(prev => ({ ...prev, [field]: data.fileUrl }));
          const labelMap = {
            photoFront: 'Front',
            photoBack: 'Back',
            photoLeft: 'Left side',
            photoRight: 'Right side'
          };
          toast.success(`${labelMap[field] || 'Progress'} view photo uploaded to Google Drive!`);
        } else {
          throw new Error(data.error || 'Upload returned failure status');
        }
      } catch (err) {
        toast.error(`Photo upload failed: ${err.message}`);
      } finally {
        setPhotoUploading(prev => ({ ...prev, [field]: false }));
      }
    };
  
    const handleSaveCheckin = async (e) => {
      e.preventDefault();
      setStatusBanner(null);
  
      if (!selectedClient) {
        const msg = 'Mandatory Field Missing: Please select a client first.';
        toast.warning(msg);
        setStatusBanner({ type: 'error', message: msg });
        return;
      }
      if (!form.date) {
        const msg = 'Mandatory Field Missing: Please select the check-in date.';
        toast.warning(msg);
        setStatusBanner({ type: 'error', message: msg });
        return;
      }
      if (!form.weight) {
        const msg = 'Mandatory Field Missing: Please enter body weight value.';
        toast.warning(msg);
        setStatusBanner({ type: 'error', message: msg });
        return;
      }
  
      setSaving(true);
      try {
        const selectedClientObj = clients.find(c => c.id === selectedClient);
        const data = {
          clientId: selectedClient,
          clientName: selectedClientObj?.displayName || selectedClientObj?.name || 'Client',
          date: form.date,
          weight: Number(form.weight) || 0,
          chest: Number(form.chest) || 0,
          waist: Number(form.waist) || 0,
          arms: Number(form.arms) || 0,
          legs: Number(form.legs) || 0,
          photoFront: form.photoFront,
          photoBack: form.photoBack,
          photoLeft: form.photoLeft,
          photoRight: form.photoRight,
          photoSide: form.photoLeft || form.photoRight || '',
          notes: form.notes,
          updatedAtStr: new Date().toISOString()
        };

      if (editingId) {
        await updateCheckin(editingId, data);
        toast.success('Body check-in report updated successfully!');
      } else {
        await submitCheckin(data);
        toast.success('New body check-in report saved successfully!');
      }
      setIsModalOpen(false);
      await loadCheckinHistory(selectedClient);
    } catch (err) {
      console.error(err);
      const errorMsg = `Save Error: ${err.message || 'Failed to save check-in details'}`;
      toast.error(errorMsg);
      setStatusBanner({ type: 'error', message: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCheckin = async (id) => {
    if (!confirm('Are you sure you want to delete this body check-in report?')) return;
    try {
      await deleteCheckin(id);
      toast.success('Check-in report deleted successfully');
      await loadCheckinHistory(selectedClient);
    } catch (err) {
      toast.error('Failed to delete check-in report');
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
              <TrendingUp size={22} color="var(--accent, #E00008)" />
            </div>
            <h1 style={styles.title}>Body Check-ins Management</h1>
          </div>
          <p style={{ color: 'var(--text-secondary, #AAAAAA)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Track client weight progress, physical measurements, and check-in photos
          </p>
        </div>
      </header>

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
              <Plus size={18} /> + Add Check-in
            </Button>
          )}
        </div>
      </Card>

      {/* History Grid */}
      {selectedClient ? (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: '#FFFFFF' }}>
            Check-in History for <span style={{ color: 'var(--accent, #E00008)' }}>{selectedClientObj?.displayName || selectedClientObj?.name || 'Client'}</span> ({checkinsList.length})
          </h2>

          {loading ? (
            <div style={styles.historyList}>
              {Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : checkinsList.length > 0 ? (
            <div style={styles.historyList}>
              {checkinsList.map((checkin) => (
                <Card key={checkin.id} style={styles.checkinCard} className="glass-card">
                  <div style={styles.checkinHeader}>
                    <div>
                      <h3 style={styles.date}>📅 Date: {checkin.date}</h3>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Updated: {checkin.updatedAtStr ? new Date(checkin.updatedAtStr).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div style={styles.weightBadge}>
                      ⚖️ {checkin.weight} kg
                    </div>
                  </div>

                  {/* Photo Display Grid */}
                  <div style={styles.photoGrid}>
                    <div style={styles.photoWrapper}>
                      <img src={checkin.photoFront || checkin.photos?.front || checkin.front || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80'} alt="Front View" style={styles.photo} />
                      <div style={styles.photoLabel}>Front View</div>
                    </div>
                    <div style={styles.photoWrapper}>
                      <img src={checkin.photoLeft || checkin.photoSide || checkin.photos?.left || checkin.photos?.side || checkin.left || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80'} alt="Left Side" style={styles.photo} />
                      <div style={styles.photoLabel}>Left Side</div>
                    </div>
                    <div style={styles.photoWrapper}>
                      <img src={checkin.photoRight || checkin.photos?.right || checkin.right || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80'} alt="Right Side" style={styles.photo} />
                      <div style={styles.photoLabel}>Right Side</div>
                    </div>
                    <div style={styles.photoWrapper}>
                      <img src={checkin.photoBack || checkin.photos?.back || checkin.back || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80'} alt="Back View" style={styles.photo} />
                      <div style={styles.photoLabel}>Back View</div>
                    </div>
                  </div>

                  {/* Measurements */}
                  <div style={styles.measurementsBar}>
                    <div style={styles.measureItem}>📏 Chest: <strong>{checkin.chest || 'N/A'} cm</strong></div>
                    <div style={styles.measureItem}>📏 Waist: <strong>{checkin.waist || 'N/A'} cm</strong></div>
                    <div style={styles.measureItem}>📏 Arms: <strong>{checkin.arms || 'N/A'} cm</strong></div>
                    <div style={styles.measureItem}>📏 Legs: <strong>{checkin.legs || 'N/A'} cm</strong></div>
                  </div>

                  {/* Notes */}
                  {checkin.notes && (
                    <div style={styles.notesBox}>
                      <strong>Trainer Feedback / Notes:</strong>
                      <p style={{ margin: '6px 0 0 0', fontStyle: 'italic', fontSize: '0.9rem' }}>
                        "{checkin.notes}"
                      </p>
                    </div>
                  )}

                  {/* Card Actions */}
                  <div style={styles.cardActions}>
                    <Button 
                      variant="outline" 
                      onClick={() => handleOpenEditModal(checkin)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Edit size={14} /> Edit Check-in
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleDeleteCheckin(checkin.id)}
                      style={{ color: '#ff1744', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <TrendingUp size={48} color="var(--text-muted, #666666)" />
              <h3 style={{ margin: '16px 0 6px', color: '#FFFFFF' }}>No Check-ins Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Click <strong>"+ Add Check-in"</strong> above to record a new body progress entry for {selectedClientObj?.displayName || 'this client'}.
              </p>
              <Button onClick={handleOpenAddModal}>+ Add Check-in Now</Button>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <TrendingUp size={48} color="var(--text-muted, #666666)" />
          <h3 style={{ margin: '16px 0 6px', color: '#FFFFFF' }}>Select a Client to View Body Check-ins</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Choose a client from the dropdown search above to view or update progress history.
          </p>
        </div>
      )}

      {/* POPUP MODAL: ADD / EDIT CHECK-IN */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? `Edit Check-in for ${selectedClientObj?.displayName || 'Client'}` : `Add New Check-in for ${selectedClientObj?.displayName || 'Client'}`}
        size="lg"
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

          <div style={styles.modalFormGrid}>
            <Input 
              type="date" 
              label="Check-in Date *" 
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <Input 
              type="number" 
              label="Body Weight (kg) *" 
              placeholder="e.g. 74.5"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
            />
            <Input 
              type="number" 
              label="Chest Circumference (cm)" 
              placeholder="e.g. 102"
              value={form.chest}
              onChange={(e) => setForm({ ...form, chest: e.target.value })}
            />
            <Input 
              type="number" 
              label="Waist Circumference (cm)" 
              placeholder="e.g. 84"
              value={form.waist}
              onChange={(e) => setForm({ ...form, waist: e.target.value })}
            />
            <Input 
              type="number" 
              label="Arms (cm)" 
              placeholder="e.g. 38"
              value={form.arms}
              onChange={(e) => setForm({ ...form, arms: e.target.value })}
            />
            <Input 
              type="number" 
              label="Legs / Thighs (cm)" 
              placeholder="e.g. 58"
              value={form.legs}
              onChange={(e) => setForm({ ...form, legs: e.target.value })}
            />
          </div>

          {/* Progress Photos Upload Zone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: 0, color: '#FFFFFF', fontSize: '0.95rem' }}>Progress Photos (Upload to Google Drive)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              
              {/* Front Photo */}
              <div style={{
                border: '2px dashed var(--border, #2a2a30)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #AAAAAA)', fontWeight: 600 }}>Front View</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  id="upload-front-admin" 
                  style={{ display: 'none' }}
                  onChange={(e) => handlePhotoUpload(e, 'photoFront')}
                  disabled={photoUploading.photoFront}
                />
                <label 
                  htmlFor="upload-front-admin"
                  style={{
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--border, #2a2a30)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    opacity: photoUploading.photoFront ? 0.6 : 1,
                    pointerEvents: photoUploading.photoFront ? 'none' : 'auto'
                  }}
                >
                  {photoUploading.photoFront ? (
                    <>
                      <Loader className="animate-spin" size={14} /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={14} color="var(--accent, #E00008)" /> Upload Front View
                    </>
                  )}
                </label>
                {form.photoFront && (
                  <span style={{ fontSize: '0.75rem', color: '#00c853', fontWeight: 600 }}>✓ Attached</span>
                )}
              </div>

              {/* Left Side Photo */}
              <div style={{
                border: '2px dashed var(--border, #2a2a30)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #AAAAAA)', fontWeight: 600 }}>Left Side</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  id="upload-left-admin" 
                  style={{ display: 'none' }}
                  onChange={(e) => handlePhotoUpload(e, 'photoLeft')}
                  disabled={photoUploading.photoLeft}
                />
                <label 
                  htmlFor="upload-left-admin"
                  style={{
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--border, #2a2a30)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    opacity: photoUploading.photoLeft ? 0.6 : 1,
                    pointerEvents: photoUploading.photoLeft ? 'none' : 'auto'
                  }}
                >
                  {photoUploading.photoLeft ? (
                    <>
                      <Loader className="animate-spin" size={14} /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={14} color="var(--accent, #E00008)" /> Upload Left Side
                    </>
                  )}
                </label>
                {form.photoLeft && (
                  <span style={{ fontSize: '0.75rem', color: '#00c853', fontWeight: 600 }}>✓ Attached</span>
                )}
              </div>

              {/* Right Side Photo */}
              <div style={{
                border: '2px dashed var(--border, #2a2a30)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #AAAAAA)', fontWeight: 600 }}>Right Side</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  id="upload-right-admin" 
                  style={{ display: 'none' }}
                  onChange={(e) => handlePhotoUpload(e, 'photoRight')}
                  disabled={photoUploading.photoRight}
                />
                <label 
                  htmlFor="upload-right-admin"
                  style={{
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--border, #2a2a30)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    opacity: photoUploading.photoRight ? 0.6 : 1,
                    pointerEvents: photoUploading.photoRight ? 'none' : 'auto'
                  }}
                >
                  {photoUploading.photoRight ? (
                    <>
                      <Loader className="animate-spin" size={14} /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={14} color="var(--accent, #E00008)" /> Upload Right Side
                    </>
                  )}
                </label>
                {form.photoRight && (
                  <span style={{ fontSize: '0.75rem', color: '#00c853', fontWeight: 600 }}>✓ Attached</span>
                )}
              </div>

              {/* Back Photo */}
              <div style={{
                border: '2px dashed var(--border, #2a2a30)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #AAAAAA)', fontWeight: 600 }}>Back View</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  id="upload-back-admin" 
                  style={{ display: 'none' }}
                  onChange={(e) => handlePhotoUpload(e, 'photoBack')}
                  disabled={photoUploading.photoBack}
                />
                <label 
                  htmlFor="upload-back-admin"
                  style={{
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--border, #2a2a30)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    opacity: photoUploading.photoBack ? 0.6 : 1,
                    pointerEvents: photoUploading.photoBack ? 'none' : 'auto'
                  }}
                >
                  {photoUploading.photoBack ? (
                    <>
                      <Loader className="animate-spin" size={14} /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={14} color="var(--accent, #E00008)" /> Upload Back View
                    </>
                  )}
                </label>
                {form.photoBack && (
                  <span style={{ fontSize: '0.75rem', color: '#00c853', fontWeight: 600 }}>✓ Attached</span>
                )}
              </div>

            </div>
          </div>

          <Textarea 
            label="Abnormalities / Notes / Progress Remarks" 
            placeholder="Feedback for the client or physical notes..." 
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCheckin} loading={saving} style={{ padding: '12px 28px' }}>
              <Save size={18} /> Save Check-in
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
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
  historyList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  checkinCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  checkinHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border, #2a2a30)', paddingBottom: '14px' },
  date: { margin: '0 0 4px 0', fontSize: '1.25rem', color: '#FFFFFF', fontWeight: 700 },
  weightBadge: {
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
    border: '1px solid rgba(0, 200, 83, 0.3)',
    color: '#00c853',
    fontWeight: 800,
    fontSize: '0.95rem',
    padding: '6px 16px',
    borderRadius: '20px',
  },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  photoWrapper: { position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border, #2a2a30)' },
  photo: { width: '100%', height: '240px', objectFit: 'cover', display: 'block' },
  photoLabel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', color: '#fff', padding: '6px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600 },
  measurementsBar: {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '10px',
    border: '1px solid var(--border, #2a2a30)',
  },
  measureItem: { fontSize: '0.85rem', color: 'var(--text-secondary)' },
  notesBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border, #2a2a30)',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '0.85rem',
  },
  cardActions: {
    display: 'flex',
    gap: '12px',
    borderTop: '1px solid var(--border, #2a2a30)',
    paddingTop: '14px',
  },
  modalFormGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
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
