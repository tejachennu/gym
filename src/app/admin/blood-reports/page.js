'use client';

import { useState, useEffect } from 'react';
import { 
  getAllClients, 
  getClientBloodReports, 
  uploadBloodReport, 
  updateBloodReport, 
  deleteBloodReport 
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
  Heart, 
  Plus, 
  Trash2, 
  Save, 
  Calendar, 
  Edit, 
  FileText, 
  Link as LinkIcon,
  Upload,
  Loader
} from 'lucide-react';

export default function BloodReportsPage() {
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reportName: '',
    fileUrl: '',
    notes: ''
  });

   const [statusBanner, setStatusBanner] = useState(null);
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
      loadBloodReports(selectedClient);
    } else {
      setReportsList([]);
    }
  }, [selectedClient]);

  const loadBloodReports = async (clientId) => {
    try {
      setLoading(true);
      const history = await getClientBloodReports(clientId);
      setReportsList(history || []);
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
      reportName: '',
      fileUrl: '',
      notes: ''
    });
    setStatusBanner(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (report) => {
    setEditingId(report.id);
    setForm({
      date: report.date || new Date().toISOString().split('T')[0],
      reportName: report.reportName || '',
      fileUrl: report.fileUrl || '',
      notes: report.notes || ''
    });
    setStatusBanner(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatusBanner(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success && data.fileUrl) {
        setForm(prev => ({ ...prev, fileUrl: data.fileUrl }));
        if (data.local) {
          toast.info(`Local Fallback: Saved "${file.name}" locally inside /public/uploads/`);
        } else {
          toast.success(`File "${file.name}" uploaded to Google Drive!`);
        }
      } else {
        throw new Error(data.error || 'Upload returned unsuccessful status');
      }
    } catch (err) {
      console.error('File upload failure:', err);
      toast.error(`Upload failed: ${err.message}`);
      setStatusBanner({ type: 'error', message: `Upload failed: ${err.message}` });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveReport = async (e) => {
    e.preventDefault();
    setStatusBanner(null);

    if (!selectedClient) {
      const msg = 'Mandatory Field Missing: Please select a client first.';
      toast.warning(msg);
      setStatusBanner({ type: 'error', message: msg });
      return;
    }
    if (!form.reportName.trim()) {
      const msg = 'Mandatory Field Missing: Please enter the test name.';
      toast.warning(msg);
      setStatusBanner({ type: 'error', message: msg });
      return;
    }
    if (!form.date) {
      const msg = 'Mandatory Field Missing: Please enter the test date.';
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
        reportName: form.reportName.trim(),
        fileUrl: form.fileUrl.trim(),
        notes: form.notes.trim(),
        updatedAtStr: new Date().toISOString()
      };

      if (editingId) {
        await updateBloodReport(editingId, data);
        toast.success('Blood report details updated successfully!');
      } else {
        await uploadBloodReport(data);
        toast.success('New blood report details saved successfully!');
      }
      setIsModalOpen(false);
      await loadBloodReports(selectedClient);
    } catch (err) {
      console.error(err);
      const errorMsg = `Save Error: ${err.message || 'Failed to save blood report details'}`;
      toast.error(errorMsg);
      setStatusBanner({ type: 'error', message: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!confirm('Are you sure you want to delete this blood report entry?')) return;
    try {
      await deleteBloodReport(id);
      toast.success('Blood report entry deleted successfully');
      await loadBloodReports(selectedClient);
    } catch (err) {
      toast.error('Failed to delete blood report');
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
              <Heart size={22} color="var(--accent, #E00008)" />
            </div>
            <h1 style={styles.title}>Blood Reports Management</h1>
          </div>
          <p style={{ color: 'var(--text-secondary, #AAAAAA)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Monitor client health vitals, hormone panels, and blood biomarkers
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
              <Plus size={18} /> + Add Blood Report
            </Button>
          )}
        </div>
      </Card>

      {/* History Grid */}
      {selectedClient ? (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: '#FFFFFF' }}>
            Blood Reports for <span style={{ color: 'var(--accent, #E00008)' }}>{selectedClientObj?.displayName || selectedClientObj?.name || 'Client'}</span> ({reportsList.length})
          </h2>

          {loading ? (
            <div style={styles.historyList}>
              {Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : reportsList.length > 0 ? (
            <div style={styles.historyList}>
              {reportsList.map((report) => (
                <Card key={report.id} style={styles.reportCard} className="glass-card">
                  <div style={styles.reportHeader}>
                    <div>
                      <h3 style={styles.reportTitle}>📋 {report.reportName}</h3>
                      <p style={styles.reportDate}>
                        📅 Date: <strong>{report.date}</strong>
                      </p>
                    </div>
                    <Badge variant="danger">BLOOD TEST</Badge>
                  </div>

                  {/* Notes / Abnormalities */}
                  <div style={styles.abnormalitiesBox}>
                    <strong style={{ color: 'var(--accent, #E00008)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={16} /> Key Notes & Vital Markers:
                    </strong>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', lineHeight: 1.4, color: '#FFFFFF' }}>
                      {report.notes || 'No notes added for this report.'}
                    </p>
                  </div>

                  {/* PDF attachment */}
                  {report.fileUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <LinkIcon size={14} color="var(--accent, #E00008)" />
                      <button 
                        type="button"
                        onClick={() => {
                          setViewerUrl(report.fileUrl);
                          setIsViewerOpen(true);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent, #E00008)',
                          fontWeight: 600,
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '0.85rem'
                        }}
                      >
                        View Attached Lab PDF / Image
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={styles.cardActions}>
                    <Button 
                      variant="outline" 
                      onClick={() => handleOpenEditModal(report)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Edit size={14} /> Edit Entry
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleDeleteReport(report.id)}
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
              <Heart size={48} color="var(--text-muted, #666666)" />
              <h3 style={{ margin: '16px 0 6px', color: '#FFFFFF' }}>No Blood Reports Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Click <strong>"+ Add Blood Report"</strong> above to record a new biomarker entry for {selectedClientObj?.displayName || 'this client'}.
              </p>
              <Button onClick={handleOpenAddModal}>+ Add Blood Report Now</Button>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <Heart size={48} color="var(--text-muted, #666666)" />
          <h3 style={{ margin: '16px 0 6px', color: '#FFFFFF' }}>Select a Client to View Blood Reports</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Choose a client from the dropdown search above to view biomarker or hormone panel history.
          </p>
        </div>
      )}

      {/* POPUP MODAL: ADD / EDIT REPORT */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? `Edit Blood Report for ${selectedClientObj?.displayName || 'Client'}` : `Upload New Blood Report for ${selectedClientObj?.displayName || 'Client'}`}
        size="lg"
      >
        <form onSubmit={handleSaveReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              <button type="button" onClick={() => setStatusBanner(null)} style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer' }}>✕</button>
            </div>
          )}

          <div style={styles.modalFormGrid}>
            <Input 
              label="Test Name *" 
              placeholder="e.g. CBC with Lipid Profile"
              value={form.reportName}
              onChange={(e) => setForm({ ...form, reportName: e.target.value })}
              required
            />
            <Input 
              type="date" 
              label="Test Date *" 
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          {/* File Attachment Status / Input */}
          {form.fileUrl ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              backgroundColor: 'rgba(0, 200, 83, 0.08)',
              border: '1px solid rgba(0, 200, 83, 0.25)',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              fontWeight: 500
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#00c853" />
                <span>Document Attachment Ready</span>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, fileUrl: '' }))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff1744',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <Input 
              label="File Attachment Link (PDF / Image URL)" 
              placeholder="e.g. Paste link or upload file below..."
              value={form.fileUrl}
              onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            />
          )}

          {/* File Upload Zone */}
          <div style={{
            border: '2px dashed var(--border, #2a2a30)',
            borderRadius: '12px',
            padding: '24px 16px',
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #AAAAAA)' }}>
              Or upload lab report directly from your device (PDF / JPG / PNG)
            </span>
            <input 
              type="file" 
              accept=".pdf,image/*" 
              onChange={handleFileUpload} 
              id="report-file-upload" 
              style={{ display: 'none' }}
              disabled={uploading}
            />
            <label 
              htmlFor="report-file-upload"
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid var(--border, #2a2a30)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                opacity: uploading ? 0.6 : 1,
                pointerEvents: uploading ? 'none' : 'auto'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
            >
              {uploading ? (
                <>
                  <Loader className="animate-spin" size={16} /> Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} color="var(--accent, #E00008)" /> Upload Lab Document
                </>
              )}
            </label>
            {form.fileUrl && (
              <span style={{ fontSize: '0.85rem', color: '#00c853', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                ✓ File uploaded successfully!
              </span>
            )}
          </div>

          <Textarea 
            label="Abnormalities / Biomarker Remarks" 
            placeholder="e.g. Vitamin D: 22 ng/mL (Low), Fasting Glucose: 110 mg/dL (Elevated)..." 
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={4}
          />

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} style={{ padding: '12px 28px' }}>
              <Save size={18} /> Save Blood Report
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
                <LinkIcon size={16} /> Open in New Tab
              </a>
            )}
            <Button onClick={() => setIsViewerOpen(false)}>Close Preview</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  headerIconWrapper: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(224, 0, 8, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(224, 0, 8, 0.2)',
  },
  title: { fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  reportCard: { padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' },
  reportHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border, #2a2a30)', paddingBottom: '10px' },
  reportTitle: { margin: 0, fontSize: '1.05rem', color: '#FFFFFF', fontWeight: 700 },
  reportDate: { margin: '2px 0 0 0', color: 'var(--text-secondary, #AAAAAA)', fontSize: '0.78rem' },
  abnormalitiesBox: { backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border, #2a2a30)' },
  cardActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    borderTop: '1px solid var(--border, #2a2a30)',
    paddingTop: '12px',
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
