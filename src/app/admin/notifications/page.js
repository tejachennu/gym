'use client';

import { useState, useEffect } from 'react';
import { getAllClients, addDocument, getDocuments } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Select, Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Bell, Send, CheckCircle2, Info, AlertTriangle, Clock } from 'lucide-react';

export default function NotificationsPage() {
  const toast = useToast();

  const [clients, setClients] = useState([]);
  const [recipient, setRecipient] = useState('all');
  const [type, setType] = useState('reminder');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [recentSent, setRecentSent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsData, notificationsData] = await Promise.all([
        getAllClients(),
        getDocuments('Notifications')
      ]);
      setClients(clientsData || []);

      const sortedNotifs = (notificationsData || []).sort((a, b) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.sentAt ? new Date(a.sentAt).getTime() : 0);
        const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.sentAt ? new Date(b.sentAt).getTime() : 0);
        return tB - tA;
      });
      setRecentSent(sortedNotifs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    { title: 'Upload Meals', message: 'Please remember to upload your daily meal photos and details for today.' },
    { title: 'Log Workout', message: "Don't forget to log your workout completed sets and add notes!" },
    { title: 'Check-in Reminder', message: 'It\'s time for your 10-day body check-in. Please upload your posture photos and sizing measurements.' },
    { title: 'Blood Test Reminder', message: 'Friendly reminder to get your scheduled blood test done and upload the report.' }
  ];

  const handleUseTemplate = (tmpl) => {
    setTitle(tmpl.title);
    setMessage(tmpl.message);
    toast.info(`Applied template: "${tmpl.title}"`);
  };

  const handleSendNotification = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a notification title.');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter a notification message body.');
      return;
    }

    let recipientName = 'All Clients';
    if (recipient !== 'all') {
      const matchedClient = clients.find(c => c.id === recipient || c.uid === recipient);
      recipientName = matchedClient ? (matchedClient.displayName || matchedClient.name || matchedClient.email) : 'Selected Client';
    }

    setSending(true);
    try {
      const newNotif = {
        recipient,
        recipientName,
        type,
        title: title.trim(),
        message: message.trim(),
        sentAt: new Date().toISOString(),
        read: false
      };

      await addDocument('Notifications', newNotif);
      toast.success(`Notification "${title}" sent to ${recipientName}!`);

      setTitle('');
      setMessage('');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to send notification. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-up">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Client Notifications Center</h1>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Broadcast reminders, alerts, and custom updates directly to your clients.
          </p>
        </div>
      </header>

      <div style={styles.grid}>
        {/* SEND NOTIFICATION FORM */}
        <Card style={styles.formCard} className="glass-card">
          <h2 style={styles.cardTitle}>
            <Send size={16} color="var(--accent)" /> Send New Notification
          </h2>
          
          <form onSubmit={handleSendNotification} style={styles.form}>
            <Select 
              label="Recipient" 
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              options={[
                { label: '📢 All Clients (Broadcast)', value: 'all' },
                ...clients.map(c => ({ 
                  label: `👤 ${c.displayName || c.name || c.email} (${c.email})`, 
                  value: c.id 
                }))
              ]}
            />

            <Select 
              label="Notification Type" 
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { label: '⏰ Reminder', value: 'reminder' },
                { label: '🚨 Alert', value: 'alert' },
                { label: 'ℹ️ Information', value: 'info' }
              ]}
            />

            <Input 
              label="Notification Title" 
              placeholder="e.g. Upload Meals Today" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Textarea 
              label="Message Body" 
              placeholder="Type your broadcast message details here..." 
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />

            <Button fullWidth type="submit" loading={sending} style={{ marginTop: '8px' }}>
              <Send size={16} /> Send Notification
            </Button>
          </form>
        </Card>

        {/* SIDEBAR: TEMPLATES & RECENT SENT */}
        <div style={styles.sideCol}>
          <Card style={styles.templatesCard} className="glass-card">
            <h2 style={styles.cardTitle}>⚡ Quick Templates</h2>
            <div style={styles.templatesList}>
              {templates.map((t, i) => (
                <div key={i} style={styles.templateItem}>
                  <div style={styles.templateContent}>
                    <h4 style={styles.templateTitle}>{t.title}</h4>
                    <p style={styles.templateMessage}>{t.message}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUseTemplate(t)}
                    style={{ fontSize: '0.72rem', padding: '4px 10px', flexShrink: 0 }}
                  >
                    Use
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card style={styles.historyCard} className="glass-card">
            <h2 style={styles.cardTitle}>📜 Recent Sent Log</h2>
            <div style={styles.historyList}>
              {recentSent.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px' }}>
                  No notifications sent yet.
                </div>
              ) : (
                recentSent.slice(0, 6).map((item, idx) => {
                  const dateStr = item.sentAt 
                    ? new Date(item.sentAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                    : 'Just now';

                  return (
                    <div key={idx} style={styles.historyItem}>
                      <div style={styles.historyIcon}>
                        {item.type === 'alert' ? (
                          <AlertTriangle size={18} color="#ff1744" />
                        ) : item.type === 'info' ? (
                          <Info size={18} color="#29b6f6" />
                        ) : (
                          <Bell size={18} color="var(--accent)" />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={styles.historyTitle}>{item.title}</h4>
                        <p style={styles.historyMeta}>
                          Sent to <strong>{item.recipientName || 'Clients'}</strong> • {dateStr}
                        </p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {item.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '1.3rem', fontWeight: 900, margin: '0 0 2px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', alignItems: 'start' },
  cardTitle: { fontSize: '0.95rem', fontWeight: 800, margin: '0 0 14px 0', borderBottom: '1px solid var(--border, #2a2a30)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' },
  formCard: { padding: '16px', borderRadius: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '14px' },
  templatesCard: { padding: '16px', borderRadius: '14px' },
  templatesList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  templateItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: 'var(--card)', borderRadius: '10px', border: '1px solid var(--border, #2a2a30)' },
  templateContent: { flex: 1 },
  templateTitle: { margin: '0 0 2px 0', fontSize: '0.85rem', fontWeight: 700 },
  templateMessage: { margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary, #AAAAAA)' },
  historyCard: { padding: '16px', borderRadius: '14px' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  historyItem: { display: 'flex', gap: '10px', alignItems: 'flex-start', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  historyIcon: { marginTop: '2px' },
  historyTitle: { margin: '0 0 2px 0', fontSize: '0.85rem', fontWeight: 700 },
  historyMeta: { margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary, #AAAAAA)' }
};
