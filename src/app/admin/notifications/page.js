'use client';

import { useState, useEffect, useRef } from 'react';
import { getAllClients, addDocument, getDocuments, getPlans } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { Select, Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Bell, Send, CheckCircle2, Info, AlertTriangle, Clock, Search, X, Users, Filter, Check, Zap, Sparkles, Layers } from 'lucide-react';

export default function NotificationsPage() {
  const toast = useToast();

  const [clients, setClients] = useState([]);
  const [masterPlans, setMasterPlans] = useState([]);

  // Multi-recipient selection state
  const [selectedRecipients, setSelectedRecipients] = useState([
    { type: 'all', id: 'all', label: '📢 All Clients (Broadcast)' }
  ]);

  const [type, setType] = useState('reminder');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [recentSent, setRecentSent] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & plan filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('all');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsData, notificationsData, plansData] = await Promise.all([
        getAllClients(),
        getDocuments('Notifications'),
        getPlans()
      ]);
      setClients(clientsData || []);
      setMasterPlans(plansData || []);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get unique plan names from clients
  const uniquePlans = [...new Set(
    clients
      .map(c => c.currentPlan)
      .filter(p => p && p !== 'None' && p !== 'Not Assigned')
  )].sort();

  // Helper: check if 'all' is selected
  const isAllSelected = selectedRecipients.some(r => r.type === 'all');

  // Select 'All Clients (Broadcast)'
  const handleSelectAll = () => {
    setSelectedRecipients([{ type: 'all', id: 'all', label: '📢 All Clients (Broadcast)' }]);
  };

  // Toggle Plan selection
  const handleTogglePlan = (planName) => {
    const planId = `plan:${planName}`;
    const exists = selectedRecipients.some(r => r.id === planId);

    if (exists) {
      const updated = selectedRecipients.filter(r => r.id !== planId);
      if (updated.length === 0) {
        setSelectedRecipients([{ type: 'all', id: 'all', label: '📢 All Clients (Broadcast)' }]);
      } else {
        setSelectedRecipients(updated);
      }
    } else {
      const filtered = selectedRecipients.filter(r => r.type !== 'all');
      setSelectedRecipients([
        ...filtered,
        { type: 'plan', id: planId, value: planName, label: `📋 ${planName}` }
      ]);
    }
  };

  // Toggle Client selection
  const handleToggleClient = (clientObj) => {
    const clientId = clientObj.id || clientObj.uid;
    const exists = selectedRecipients.some(r => r.id === clientId);

    if (exists) {
      const updated = selectedRecipients.filter(r => r.id !== clientId);
      if (updated.length === 0) {
        setSelectedRecipients([{ type: 'all', id: 'all', label: '📢 All Clients (Broadcast)' }]);
      } else {
        setSelectedRecipients(updated);
      }
    } else {
      const filtered = selectedRecipients.filter(r => r.type !== 'all');
      const name = clientObj.displayName || clientObj.name || clientObj.email;
      setSelectedRecipients([
        ...filtered,
        { type: 'client', id: clientId, value: clientId, label: `👤 ${name}` }
      ]);
    }
  };

  // Remove individual target item
  const handleRemoveRecipient = (idToRemove) => {
    const updated = selectedRecipients.filter(r => r.id !== idToRemove);
    if (updated.length === 0) {
      setSelectedRecipients([{ type: 'all', id: 'all', label: '📢 All Clients (Broadcast)' }]);
    } else {
      setSelectedRecipients(updated);
    }
  };

  // Compute unique target clients count
  const getTargetAudience = () => {
    if (isAllSelected) return clients;

    const selectedPlanNames = selectedRecipients
      .filter(r => r.type === 'plan')
      .map(r => r.value.toLowerCase());
    const selectedClientIds = new Set(
      selectedRecipients.filter(r => r.type === 'client').map(r => r.id)
    );

    return clients.filter(c => {
      const cId = c.id || c.uid;
      const cPlan = (c.currentPlan || '').toLowerCase();
      
      const matchedByPlan = selectedPlanNames.length > 0 && selectedPlanNames.includes(cPlan);
      const matchedById = selectedClientIds.has(cId);

      return matchedByPlan || matchedById;
    });
  };

  const targetAudience = getTargetAudience();

  // Filter clients by search & category filter
  const filteredClients = clients.filter(c => {
    const matchesPlan = selectedPlanFilter === 'all' || 
      (c.currentPlan || '').toLowerCase() === selectedPlanFilter.toLowerCase();
    
    if (!searchQuery.trim()) return matchesPlan;
    
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (c.displayName || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q);
    
    return matchesPlan && matchesSearch;
  });

  const templates = [
    { icon: '🥗', category: 'Nutrition', title: 'Upload Meals Today', message: 'Please remember to upload your daily meal photos and nutritional details for today.' },
    { icon: '🏋️', category: 'Workout', title: 'Log Daily Workout', message: "Don't forget to log your completed workout sets, weights lifted, and session notes!" },
    { icon: '📸', category: 'Check-in', title: '10-Day Check-in Due', message: 'It\'s time for your 10-day body check-in. Please upload your posture photos and sizing measurements.' },
    { icon: '🩸', category: 'Health', title: 'Blood Report Reminder', message: 'Friendly reminder to get your scheduled blood test done and upload the laboratory report.' }
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

    if (targetAudience.length === 0) {
      toast.error('No target clients found for the selected recipients.');
      return;
    }

    // Construct friendly summary text
    let recipientName = 'All Clients';
    if (!isAllSelected) {
      const planItems = selectedRecipients.filter(r => r.type === 'plan');
      const clientItems = selectedRecipients.filter(r => r.type === 'client');
      
      const parts = [];
      if (planItems.length > 0) parts.push(`${planItems.length} Plan(s)`);
      if (clientItems.length > 0) parts.push(`${clientItems.length} Client(s)`);

      recipientName = `${parts.join(' & ')} (${targetAudience.length} total recipients)`;
    }

    setSending(true);
    try {
      const newNotif = {
        recipient: isAllSelected ? 'all' : selectedRecipients.map(r => r.id),
        recipientName,
        targetCount: targetAudience.length,
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
      {/* TOP HEADER WITH SUMMARY BADGES */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={styles.headerIconCircle}>
            <Bell size={22} color="var(--accent, #E00008)" />
          </div>
          <div>
            <h1 style={styles.title}>Client Notifications Hub</h1>
            <p style={styles.subtitle}>
              Broadcast reminders, alerts, and plan-wise updates directly to client apps.
            </p>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div style={styles.statsRow}>
          <div style={styles.statMiniCard}>
            <Users size={14} color="#00c853" />
            <span>Total Clients: <strong>{clients.length}</strong></span>
          </div>
          <div style={styles.statMiniCard}>
            <Layers size={14} color="#0288d1" />
            <span>Active Plans: <strong>{uniquePlans.length}</strong></span>
          </div>
        </div>
      </header>

      <div style={styles.grid}>
        {/* ENHANCED FORM CARD: SEND NOTIFICATION */}
        <Card style={styles.formCard} className="glass-card">
          <div style={styles.cardHeaderBar}>
            <div style={styles.cardHeaderLeft}>
              <div style={styles.cardHeaderIconWrapper}>
                <Send size={16} color="var(--accent, #E00008)" />
              </div>
              <div>
                <h2 style={styles.cardHeaderTitle}>Create & Broadcast Notification</h2>
                <p style={styles.cardHeaderSub}>Select target audience by plan, individual clients, or broadcast to all.</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSendNotification} style={styles.form}>
            
            {/* MULTI-RECIPIENT SELECTION BOX */}
            <div ref={searchRef} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={styles.fieldLabel}>Selected Target Audience</label>
                <div style={styles.targetBadge}>
                  <Users size={12} /> Target: <strong>{targetAudience.length} client(s)</strong>
                </div>
              </div>

              {/* Selected Badges Box */}
              <div style={styles.selectedChipsBox}>
                {selectedRecipients.map(r => (
                  <div 
                    key={r.id}
                    style={{
                      ...styles.recipientChip,
                      ...(r.type === 'plan' ? styles.recipientChipPlan : {}),
                      ...(r.type === 'all' ? styles.recipientChipAll : {})
                    }}
                  >
                    <span>{r.label}</span>
                    {selectedRecipients.length > 1 || r.type !== 'all' ? (
                      <button 
                        type="button"
                        onClick={() => handleRemoveRecipient(r.id)}
                        style={styles.chipRemoveBtn}
                        title="Remove selection"
                      >
                        <X size={12} />
                      </button>
                    ) : null}
                  </div>
                ))}

                {!isAllSelected && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    style={styles.resetAllBtn}
                  >
                    Reset & Broadcast All
                  </button>
                )}
              </div>

              {/* Search input with sleek styling */}
              <div style={styles.searchWrapper}>
                <Search size={14} color="var(--accent, #E00008)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Type client name, email or phone to add individual..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                  onFocus={() => setShowResults(true)}
                  style={styles.searchInput}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Plan Filter & Multi-Selection Chips */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Filter size={12} color="var(--accent)" /> Quick Multi-Select Plans:
                </div>
                
                <div style={styles.planChipsRow}>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    style={{
                      ...styles.planChip,
                      ...(isAllSelected ? styles.planChipActive : {})
                    }}
                  >
                    📢 Broadcast All Clients
                  </button>

                  {uniquePlans.map(plan => {
                    const planId = `plan:${plan}`;
                    const isSelected = selectedRecipients.some(r => r.id === planId);
                    return (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => {
                          handleTogglePlan(plan);
                          setSelectedPlanFilter(plan === selectedPlanFilter ? 'all' : plan);
                        }}
                        style={{
                          ...styles.planChip,
                          ...(isSelected ? styles.planChipSelected : {})
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}Plan: {plan}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dropdown results for Client Search */}
              {showResults && (
                <div style={styles.resultsDropdown}>
                  <div style={styles.dropdownHeader}>
                    <span>Click clients below to add/remove from selection:</span>
                  </div>

                  {filteredClients.length === 0 ? (
                    <div style={{ padding: '14px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      No clients found matching &quot;{searchQuery}&quot;.
                    </div>
                  ) : (
                    filteredClients.map(c => {
                      const cId = c.id || c.uid;
                      const isSelected = selectedRecipients.some(r => r.id === cId);
                      return (
                        <div
                          key={cId}
                          style={{
                            ...styles.resultItem,
                            ...(isSelected ? { backgroundColor: 'rgba(224,0,8,0.12)' } : {})
                          }}
                          onClick={() => handleToggleClient(c)}
                        >
                          <div style={{
                            ...styles.checkboxSquare,
                            ...(isSelected ? styles.checkboxSquareActive : {})
                          }}>
                            {isSelected && <Check size={12} color="#fff" />}
                          </div>

                          <Avatar 
                            src={c.photoURL || c.profileImage || c.photo || c.avatar} 
                            name={c.displayName || c.name || c.email} 
                            size="sm" 
                          />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={styles.resultName}>
                              {c.displayName || c.name || c.email}
                            </div>
                            <div style={styles.resultMeta}>
                              {c.email}{c.currentPlan && c.currentPlan !== 'None' ? ` • ${c.currentPlan}` : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <Select 
              label="Notification Type" 
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { label: '⏰ Reminder (General Action)', value: 'reminder' },
                { label: '🚨 Urgent Alert (Important Notice)', value: 'alert' },
                { label: 'ℹ️ Announcement / Update', value: 'info' }
              ]}
            />

            <Input 
              label="Notification Title" 
              placeholder="e.g. Upload Meals & Workout Today" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Textarea 
              label="Message Body" 
              placeholder="Type your notification message details here..." 
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />

            <Button fullWidth type="submit" loading={sending} style={styles.submitBtn}>
              <Send size={16} /> Send Notification ({targetAudience.length} Target Client{targetAudience.length !== 1 ? 's' : ''})
            </Button>
          </form>
        </Card>

        {/* SIDEBAR: TEMPLATES & RECENT SENT LOG */}
        <div style={styles.sideCol}>
          
          {/* ENHANCED CARD 2: QUICK TEMPLATES */}
          <Card style={styles.templatesCard} className="glass-card">
            <div style={styles.sideCardHeader}>
              <Zap size={16} color="#ffb300" />
              <h2 style={styles.sideCardTitle}>Quick Templates</h2>
            </div>

            <div style={styles.templatesList}>
              {templates.map((t, i) => (
                <div key={i} style={styles.templateItem}>
                  <div style={styles.templateHeader}>
                    <span style={{ fontSize: '1rem' }}>{t.icon}</span>
                    <span style={styles.categoryBadge}>{t.category}</span>
                  </div>
                  <h4 style={styles.templateTitle}>{t.title}</h4>
                  <p style={styles.templateMessage}>{t.message}</p>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUseTemplate(t)}
                    style={styles.templateUseBtn}
                  >
                    <Sparkles size={12} color="var(--accent)" /> Apply Template
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* ENHANCED CARD 3: RECENT SENT LOG */}
          <Card style={styles.historyCard} className="glass-card">
            <div style={styles.sideCardHeader}>
              <Clock size={16} color="var(--accent)" />
              <h2 style={styles.sideCardTitle}>Recent Sent History Log</h2>
            </div>

            <div style={styles.historyList}>
              {recentSent.length === 0 ? (
                <div style={styles.emptyHistoryState}>
                  <Bell size={24} color="var(--text-secondary)" style={{ marginBottom: '6px', opacity: 0.5 }} />
                  <div>No notifications sent yet.</div>
                </div>
              ) : (
                recentSent.slice(0, 6).map((item, idx) => {
                  const dateStr = item.sentAt 
                    ? new Date(item.sentAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                    : 'Just now';

                  return (
                    <div key={idx} style={styles.historyItem}>
                      <div style={{
                        ...styles.historyIconWrapper,
                        ...(item.type === 'alert' ? { backgroundColor: 'rgba(255, 23, 68, 0.15)', borderColor: '#ff1744' } : {}),
                        ...(item.type === 'info' ? { backgroundColor: 'rgba(41, 182, 246, 0.15)', borderColor: '#29b6f6' } : {})
                      }}>
                        {item.type === 'alert' ? (
                          <AlertTriangle size={15} color="#ff1744" />
                        ) : item.type === 'info' ? (
                          <Info size={15} color="#29b6f6" />
                        ) : (
                          <Bell size={15} color="var(--accent)" />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                          <h4 style={styles.historyTitle}>{item.title}</h4>
                          <span style={styles.historyTime}>{dateStr}</span>
                        </div>
                        <p style={styles.historyMeta}>
                          Target: <strong style={{ color: 'var(--text)' }}>{item.recipientName || 'Clients'}</strong>
                        </p>
                        <p style={styles.historyMessageSnippet}>
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
  container: { display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '50px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  headerIconCircle: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    backgroundColor: 'rgba(224, 0, 8, 0.12)',
    border: '1px solid rgba(224, 0, 8, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  title: { fontSize: '1.4rem', fontWeight: 900, margin: '0 0 2px 0', letterSpacing: '-0.02em' },
  subtitle: { margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' },
  statsRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  statMiniCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: 'var(--card, #1a1a1f)',
    border: '1px solid var(--border, #2a2a30)',
    borderRadius: '20px',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', alignItems: 'start' },
  
  // FORM CARD STYLING
  formCard: { 
    padding: '20px', 
    borderRadius: '16px', 
    borderTop: '3px solid var(--accent, #E00008)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
  },
  cardHeaderBar: { marginBottom: '16px', borderBottom: '1px solid var(--border, #2a2a30)', paddingBottom: '12px' },
  cardHeaderLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  cardHeaderIconWrapper: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(224, 0, 8, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  cardHeaderTitle: { margin: '0 0 2px 0', fontSize: '1.02rem', fontWeight: 800 },
  cardHeaderSub: { margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },

  // SIDEBAR CARDS STYLING
  sideCol: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sideCardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border, #2a2a30)', paddingBottom: '10px' },
  sideCardTitle: { margin: 0, fontSize: '0.95rem', fontWeight: 800 },
  
  templatesCard: { padding: '18px', borderRadius: '16px', borderTop: '3px solid #ffb300' },
  templatesList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  templateItem: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px', 
    padding: '12px', 
    backgroundColor: 'var(--card, #1a1a1f)', 
    borderRadius: '12px', 
    border: '1px solid var(--border, #2a2a30)',
    transition: 'transform 0.2s ease, border-color 0.2s ease'
  },
  templateHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  categoryBadge: {
    fontSize: '0.65rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 179, 0, 0.15)',
    color: '#ffb300',
    border: '1px solid rgba(255, 179, 0, 0.3)'
  },
  templateTitle: { margin: '2px 0 0 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)' },
  templateMessage: { margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 },
  templateUseBtn: { fontSize: '0.72rem', padding: '6px 12px', marginTop: '4px', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '4px' },

  historyCard: { padding: '18px', borderRadius: '16px', borderTop: '3px solid #0288d1' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  emptyHistoryState: { fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  historyItem: { display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px', backgroundColor: 'var(--card, #1a1a1f)', borderRadius: '10px', border: '1px solid var(--border, #2a2a30)' },
  historyIconWrapper: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(224, 0, 8, 0.12)',
    border: '1px solid var(--accent, #E00008)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px'
  },
  historyTitle: { margin: 0, fontSize: '0.82rem', fontWeight: 800, color: 'var(--text)' },
  historyTime: { fontSize: '0.68rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' },
  historyMeta: { margin: '2px 0', fontSize: '0.72rem', color: 'var(--text-secondary)' },
  historyMessageSnippet: { margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', opacity: 0.85, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },

  // RECIPIENT SEARCH & MULTI-SELECT STYLES
  fieldLabel: {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 800,
    color: 'var(--text)',
    margin: 0
  },
  targetBadge: {
    fontSize: '0.72rem',
    color: '#00c853',
    backgroundColor: 'rgba(0, 200, 83, 0.12)',
    padding: '3px 10px',
    borderRadius: '12px',
    border: '1px solid rgba(0, 200, 83, 0.25)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  selectedChipsBox: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    alignItems: 'center',
    padding: '8px 10px',
    backgroundColor: 'var(--card-hover, rgba(255,255,255,0.04))',
    borderRadius: '12px',
    border: '1px solid var(--border, #2a2a30)',
    marginBottom: '8px',
    minHeight: '42px'
  },
  recipientChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    borderRadius: '16px',
    backgroundColor: 'rgba(224, 0, 8, 0.18)',
    border: '1px solid var(--accent, #E00008)',
    color: 'var(--text)',
    fontSize: '0.75rem',
    fontWeight: 700,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
  },
  recipientChipPlan: {
    backgroundColor: 'rgba(2, 136, 209, 0.18)',
    borderColor: '#0288d1',
    color: '#e1f5fe'
  },
  recipientChipAll: {
    backgroundColor: 'rgba(0, 200, 83, 0.18)',
    borderColor: '#00c853',
    color: '#e8f5e9'
  },
  chipRemoveBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    color: 'inherit',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '50%',
    opacity: 0.85
  },
  resetAllBtn: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    background: 'none',
    border: '1px dashed var(--border)',
    borderRadius: '12px',
    padding: '4px 10px',
    cursor: 'pointer',
    marginLeft: 'auto',
    fontWeight: 600
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 12px',
    backgroundColor: 'var(--card, #1a1a1f)',
    borderRadius: '10px',
    border: '1px solid var(--border, #2a2a30)',
    marginBottom: '10px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text)',
    fontSize: '0.82rem',
    fontFamily: 'inherit'
  },
  planChipsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap'
  },
  planChip: {
    padding: '5px 12px',
    borderRadius: '20px',
    border: '1px solid var(--border, #2a2a30)',
    backgroundColor: 'var(--card, #1a1a1f)',
    color: 'var(--text-secondary)',
    fontSize: '0.72rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap'
  },
  planChipActive: {
    backgroundColor: '#00c853',
    color: '#fff',
    borderColor: '#00c853',
    boxShadow: '0 2px 10px rgba(0,200,83,0.3)'
  },
  planChipSelected: {
    backgroundColor: '#0288d1',
    color: '#fff',
    borderColor: '#0288d1',
    boxShadow: '0 2px 10px rgba(2,136,209,0.3)'
  },
  resultsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: '260px',
    overflowY: 'auto',
    backgroundColor: 'var(--card, #1a1a1f)',
    border: '1px solid var(--border, #2a2a30)',
    borderRadius: '12px',
    zIndex: 50,
    boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
    marginTop: '4px'
  },
  dropdownHeader: {
    padding: '8px 12px',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--card-hover)',
    borderBottom: '1px solid var(--border)'
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    borderBottom: '1px solid rgba(255,255,255,0.03)'
  },
  checkboxSquare: {
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    border: '1.5px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  checkboxSquareActive: {
    backgroundColor: 'var(--accent, #E00008)',
    borderColor: 'var(--accent, #E00008)'
  },
  resultAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 800,
    color: 'var(--accent, #E00008)',
    flexShrink: 0
  },
  resultName: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  resultMeta: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  submitBtn: {
    marginTop: '10px',
    padding: '12px',
    fontSize: '0.88rem',
    fontWeight: 800,
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--accent, #E00008) 0%, #ff1744 100%)',
    boxShadow: '0 4px 16px rgba(224, 0, 8, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  }
};
