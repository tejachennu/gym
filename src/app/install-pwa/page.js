'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import { 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles,
  Zap,
  Globe,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function InstallPwaPage() {
  const toast = useToast();
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [activeTab, setActiveTab] = useState('android'); // 'android' | 'ios'

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIos(ios);
    if (ios) setActiveTab('ios');

    // Detect if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info("Installation prompt is not ready automatically. Follow the step-by-step instructions below for your device!");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-up">
      {/* Header Bar */}
      <header style={styles.header}>
        <button onClick={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/mrk-logo.png" alt="MRK FITNESS" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <div style={{ width: '32px' }} />
      </header>

      <main style={styles.mainContent}>
        {/* Hero Card */}
        <Card style={styles.heroCard} className="glass-card">
          <div style={styles.heroBadge}>
            <Sparkles size={14} color="var(--accent, #E00008)" />
            <span>MRK FITNESS PWA APP</span>
          </div>

          <h1 style={styles.title}>
            Install <span style={{ color: 'var(--accent, #E00008)' }}>MRK FITNESS</span> <br />
            on Your Home Screen
          </h1>

          <p style={styles.subtitle}>
            Get instant 1-tap access to your daily diet plans, workout splits, 10-day posture check-ins, and trainer chat — no App Store download required!
          </p>

          {isInstalled ? (
            <div style={styles.installedBanner}>
              <CheckCircle2 size={24} color="#00c853" />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: '#00c853' }}>MRK Fitness App is Installed!</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>You can launch it directly from your phone's home screen.</span>
              </div>
            </div>
          ) : (
            <Button 
              onClick={handleInstallClick}
              style={styles.installBtn}
              className="pulse-glow"
            >
              <Download size={18} /> Install App Now
            </Button>
          )}
        </Card>

        {/* Benefits Grid */}
        <div style={styles.benefitsGrid}>
          <Card style={styles.benefitCard} className="glass-card">
            <Zap size={22} color="var(--accent, #E00008)" />
            <div>
              <h4 style={styles.benefitTitle}>Lightning Fast Loading</h4>
              <p style={styles.benefitDesc}>Opens instantly like a native iOS & Android mobile app.</p>
            </div>
          </Card>

          <Card style={styles.benefitCard} className="glass-card">
            <Smartphone size={22} color="#00c853" />
            <div>
              <h4 style={styles.benefitTitle}>Home Screen Shortcut</h4>
              <p style={styles.benefitDesc}>1-tap access right from your phone's home screen grid.</p>
            </div>
          </Card>
        </div>

        {/* Device Step-by-Step Instructions Tabs */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
          <div style={styles.tabHeader}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
              Installation Instructions
            </h3>
            
            <div style={styles.tabBtnGroup}>
              <button 
                onClick={() => setActiveTab('android')}
                style={{ ...styles.tabBtn, ...(activeTab === 'android' ? styles.tabBtnActive : {}) }}
              >
                🤖 Android / Chrome
              </button>

              <button 
                onClick={() => setActiveTab('ios')}
                style={{ ...styles.tabBtn, ...(activeTab === 'ios' ? styles.tabBtnActive : {}) }}
              >
                🍏 iPhone / Safari
              </button>
            </div>
          </div>

          {activeTab === 'android' ? (
            <Card style={styles.guideCard} className="glass-card">
              <h4 style={styles.guideTitle}>How to install on Android (Google Chrome):</h4>
              
              <div style={styles.stepList}>
                <div style={styles.stepRow}>
                  <div style={styles.stepNum}>1</div>
                  <div style={styles.stepText}>
                    Open <strong>Chrome Browser</strong> and make sure you are on this page.
                  </div>
                </div>

                <div style={styles.stepRow}>
                  <div style={styles.stepNum}>2</div>
                  <div style={styles.stepText}>
                    Tap the <strong>3 dots menu (⋮)</strong> at the top right corner of Chrome.
                  </div>
                </div>

                <div style={styles.stepRow}>
                  <div style={styles.stepNum}>3</div>
                  <div style={styles.stepText}>
                    Tap <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.
                  </div>
                </div>

                <div style={styles.stepRow}>
                  <div style={styles.stepNum}>4</div>
                  <div style={styles.stepText}>
                    Tap <strong>Install</strong> to confirm. The MRK FITNESS icon will appear on your phone's home screen!
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card style={styles.guideCard} className="glass-card">
              <h4 style={styles.guideTitle}>How to install on iPhone & iPad (Safari):</h4>

              <div style={styles.stepList}>
                <div style={styles.stepRow}>
                  <div style={styles.stepNum}>1</div>
                  <div style={styles.stepText}>
                    Open <strong>Safari Browser</strong> on your iPhone.
                  </div>
                </div>

                <div style={styles.stepRow}>
                  <div style={styles.stepNum}>2</div>
                  <div style={styles.stepText}>
                    Tap the <strong>Share button (<Share size={14} style={{ display: 'inline' }} />)</strong> in the bottom navigation bar.
                  </div>
                </div>

                <div style={styles.stepRow}>
                  <div style={styles.stepNum}>3</div>
                  <div style={styles.stepText}>
                    Scroll down the options list and tap <strong>"Add to Home Screen" (<PlusSquare size={14} style={{ display: 'inline' }} />)</strong>.
                  </div>
                </div>

                <div style={styles.stepRow}>
                  <div style={styles.stepNum}>4</div>
                  <div style={styles.stepText}>
                    Tap <strong>Add</strong> at the top right. Launch MRK FITNESS directly from your iOS Home Screen anytime!
                  </div>
                </div>
              </div>
            </Card>
          )}
        </section>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button variant="outline" onClick={() => router.push('/client')} style={{ padding: '10px 24px' }}>
            Return to Client Portal <ChevronRight size={16} />
          </Button>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'var(--bg, #080808)',
    color: '#FFFFFF',
    minHeight: '100vh',
    paddingBottom: '50px'
  },
  header: {
    padding: '14px 16px',
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'rgba(14, 14, 18, 0.95)'
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center'
  },
  mainContent: {
    maxWidth: '650px',
    margin: '0 auto',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  heroCard: {
    padding: '24px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(224, 0, 8, 0.15)',
    border: '1px solid rgba(224, 0, 8, 0.35)',
    color: 'var(--accent, #E00008)',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.72rem',
    fontWeight: 800
  },
  title: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: 900,
    lineHeight: 1.2
  },
  subtitle: {
    margin: 0,
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    maxWidth: '500px'
  },
  installBtn: {
    padding: '12px 28px',
    fontSize: '0.95rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '6px'
  },
  installedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'rgba(0, 200, 83, 0.12)',
    border: '1px solid rgba(0, 200, 83, 0.3)',
    borderRadius: '12px',
    textAlign: 'left',
    marginTop: '6px'
  },
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '12px'
  },
  benefitCard: {
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  benefitTitle: {
    margin: '0 0 2px 0',
    fontSize: '0.9rem',
    fontWeight: 800,
    color: '#FFFFFF'
  },
  benefitDesc: {
    margin: 0,
    fontSize: '0.78rem',
    color: 'var(--text-secondary)'
  },
  tabHeader: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px'
  },
  tabBtnGroup: {
    display: 'flex',
    gap: '6px',
    backgroundColor: 'var(--card)',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid var(--border)'
  },
  tabBtn: {
    padding: '6px 12px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  tabBtnActive: {
    backgroundColor: 'var(--accent, #E00008)',
    color: '#FFFFFF'
  },
  guideCard: {
    padding: '20px'
  },
  guideTitle: {
    margin: '0 0 16px 0',
    fontSize: '0.95rem',
    fontWeight: 800,
    color: '#FFFFFF'
  },
  stepList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  stepRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px'
  },
  stepNum: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-surface)',
    border: '1px solid var(--accent)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '0.8rem',
    flexShrink: 0
  },
  stepText: {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 1.5
  }
};
