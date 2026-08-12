'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientCheckins } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import { Ruler, Activity, TrendingDown, TrendingUp, HelpCircle, CheckCircle2 } from 'lucide-react';

const MEASUREMENT_COLUMNS = [
  { key: 'weight', label: 'Weight (kg)' },
  { key: 'chest', label: '1. Chest' },
  { key: 'neck', label: '2. Neck' },
  { key: 'shoulder', label: '3. Shoulder' },
  { key: 'waist', label: '4. Waist' },
  { key: 'stomach', label: '5. Stomach' },
  { key: 'highHip', label: '6. Butt / Hip' },
  { key: 'rBicep', label: '7. Right Bicep' },
  { key: 'lBicep', label: '8. Left Bicep' },
  { key: 'rForearm', label: '9. Right Forearm' },
  { key: 'lForearm', label: '10. Left Forearm' },
  { key: 'rThigh', label: '11. Right Thigh' },
  { key: 'lThigh', label: '12. Left Thigh' },
  { key: 'rCalf', label: '13. Right Calf' },
  { key: 'lCalf', label: '14. Left Calf' }
];

export default function MeasurementsPage() {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      getClientCheckins(user.uid).then(data => {
        setCheckins(data.sort((a, b) => new Date(a.date) - new Date(b.date)));
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spinner /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '90px' }} className="animate-fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
            📏 14-Point Body Measurements
          </h2>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary, #AAAAAA)', fontSize: '0.8rem' }}>
            Comprehensive anatomical progress tracking history
          </p>
        </div>
      </div>

      {/* Measurement Tips Card */}
      <Card style={{ padding: '14px', backgroundColor: 'rgba(224, 0, 8, 0.08)', border: '1px solid rgba(224, 0, 8, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <HelpCircle size={16} color="var(--accent, #E00008)" />
          <strong style={{ fontSize: '0.85rem', color: '#FFFFFF' }}>Tips For Accurate Measurement:</strong>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.85)' }}>
          <div>• Measure in the morning (Empty stomach)</div>
          <div>• Stand relaxed with tape parallel to ground</div>
          <div>• Don't pull the tape too tight</div>
          <div>• Measure at the same time every week</div>
        </div>
      </Card>

      {/* History Table */}
      {checkins.length === 0 ? (
        <EmptyState title="No Measurements Logged" message="Submit a 10-day check-in to record your anatomical measurements." icon="📏" />
      ) : (
        <Card style={{ padding: '14px', overflowX: 'auto' }} className="glass-card">
          <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                <th style={{ padding: '8px 6px', color: 'var(--text-secondary)', fontWeight: 700 }}>Date</th>
                {MEASUREMENT_COLUMNS.map(col => (
                  <th key={col.key} style={{ padding: '8px 6px', color: '#FFFFFF', fontWeight: 700 }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {checkins.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '8px 6px', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  {MEASUREMENT_COLUMNS.map(col => {
                    // Fallback to legacy key mappings if needed
                    const val = c.measurements?.[col.key] || 
                               (col.key === 'lBicep' ? c.measurements?.lArm : '') ||
                               (col.key === 'rBicep' ? c.measurements?.rArm : '') || '--';

                    let trend = null;
                    if (i > 0 && val !== '--' && checkins[i-1].measurements?.[col.key]) {
                      const prevVal = Number(checkins[i-1].measurements[col.key]);
                      const currentVal = Number(val);
                      if (currentVal < prevVal) trend = 'down';
                      else if (currentVal > prevVal) trend = 'up';
                    }

                    const color = trend === 'down' ? '#00c853' : trend === 'up' ? 'var(--accent, #E00008)' : '#FFFFFF';
                    const arrow = trend === 'down' ? '↓' : trend === 'up' ? '↑' : '';

                    return (
                      <td key={col.key} style={{ padding: '8px 6px', color, fontWeight: val !== '--' ? 700 : 400 }}>
                        {val} {val !== '--' ? 'cm' : ''} {arrow}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
