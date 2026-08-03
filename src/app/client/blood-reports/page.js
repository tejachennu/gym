'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientBloodReports } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { FileText, Link as LinkIcon } from 'lucide-react';

export default function BloodReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
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
    if (user?.uid) {
      getClientBloodReports(user.uid)
        .then(setReports)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spinner /></div>;

  if (reports.length === 0) {
    return <EmptyState title="No Blood Reports" message="You haven't uploaded any blood reports yet." icon="🩸" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Blood Reports</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {reports.map((report, idx) => (
          <Card key={idx} style={{ padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{report.testName || 'Comprehensive Panel'}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {new Date(report.date?.toDate() || report.date).toLocaleDateString()}
                </p>
              </div>
              {report.abnormalities?.length > 0 && (
                <Badge style={{ backgroundColor: 'rgba(255, 214, 0, 0.2)', color: 'var(--warning)' }}>Alerts</Badge>
              )}
            </div>

            {report.description && (
              <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>{report.description}</p>
            )}

            {report.abnormalities?.length > 0 && (
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(255, 214, 0, 0.05)', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--warning)', display: 'block', marginBottom: '5px' }}>Key Findings:</strong>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem' }}>
                  {report.abnormalities.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}

            {report.fileUrl && (
              <Button 
                onClick={() => {
                  setViewerUrl(report.fileUrl);
                  setIsViewerOpen(true);
                }}
                style={{ width: '100%', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
              >
                📄 View Full Report
              </Button>
            )}
          </Card>
        ))}
      </div>

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
