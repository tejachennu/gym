'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getPlans } from '@/lib/firestore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Loading';
import { 
  Dumbbell, 
  Utensils, 
  Activity, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight,
  Flame,
  Star,
  Zap,
  Camera,
  Target,
  UserCheck,
  Clock,
  Home as HomeIcon,
  Check,
  Menu,
  X
} from 'lucide-react';

function InstagramIcon({ size = 18, color = "#e1306c" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

const DEFAULT_PLANS = [
  {
    id: 'default-1',
    plan_name: "Cardio + Strength",
    category: "MRK FITNESS",
    badge: "Most Popular",
    description: "The ultimate combination for fat loss, endurance, and body transformation.",
    pricing: [
      { duration: "1 Month", price: 1599 },
      { duration: "3 Months", price: 3999 },
      { duration: "6 Months", price: 6499 }
    ],
    features: ["Cardio & Strength Training", "Personalized Diet Plan", "Weekly Weight & Posture Tracking", "24/7 Trainer Support", "Locker & Equipment Access"]
  },
  {
    id: 'default-2',
    plan_name: "Personal Training",
    category: "MRK FITNESS",
    badge: "VIP Coaching",
    description: "One-on-one dedicated coaching with Radha Krishna Maram.",
    pricing: [
      { duration: "1 Month", price: 6000 },
      { duration: "3 Months", price: 16000 },
      { duration: "6 Months", price: 30000 }
    ],
    features: ["1-on-1 Personal Trainer", "Custom Macro Meal Plan", "10-Day Posture Photo Reviews", "Direct WhatsApp & Call Support", "Custom Workout Splits"]
  },
  {
    id: 'default-3',
    plan_name: "15 Days Pass",
    category: "MRK FITNESS",
    description: "A flexible short-term membership for rapid body reset.",
    pricing: [
      { duration: "15 Days", price: 999 }
    ],
    features: ["Unlimited Gym Access", "Cardio & Strength Training", "Certified Trainer Guidance", "Nutrition Guidance", "Clean Facilities"]
  },
  {
    id: 'default-4',
    plan_name: "Daily Access Pass",
    category: "MRK FITNESS",
    description: "Single day drop-in pass.",
    pricing: [
      { duration: "1 Day", price: 99 }
    ],
    features: ["Full Gym Access", "Cardio Zone & Weights", "Locker Facility", "Trainer Assistance"]
  }
];

export default function HomePage() {
  const router = useRouter();
  const { user, userData } = useAuth();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Responsive Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Interactive Calorie Estimator State
  const [calcWeight, setCalcWeight] = useState(75);
  const [calcHeight, setCalcHeight] = useState(175);
  const [calcGoal, setCalcGoal] = useState('fatloss');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function loadPlans() {
      try {
        const plansData = await getPlans();
        if (plansData && plansData.length > 0) {
          setPlans(plansData);
        } else {
          setPlans(DEFAULT_PLANS);
        }
      } catch (err) {
        console.error('Failed to load plans from database, using defaults:', err);
        setPlans(DEFAULT_PLANS);
      } finally {
        setLoadingPlans(false);
      }
    }
    loadPlans();
  }, []);

  const handlePortalRedirect = () => {
    if (!user) {
      router.push('/login');
    } else if (userData?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/client');
    }
  };

  const calculateCalories = () => {
    const bmr = 10 * calcWeight + 6.25 * calcHeight - 5 * 25 + 5;
    const maintenance = Math.round(bmr * 1.4);
    if (calcGoal === 'fatloss') return maintenance - 400;
    if (calcGoal === 'muscle') return maintenance + 350;
    return maintenance;
  };

  const estimatedCalories = calculateCalories();

  return (
    <div style={styles.pageWrapper}>
      {/* 1. Header Navigation Bar */}
      <header style={styles.navHeader}>
        <div style={styles.navContainer}>
          <div style={styles.brandGroup} onClick={() => router.push('/')}>
            <img src="/mrk-logo.png" alt="MRK FITNESS" style={{ height: isMobile ? '32px' : '42px', width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* Desktop Navigation Links */}
          {!isMobile && (
            <nav style={styles.navLinks}>
              <a href="#about" style={styles.link}>Who is MRK?</a>
              <a href="#specializations" style={styles.link}>Specializations</a>
              <a href="#offerings" style={styles.link}>Program Features</a>
              <a href="#calculator" style={styles.link}>Calculator</a>
              <a href="#plans" style={styles.link}>Pricing Plans</a>
              <a href="/contact" style={styles.link}>Contact Us</a>
            </nav>
          )}

          {/* Desktop Actions / Mobile Menu Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isMobile && (
              <div style={styles.navActions}>
                {user ? (
                  <Button onClick={handlePortalRedirect} style={styles.portalBtn}>
                    <ShieldCheck size={16} /> Portal Dashboard
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => router.push('/login')} style={{ fontSize: '0.85rem' }}>
                      Log In
                    </Button>
                    <Button onClick={() => router.push('/login')} style={styles.ctaHeaderBtn}>
                      Get Started <ArrowRight size={16} />
                    </Button>
                  </>
                )}
              </div>
            )}

            {isMobile && (
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                style={styles.hamburgerBtn}
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X size={22} color="#FFFFFF" /> : <Menu size={22} color="#FFFFFF" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Slide-out Drawer Menu */}
        {isMobile && isMobileMenuOpen && (
          <div style={styles.mobileDrawer} className="animate-fade-up">
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>
              Who is MRK?
            </a>
            <a href="#specializations" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>
              Specializations
            </a>
            <a href="#offerings" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>
              Program Features
            </a>
            <a href="#calculator" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>
              Calculator
            </a>
            <a href="#plans" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>
              Pricing Plans
            </a>
            <a href="/contact" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>
              Contact Us
            </a>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {user ? (
                <Button onClick={() => { setIsMobileMenuOpen(false); handlePortalRedirect(); }} style={{ width: '100%' }}>
                  <ShieldCheck size={16} /> Portal Dashboard
                </Button>
              ) : (
                <>
                  <Button onClick={() => { setIsMobileMenuOpen(false); router.push('/login'); }} style={{ width: '100%' }}>
                    Get Started / Login <ArrowRight size={16} />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Banner Section */}
      <section style={{ ...styles.heroSection, padding: isMobile ? '40px 16px 50px 16px' : '70px 16px 80px 16px' }}>
        <div style={styles.heroGlow1} />
        <div style={styles.heroGlow2} />
        <div style={styles.heroGlow3} />

        <div style={styles.heroContainer}>
          <div style={styles.heroBadge}>
            <Sparkles size={14} color="var(--accent, #E00008)" />
            <span>START YOUR JOURNEY WITH MRK FITNESS</span>
          </div>

          <h1 style={{ ...styles.heroTitle, fontSize: isMobile ? '1.8rem' : '2.6rem' }}>
            LET US BUILD THE <br />
            <span style={styles.gradientText}>BEST VERSION OF YOU</span>
          </h1>

          <p style={{ ...styles.heroSubtitle, fontSize: isMobile ? '0.88rem' : '0.98rem' }}>
            Personalized strength training routines, scientific fat-loss diets, weekly check-ins, and 24/7 direct coaching by Head Coach <strong>Radha Krishna Maram</strong>.
          </p>

          <div style={{ ...styles.heroBtnGroup, flexDirection: isMobile ? 'column' : 'row' }}>
            <Button onClick={handlePortalRedirect} style={{ ...styles.mainCtaBtn, width: isMobile ? '100%' : 'auto', justifyContent: 'center' }} className="pulse-glow">
              Start Your Journey Now <ChevronRight size={18} />
            </Button>
            <a 
              href="https://instagram.com/__MRK.FITNESS.__" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ ...styles.instaBtn, justifyContent: 'center', width: isMobile ? '100%' : 'auto' }}
            >
              <InstagramIcon size={18} color="#e1306c" /> DM on Instagram
            </a>
          </div>

          {/* Key Program Highlights Row */}
          <div style={{ ...styles.heroStatsRow, padding: isMobile ? '12px 14px' : '16px 28px', gap: isMobile ? '12px' : '24px' }}>
            <div style={styles.statBox}>
              <div style={{ ...styles.statNumber, fontSize: isMobile ? '1.1rem' : '1.4rem' }}>2+ Years</div>
              <div style={styles.statLabel}>Specialized Coaching</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statBox}>
              <div style={{ ...styles.statNumber, fontSize: isMobile ? '1.1rem' : '1.4rem' }}>100%</div>
              <div style={styles.statLabel}>Custom Plans</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statBox}>
              <div style={{ ...styles.statNumber, fontSize: isMobile ? '1.1rem' : '1.4rem' }}>24 / 7</div>
              <div style={styles.statLabel}>Direct Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHO IS MRK? (Coach Profile Section) */}
      <section id="about" style={{ ...styles.section, padding: isMobile ? '30px 16px' : '60px 16px' }}>
        <Card style={{ ...styles.aboutCard, padding: isMobile ? '16px' : '24px' }} className="glass-card">
          <div style={styles.aboutGrid}>
            {/* Coach Circle Avatar */}
            <div style={styles.aboutPhotoCol}>
              <div style={{ ...styles.coachAvatarCircle, width: isMobile ? '90px' : '120px', height: isMobile ? '90px' : '120px' }}>
                <img 
                  src="/images/mrk_coach_avatar.jpg" 
                  alt="Radha Krishna Maram" 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                />
              </div>
              <h3 style={{ ...styles.coachName, fontSize: isMobile ? '1.15rem' : '1.35rem' }}>Radha Krishna Maram</h3>
              <p style={styles.coachTitle}>Personal Fitness Trainer & Strength & Weight-Loss Specialist</p>
              
              <a 
                href="https://instagram.com/__MRK.FITNESS.__" 
                target="_blank" 
                rel="noreferrer" 
                style={styles.socialPill}
              >
                <InstagramIcon size={16} color="#e1306c" />
                <span style={{ color: '#FFFFFF', fontWeight: 700 }}>@__MRK.FITNESS.__</span>
              </a>
            </div>

            {/* Coach Bio Text */}
            <div style={styles.aboutTextCol}>
              <div style={styles.sectionBadge}>MEET YOUR HEAD COACH</div>
              <h2 style={{ ...styles.aboutHeadline, fontSize: isMobile ? '1.3rem' : '1.6rem' }}>WHO IS <span style={{ color: 'var(--accent, #E00008)' }}>MRK?</span></h2>

              <p style={styles.bioParagraph}>
                <strong>Radha Krishna Maram</strong> is a dedicated Personal Fitness Trainer and Strength & Weight-Loss Specialist with over two years of hands-on experience helping individuals transform their bodies and lifestyles.
              </p>

              <p style={styles.bioParagraph}>
                With expertise in designing personalized training programs, strength-building routines, and fat-loss strategies, he brings a results-driven yet supportive approach to fitness. His background spans corporate, commercial, and individual coaching environments where he has consistently guided clients toward sustainable progress through structured workouts, nutritional awareness, and goal-focused planning.
              </p>

              <div style={styles.bioParagraphHighlight}>
                "Passionate, knowledgeable, and committed to client success, Radha Krishna Maram embodies the perfect blend of discipline, motivation, and practical fitness education."
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. SPECIALIZATIONS SECTION */}
      <section id="specializations" style={{ ...styles.section, background: 'rgba(18, 18, 20, 0.4)', padding: isMobile ? '30px 16px' : '60px 16px' }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>EXPERT CORE CAPABILITIES</span>
          <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? '1.3rem' : '1.6rem' }}>SPECIALIZATIONS</h2>
          <p style={styles.sectionSub}>Targeted fitness protocols engineered for permanent body transformations.</p>
        </div>

        <div style={styles.specGrid}>
          <Card style={styles.specCard} className="glass-card">
            <div style={styles.specIconBox}>
              <Dumbbell size={22} color="var(--accent, #E00008)" />
            </div>
            <h3 style={styles.specTitle}>Strength Training</h3>
            <p style={styles.specDesc}>
              Progressive overload routines designed to build lean muscle mass, improve bone density, and maximize raw physical strength.
            </p>
          </Card>

          <Card style={styles.specCard} className="glass-card">
            <div style={styles.specIconBox}>
              <Flame size={22} color="#ff9100" />
            </div>
            <h3 style={styles.specTitle}>Fat Loss Diets & Workout Plans</h3>
            <p style={styles.specDesc}>
              Calculated calorie deficit protocols paired with metabolic resistance workouts for accelerated body fat reduction.
            </p>
          </Card>

          <Card style={styles.specCard} className="glass-card">
            <div style={styles.specIconBox}>
              <Target size={22} color="#00c853" />
            </div>
            <h3 style={styles.specTitle}>Goal Setting & Achievement Strategies</h3>
            <p style={styles.specDesc}>
              Structured milestone tracking and psychological discipline techniques to guarantee weekly progress accountability.
            </p>
          </Card>

          <Card style={styles.specCard} className="glass-card">
            <div style={styles.specIconBox}>
              <Award size={22} color="#ab47bc" />
            </div>
            <h3 style={styles.specTitle}>Personalized Program Design</h3>
            <p style={styles.specDesc}>
              Fully customized workout splits and meal structures tailored to your daily work schedule, body type, and dietary preferences.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. PROGRAM OFFERINGS & FEATURES */}
      <section id="offerings" style={{ ...styles.section, padding: isMobile ? '30px 16px' : '60px 16px' }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>WHAT YOU GET WITH MRK FITNESS</span>
          <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? '1.3rem' : '1.6rem' }}>PROGRAM FEATURES & INCLUSIONS</h2>
          <p style={styles.sectionSub}>Complete 360-degree support to build the best version of you.</p>
        </div>

        <div style={styles.offeringsGrid}>
          <div style={styles.offeringCard} className="glass-card">
            <div style={styles.offeringCheck}>
              <Check size={14} color="#FFFFFF" />
            </div>
            <span style={styles.offeringText}>Custom Workout Plan</span>
          </div>

          <div style={styles.offeringCard} className="glass-card">
            <div style={styles.offeringCheck}>
              <Check size={14} color="#FFFFFF" />
            </div>
            <span style={styles.offeringText}>Personalized Diet Plan</span>
          </div>

          <div style={styles.offeringCard} className="glass-card">
            <div style={styles.offeringCheck}>
              <Check size={14} color="#FFFFFF" />
            </div>
            <span style={styles.offeringText}>Weekly Check-ins</span>
          </div>

          <div style={styles.offeringCard} className="glass-card">
            <div style={styles.offeringCheck}>
              <Check size={14} color="#FFFFFF" />
            </div>
            <span style={styles.offeringText}>Fat Loss / Muscle Gain Programs</span>
          </div>

          <div style={styles.offeringCard} className="glass-card">
            <div style={styles.offeringCheck}>
              <Check size={14} color="#FFFFFF" />
            </div>
            <span style={styles.offeringText}>24/7 Direct Support</span>
          </div>

          <div style={styles.offeringCard} className="glass-card">
            <div style={styles.offeringCheck}>
              <Check size={14} color="#FFFFFF" />
            </div>
            <span style={styles.offeringText}>Home & Gym Workouts Available</span>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE CALORIE & NUTRITION CALCULATOR */}
      <section id="calculator" style={{ ...styles.section, background: 'rgba(18, 18, 20, 0.4)', padding: isMobile ? '30px 16px' : '60px 16px' }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>FREE FITNESS WIDGET</span>
          <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? '1.3rem' : '1.6rem' }}>Estimate Your Daily Nutrition Target</h2>
          <p style={styles.sectionSub}>Get an instant estimate of your required calorie & macro intake.</p>
        </div>

        <Card style={{ ...styles.calcCard, padding: isMobile ? '16px' : '24px' }} className="glass-card">
          <div style={styles.calcGrid}>
            <div style={styles.calcInputsCol}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Your Weight (kg): <strong style={{ color: '#FFFFFF' }}>{calcWeight} kg</strong></label>
                <input 
                  type="range" 
                  min="40" 
                  max="140" 
                  value={calcWeight} 
                  onChange={(e) => setCalcWeight(Number(e.target.value))}
                  style={styles.slider}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Your Height (cm): <strong style={{ color: '#FFFFFF' }}>{calcHeight} cm</strong></label>
                <input 
                  type="range" 
                  min="140" 
                  max="210" 
                  value={calcHeight} 
                  onChange={(e) => setCalcHeight(Number(e.target.value))}
                  style={styles.slider}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Transformation Goal:</label>
                <div style={styles.goalBtnRow}>
                  <button 
                    onClick={() => setCalcGoal('fatloss')}
                    style={{ ...styles.goalBtn, ...(calcGoal === 'fatloss' ? styles.goalBtnActive : {}) }}
                  >
                    🔥 Fat Loss
                  </button>

                  <button 
                    onClick={() => setCalcGoal('muscle')}
                    style={{ ...styles.goalBtn, ...(calcGoal === 'muscle' ? styles.goalBtnActive : {}) }}
                  >
                    💪 Muscle
                  </button>

                  <button 
                    onClick={() => setCalcGoal('maintenance')}
                    style={{ ...styles.goalBtn, ...(calcGoal === 'maintenance' ? styles.goalBtnActive : {}) }}
                  >
                    ⚡ Maintain
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.calcResultsCol}>
              <div style={styles.resultBadge}>RECOMMENDED TARGET</div>
              <div style={{ ...styles.resultCalorie, fontSize: isMobile ? '1.8rem' : '2.2rem' }}>{estimatedCalories} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Kcal / day</span></div>

              <div style={styles.macroPillsRow}>
                <div style={styles.macroPill}>
                  <span style={{ color: '#ff5252' }}>Protein</span>
                  <strong>{Math.round(calcWeight * 2.2)}g</strong>
                </div>
                <div style={styles.macroPill}>
                  <span style={{ color: '#448aff' }}>Carbs</span>
                  <strong>{Math.round((estimatedCalories * 0.4) / 4)}g</strong>
                </div>
                <div style={styles.macroPill}>
                  <span style={{ color: '#ffb300' }}>Fats</span>
                  <strong>{Math.round((estimatedCalories * 0.25) / 9)}g</strong>
                </div>
              </div>

              <Button onClick={() => router.push('/login')} style={{ width: '100%', marginTop: '16px' }}>
                Get Custom MRK Plan for {calcWeight}kg <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 7. PRICING & MEMBERSHIP TIERS */}
      <section id="plans" style={{ ...styles.section, padding: isMobile ? '30px 16px' : '60px 16px' }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>JOIN MRK FITNESS</span>
          <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? '1.3rem' : '1.6rem' }}>MEMBERSHIP & PRICING PLANS</h2>
          <p style={styles.sectionSub}>Choose your commitment level and start transforming today.</p>
        </div>

        {loadingPlans ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spinner />
          </div>
        ) : (
          <div style={styles.plansGrid}>
            {plans.map((p, idx) => {
              const lowestTier = (p.pricing || []).sort((a, b) => (a.price || 0) - (b.price || 0))[0];
              const priceDisplay = lowestTier ? `₹${lowestTier.price}` : 'Custom';

              return (
                <Card key={p.id || idx} style={{ ...styles.planCard, padding: isMobile ? '16px' : '20px' }} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={styles.planName}>{p.plan_name || p.name}</h3>
                    {p.badge && (
                      <div style={styles.planBadgeInline}>{p.badge}</div>
                    )}
                  </div>
                  <p style={styles.planCategory}>MRK FITNESS</p>

                  <div style={styles.planPriceBox}>
                    <span style={styles.planPrice}>{priceDisplay}</span>
                    <span style={styles.planPeriod}> / {lowestTier?.duration || 'period'}</span>
                  </div>

                  <div style={styles.planFeatureList}>
                    {(p.features || [
                      'Custom Workout Plan',
                      'Personalized Diet Plan',
                      'Weekly Check-ins',
                      '24/7 Trainer Support'
                    ]).map((feat, fIdx) => (
                      <div key={fIdx} style={styles.planFeatureItem}>
                        <CheckCircle2 size={15} color="#00c853" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <Button onClick={() => router.push('/login')} style={{ width: '100%', marginTop: '16px', fontWeight: 800 }}>
                    Enroll Now <ArrowRight size={16} />
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 8. FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerContainer}>
          <div style={styles.footerBrand}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/mrk-logo.png" alt="MRK FITNESS" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            </div>
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary, #AAAAAA)', fontSize: '0.85rem', maxWidth: '340px' }}>
              Guided by Radha Krishna Maram. Personalized fitness coaching, strength training, and sustainable weight-loss planning.
            </p>
            <div style={{ marginTop: '14px' }}>
              <a 
                href="https://instagram.com/__MRK.FITNESS.__" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#e1306c', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}
              >
                <InstagramIcon size={18} /> Follow @__MRK.FITNESS.__
              </a>
            </div>
          </div>

          <div style={styles.footerLinksGroup}>
            <div style={styles.footerCol}>
              <h4 style={styles.footerColTitle}>Navigation</h4>
              <a href="#about" style={styles.footerLink}>Who is MRK?</a>
              <a href="#specializations" style={styles.footerLink}>Specializations</a>
              <a href="#offerings" style={styles.footerLink}>Program Features</a>
              <a href="#plans" style={styles.footerLink}>Pricing Plans</a>
              <a href="/contact" style={styles.footerLink}>Contact Support</a>
            </div>

            <div style={styles.footerCol}>
              <h4 style={styles.footerColTitle}>Portals</h4>
              <a href="/login" style={styles.footerLink}>Client Login</a>
              <a href="/login" style={styles.footerLink}>Admin Login</a>
            </div>
          </div>
        </div>

        <div style={styles.footerBottom}>
          © {new Date().getFullYear()} MRK FITNESS — Radha Krishna Maram. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

const styles = {
  pageWrapper: { backgroundColor: 'var(--bg, #080808)', color: '#FFFFFF', minHeight: '100vh', overflowX: 'hidden' },
  navHeader: { position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(18, 18, 20, 0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' },
  navContainer: { maxWidth: '1100px', margin: '0 auto', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brandGroup: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  logoIcon: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--accent, #E00008)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brandTitle: { fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.3px', margin: 0, lineHeight: 1 },
  brandSub: { fontSize: '0.58rem', fontWeight: 700, color: 'var(--accent, #E00008)', letterSpacing: '1px', marginTop: '2px' },
  navLinks: { display: 'flex', gap: '18px' },
  link: { color: 'var(--text-secondary, #AAAAAA)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, transition: 'color 0.2s' },
  navActions: { display: 'flex', alignItems: 'center', gap: '10px' },
  portalBtn: { fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' },
  ctaHeaderBtn: { fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' },
  hamburgerBtn: { width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  mobileDrawer: { 
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: '20px 16px 24px 16px', 
    backgroundColor: 'rgba(10, 10, 12, 0.98)', 
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.12)', 
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.9)',
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px' 
  },
  mobileLink: { 
    color: '#FFFFFF', 
    textDecoration: 'none', 
    fontSize: '0.9rem', 
    fontWeight: 700, 
    padding: '10px 14px', 
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px'
  },
  heroSection: { position: 'relative', textAlign: 'center', overflow: 'hidden' },
  heroGlow1: { position: 'absolute', top: '-100px', left: '15%', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(224, 0, 8, 0.22)', filter: 'blur(100px)', pointerEvents: 'none' },
  heroGlow2: { position: 'absolute', top: '100px', right: '15%', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(255, 145, 0, 0.14)', filter: 'blur(100px)', pointerEvents: 'none' },
  heroGlow3: { position: 'absolute', bottom: '0', left: '40%', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(224, 0, 8, 0.1)', filter: 'blur(90px)', pointerEvents: 'none' },
  heroContainer: { maxWidth: '850px', margin: '0 auto', position: 'relative', zIndex: 1 },
  heroBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(224, 0, 8, 0.15)', border: '1px solid rgba(224, 0, 8, 0.35)', color: 'var(--accent, #E00008)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800, marginBottom: '18px' },
  heroTitle: { fontWeight: 900, margin: '0 0 16px 0', letterSpacing: '-0.03em', lineHeight: 1.1 },
  gradientText: { background: 'linear-gradient(135deg, var(--accent, #E00008) 0%, #ff9100 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroSubtitle: { color: 'var(--text-secondary, #AAAAAA)', margin: '0 0 30px 0', lineHeight: 1.6 },
  heroBtnGroup: { display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '30px' },
  mainCtaBtn: { padding: '12px 24px', fontSize: '0.92rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' },
  instaBtn: { padding: '12px 20px', borderRadius: '10px', backgroundColor: 'rgba(225, 48, 108, 0.15)', border: '1px solid rgba(225, 48, 108, 0.35)', color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' },
  heroStatsRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', backgroundColor: 'rgba(18, 18, 20, 0.85)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' },
  statBox: { textAlign: 'center' },
  statNumber: { fontWeight: 900, color: '#FFFFFF' },
  statLabel: { fontSize: '0.7rem', color: 'var(--text-secondary, #AAAAAA)', marginTop: '2px' },
  statDivider: { width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  section: { maxWidth: '1100px', margin: '0 auto' },
  sectionHeader: { textAlign: 'center', marginBottom: '30px' },
  sectionBadge: { fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent, #E00008)', textTransform: 'uppercase', letterSpacing: '1px' },
  sectionTitle: { fontWeight: 900, margin: '6px 0 8px 0', letterSpacing: '-0.02em' },
  sectionSub: { fontSize: '0.85rem', color: 'var(--text-secondary, #AAAAAA)', margin: 0 },
  aboutCard: {},
  aboutGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', alignItems: 'center' },
  aboutPhotoCol: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  coachAvatarCircle: { borderRadius: '50%', backgroundColor: 'rgba(224, 0, 8, 0.15)', border: '2px solid var(--accent, #E00008)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(224, 0, 8, 0.35)', flexShrink: 0 },
  coachName: { fontWeight: 900, margin: '4px 0 2px 0', color: '#FFFFFF' },
  coachTitle: { fontSize: '0.78rem', color: 'var(--text-secondary, #AAAAAA)', margin: 0 },
  socialPill: { marginTop: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(225, 48, 108, 0.15)', border: '1px solid rgba(225, 48, 108, 0.3)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', textDecoration: 'none' },
  aboutTextCol: { display: 'flex', flexDirection: 'column', gap: '10px' },
  aboutHeadline: { fontWeight: 900, margin: '4px 0 10px 0', color: '#FFFFFF' },
  bioParagraph: { fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, margin: 0 },
  bioParagraphHighlight: { fontSize: '0.85rem', color: '#FFFFFF', fontStyle: 'italic', lineHeight: 1.6, margin: 0, paddingLeft: '12px', borderLeft: '3px solid var(--accent, #E00008)' },
  specGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' },
  specCard: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  specIconBox: { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  specTitle: { fontSize: '0.98rem', fontWeight: 800, margin: 0, color: '#FFFFFF' },
  specDesc: { fontSize: '0.8rem', color: 'var(--text-secondary, #AAAAAA)', margin: 0, lineHeight: 1.5 },
  offeringsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' },
  offeringCard: { padding: '14px', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '12px' },
  offeringCheck: { width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent, #E00008)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  offeringText: { fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' },
  calcCard: {},
  calcGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', alignItems: 'center' },
  calcInputsCol: { display: 'flex', flexDirection: 'column', gap: '14px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.82rem', color: 'var(--text-secondary, #AAAAAA)' },
  slider: { width: '100%', accentColor: 'var(--accent, #E00008)', cursor: 'pointer' },
  goalBtnRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  goalBtn: { flex: 1, padding: '8px 10px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  goalBtnActive: { backgroundColor: 'rgba(224, 0, 8, 0.15)', color: '#FFFFFF', borderColor: 'var(--accent, #E00008)' },
  calcResultsCol: { padding: '16px', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' },
  resultBadge: { fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent, #E00008)', letterSpacing: '0.5px' },
  resultCalorie: { fontWeight: 800, color: '#FFFFFF', margin: '4px 0 10px 0' },
  macroPillsRow: { display: 'flex', justifyContent: 'space-around', gap: '6px', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' },
  macroPill: { display: 'flex', flexDirection: 'column', fontSize: '0.72rem' },
  plansGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' },
  planCard: { display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' },
  planBadgeInline: { backgroundColor: 'rgba(224, 0, 8, 0.18)', color: 'var(--accent, #E00008)', border: '1px solid rgba(224, 0, 8, 0.4)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 },
  planName: { fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' },
  planCategory: { fontSize: '0.72rem', color: 'var(--text-secondary, #AAAAAA)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  planPriceBox: { display: 'flex', alignItems: 'baseline', marginBottom: '14px' },
  planPrice: { fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF' },
  planPeriod: { fontSize: '0.78rem', color: 'var(--text-secondary, #AAAAAA)' },
  planFeatureList: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  planFeatureItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.85)' },
  footer: { borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(10, 10, 12, 0.95)', padding: '40px 16px 20px 16px' },
  footerContainer: { maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' },
  footerBrand: { flex: 1, minWidth: '220px' },
  footerLinksGroup: { display: 'flex', gap: '30px', flexWrap: 'wrap' },
  footerCol: { display: 'flex', flexDirection: 'column', gap: '6px' },
  footerColTitle: { fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' },
  footerLink: { color: 'var(--text-secondary, #AAAAAA)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' },
  footerBottom: { maxWidth: '1100px', margin: '20px auto 0 auto', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center', color: 'var(--text-muted, #666666)', fontSize: '0.72rem' }
};
