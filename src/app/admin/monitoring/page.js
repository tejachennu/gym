'use client';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function MonitoringPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock data
  const logs = [
    {
      id: 1,
      clientName: 'John Doe',
      status: 'pending',
      steps: 8500,
      sleep: '7.5',
      water: '3.0',
      notes: 'Felt tired today during workout.',
      meals: [
        { name: 'Breakfast', image: 'https://via.placeholder.com/150' },
        { name: 'Lunch', image: 'https://via.placeholder.com/150' },
        { name: 'Dinner', image: 'https://via.placeholder.com/150' },
      ]
    },
    {
      id: 2,
      clientName: 'Jane Smith',
      status: 'reviewed',
      steps: 12000,
      sleep: '8.0',
      water: '4.0',
      notes: 'Great energy today!',
      meals: [
        { name: 'Breakfast', image: 'https://via.placeholder.com/150' },
      ]
    }
  ];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Daily Monitoring</h1>
        <div style={styles.filterBar}>
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
        </div>
      </header>

      <div style={styles.list}>
        {logs.map(log => (
          <Card key={log.id} style={styles.logCard}>
            <div style={styles.logHeader}>
              <h3 style={styles.clientName}>{log.clientName}</h3>
              <span style={{
                ...styles.statusBadge, 
                backgroundColor: log.status === 'reviewed' ? 'var(--success, #00c853)' : 'var(--warning, #ffd600)',
                color: '#000'
              }}>
                {log.status === 'reviewed' ? 'Reviewed' : 'Pending Review'}
              </span>
            </div>

            <div style={styles.metricsGrid}>
              <div style={styles.metric}>
                <span style={styles.metricIcon}>👣</span>
                <div>
                  <div style={styles.metricLabel}>Steps</div>
                  <div style={styles.metricValue}>{log.steps}</div>
                </div>
              </div>
              <div style={styles.metric}>
                <span style={styles.metricIcon}>😴</span>
                <div>
                  <div style={styles.metricLabel}>Sleep</div>
                  <div style={styles.metricValue}>{log.sleep} hrs</div>
                </div>
              </div>
              <div style={styles.metric}>
                <span style={styles.metricIcon}>💧</span>
                <div>
                  <div style={styles.metricLabel}>Water</div>
                  <div style={styles.metricValue}>{log.water} L</div>
                </div>
              </div>
            </div>

            <div style={styles.mealsSection}>
              <h4 style={styles.sectionTitle}>Meals</h4>
              <div style={styles.mealsGrid}>
                {log.meals.map((meal, idx) => (
                  <div key={idx} style={styles.mealItem}>
                    <img src={meal.image} alt={meal.name} style={styles.mealImage} />
                    <div style={styles.mealName}>{meal.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {log.notes && (
              <div style={styles.notesSection}>
                <h4 style={styles.sectionTitle}>Client Notes</h4>
                <p style={styles.notesText}>"{log.notes}"</p>
              </div>
            )}

            <div style={styles.actionSection}>
              <Input placeholder="Add review remarks..." style={{ flex: 1 }} />
              <Button disabled={log.status === 'reviewed'}>
                {log.status === 'reviewed' ? 'Reviewed' : 'Mark as Reviewed'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '2rem', margin: 0 },
  filterBar: { display: 'flex', gap: '16px', alignItems: 'center' },
  list: { display: 'flex', flexDirection: 'column', gap: '24px' },
  logCard: { padding: '24px' },
  logHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border, #2a2a30)', paddingBottom: '16px' },
  clientName: { margin: 0, fontSize: '1.5rem' },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' },
  metric: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--bg, #080808)', padding: '16px', borderRadius: 'var(--radius-sm, 12px)' },
  metricIcon: { fontSize: '1.5rem' },
  metricLabel: { fontSize: '0.8rem', color: 'var(--text-secondary, #AAAAAA)' },
  metricValue: { fontSize: '1.2rem', fontWeight: 'bold' },
  mealsSection: { marginBottom: '24px' },
  sectionTitle: { margin: '0 0 12px 0', fontSize: '1.1rem' },
  mealsGrid: { display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' },
  mealItem: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' },
  mealImage: { width: '150px', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-sm, 12px)', border: '1px solid var(--border, #2a2a30)' },
  mealName: { textAlign: 'center', fontSize: '0.9rem' },
  notesSection: { marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg, #080808)', borderRadius: 'var(--radius-sm, 12px)', borderLeft: '4px solid var(--accent, #E00008)' },
  notesText: { margin: 0, fontStyle: 'italic', color: 'var(--text-secondary, #AAAAAA)' },
  actionSection: { display: 'flex', gap: '16px', alignItems: 'center', borderTop: '1px solid var(--border, #2a2a30)', paddingTop: '24px' }
};
