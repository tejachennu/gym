'use client';
import { useState, useEffect } from 'react';
import { getAllClients } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Select, Input, Textarea } from '@/components/ui/Input';

export default function NotificationsPage() {
  const [clients, setClients] = useState([]);
  
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const data = await getAllClients();
    setClients(data);
  };

  const templates = [
    { title: 'Upload Meals', message: 'Please remember to upload your meals for today.' },
    { title: 'Log Workout', message: 'Don\'t forget to log your workout and add notes!' },
    { title: 'Check-in Reminder', message: 'It\'s time for your weekly body check-in. Please upload your photos and measurements.' },
    { title: 'Blood Test', message: 'Friendly reminder to get your scheduled blood test done this week.' }
  ];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Notifications</h1>
      </header>

      <div style={styles.grid}>
        <Card style={styles.formCard}>
          <h2 style={styles.cardTitle}>Send Notification</h2>
          <div style={styles.form}>
            <Select 
              label="Recipient" 
              options={[
                { label: 'All Clients', value: 'all' },
                ...clients.map(c => ({ label: c.displayName || c.email, value: c.id }))
              ]}
            />
            <Select 
              label="Type" 
              options={[
                { label: 'Reminder', value: 'reminder' },
                { label: 'Alert', value: 'alert' },
                { label: 'Info', value: 'info' }
              ]}
            />
            <Input label="Title" placeholder="Notification Title" />
            <Textarea label="Message" placeholder="Type your message here..." rows={4} />
            <Button fullWidth>Send Notification</Button>
          </div>
        </Card>

        <div style={styles.sideCol}>
          <Card style={styles.templatesCard}>
            <h2 style={styles.cardTitle}>Quick Templates</h2>
            <div style={styles.templatesList}>
              {templates.map((t, i) => (
                <div key={i} style={styles.templateItem}>
                  <div style={styles.templateContent}>
                    <h4 style={styles.templateTitle}>{t.title}</h4>
                    <p style={styles.templateMessage}>{t.message}</p>
                  </div>
                  <Button variant="outline" size="sm">Use</Button>
                </div>
              ))}
            </div>
          </Card>

          <Card style={styles.historyCard}>
            <h2 style={styles.cardTitle}>Recent Sent</h2>
            <div style={styles.historyList}>
              <div style={styles.historyItem}>
                <div style={styles.historyIcon}>🔔</div>
                <div>
                  <h4 style={styles.historyTitle}>Check-in Reminder</h4>
                  <p style={styles.historyMeta}>Sent to All Clients • 2 hours ago</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '1.25rem', fontWeight: 800, margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', alignItems: 'start' },
  cardTitle: { fontSize: '0.95rem', fontWeight: 700, margin: '0 0 14px 0', borderBottom: '1px solid var(--border, #2a2a30)', paddingBottom: '10px' },
  formCard: { padding: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '14px' },
  templatesCard: { padding: '14px' },
  templatesList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  templateItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: 'var(--bg, #080808)', borderRadius: '10px', border: '1px solid var(--border, #2a2a30)' },
  templateContent: { flex: 1 },
  templateTitle: { margin: '0 0 2px 0', fontSize: '0.85rem' },
  templateMessage: { margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary, #AAAAAA)' },
  historyCard: { padding: '14px' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  historyItem: { display: 'flex', gap: '10px', alignItems: 'center' },
  historyIcon: { fontSize: '1.2rem' },
  historyTitle: { margin: '0 0 2px 0', fontSize: '0.85rem' },
  historyMeta: { margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary, #AAAAAA)' }
};
