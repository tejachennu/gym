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
  Edit, 
  FileText, 
  Link as LinkIcon,
  Upload,
  Loader,
  Filter,
  Send
} from 'lucide-react';

export default function BloodReportsPage() {
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Date Filters (Default 1 Month)
  const defaultToDate = new Date().toISOString().split('T')[0];
  const defaultFromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
        toast.success(`File "${file.name}" uploaded successfully!`);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveReport = async (e) => {
    e.preventDefault();
    setStatusBanner(null);

    if (!selectedClient) {
      return toast.warning('Please select a client first.');
    }
    if (!form.reportName.trim()) {
      return toast.warning('Please enter the test name.');
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
        toast.success('Blood report submitted successfully!');
      } else {
        await uploadBloodReport(data);
        toast.success('New blood report submitted successfully!');
      }
      setIsModalOpen(false);
      await loadBloodReports(selectedClient);
    } catch (err) {
      console.error(err);
      toast.error(err);
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

  const filteredReportsList = reportsList.filter(r => {
    const rDate = r.date || '';
    if (fromDate && rDate && rDate < fromDate) return false;
    if (toDate && rDate && rDate > toDate) return false;
    return true;
  });

  return (
    <div style={styles.container} className="animate-fade-up">
      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={styles.headerIconWrapper}>
              <Heart size={18} color="var(--accent, #E00008)" />
            </div>
            <h1 style={styles.title}>Blood Reports Management</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0 0', fontSize: '0.78rem' }}>
            Monitor client health vitals, hormone panels, and blood biomarkers
          </p>
        </div>
      </header>

      {/* Client Selector & Date Filter Bar */}
      <Card style={{ padding: '12px' }} className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ flex: 1, minWidth: '220px', maxWidth: '400px' }}>
            <SearchableSelect 
              label="Search & Select Client *"
              placeholder="Type name, phone, or email..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--accent)" />
            <Input 
              type="date" 
              label="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ width: '130px' }}
            />
            <Input 
              type="date" 
              label="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ width: '130px' }}
            />
            <Button variant="outline" size="sm" onClick={() => { setFromDate(defaultFromDate); setToDate(defaultToDate); }} style={{ alignSelf: 'flex-end' }}>
              Reset
            </Button>
          </div>

          {selectedClient && (
            <Button onClick={handleOpenAddModal} size="sm">
              <Plus size={14} /> Submit Blood Report
            </Button>
          )}
        </div>
      </Card>

      {/* History Grid */}
      {selectedClient ? (
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text)' }}>
            Blood Reports for <span style={{ color: 'var(--accent, #E00008)' }}>{selectedClientObj?.displayName || selectedClientObj?.name || 'Client'}</span> ({filteredReportsList.length})
          </h2>

          {loading ? (
            <div style={styles.historyList}>
              {Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : filteredReportsList.length > 0 ? (
            <div style={styles.historyList}>
              {filteredReportsList.map((report) => (
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

                  <div style={styles.abnormalitiesBox}>
                    <strong style={{ color: 'var(--accent, #E00008)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                      <FileText size={14} /> Key Notes & Vital Markers:
                    </strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--text)' }}>
                      {report.notes || 'No notes added for this report.'}
                    </p>
                  </div>

                  {report.fileUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                      <LinkIcon size={12} color="var(--accent, #E00008)" />
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
                          fontSize: '0.78rem'
                        }}
                      >
                        View Attached Lab PDF / Image
                      </button>
                    </div>
                  )}

                  <div style={styles.cardActions}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenEditModal(report)}
                    >
                      <Edit size={12} /> Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteReport(report.id)}
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={12} /> Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Heart size={36} color="var(--text-muted)" />
              <h3 style={{ margin: '10px 0 4px', color: 'var(--text)' }}>No Blood Reports Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '12px' }}>
                Click <strong>"Submit Blood Report"</strong> to record a report for {selectedClientObj?.displayName || 'this client'}.
              </p>
              <Button onClick={handleOpenAddModal} size="sm">Submit Blood Report</Button>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <Heart size={36} color="var(--text-muted)" />
          <h3 style={{ margin: '10px 0 4px', color: 'var(--text)' }}>Select a Client to View Blood Reports</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            Choose a client from the dropdown search above to view biomarker or hormone panel history.
          </p>
        </div>
      )}

      {/* POPUP MODAL: ADD / EDIT REPORT */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? `Edit Blood Report for ${selectedClientObj?.displayName || 'Client'}` : `Submit Blood Report for ${selectedClientObj?.displayName || 'Client'}`}
        size="lg"
      >
        <form onSubmit={handleSaveReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

          <Input 
            label="File Attachment Link (PDF / Image URL)" 
            placeholder="Paste link or upload below..."
            value={form.fileUrl}
            onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
          />

          <div style={{
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            padding: '14px',
            textAlign: 'center',
            backgroundColor: 'var(--card-hover)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
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
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
                color: 'var(--text)',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              {uploading ? <Loader className="animate-spin" size={14} /> : <Upload size={14} color="var(--accent)" />}
              {uploading ? 'Uploading...' : 'Upload Document'}
            </label>
          </div>

          <Textarea 
            label="Abnormalities / Biomarker Remarks" 
            placeholder="e.g. Vitamin D: 22 ng/mL (Low)..." 
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              <Send size={14} /> Submit Blood Report
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          {viewerUrl && (
            isImageUrl(viewerUrl) ? (
              <img 
                src={viewerUrl} 
                alt="Attached Lab Document" 
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '8px' }} 
              />
            ) : (
              <iframe 
                src={getEmbedUrl(viewerUrl)} 
                style={{ width: '100%', height: '60vh', borderRadius: '8px', border: '1px solid var(--border)' }} 
                allow="autoplay"
              />
            )
          )}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: '6px', alignItems: 'center' }}>
            {viewerUrl && (
              <a 
                href={viewerUrl} 
                target="_blank" 
                rel="noreferrer" 
                style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'underline' }}
              >
                <LinkIcon size={14} /> Open in New Tab
              </a>
            )}
            <Button onClick={() => setIsViewerOpen(false)} size="sm">Close Preview</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '12px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' },
  headerIconWrapper: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'var(--accent-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  reportCard: { padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' },
  reportHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '8px' },
  reportTitle: { margin: 0, fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700 },
  reportDate: { margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.72rem' },
  abnormalitiesBox: { backgroundColor: 'var(--card-hover)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' },
  cardActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    borderTop: '1px solid var(--border)',
    paddingTop: '8px',
  },
  modalFormGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
  },
  emptyState: {
    padding: '40px 16px',
    textAlign: 'center',
    backgroundColor: 'var(--card)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    width: '100%',
  },
};
