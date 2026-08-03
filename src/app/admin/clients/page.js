'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllClients } from '@/lib/firestore';
import { registerUser } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Calendar, 
  User as UserIcon, 
  CreditCard,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function ClientsPage() {
  const router = useRouter();
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'Male',
    password: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await getAllClients();
      setClients(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!newClient.name || !newClient.email || !newClient.password) {
      return toast.error('Please fill in Name, Email and Password');
    }
    setCreating(true);
    try {
      await registerUser({
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        age: newClient.age,
        gender: newClient.gender,
        password: newClient.password,
        role: 'client'
      });
      toast.success(`Client ${newClient.name} added successfully!`);
      setIsAddModalOpen(false);
      setNewClient({ name: '', email: '', phone: '', age: '', gender: 'Male', password: '' });
      await fetchClients();
    } catch (err) {
      toast.error(err.message || 'Failed to add client');
    } finally {
      setCreating(false);
    }
  };

  // Helper for Membership Status
  const getMembershipStatus = (client) => {
    if (client.status === 'inactive') return { label: 'Inactive', variant: 'warning' };
    if (!client.currentPlan) return { label: 'Active', variant: 'success' };
    if (client.planExpiry) {
      const isExpired = new Date(client.planExpiry).getTime() < new Date().getTime();
      if (isExpired) return { label: 'Expired', variant: 'danger' };
    }
    return { label: 'Active Member', variant: 'success' };
  };

  // Sort descending by registration / creation date
  const sortedClients = [...clients].sort((a, b) => {
    const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return tB - tA;
  });

  // Filter clients
  const filteredClients = sortedClients.filter(c => {
    const matchesSearch = 
      (c.displayName || c.name)?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || (c.status || 'active') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginated Clients slice
  const totalItems = filteredClients.length;
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={styles.container} className="animate-fade-up">
      {/* Page Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.titleRow}>
            <div style={styles.titleIcon}>
              <Users size={22} color="var(--accent, #E00008)" />
            </div>
            <h1 style={styles.title}>Clients Directory</h1>
          </div>
          <p style={styles.subtitle}>
            Manage member profiles, health metrics & fitness plan assignments
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} style={styles.addBtn}>
          <UserPlus size={18} /> Add Client
        </Button>
      </header>

      {/* Filter & Search Bar */}
      <div style={styles.controlsBar}>
        <div style={styles.searchWrapper}>
          <Input 
            placeholder="Search by name, email, or phone..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            icon={<Search size={18} />}
          />
        </div>

        <div style={styles.filterWrapper}>
          <div style={styles.filterLabel}>
            <Filter size={16} color="var(--text-secondary)" /> Status:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.filterSelect}
          >
            <option value="all">All Clients ({clients.length})</option>
            <option value="active">Active Members</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            {paginatedClients.map(client => {
              const memStatus = getMembershipStatus(client);
              return (
                <Card 
                  key={client.id} 
                  style={styles.card}
                  className="glass-card"
                  onClick={() => router.push(`/admin/clients/${client.id}`)}
                >
                  <div style={styles.cardHeader}>
                    <Avatar src={client.photoURL} name={client.displayName || client.name} size="lg" />
                    <div style={styles.cardInfo}>
                      <h3 style={styles.clientName}>{client.displayName || client.name || 'No Name'}</h3>
                      <p style={styles.clientEmail}>{client.email}</p>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted, #666666)" />
                  </div>

                  <div style={styles.cardDetails}>
                    {client.phone && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}><Phone size={14} /> Phone:</span>
                        <span style={styles.detailValue}>{client.phone}</span>
                      </div>
                    )}
                    {(client.age || client.gender) && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}><UserIcon size={14} /> Demographics:</span>
                        <span style={styles.detailValue}>
                          {client.age ? `${client.age} yrs` : ''} {client.gender ? `(${client.gender})` : ''}
                        </span>
                      </div>
                    )}
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}><CreditCard size={14} /> Active Plan:</span>
                      <span style={styles.detailValue}>{client.currentPlan || 'Not Assigned'}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Membership Status:</span>
                      <Badge variant={memStatus.variant}>
                        {memStatus.label}
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredClients.length === 0 && (
            <div style={styles.emptyState}>
              <Users size={48} color="var(--text-muted, #666666)" />
              <h3 style={{ margin: '12px 0 4px', color: '#FFFFFF' }}>No Clients Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Try adjusting your search query or filter.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalItems > 0 && (
            <Pagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={(page) => setCurrentPage(page)}
              onItemsPerPageChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
              itemsPerPageOptions={[6, 12, 24, 48]}
            />
          )}
        </>
      )}

      {/* Add Client Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Client Account"
      >
        <form onSubmit={handleCreateClient} style={styles.form}>
          <Input 
            label="Full Name *" 
            placeholder="e.g. John Doe" 
            value={newClient.name}
            onChange={(e) => setNewClient({...newClient, name: e.target.value})}
            required 
          />
          <Input 
            label="Email Address *" 
            type="email" 
            placeholder="john@example.com" 
            value={newClient.email}
            onChange={(e) => setNewClient({...newClient, email: e.target.value})}
            required 
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input 
              label="Age" 
              type="number" 
              placeholder="e.g. 25" 
              value={newClient.age}
              onChange={(e) => setNewClient({...newClient, age: e.target.value})}
            />
            <Select 
              label="Gender"
              value={newClient.gender}
              onChange={(e) => setNewClient({...newClient, gender: e.target.value})}
              options={[
                { label: 'Male', value: 'Male' },
                { label: 'Female', value: 'Female' },
                { label: 'Other', value: 'Other' }
              ]}
            />
          </div>
          <Input 
            label="Phone Number" 
            type="tel" 
            placeholder="+1 555-0199" 
            value={newClient.phone}
            onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
          />
          <Input 
            label="Temporary Password *" 
            type="password" 
            placeholder="Password for client login" 
            value={newClient.password}
            onChange={(e) => setNewClient({...newClient, password: e.target.value})}
            required 
          />
          <Button type="submit" fullWidth loading={creating} style={{ marginTop: '10px' }}>
            Create Client Account
          </Button>
        </form>
      </Modal>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  titleRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  titleIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'var(--accent-surface, rgba(224, 0, 8, 0.1))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(224, 0, 8, 0.2)',
  },
  title: { fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  subtitle: { color: 'var(--text-secondary, #AAAAAA)', margin: '4px 0 0 0', fontSize: '0.825rem' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' },
  controlsBar: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  searchWrapper: { flex: 1, minWidth: '200px', maxWidth: '100%' },
  filterWrapper: { display: 'flex', alignItems: 'center', gap: '8px' },
  filterLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' },
  filterSelect: {
    backgroundColor: 'var(--card, #121214)',
    border: '1px solid var(--border, #2a2a30)',
    color: '#FFFFFF',
    padding: '8px 12px',
    borderRadius: '10px',
    fontSize: '0.8rem',
    outline: 'none',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '12px',
  },
  card: {
    padding: '20px',
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '16px',
  },
  cardInfo: { flex: 1, overflow: 'hidden' },
  clientName: { margin: '0 0 2px 0', fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
  clientEmail: { margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary, #AAAAAA)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
  cardDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingTop: '14px',
    borderTop: '1px solid var(--border, #2a2a30)',
  },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { color: 'var(--text-secondary, #AAAAAA)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' },
  detailValue: { fontSize: '0.875rem', fontWeight: 500 },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    backgroundColor: 'var(--card, #121214)',
    borderRadius: 'var(--radius, 20px)',
    border: '1px solid var(--border, #2a2a30)',
    textAlign: 'center',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' }
};
