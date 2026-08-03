'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { logoutUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { getClientById, getClientCheckins, getClientDailyLogs } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { User, Mail, Phone, Calendar, LogOut, Settings, Lock, Edit3, Target, Activity, Sparkles, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({ checkins: 0, dailyLogs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (user?.uid) {
        try {
          const clientData = await getClientById(user.uid);
          setProfileData(clientData);
          
          const checkins = await getClientCheckins(user.uid);
          const logs = await getClientDailyLogs(user.uid);
          
          setStats({
            checkins: checkins.length,
            dailyLogs: logs.length
          });
        } catch (error) {
          console.error("Error loading profile data:", error);
          toast.error("Failed to load profile data");
        } finally {
          setLoading(false);
        }
      } else if (!authLoading) {
        setLoading(false);
      }
    }
    
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const calculatePlanProgress = () => {
    if (!profileData?.planStart || !profileData?.planExpiry) return { percent: 0, daysLeft: 0 };
    
    const start = new Date(profileData.planStart).getTime();
    const end = new Date(profileData.planExpiry).getTime();
    const now = new Date().getTime();
    
    if (now > end) return { percent: 100, daysLeft: 0, expired: true };
    if (now < start) return { percent: 0, daysLeft: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) };
    
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    const daysLeft = totalDays - daysPassed;
    
    const percent = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
    
    return { percent, daysLeft, expired: false, totalDays };
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spinner />
      </div>
    );
  }

  const planInfo = calculatePlanProgress();
  const userName = userData?.name || profileData?.name || 'Client';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '85px' }} className="animate-fade-up">
      
      {/* 1. Sleek Profile Header Banner */}
      <div style={{ 
        padding: '16px', 
        background: 'linear-gradient(135deg, rgba(224, 0, 8, 0.14) 0%, rgba(18, 18, 20, 0.85) 100%)', 
        borderRadius: '16px', 
        border: '1px solid rgba(224, 0, 8, 0.25)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
        {/* Avatar with Ring */}
        <div style={{ 
          padding: '3px', 
          background: 'linear-gradient(135deg, var(--accent, #E00008), #ff9100)',
          borderRadius: '50%',
          boxShadow: '0 4px 16px rgba(224, 0, 8, 0.3)',
          flexShrink: 0
        }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            backgroundColor: '#121214', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '1.2rem'
          }}>
            {getInitials(userName)}
          </div>
        </div>

        {/* User Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
              {userName}
            </h1>
            <span style={{ 
              fontSize: '0.65rem', 
              backgroundColor: 'rgba(224, 0, 8, 0.18)', 
              color: 'var(--accent, #E00008)', 
              padding: '2px 8px', 
              borderRadius: '12px',
              border: '1px solid rgba(224, 0, 8, 0.3)',
              fontWeight: 700
            }}>
              {userData?.role?.toUpperCase() || 'CLIENT'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              <Mail size={12} color="var(--accent, #E00008)" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</span>
            </div>
            {(userData?.phone || profileData?.phone) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                <Phone size={12} color="var(--accent, #E00008)" />
                <span>{userData?.phone || profileData?.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Active Plan Card */}
      <div style={{ 
        padding: '14px', 
        borderRadius: '14px', 
        background: 'rgba(18, 18, 20, 0.75)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={16} color="var(--accent, #E00008)" />
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#FFFFFF', fontWeight: 700 }}>Active Plan</h3>
          </div>
          {profileData?.currentPlan && (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: planInfo.expired ? '#ff9100' : 'var(--accent, #E00008)' }}>
              {planInfo.expired ? 'Expired' : `${planInfo.daysLeft} days remaining`}
            </span>
          )}
        </div>
        
        {profileData?.currentPlan ? (
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', color: '#FFFFFF', fontWeight: 700 }}>
              {profileData.currentPlan}
            </h4>
            
            <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ 
                height: '100%', 
                width: `${planInfo.percent}%`,
                background: 'linear-gradient(90deg, var(--accent, #E00008), #ff5252)',
                borderRadius: '10px',
                transition: 'width 1s ease-in-out',
                boxShadow: '0 0 10px rgba(224, 0, 8, 0.5)'
              }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.55)' }}>
              <span>Start: {new Date(profileData.planStart).toLocaleDateString()}</span>
              <span>End: {new Date(profileData.planExpiry).toLocaleDateString()}</span>
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.8rem' }}>
            No Active Plan Assigned
          </div>
        )}
      </div>

      {/* 3. Stats Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div style={{ 
          padding: '12px', 
          borderRadius: '14px', 
          background: 'rgba(18, 18, 20, 0.75)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ padding: '8px', backgroundColor: 'rgba(0, 200, 83, 0.12)', borderRadius: '10px', border: '1px solid rgba(0, 200, 83, 0.25)' }}>
            <Activity size={18} color="#00c853" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.55)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Check-ins</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>{stats.checkins}</div>
          </div>
        </div>

        <div style={{ 
          padding: '12px', 
          borderRadius: '14px', 
          background: 'rgba(18, 18, 20, 0.75)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ padding: '8px', backgroundColor: 'rgba(255, 179, 0, 0.12)', borderRadius: '10px', border: '1px solid rgba(255, 179, 0, 0.25)' }}>
            <Calendar size={18} color="#ffb300" />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.55)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Daily Logs</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>{stats.dailyLogs}</div>
          </div>
        </div>
      </div>

      {/* 4. Settings Section */}
      <div style={{ 
        padding: '14px', 
        borderRadius: '14px', 
        background: 'rgba(18, 18, 20, 0.75)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.07)'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#FFFFFF', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Settings size={16} color="rgba(255,255,255,0.7)" /> Account Settings
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div 
            style={styles.settingItem} 
            onClick={() => toast.info('Edit profile feature coming soon')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Edit3 size={15} color="rgba(255, 255, 255, 0.7)" />
              <span style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 500 }}>Edit Profile</span>
            </div>
          </div>
          
          <div 
            style={styles.settingItem} 
            onClick={() => toast.info('Change password feature coming soon')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={15} color="rgba(255, 255, 255, 0.7)" />
              <span style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 500 }}>Change Password</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Logout Button */}
      <Button 
        onClick={handleLogout} 
        style={{ 
          backgroundColor: 'rgba(255, 82, 82, 0.08)', 
          color: '#ff5252', 
          border: '1px solid rgba(255, 82, 82, 0.3)', 
          padding: '12px',
          borderRadius: '12px',
          fontSize: '0.9rem',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
          marginTop: '4px'
        }}
      >
        <LogOut size={16} /> Log Out
      </Button>

    </div>
  );
}

const styles = {
  settingItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }
};
