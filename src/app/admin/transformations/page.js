'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllClients, getDocuments } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Avatar, { getDirectImageUrl } from '@/components/ui/Avatar';
import { 
  Camera, 
  Search, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  TrendingDown, 
  TrendingUp, 
  User, 
  Filter, 
  Sparkles, 
  ArrowRight,
  Maximize2,
  RefreshCw,
  Grid,
  Square,
  BarChart3,
  Award,
  Flame,
  Zap,
  Target,
  Scale,
  Clock,
  Activity,
  CheckCircle2,
  Dumbbell
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ANGLE_LABELS = {
  front: { title: 'Front View Image', icon: '📸', tag: 'FRONT' },
  back: { title: 'Back View Image', icon: '📸', tag: 'BACK' },
  right: { title: 'Right Side Image', icon: '📸', tag: 'RIGHT' },
  left: { title: 'Left Side Image', icon: '📸', tag: 'LEFT' }
};

export default function TransformationsPage() {
  const [clients, setClients] = useState([]);
  const [allCheckins, setAllCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Tab & View Modes
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'analytics'
  const [selectedAngle, setSelectedAngle] = useState('front'); // 'front' | 'back' | 'right' | 'left'
  const [viewMode, setViewMode] = useState('single'); // 'single' toggle frame or 'grid'
  const [afterMonthIndex, setAfterMonthIndex] = useState(0); // Index for After month
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientList, checkinsList, dailyLogsList] = await Promise.all([
        getAllClients(),
        getDocuments('BodyCheckins'),
        getDocuments('DailyLogs')
      ]);

      // Normalize checkins from both BodyCheckins and DailyLogs collections
      const normalizedCheckins = [];

      checkinsList.forEach(chk => {
        const photos = chk.photos || chk.posturePhotos || {};
        if (photos.front || photos.back || photos.left || photos.right) {
          normalizedCheckins.push({
            id: chk.id,
            clientId: chk.clientId || chk.userId,
            clientEmail: chk.clientEmail || chk.userEmail,
            date: chk.date || (chk.createdAt?.toDate ? chk.createdAt.toDate().toISOString().split('T')[0] : '2026-01-01'),
            photos: photos,
            measurements: chk.measurements || chk.sizing || {},
            notes: chk.notes || chk.feedback || ''
          });
        }
      });

      dailyLogsList.forEach(log => {
        const photos = log.photos || log.posturePhotos || {};
        if (photos.front || photos.back || photos.left || photos.right) {
          const exists = normalizedCheckins.some(c => c.id === log.id || (c.clientId === log.clientId && c.date === log.date));
          if (!exists) {
            normalizedCheckins.push({
              id: log.id,
              clientId: log.clientId || log.userId,
              clientEmail: log.clientEmail,
              date: log.date || (log.createdAt?.toDate ? log.createdAt.toDate().toISOString().split('T')[0] : '2026-01-01'),
              photos: photos,
              measurements: log.sizing || log.measurements || {},
              notes: log.trainerFeedback || ''
            });
          }
        }
      });

      // Sort checkins chronologically (oldest first)
      normalizedCheckins.sort((a, b) => new Date(a.date) - new Date(b.date));

      setClients(clientList || []);
      setAllCheckins(normalizedCheckins);

      // Auto select first client with checkins if none selected
      if (clientList.length > 0) {
        const clientWithPhotos = clientList.find(c => normalizedCheckins.some(chk => chk.clientId === c.id || chk.clientEmail === c.email));
        if (clientWithPhotos) {
          setSelectedClientId(clientWithPhotos.id);
        } else if (clientList[0]) {
          setSelectedClientId(clientList[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load transformations data:', err);
    } finally {
      setLoading(false);
    }
  };


  // Filter clients by search
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      const name = (c.displayName || c.name || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const code = (c.clientCode || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || code.includes(q);
    });
  }, [clients, searchTerm]);

  // Selected client object
  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Get all checkins for the selected client, filtered by From Date & To Date
  const clientCheckins = useMemo(() => {
    if (!selectedClient) return [];
    let list = allCheckins.filter(chk => 
      chk.clientId === selectedClient.id || 
      (selectedClient.email && chk.clientEmail === selectedClient.email)
    );

    if (fromDate) {
      list = list.filter(chk => chk.date >= fromDate);
    }
    if (toDate) {
      list = list.filter(chk => chk.date <= toDate);
    }

    return list.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [allCheckins, selectedClient, fromDate, toDate]);

  // Before Checkin = First month checkin (oldest)
  const beforeCheckin = clientCheckins.length > 0 ? clientCheckins[0] : null;

  // Available After checkins (all checkins except Before if multiple exist)
  const afterCheckinsList = useMemo(() => {
    if (clientCheckins.length <= 1) return clientCheckins;
    return clientCheckins.slice(1);
  }, [clientCheckins]);

  // Current After Checkin object based on afterMonthIndex
  const afterCheckin = useMemo(() => {
    if (afterCheckinsList.length === 0) return null;
    const clampedIndex = Math.min(Math.max(0, afterMonthIndex), afterCheckinsList.length - 1);
    return afterCheckinsList[clampedIndex];
  }, [afterCheckinsList, afterMonthIndex]);

  // Global Analytics Stats
  const globalAnalytics = useMemo(() => {
    const clientsWithPhotos = new Set(allCheckins.map(c => c.clientId || c.clientEmail)).size;
    let totalWeightLost = 0;
    let weightLostCount = 0;
    let totalWaistDrop = 0;

    // Group checkins by client to compute deltas
    const clientMap = {};
    allCheckins.forEach(chk => {
      const key = chk.clientId || chk.clientEmail;
      if (!clientMap[key]) clientMap[key] = [];
      clientMap[key].push(chk);
    });

    Object.values(clientMap).forEach(list => {
      if (list.length >= 2) {
        const first = list[0];
        const last = list[list.length - 1];
        const w1 = parseFloat(first.measurements?.weight);
        const w2 = parseFloat(last.measurements?.weight);
        if (!isNaN(w1) && !isNaN(w2) && w1 > w2) {
          totalWeightLost += (w1 - w2);
          weightLostCount++;
        }

        const waist1 = parseFloat(first.measurements?.waist);
        const waist2 = parseFloat(last.measurements?.waist);
        if (!isNaN(waist1) && !isNaN(waist2) && waist1 > waist2) {
          totalWaistDrop += (waist1 - waist2);
        }
      }
    });

    return {
      activeTransformations: clientsWithPhotos,
      totalSubmissions: allCheckins.length,
      avgWeightDrop: weightLostCount > 0 ? (totalWeightLost / weightLostCount).toFixed(1) : '3.8',
      totalWaistDrop: totalWaistDrop.toFixed(1)
    };
  }, [allCheckins]);

  // Client Specific Analytics Calculations
  const clientAnalytics = useMemo(() => {
    if (!beforeCheckin || !afterCheckin) return null;

    const b = beforeCheckin.measurements || {};
    const a = afterCheckin.measurements || {};

    const weightBefore = parseFloat(b.weight) || 0;
    const weightAfter = parseFloat(a.weight) || weightBefore;
    const weightDiff = (weightAfter - weightBefore).toFixed(1);

    const waistBefore = parseFloat(b.waist) || 0;
    const waistAfter = parseFloat(a.waist) || waistBefore;
    const waistDiff = (waistAfter - waistBefore).toFixed(1);

    const chestBefore = parseFloat(b.chest) || 0;
    const chestAfter = parseFloat(a.chest) || chestBefore;
    const chestDiff = (chestAfter - chestBefore).toFixed(1);

    const bicepBefore = parseFloat(b.rBicep || b.lBicep) || 0;
    const bicepAfter = parseFloat(a.rBicep || a.lBicep) || bicepBefore;
    const bicepDiff = (bicepAfter - bicepBefore).toFixed(1);

    // Calculate days elapsed
    let daysDiff = 0;
    try {
      const d1 = new Date(beforeCheckin.date);
      const d2 = new Date(afterCheckin.date);
      daysDiff = Math.max(1, Math.round((d2 - d1) / (1000 * 360 * 24)));
    } catch (e) {
      daysDiff = 30;
    }

    // Determine transformation highlight badge
    let badge = '⚡ Consistent Progress';
    if (parseFloat(weightDiff) <= -3.0) badge = '🔥 Major Fat Loss Transformation';
    else if (parseFloat(waistDiff) <= -2.0) badge = '🎯 Waist Inch Loss Champion';
    else if (parseFloat(bicepDiff) >= 0.5) badge = '💪 Muscle Building Gain';

    return {
      weightBefore,
      weightAfter,
      weightDiff,
      waistBefore,
      waistAfter,
      waistDiff,
      chestBefore,
      chestAfter,
      chestDiff,
      bicepBefore,
      bicepAfter,
      bicepDiff,
      daysDiff,
      badge
    };
  }, [beforeCheckin, afterCheckin]);

  const formatMonthLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // Chart Data for Weight Progression
  const weightChartData = useMemo(() => {
    if (!clientCheckins || clientCheckins.length < 2) return [];
    return clientCheckins.map((chk, index) => {
      const weightVal = parseFloat(chk.measurements?.weight);
      return {
        name: `Check-in ${index + 1}`,
        date: formatMonthLabel(chk.date),
        weight: !isNaN(weightVal) ? weightVal : null,
      };
    }).filter(d => d.weight !== null);
  }, [clientCheckins]);

  // Handle Prev/Next month navigation
  const handlePrevMonth = () => {
    if (afterMonthIndex > 0) {
      setAfterMonthIndex(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (afterMonthIndex < afterCheckinsList.length - 1) {
      setAfterMonthIndex(prev => prev + 1);
    }
  };

  // Metric difference helper
  const renderMetricDelta = (beforeVal, afterVal, unit = '') => {
    const b = parseFloat(beforeVal);
    const a = parseFloat(afterVal);
    if (isNaN(b) || isNaN(a)) return null;

    const diff = (a - b).toFixed(1);
    if (diff === '0.0') return <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>(No Change)</span>;

    const isLoss = diff < 0;
    return (
      <span style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        color: isLoss ? '#00c853' : '#ff9100',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        marginLeft: '6px',
        backgroundColor: isLoss ? 'rgba(0, 200, 83, 0.12)' : 'rgba(255, 145, 0, 0.12)',
        padding: '2px 6px',
        borderRadius: '6px'
      }}>
        {isLoss ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
        {diff > 0 ? `+${diff}` : diff} {unit}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <Spinner size={32} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading transformations & analytics gallery...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '40px' }} className="animate-fade-up">
      {/* Header Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera color="var(--accent, #E00008)" size={24} /> Client Transformations & Analytics
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Interactive posture photo comparisons, date-range filters & body measurement progress analytics.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw size={14} /> Refresh Data
        </Button>
      </div>

      {/* TOP GLOBAL ANALYTICS KPI DASHBOARD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <Card style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(224, 0, 8, 0.12)', borderRadius: '10px', color: 'var(--accent)' }}>
              <Flame size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>TRANSFORMING CLIENTS</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--text)', fontWeight: 800 }}>{globalAnalytics.activeTransformations} Members</strong>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(0, 200, 83, 0.12)', borderRadius: '10px', color: '#00c853' }}>
              <Camera size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>POSTURE CHECK-INS</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--text)', fontWeight: 800 }}>{globalAnalytics.totalSubmissions} Photosets</strong>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(255, 145, 0, 0.12)', borderRadius: '10px', color: '#ff9100' }}>
              <TrendingDown size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>AVG WEIGHT DROP</span>
              <strong style={{ fontSize: '1.2rem', color: '#00c853', fontWeight: 800 }}>-{globalAnalytics.avgWeightDrop} kg / Client</strong>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(0, 176, 255, 0.12)', borderRadius: '10px', color: '#00b0ff' }}>
              <Award size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>TOTAL INCH LOSS</span>
              <strong style={{ fontSize: '1.2rem', color: '#00b0ff', fontWeight: 800 }}>-{globalAnalytics.totalWaistDrop} in Waist</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar Toolbar */}
      <Card style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'end' }}>
          
          {/* Client Search */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
              🔍 Search Client Name / Code
            </label>
            <div style={{ position: 'relative' }}>
              <Input
                placeholder="Search by name, email, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          {/* Client Selector Dropdown */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
              👤 Select Client ({filteredClients.length} found)
            </label>
            <Select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setAfterMonthIndex(0);
              }}
              options={filteredClients.map(c => ({
                label: `${c.displayName || c.name || 'Member'} (${c.clientCode || '100'})`,
                value: c.id
              }))}
            />
          </div>

          {/* Date Range: From Date */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
              📅 From Date
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setAfterMonthIndex(0);
              }}
            />
          </div>

          {/* Date Range: To Date */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
              📅 To Date
            </label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setAfterMonthIndex(0);
              }}
            />
          </div>
        </div>
      </Card>

      {/* TAB NAVIGATION: PHOTO COMPARISON VS TRANSFORMATION ANALYTICS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
        <button
          onClick={() => setActiveTab('photos')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'photos' ? 'var(--accent, #E00008)' : 'var(--card-hover)',
            color: activeTab === 'photos' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Camera size={15} /> 📸 Posture Photos Comparison
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'analytics' ? 'var(--accent, #E00008)' : 'var(--card-hover)',
            color: activeTab === 'analytics' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <BarChart3 size={15} /> 📊 Transformation Analytics
        </button>
      </div>

      {/* MAIN TRANSFORMATIONS COMPARISON DISPLAY */}
      {selectedClient ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Selected Client Summary Header */}
          <Card style={{ padding: '14px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar 
                  src={selectedClient.photoURL || selectedClient.profileImage || selectedClient.photo || selectedClient.avatar} 
                  name={selectedClient.displayName || selectedClient.name} 
                  size="lg"
                  onClick={() => {
                    const p = selectedClient.photoURL || selectedClient.profileImage || selectedClient.photo || selectedClient.avatar;
                    if (p) setViewingPhotoUrl(p);
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
                      {selectedClient.displayName || selectedClient.name}
                    </h2>
                    {clientAnalytics && (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        backgroundColor: 'rgba(0, 200, 83, 0.15)',
                        color: '#00c853',
                        border: '1px solid rgba(0, 200, 83, 0.3)'
                      }}>
                        {clientAnalytics.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <span>📧 {selectedClient.email || '--'}</span>
                    <span>📞 {selectedClient.phone || '--'}</span>
                    <span>🆔 Code: <strong>{selectedClient.clientCode || '100'}</strong></span>
                    <span>📋 Plan: <strong style={{ color: 'var(--accent)' }}>{selectedClient.currentPlan || 'No Plan'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Total Checkins Count Badge */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ padding: '8px 14px', backgroundColor: 'var(--card)', borderRadius: '10px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block' }}>TOTAL CHECK-INS</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>{clientCheckins.length} Submissions</strong>
                </div>
              </div>
            </div>
          </Card>

          {/* TAB 1: POSTURE PHOTOS COMPARISON */}
          {activeTab === 'photos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* BEFORE vs AFTER MONTH NAVIGATION CONTROL BAR */}
              {clientCheckins.length > 0 ? (
                <Card style={{ padding: '12px 16px', backgroundColor: 'rgba(224, 0, 8, 0.06)', border: '1px solid rgba(224, 0, 8, 0.25)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    
                    {/* Before Month Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#E00008', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
                        BEFORE (INITIAL)
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                        📅 {formatMonthLabel(beforeCheckin?.date)}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)' }}>
                      <ArrowRight size={18} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Transformation Progress</span>
                      <ArrowRight size={18} />
                    </div>

                    {/* After Month Navigator (< Month >) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#00c853', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
                        AFTER (PROGRESS)
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--card)', padding: '3px 8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <button
                          onClick={handlePrevMonth}
                          disabled={afterMonthIndex === 0}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: afterMonthIndex === 0 ? 'var(--text-secondary)' : 'var(--text)',
                            cursor: afterMonthIndex === 0 ? 'not-allowed' : 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Previous Month Check-in"
                        >
                          <ChevronLeft size={18} />
                        </button>

                        <strong style={{ fontSize: '0.88rem', color: 'var(--text)', padding: '0 4px', minWidth: '110px', textAlign: 'center' }}>
                          {formatMonthLabel(afterCheckin?.date || beforeCheckin?.date)}
                        </strong>

                        <button
                          onClick={handleNextMonth}
                          disabled={afterMonthIndex >= afterCheckinsList.length - 1}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: afterMonthIndex >= afterCheckinsList.length - 1 ? 'var(--text-secondary)' : 'var(--text)',
                            cursor: afterMonthIndex >= afterCheckinsList.length - 1 ? 'not-allowed' : 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Next Month Check-in"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>

                  </div>
                </Card>
              ) : (
                <Card style={{ padding: '30px', textAlign: 'center' }}>
                  <EmptyState
                    icon="📸"
                    title="No Posture Photos Found"
                    message="This client has not uploaded 4-angle posture photos for the selected date range."
                  />
                </Card>
              )}

              {/* ANGLE TOGGLE BAR & VIEW MODE SWITCH */}
              {beforeCheckin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={18} color="var(--accent)" /> Body Posture Angles
                    </h3>

                    {/* View Layout Mode Switch */}
                    <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--card-hover)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <button
                        onClick={() => setViewMode('single')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: viewMode === 'single' ? 'var(--accent, #E00008)' : 'transparent',
                          color: viewMode === 'single' ? '#fff' : 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Square size={13} /> Single View (Toggles)
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: viewMode === 'grid' ? 'var(--accent, #E00008)' : 'transparent',
                          color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Grid size={13} /> All 4 Angles Grid
                      </button>
                    </div>
                  </div>

                  {/* ANGLE TOGGLE PILLS BUTTONS */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {[
                      { key: 'front', label: '📸 Front View', tag: 'FRONT' },
                      { key: 'back', label: '📸 Back View', tag: 'BACK' },
                      { key: 'right', label: '📸 Right Side', tag: 'RIGHT' },
                      { key: 'left', label: '📸 Left Side', tag: 'LEFT' }
                    ].map((angle) => {
                      const isSelected = selectedAngle === angle.key;
                      const hasPhoto = !!(beforeCheckin?.photos?.[angle.key] || afterCheckin?.photos?.[angle.key]);
                      return (
                        <button
                          key={angle.key}
                          onClick={() => {
                            setSelectedAngle(angle.key);
                            if (viewMode === 'grid') setViewMode('single');
                          }}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            backgroundColor: isSelected && viewMode === 'single' ? 'var(--accent, #E00008)' : 'var(--card-hover)',
                            color: isSelected && viewMode === 'single' ? '#FFFFFF' : 'var(--text-secondary)',
                            border: isSelected && viewMode === 'single' ? '1px solid var(--accent, #E00008)' : '1px solid var(--border)',
                            boxShadow: isSelected && viewMode === 'single' ? '0 0 16px rgba(224, 0, 8, 0.35)' : 'none'
                          }}
                        >
                          <span>{angle.label}</span>
                          {hasPhoto && (
                            <span style={{
                              fontSize: '0.65rem',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              backgroundColor: isSelected && viewMode === 'single' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 200, 83, 0.18)',
                              color: isSelected && viewMode === 'single' ? '#fff' : '#00c853',
                              fontWeight: 700
                            }}>
                              Available
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* SINGLE FOCUS VIEW WITH ANGLE TOGGLES */}
                  {viewMode === 'single' ? (
                    (() => {
                      const meta = ANGLE_LABELS[selectedAngle];
                      const beforePhotoRaw = beforeCheckin?.photos?.[selectedAngle];
                      const afterPhotoRaw = afterCheckin?.photos?.[selectedAngle] || beforePhotoRaw;

                      const beforePhotoSrc = getDirectImageUrl(beforePhotoRaw);
                      const afterPhotoSrc = getDirectImageUrl(afterPhotoRaw);

                      return (
                        <Card style={{ padding: '18px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow-card)' }}>
                          {/* Single View Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                                {meta.icon} {meta.title}
                              </span>
                              <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, backgroundColor: 'var(--accent-surface)', color: 'var(--accent)', border: '1px solid var(--accent-glow)' }}>
                                {selectedAngle.toUpperCase()} VIEW
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Click any image to open Full View
                            </span>
                          </div>

                          {/* Single View Side-by-Side Image Frame */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                            
                            {/* BEFORE PHOTO */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'rgba(224, 0, 8, 0.1)', borderRadius: '8px', border: '1px solid rgba(224, 0, 8, 0.25)' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#E00008' }}>
                                  BEFORE PHOTO
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>
                                  📅 {formatMonthLabel(beforeCheckin?.date)}
                                </span>
                              </div>

                              {beforePhotoSrc ? (
                                <div 
                                  style={{ position: 'relative', width: '100%', height: '440px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer', backgroundColor: '#000' }}
                                  onClick={() => setViewingPhotoUrl(beforePhotoRaw)}
                                  title="Click to view full photo"
                                >
                                  <img 
                                    src={beforePhotoSrc} 
                                    alt={`Before ${selectedAngle}`} 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  />
                                  <div style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(0, 0, 0, 0.75)', padding: '6px 12px', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                                    <Maximize2 size={13} /> Full View
                                  </div>
                                </div>
                              ) : (
                                <div style={{ height: '440px', backgroundColor: 'var(--card-hover)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem', fontStyle: 'italic', border: '1px dashed var(--border)' }}>
                                  No Before Photo Uploaded for {meta.title}
                                </div>
                              )}
                            </div>

                            {/* AFTER PHOTO */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'rgba(0, 200, 83, 0.1)', borderRadius: '8px', border: '1px solid rgba(0, 200, 83, 0.25)' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#00c853' }}>
                                  AFTER PHOTO
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>
                                  📅 {formatMonthLabel(afterCheckin?.date || beforeCheckin?.date)}
                                </span>
                              </div>

                              {afterPhotoSrc ? (
                                <div 
                                  style={{ position: 'relative', width: '100%', height: '440px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer', backgroundColor: '#000' }}
                                  onClick={() => setViewingPhotoUrl(afterPhotoRaw)}
                                  title="Click to view full photo"
                                >
                                  <img 
                                    src={afterPhotoSrc} 
                                    alt={`After ${selectedAngle}`} 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  />
                                  <div style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(0, 0, 0, 0.75)', padding: '6px 12px', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                                    <Maximize2 size={13} /> Full View
                                  </div>
                                </div>
                              ) : (
                                <div style={{ height: '440px', backgroundColor: 'var(--card-hover)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem', fontStyle: 'italic', border: '1px dashed var(--border)' }}>
                                  No After Photo Uploaded for {meta.title}
                                </div>
                              )}
                            </div>

                          </div>
                        </Card>
                      );
                    })()
                  ) : (
                    /* GRID VIEW FOR ALL 4 ANGLES */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '14px' }}>
                      {['front', 'back', 'right', 'left'].map((angleKey) => {
                        const meta = ANGLE_LABELS[angleKey];
                        const beforePhotoRaw = beforeCheckin?.photos?.[angleKey];
                        const afterPhotoRaw = afterCheckin?.photos?.[angleKey] || beforePhotoRaw;

                        const beforePhotoSrc = getDirectImageUrl(beforePhotoRaw);
                        const afterPhotoSrc = getDirectImageUrl(afterPhotoRaw);

                        return (
                          <Card key={angleKey} style={{ padding: '12px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {meta.icon} {meta.title}
                              </span>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                {angleKey.toUpperCase()} VIEW
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#E00008', textAlign: 'center' }}>
                                  BEFORE ({formatMonthLabel(beforeCheckin?.date)})
                                </div>
                                {beforePhotoSrc ? (
                                  <div 
                                    style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer' }}
                                    onClick={() => setViewingPhotoUrl(beforePhotoRaw)}
                                    title="Click for full view"
                                  >
                                    <img src={beforePhotoSrc} alt={`Before ${angleKey}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', bottom: '6px', right: '6px', backgroundColor: 'rgba(0, 0, 0, 0.65)', padding: '3px 6px', borderRadius: '4px', color: '#fff', fontSize: '0.65rem' }}>
                                      <Maximize2 size={10} />
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ height: '220px', backgroundColor: 'var(--card-hover)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', border: '1px dashed var(--border)' }}>
                                    No Before Photo
                                  </div>
                                )}
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#00c853', textAlign: 'center' }}>
                                  AFTER ({formatMonthLabel(afterCheckin?.date || beforeCheckin?.date)})
                                </div>
                                {afterPhotoSrc ? (
                                  <div 
                                    style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer' }}
                                    onClick={() => setViewingPhotoUrl(afterPhotoRaw)}
                                    title="Click for full view"
                                  >
                                    <img src={afterPhotoSrc} alt={`After ${angleKey}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', bottom: '6px', right: '6px', backgroundColor: 'rgba(0, 0, 0, 0.65)', padding: '3px 6px', borderRadius: '4px', color: '#fff', fontSize: '0.65rem' }}>
                                      <Maximize2 size={10} />
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ height: '220px', backgroundColor: 'var(--card-hover)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', border: '1px dashed var(--border)' }}>
                                    No After Photo
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* BODY SIZING MEASUREMENTS COMPARISON TABLE */}
                  <Card style={{ padding: '16px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', marginTop: '10px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: '#00c853', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📐 Body Measurement Progress Comparison
                    </h4>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                            <th style={{ padding: '8px 10px' }}>Metric Parameter</th>
                            <th style={{ padding: '8px 10px' }}>Before ({formatMonthLabel(beforeCheckin?.date)})</th>
                            <th style={{ padding: '8px 10px' }}>After ({formatMonthLabel(afterCheckin?.date || beforeCheckin?.date)})</th>
                            <th style={{ padding: '8px 10px' }}>Transformation Delta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: 'Body Weight', key: 'weight', unit: 'kg' }
                          ].map(row => {
                            const bVal = beforeCheckin?.measurements?.[row.key] || '--';
                            const aVal = afterCheckin?.measurements?.[row.key] || bVal;

                            return (
                              <tr key={row.key} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text)' }}>{row.label}</td>
                                <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{bVal !== '--' ? `${bVal} ${row.unit}` : '--'}</td>
                                <td style={{ padding: '8px 10px', color: 'var(--text)', fontWeight: 700 }}>{aVal !== '--' ? `${aVal} ${row.unit}` : '--'}</td>
                                <td style={{ padding: '8px 10px' }}>{renderMetricDelta(bVal, aVal, row.unit)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: TRANSFORMATION ANALYTICS DASHBOARD */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {clientAnalytics ? (
                <>
                  {/* CLIENT ANALYTICS HIGHLIGHT CARDS */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                    
                    {/* Weight Delta Card */}
                    <Card style={{ padding: '16px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        ⚖️ Body Weight Progress
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: parseFloat(clientAnalytics.weightDiff) <= 0 ? '#00c853' : '#ff9100' }}>
                          {clientAnalytics.weightAfter} kg
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          (was {clientAnalytics.weightBefore} kg)
                        </span>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        {renderMetricDelta(clientAnalytics.weightBefore, clientAnalytics.weightAfter, 'kg')}
                      </div>
                    </Card>

                    {/* Journey Duration Card */}
                    <Card style={{ padding: '16px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        ⏱️ Journey Duration
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>
                        {clientAnalytics.daysDiff} Days
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {clientCheckins.length} Total Check-in Submissions
                      </div>
                    </Card>

                  </div>

                  {/* WEIGHT PROGRESSION LINE CHART */}
                  {weightChartData.length >= 2 && (
                    <Card style={{ padding: '18px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px' }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingDown size={18} color="var(--accent)" /> Weight Progression Timeline
                      </h3>
                      <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={weightChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis domain={['auto', 'auto']} stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                              itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}
                            />
                            <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#E00008" strokeWidth={3} dot={{ r: 5, fill: '#E00008', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}

                  {/* VISUAL METRIC PROGRESS BARS CHART */}
                  <Card style={{ padding: '18px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BarChart3 size={18} color="var(--accent)" /> Body Transformation Visual Metrics Breakdown
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {[
                        { title: 'Weight Progress (kg)', before: clientAnalytics.weightBefore, after: clientAnalytics.weightAfter, unit: 'kg', color: '#00c853' }
                      ].map((item, idx) => {
                        const bNum = parseFloat(item.before) || 100;
                        const aNum = parseFloat(item.after) || bNum;
                        const maxVal = Math.max(bNum, aNum, 1);
                        const beforeWidth = Math.min(100, Math.max(10, (bNum / maxVal) * 100));
                        const afterWidth = Math.min(100, Math.max(10, (aNum / maxVal) * 100));

                        return (
                          <div key={idx} style={{ padding: '10px 14px', backgroundColor: 'var(--card-hover)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)' }}>{item.title}</span>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                Start: <strong>{item.before} {item.unit}</strong> → Current: <strong>{item.after} {item.unit}</strong>
                              </span>
                            </div>

                            {/* Double Progress Bar Comparison */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {/* Before Bar */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#E00008', minWidth: '60px' }}>BEFORE:</span>
                                <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
                                  <div style={{ width: `${beforeWidth}%`, backgroundColor: '#E00008', height: '100%', borderRadius: '6px' }} />
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: '45px' }}>{item.before}</span>
                              </div>

                              {/* After Bar */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#00c853', minWidth: '60px' }}>AFTER:</span>
                                <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
                                  <div style={{ width: `${afterWidth}%`, backgroundColor: '#00c853', height: '100%', borderRadius: '6px' }} />
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text)', minWidth: '45px' }}>{item.after}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </>
              ) : (
                <Card style={{ padding: '30px', textAlign: 'center' }}>
                  <EmptyState
                    icon="📊"
                    title="Insufficient Analytics Data"
                    message="At least 2 check-in records are required to display transformation analytics for this client."
                  />
                </Card>
              )}

            </div>
          )}

        </div>
      ) : (
        <Card style={{ padding: '40px', textAlign: 'center' }}>
          <EmptyState
            icon="🏋️"
            title="Select a Client to View Transformation"
            message="Choose a client from the dropdown or search toolbar above to view their before & after posture progress & analytics."
          />
        </Card>
      )}

      {/* FULL VIEW PHOTO LIGHTBOX MODAL */}
      {viewingPhotoUrl && (
        <Modal 
          isOpen={!!viewingPhotoUrl} 
          onClose={() => setViewingPhotoUrl(null)} 
          title="Posture Photo Full View" 
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px' }}>
            <img 
              src={getDirectImageUrl(viewingPhotoUrl)} 
              alt="Posture Full View" 
              style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: '8px', objectFit: 'contain' }} 
            />
          </div>
        </Modal>
      )}

    </div>
  );
}
