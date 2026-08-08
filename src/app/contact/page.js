'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addEnquiry } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  Dumbbell, 
  ArrowLeft, 
  MessageSquare, 
  CheckCircle2, 
  HelpCircle,
  ChevronDown
} from 'lucide-react';

export default function ContactPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'Membership Plan Query',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      return toast.error('Please fill in Name, Email, and Message');
    }

    setSubmitting(true);
    try {
      await addEnquiry({
        name: form.name,
        email: form.email,
        phone: form.phone || '',
        category: form.category || 'Membership Plan Query',
        message: form.message,
        source: 'website',
        status: 'new',
        createdAt: new Date().toISOString()
      });
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Message sent! Our fitness team will contact you within 2 hours.');
    } catch (err) {
      setSubmitting(false);
      toast.error('Failed to submit message. Please try again.');
    }
  };

  return (
    <div style={styles.pageWrapper}>
      {/* 1. Header Navigation Bar */}
      <header style={styles.navHeader}>
        <div style={styles.navContainer}>
          <div style={styles.brandGroup} onClick={() => router.push('/')}>
            <img src="/mrk-logo.png" alt="MRK FITNESS" style={{ height: '34px', width: 'auto', objectFit: 'contain' }} />
          </div>

          <Button variant="ghost" onClick={() => router.push('/')} style={styles.backBtn}>
            <ArrowLeft size={16} /> Back to Home
          </Button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroContainer}>
          <div style={styles.heroBadge}>
            <MessageSquare size={14} color="var(--accent, #E00008)" />
            <span>WE ARE HERE TO HELP YOU</span>
          </div>

          <h1 style={styles.heroTitle}>Get In Touch With Our Team</h1>
          <p style={styles.heroSubtitle}>
            Have questions about our membership tiers, workout splits, or personal training programs? Reach out below!
          </p>
        </div>
      </section>

      {/* 3. Main Content: Info Cards & Form */}
      <section style={styles.mainSection}>
        <div style={styles.gridContainer}>
          
          {/* Left Column: Contact Cards */}
          <div style={styles.infoCol}>
            <Card style={styles.infoCard} className="glass-card">
              <div style={styles.infoIconBox}>
                <MapPin size={20} color="var(--accent, #E00008)" />
              </div>
              <div>
                <h4 style={styles.infoCardTitle}>Gym Address & Headquarters</h4>
                <p style={styles.infoCardText}>MRK FITNESS COACH Center, Main Gym Complex, Film Nagar, Hyderabad, Telangana 500096</p>
              </div>
            </Card>

            <Card style={styles.infoCard} className="glass-card">
              <div style={styles.infoIconBox}>
                <Clock size={20} color="#ab47bc" />
              </div>
              <div>
                <h4 style={styles.infoCardTitle}>Operating Hours</h4>
                <p style={styles.infoCardText}>Morning: 05:30 AM – 11:00 AM</p>
                <p style={styles.infoCardText}>Evening: 04:30 PM – 10:00 PM (Sunday Closed)</p>
              </div>
            </Card>
          </div>

          {/* Right Column: Contact Form */}
          <div style={styles.formCol}>
            <Card style={styles.formCard} className="glass-card">
              {submitted ? (
                <div style={styles.successState}>
                  <div style={styles.successIconCircle}>
                    <CheckCircle2 size={36} color="#00c853" />
                  </div>
                  <h3 style={{ margin: '12px 0 6px', fontSize: '1.2rem', color: '#FFFFFF' }}>Message Received!</h3>
                  <p style={{ color: 'var(--text-secondary, #AAAAAA)', fontSize: '0.88rem', marginBottom: '20px', lineHeight: 1.5 }}>
                    Thank you for contacting MRK FITNESS. One of our certified personal trainers will get back to you shortly.
                  </p>
                  <Button onClick={() => setSubmitted(false)}>Send Another Message</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={styles.form}>
                  <h3 style={styles.formTitle}>Send Us A Message</h3>
                  <p style={styles.formSub}>Fill out the details below and we will contact you immediately.</p>

                  <Input 
                    label="Full Name *" 
                    placeholder="Enter your name" 
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    <Input 
                      label="Email Address *" 
                      type="email"
                      placeholder="name@example.com" 
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />

                    <Input 
                      label="Phone Number" 
                      placeholder="Phone or WhatsApp" 
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>

                  <Select 
                    label="Topic / Inquiry Category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    options={[
                      { label: 'Membership Plan Query', value: 'Membership Plan Query' },
                      { label: 'Personal Trainer Guidance', value: 'Personal Trainer Guidance' },
                      { label: 'Custom Diet & Workout Plan', value: 'Custom Diet & Workout Plan' },
                      { label: 'Technical / Portal Support', value: 'Technical Support' }
                    ]}
                  />

                  <Textarea 
                    label="Message / Query Details *"
                    placeholder="Tell us about your fitness goals or questions..."
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                  />

                  <Button type="submit" loading={submitting} style={{ width: '100%', marginTop: '6px' }}>
                    <Send size={16} /> Submit Message
                  </Button>
                </form>
              )}
            </Card>
          </div>

        </div>
      </section>

      {/* 4. Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerBottom}>
          © {new Date().getFullYear()} MRK FITNESS System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

const styles = {
  pageWrapper: { backgroundColor: 'var(--bg, #080808)', color: '#FFFFFF', minHeight: '100vh' },
  navHeader: { position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(18, 18, 20, 0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255, 255, 255, 0.07)' },
  navContainer: { maxWidth: '1100px', margin: '0 auto', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brandGroup: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  logoIcon: { width: '34px', height: '34px', borderRadius: '10px', backgroundColor: 'var(--accent, #E00008)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px' },
  backBtn: { fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' },
  heroSection: { padding: '40px 16px 20px 16px', textAlign: 'center' },
  heroContainer: { maxWidth: '700px', margin: '0 auto' },
  heroBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(224, 0, 8, 0.12)', border: '1px solid rgba(224, 0, 8, 0.3)', color: 'var(--accent, #E00008)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '12px' },
  heroTitle: { fontSize: '1.8rem', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.02em' },
  heroSubtitle: { fontSize: '0.9rem', color: 'var(--text-secondary, #AAAAAA)', margin: 0, lineHeight: 1.5 },
  mainSection: { padding: '30px 16px 60px 16px', maxWidth: '1050px', margin: '0 auto' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'start' },
  infoCol: { display: 'flex', flexDirection: 'column', gap: '12px' },
  infoCard: { padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' },
  infoIconBox: { width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoCardTitle: { fontSize: '0.88rem', fontWeight: 700, margin: '0 0 4px 0', color: '#FFFFFF' },
  infoCardText: { fontSize: '0.8rem', color: 'var(--text-secondary, #AAAAAA)', margin: 0, lineHeight: 1.4 },
  infoSubText: { fontSize: '0.72rem', color: 'var(--text-muted, #666666)', marginTop: '4px', display: 'block' },
  formCol: { flex: 1 },
  formCard: { padding: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  formTitle: { fontSize: '1.2rem', fontWeight: 800, margin: '0 0 2px 0', color: '#FFFFFF' },
  formSub: { fontSize: '0.8rem', color: 'var(--text-secondary, #AAAAAA)', margin: '0 0 12px 0' },
  successState: { textAlign: 'center', padding: '30px 10px' },
  successIconCircle: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(0, 200, 83, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
  footer: { borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(10, 10, 12, 0.9)', padding: '20px 16px' },
  footerBottom: { maxWidth: '1100px', margin: '0 auto', textAlign: 'center', color: 'var(--text-muted, #666666)', fontSize: '0.75rem' }
};
