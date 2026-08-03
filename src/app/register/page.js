'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
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
      toast.error(err.message || 'Registration failed');
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
      background: 'radial-gradient(circle at center, #1a1a1e 0%, var(--bg) 100%)',
      padding: '20px'
    }}>
      <Card style={{ width: '100%', maxWidth: '400px', padding: '40px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '5px' }}>
          <span style={{ color: 'var(--accent)' }}>Power</span>
          <span style={{ color: 'white' }}>House</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>Create Fitness Account</p>
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Input placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <Input type="email" placeholder="Email (e.g. admin@powerhouse.com)" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          <Input type="tel" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px', display: 'block' }}>Account Type / Role:</label>
            <select 
              value={formData.role} 
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'white',
                outline: 'none'
              }}
            >
              <option value="client">🏋️ Client Portal User</option>
              <option value="admin">👑 Trainer / Admin</option>
            </select>
          </div>

          <Input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          <Input type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required />
          
          <Button type="submit" loading={loading} style={{ backgroundColor: 'var(--accent)', color: 'white', marginTop: '10px' }}>
            Register as {formData.role === 'admin' ? 'Admin' : 'Client'}
          </Button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Login</Link>
        </div>
      </Card>
    </div>
  );
}
