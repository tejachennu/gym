'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getClientDailyLogs, 
  getClientCheckins, 
  getClientMeasurements, 
  getClientBloodReports,
  getClientPlans,
  getClientById,
  queryDocuments
} from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Loading';
import { 
  History as HistoryIcon, 
  Calendar, 
  Activity, 
  FileText, 
  Scale, 
  Droplets, 
  Eye, 
  Filter, 
  Camera,
  Layers,
  Moon,
  Zap,
  Smile,
  Dumbbell,
  CheckCircle2,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function getDirectImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  const driveRegex = /(?:id=|\/d\/|file\/d\/)([a-zA-Z0-9_-]{25,})/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  return url;
}

export default function ClientHistoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Date filters defaulting to 1 month (30 days up to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultFromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(todayStr);

  const [clientPlansHistory, setClientPlansHistory] = useState([]);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState('all');

  const [allSubmissions, setAllSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (user?.uid) {
      loadHistory();
    }
  }, [user]);

  useEffect(() => {
    filterData();
  }, [fromDate, toDate, allSubmissions]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const profileData = await getClientById(user.uid);
      const userEmail = user?.email || profileData?.email || '';

      const [logsByUid, logsByEmail, chkByUid, chkByEmail, bloodByUid, bloodByEmail, cPlans] = await Promise.all([
        queryDocuments("DailyLogs", [{ field: "clientId", operator: "==", value: user.uid }]),
        userEmail ? queryDocuments("DailyLogs", [{ field: "clientEmail", operator: "==", value: userEmail }]) : [],
        queryDocuments("BodyCheckins", [{ field: "clientId", operator: "==", value: user.uid }]),
        userEmail ? queryDocuments("BodyCheckins", [{ field: "clientEmail", operator: "==", value: userEmail }]) : [],
        queryDocuments("BloodReports", [{ field: "clientId", operator: "==", value: user.uid }]),
        userEmail ? queryDocuments("BloodReports", [{ field: "clientEmail", operator: "==", value: userEmail }]) : [],
        getClientPlans(user.uid)
      ]);

      // Deduplicate Logs
      const rawLogs = [...logsByUid, ...logsByEmail];
      const uniqueLogsMap = new Map();
      rawLogs.forEach(l => uniqueLogsMap.set(l.id || l.date, l));
      const logs = Array.from(uniqueLogsMap.values());

      // Deduplicate Checkins
      const rawChk = [...chkByUid, ...chkByEmail];
      const uniqueChkMap = new Map();
      rawChk.forEach(c => uniqueChkMap.set(c.id || (c.date + '_' + (c.createdAt?.seconds || '')), c));
      const checkins = Array.from(uniqueChkMap.values());

      // Deduplicate Blood Reports
      const rawBlood = [...bloodByUid, ...bloodByEmail];
      const uniqueBloodMap = new Map();
      rawBlood.forEach(b => uniqueBloodMap.set(b.id, b));
      const bloodReports = Array.from(uniqueBloodMap.values());

      let combinedPlans = profileData?.planHistory || [];
      if (combinedPlans.length === 0 && cPlans?.length > 0) {
        combinedPlans = cPlans;
      } else if (combinedPlans.length === 0 && profileData?.currentPlan) {
        combinedPlans = [{
          id: 'current',
          planName: profileData.currentPlan,
          planStart: profileData.planStart,
          planExpiry: profileData.planExpiry,
          status: 'active'
        }];
      }
      setClientPlansHistory(combinedPlans);

      const items = [];

      logs.forEach(item => {
        items.push({
          id: item.id || `log-${item.date}`,
          category: 'Daily Tracking',
          icon: Activity,
          color: '#29b6f6',
          date: item.date || item.createdAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          title: `Daily Activity Log (${item.date || 'Entry'})`,
          details: item
        });
      });

      checkins.forEach(item => {
        const itemDate = item.date || (item.createdAt?.toDate ? item.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        items.push({
          id: item.id || `chk-${itemDate}`,
          category: '10-Day Check-in',
          icon: Camera,
          color: 'var(--accent, #E00008)',
          date: itemDate,
          title: `10-Day Posture & Sizing Check-in`,
          details: item
        });
      });

      bloodReports.forEach(item => {
        const itemDate = item.date || (item.createdAt?.toDate ? item.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        items.push({
          id: item.id || `blood-${itemDate}`,
          category: 'Blood Report',
          icon: Droplets,
          color: '#ff1744',
          date: itemDate,
          title: `Blood Test Report (${item.reportName || 'Report'})`,
          details: item
        });
      });

      items.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAllSubmissions(items);
    } catch (err) {
      console.error('Error loading client history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelectChange = (val) => {
    setSelectedPlanIndex(val);
    setCurrentPage(1);
    if (val === 'all') {
      setFromDate(defaultFromDate);
      setToDate(todayStr);
    } else {
      const idx = Number(val);
      const planItem = clientPlansHistory[idx];
      if (planItem && planItem.planStart && planItem.planExpiry) {
        setFromDate(planItem.planStart);
        setToDate(planItem.planExpiry);
      }
    }
  };

  const filterData = () => {
    setCurrentPage(1);
    if (!fromDate && !toDate) {
      setFilteredSubmissions(allSubmissions);
      return;
    }

    const filtered = allSubmissions.filter(item => {
      if (fromDate && item.date < fromDate) return false;
      if (toDate && item.date > toDate) return false;
      return true;
    });

    setFilteredSubmissions(filtered);
  };

  const handleResetFilter = () => {
    setSelectedPlanIndex('all');
    setFromDate(defaultFromDate);
    setToDate(todayStr);
    setCurrentPage(1);
  };

  const handleShowAllDates = () => {
    setSelectedPlanIndex('all');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  // Pagination Calculations
  const totalItems = filteredSubmissions.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

  // Render Human-Readable Submission Details Component
  const renderItemDetails = (item) => {
    const d = item.details || {};

    if (item.category === 'Daily Tracking') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Key Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <Card style={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>👟 Daily Steps</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4dabf7', marginTop: '2px' }}>
                {d.steps ? Number(d.steps).toLocaleString() : 0} steps
              </div>
            </Card>

            <Card style={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>💧 Water Intake</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0288d1', marginTop: '2px' }}>
                {d.water || 0} Litres
              </div>
            </Card>

            <Card style={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>😴 Sleep Duration & Quality</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#7c4dff', marginTop: '2px' }}>
                {d.sleepHours || 0} hrs <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>({d.sleepQuality || 'Good'})</span>
              </div>
            </Card>

            <Card style={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>🏋️ Workout Weight Lifted</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00c853', marginTop: '2px' }}>
                {d.workoutWeight ? `${d.workoutWeight} kg` : 'None'}
              </div>
            </Card>
          </div>

          {/* Energy & Mood */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <Card style={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>⚡ Energy Level</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                {d.energyLevel || 'Medium'}
              </div>
            </Card>

            <Card style={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>😁 Mood</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                {d.mood || 'Good'}
              </div>
            </Card>
          </div>

          {/* Notes */}
          {d.dailyNotes && (
            <Card style={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>
                📝 Daily Wellness Notes / Remarks:
              </div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.5 }}>
                {d.dailyNotes}
              </div>
            </Card>
          )}

          {/* Treadmill Photo */}
          {d.treadmillPhoto && (
            <Card style={{ padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
                📸 Treadmill / Proof Photo:
              </div>
              <img 
                src={getDirectImageUrl(d.treadmillPhoto)} 
                alt="Treadmill proof" 
                style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} 
              />
            </Card>
          )}
        </div>
      );
    }

    if (item.category === '10-Day Check-in' || item.category === 'Weekly Check-in') {
      const photos = d.photos || {};
      const m = d.measurements || {};
      const hasPhotos = photos.front || photos.back || photos.left || photos.right || photos.treadmillWheel;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Posture Photos Stream */}
          {hasPhotos && (
            <div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent)', margin: '0 0 8px 0' }}>
                📸 10-Day Body Posture Photos:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {['front', 'back', 'left', 'right', 'treadmillWheel'].map(side => {
                  const pUrl = photos[side];
                  if (!pUrl) return null;
                  return (
                    <Card key={side} style={{ padding: '6px', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'capitalize', marginBottom: '4px' }}>
                        {side} View
                      </div>
                      <img 
                        src={getDirectImageUrl(pUrl)} 
                        alt={`${side} posture`} 
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} 
                      />
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Measurements Grid */}
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#00c853', margin: '0 0 8px 0' }}>
              📐 Body Sizing Measurements:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {m.weight && <div style={styles.metricPill}><span>Weight</span><strong>{m.weight} kg</strong></div>}
              {m.waist && <div style={styles.metricPill}><span>Waist</span><strong>{m.waist} in</strong></div>}
              {m.chest && <div style={styles.metricPill}><span>Chest</span><strong>{m.chest} in</strong></div>}
              {m.stomach && <div style={styles.metricPill}><span>Stomach</span><strong>{m.stomach} in</strong></div>}
              {m.neck && <div style={styles.metricPill}><span>Neck</span><strong>{m.neck} in</strong></div>}
              {m.shoulder && <div style={styles.metricPill}><span>Shoulder</span><strong>{m.shoulder} in</strong></div>}
              {m.rBicep && <div style={styles.metricPill}><span>R Bicep</span><strong>{m.rBicep} in</strong></div>}
              {m.lBicep && <div style={styles.metricPill}><span>L Bicep</span><strong>{m.lBicep} in</strong></div>}
              {m.rThigh && <div style={styles.metricPill}><span>R Thigh</span><strong>{m.rThigh} in</strong></div>}
            </div>
          </div>

          {/* Coach Review Remarks */}
          {d.reviewed && (
            <Card style={{ padding: '10px', backgroundColor: 'rgba(0, 200, 83, 0.12)', border: '1px solid rgba(0, 200, 83, 0.3)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#00c853', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Reviewed by Head Coach Radha Krishna Maram
              </div>
              <div style={{ fontSize: '0.8rem', color: '#FFFFFF', marginTop: '4px' }}>
                {d.remarks || 'Check-in reviewed successfully.'}
              </div>
            </Card>
          )}
        </div>
      );
    }

    if (item.category === 'Blood Report') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Card style={{ padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
              📄 {d.reportName || 'Blood Test Report'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Date Uploaded: {item.date}
            </div>
            {d.notes && (
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', marginTop: '8px' }}>
                <strong>Notes:</strong> {d.notes}
              </div>
            )}

            {d.fileUrl && (
              <a 
                href={d.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', padding: '8px 16px', backgroundColor: 'var(--accent)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700 }}
              >
                <ExternalLink size={14} /> View / Download Full Report File
              </a>
            )}
          </Card>
        </div>
      );
    }

    // Default Fallback formatted fields
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Object.entries(d)
          .filter(([key]) => !['id', 'clientId', 'clientEmail', 'createdAt', 'updatedAt', 'seconds', 'nanoseconds'].includes(key))
          .map(([key, val]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
              <strong style={{ color: '#FFFFFF' }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</strong>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '80px' }} className="animate-fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HistoryIcon size={18} color="var(--accent)" /> Client History & Submissions
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            View previous logs, 10-day posture photos, and past plan history.
          </p>
        </div>
      </div>

      {/* PLAN HISTORY SWITCHER BAR */}
      {clientPlansHistory.length > 0 && (
        <Card style={{ padding: '10px 14px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent, #E00008)' }}>
              <Layers size={16} /> Filter By Membership Plan:
            </div>

            <select
              value={selectedPlanIndex}
              onChange={(e) => handlePlanSelectChange(e.target.value)}
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--card)',
                color: 'var(--text)',
                border: '1px solid var(--accent)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <option value="all">🌐 All Plans / Full Timeline</option>
              {clientPlansHistory.map((pItem, idx) => (
                <option key={idx} value={idx}>
                  {idx === 0 ? '🟢 Active Plan: ' : '📁 Past Plan: '}{pItem.planName || pItem.name} ({pItem.planStart || 'Start'} to {pItem.planExpiry || 'Expiry'})
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {/* Date Filter Bar */}
      <Card style={{ padding: '10px 14px' }} className="glass-card">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' }}>
            <Filter size={14} color="var(--accent)" /> Date Range (Default 1 Month):
          </div>
          <div style={{ flex: 1, minWidth: '130px' }}>
            <Input 
              type="date" 
              label="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: '130px' }}>
            <Input 
              type="date" 
              label="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetFilter}
            style={{ alignSelf: 'flex-end' }}
          >
            Reset (1 Month)
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShowAllDates}
            style={{ alignSelf: 'flex-end', color: 'var(--accent)' }}
          >
            Clear Dates (All Time)
          </Button>
        </div>
      </Card>

      {/* Submissions List & Pagination Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '0 4px' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
          {totalItems > 0 ? `Showing ${startIndex + 1} - ${endIndex} of ${totalItems} record(s)` : '0 records found'}
        </div>

        {totalItems > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--card)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : filteredSubmissions.length === 0 ? (
        <Card style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div>No records or submissions found for the selected date range ({fromDate || 'Start'} to {toDate || 'Today'}).</div>
          <Button variant="outline" size="sm" onClick={handleShowAllDates} style={{ marginTop: '12px' }}>
            Show All Historical Submissions (All Dates)
          </Button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {paginatedSubmissions.map(item => {
            const Icon = item.icon;
            return (
              <Card 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' }}
                className="glass-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={item.color} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span>🗓️ {item.date}</span>
                      <span>•</span>
                      <span>Category: {item.category}</span>
                    </div>
                  </div>
                </div>

                <Button size="sm" variant="ghost" style={{ flexShrink: 0 }}>
                  <Eye size={14} /> View
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Footer Controls */}
      {totalItems > pageSize && (
        <Card style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} /> Previous
          </Button>

          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' }}>
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next <ChevronRight size={14} />
          </Button>
        </Card>
      )}

      {/* Detail View Modal */}
      {selectedItem && (
        <Modal 
          isOpen={!!selectedItem} 
          onClose={() => setSelectedItem(null)} 
          title={selectedItem.title}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              Submission Date: <strong>{selectedItem.date}</strong> | Category: <strong>{selectedItem.category}</strong>
            </div>

            {renderItemDetails(selectedItem)}
          </div>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  metricPill: {
    padding: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    fontSize: '0.72rem',
    color: 'var(--text-secondary)',
    gap: '2px'
  }
};
