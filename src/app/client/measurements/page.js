'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientCheckins } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';

export default function MeasurementsPage() {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      getClientCheckins(user.uid).then(data => {
        setCheckins(data.sort((a, b) => new Date(a.date) - new Date(b.date))); // Ascending for proper trend comp
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spinner /></div>;

  if (checkins.length === 0) {
    return <EmptyState title="No Measurements" message="Submit a check-in to record your measurements." icon="📏" />;
  }

  const columns = ['Weight', 'Chest', 'Waist', 'Abdomen', 'Hip', 'L.Arm', 'R.Arm', 'L.Thigh', 'R.Thigh'];
  const dataKeys = ['weight', 'chest', 'waist', 'abdomen', 'hip', 'lArm', 'rArm', 'lThigh', 'rThigh'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Measurements History</h2>
      
      <Card style={{ padding: '15px', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '10px 5px', color: 'var(--text-secondary)' }}>Date</th>
              {columns.map(col => <th key={col} style={{ padding: '10px 5px' }}>{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {checkins.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 5px', color: 'var(--text-secondary)' }}>
                  {new Date(c.date).toLocaleDateString()}
                </td>
                {dataKeys.map(key => {
                  const val = c.measurements?.[key] || '--';
                  let trend = null;
                  if (i > 0 && val !== '--' && checkins[i-1].measurements?.[key]) {
                    const prevVal = Number(checkins[i-1].measurements[key]);
                    const currentVal = Number(val);
                    if (currentVal < prevVal) trend = 'down';
                    else if (currentVal > prevVal) trend = 'up';
                  }

                  const color = trend === 'down' ? 'var(--success)' : trend === 'up' ? 'var(--accent)' : 'inherit';
                  const arrow = trend === 'down' ? '↓' : trend === 'up' ? '↑' : '';

                  return (
                    <td key={key} style={{ padding: '10px 5px', color }}>
                      {val} {arrow}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
