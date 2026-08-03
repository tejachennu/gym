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
      if (err.message?.includes('PASSWORD_LOGIN_DISABLED') || err.code === 'auth/operation-not-allowed') {
        toast.error('Email/Password login is not enabled in Firebase Console!');
      } else {
        toast.error(err.message || 'Login failed');
      }
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
      toast.error(err.message || 'Failed to send password reset email');
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
      background: 'radial-gradient(circle at center, #1a1a1e 0%, var(--bg) 100%)',
      padding: '20px'
    }}>
      <Card style={{ width: '100%', maxWidth: '420px', padding: '40px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '5px' }}>
          <span style={{ color: 'var(--accent)' }}>Power</span>
          <span style={{ color: 'white' }}>House</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>Fitness Management Portal</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Input 
            type="email" 
            placeholder="Email" 
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
          <div style={{ textAlign: 'right', marginTop: '-5px' }}>
            <span style={{ color: 'var(--accent)', fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => setShowReset(true)}>
              Forgot password?
            </span>
          </div>
          <Button type="submit" loading={loading} style={{ backgroundColor: 'var(--accent)', color: 'white', marginTop: '5px' }}>
            Sign In
          </Button>
        </form>

        {/* Quick Demo Autofill Section */}
        <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>⚡ Quick Demo Logins</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              onClick={fillDemoAdmin}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'rgba(224, 0, 8, 0.15)',
                color: 'white',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              👑 Fill Admin
            </button>
            <button 
              type="button" 
              onClick={fillDemoClient}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              🏋️ Fill Client
            </button>
          </div>
        </div>

        <div style={{ marginTop: '20px', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Don't have an account? </span>
          <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Register</Link>
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
          <Button onClick={handleReset} style={{ marginTop: '15px', width: '100%', backgroundColor: 'var(--accent)', color: 'white' }}>
            Send Reset Link
          </Button>
        </Modal>
      )}
    </div>
  );
}
