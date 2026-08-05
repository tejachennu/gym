'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientBloodReports } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { Link as LinkIcon, Filter, Droplet } from 'lucide-react';

export default function BloodReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');

  // Date Filters (Default 1 Month)
  const defaultToDate = new Date().toISOString().split('T')[0];
  const defaultFromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);

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
    if (user?.uid) {
      getClientBloodReports(user.uid)
        .then(setReports)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div>;

  const filteredReports = reports.filter(r => {
    const rDate = r.date?.toDate ? r.date.toDate().toISOString().split('T')[0] : (r.date || '');
    if (fromDate && rDate && rDate < fromDate) return false;
    if (toDate && rDate && rDate > toDate) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '60px' }} className="animate-fade-up">
      <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 800, color: 'var(--text)' }}>🩸 Blood Test Reports</h2>
      
      {/* Date Filter */}
      <Card style={{ padding: '10px 12px' }} className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} color="var(--accent)" /> Date Filter:
          </span>
          <Input 
            type="date"
            label="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            containerStyle={{ flex: 1, minWidth: '120px' }}
          />
          <Input 
            type="date"
            label="To Date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            containerStyle={{ flex: 1, minWidth: '120px' }}
          />
          <Button variant="outline" size="sm" onClick={() => { setFromDate(defaultFromDate); setToDate(defaultToDate); }} style={{ alignSelf: 'flex-end' }}>
            Reset (1 Month)
          </Button>
        </div>
      </Card>

      {filteredReports.length === 0 ? (
        <EmptyState title="No Blood Reports Found" message="No reports match the selected date range." icon="🩸" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredReports.map((report, idx) => (
            <Card key={idx} style={{ padding: '12px' }} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{report.testName || 'Comprehensive Panel'}</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    📅 {new Date(report.date?.toDate?.() || report.date).toLocaleDateString()}
                  </p>
                </div>
                {report.abnormalities?.length > 0 && (
                  <Badge style={{ backgroundColor: 'rgba(255, 214, 0, 0.2)', color: 'var(--warning)', fontSize: '0.7rem' }}>Alerts</Badge>
                )}
              </div>

              {report.description && (
                <p style={{ fontSize: '0.8rem', marginBottom: '10px', color: 'var(--text)' }}>{report.description}</p>
              )}

              {report.fileUrl && (
                <Button 
                  onClick={() => {
                    setViewerUrl(report.fileUrl);
                    setIsViewerOpen(true);
                  }}
                  size="sm"
                  style={{ width: '100%' }}
                >
                  📄 View Full Report
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

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
