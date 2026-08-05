'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, registerUser, resetPassword } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const router = useRouter();
  const toast = useToast();
  const { user, userData, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      const isAdmin = userData?.role === 'admin' || user.email?.toLowerCase().includes('admin');
      if (isAdmin) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/client';
      }
    }
  }, [user, userData, authLoading]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let loggedInUser;
      try {
        loggedInUser = await loginUser(email, password);
      } catch (err) {
        const isNotFound = 
          err.code === 'auth/user-not-found' || 
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/invalid-email' ||
          err.message?.includes('invalid-credential') ||
          err.message?.includes('user-not-found') ||
          err.message?.includes('INVALID_LOGIN_CREDENTIALS');

        if (isNotFound) {
          if (email.includes('admin')) {
            await registerUser({ email, password, name: 'PowerHouse Admin', role: 'admin' });
            loggedInUser = await loginUser(email, password);
          } else if (email.includes('client')) {
            await registerUser({ email, password, name: 'John Fitness Client', role: 'client' });
            loggedInUser = await loginUser(email, password);
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
      toast.success('Logged in successfully!');
      const targetRole = email.toLowerCase().includes('admin') ? '/admin' : '/client';
      window.location.href = targetRole;
    } catch (err) {
      toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!resetEmail) {
      return toast.warning('Please enter your email address first.');
    }
    try {
      await resetPassword(resetEmail);
      toast.success('Password reset link sent to your email!');
      setShowReset(false);
      setResetEmail('');
    } catch (err) {
      toast.error(err);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@powerhouse.com');
    setPassword('Admin@123456');
  };

  const fillDemoClient = () => {
    setEmail('client@powerhouse.com');
    setPassword('Client@123456');
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
        <img src="/mrk-logo.png" alt="MRK FITNESS" style={{ height: '42px', width: 'auto', objectFit: 'contain', marginBottom: '8px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '18px' }}>Radha Krishna Maram — Management Portal</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Input 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            icon="📧"
          />
          <Input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            icon="🔒"
          />
          <div style={{ textAlign: 'right', marginTop: '-2px' }}>
            <span style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowReset(true)}>
              Forgot password?
            </span>
          </div>
          <Button type="submit" loading={loading} style={{ backgroundColor: 'var(--accent)', color: 'white', marginTop: '4px', fontWeight: 800 }}>
            Submit Sign In
          </Button>
        </form>

        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ Quick Demo Logins</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              type="button" 
              onClick={fillDemoAdmin}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid var(--accent)',
                backgroundColor: 'var(--accent-surface)',
                color: 'var(--text)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              👑 Fill Admin
            </button>
            <button 
              type="button" 
              onClick={fillDemoClient}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card-hover)',
                color: 'var(--text)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🏋️ Fill Client
            </button>
          </div>
        </div>

        <div style={{ marginTop: '14px', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Don't have an account? </span>
          <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Register</Link>
        </div>
      </Card>

      {showReset && (
        <Modal isOpen={showReset} onClose={() => setShowReset(false)} title="Reset Password">
          <Input 
            type="email" 
            placeholder="Enter your email" 
            value={resetEmail} 
            onChange={(e) => setResetEmail(e.target.value)} 
          />
          <Button onClick={handleReset} style={{ marginTop: '12px', width: '100%', backgroundColor: 'var(--accent)', color: 'white' }}>
            Submit Reset Link
          </Button>
        </Modal>
      )}
    </div>
  );
}
