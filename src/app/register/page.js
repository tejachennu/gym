'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { validateField } from '@/lib/validation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'client' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleRegister = async (e) => {
    e.preventDefault();

    const nameErr = validateField('Full Name', formData.name, { required: true });
    const emailErr = validateField('Email Address', formData.email, { email: true, required: true });
    const phoneErr = validateField('Phone Number', formData.phone, { phone: true, required: true });
    const passErr = validateField('Password', formData.password, { required: true });

    if (nameErr || emailErr || phoneErr || passErr) {
      toast.error(nameErr || emailErr || phoneErr || passErr);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      const res = await registerUser(formData);
      toast.success(`Registered successfully as ${res.role}!`);
      if (res.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/client');
      }
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, var(--card-hover) 0%, var(--bg) 100%)',
      padding: '16px'
    }}>
      <Card style={{ width: '100%', maxWidth: '380px', padding: '24px 20px', textAlign: 'center', borderRadius: '14px' }} className="glass-card">
        <img src="/mrk-logo.png" alt="MRK FITNESS" style={{ height: '40px', width: 'auto', objectFit: 'contain', marginBottom: '6px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '16px' }}>Create Fitness Account</p>
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Input placeholder="Full Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <Input type="email" placeholder="Email Address *" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          <Input type="tel" numeric={true} placeholder="Phone Number (Numbers only) *" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block', fontWeight: 600 }}>Account Type / Role:</label>
            <select 
              value={formData.role} 
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            >
              <option value="client">🏋️ Client Portal User</option>
              <option value="admin">👑 Trainer / Admin</option>
            </select>
          </div>

          <Input type="password" placeholder="Password *" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          <Input type="password" placeholder="Confirm Password *" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required />
          
          <Button type="submit" loading={loading} style={{ backgroundColor: 'var(--accent)', color: 'white', marginTop: '6px', fontWeight: 800 }}>
            Submit Registration
          </Button>
        </form>

        <div style={{ marginTop: '14px', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Login</Link>
        </div>
      </Card>
    </div>
  );
}
