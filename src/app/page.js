'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getPlans } from '@/lib/firestore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PlanCard from '@/components/ui/PlanCard';
import { Spinner } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
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
  ChevronLeft,
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
  X,
  HelpCircle,
  ChevronDown,
  MessageCircle,
  CheckSquare,
  Heart,
  ShieldAlert
} from 'lucide-react';

function InstagramIcon({ size = 18, color = "var(--accent, #E00008)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const DEFAULT_PLANS = [
  {
    id: 'default-1',
    plan_name: "Cardio + Strength",
    category: "MRK FITNESS COACH",
    badge: "Most Popular 🔥",
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
    category: "MRK FITNESS COACH",
    badge: "VIP 1-on-1 Coaching 👑",
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
    category: "MRK FITNESS COACH",
    description: "A flexible short-term membership for rapid body reset.",
    pricing: [
      { duration: "15 Days", price: 999 }
    ],
    features: ["Unlimited Gym Access", "Cardio & Strength Training", "Certified Trainer Guidance", "Nutrition Guidance", "Clean Facilities"]
  },
  {
    id: 'default-4',
    plan_name: "Daily Access Pass",
    category: "MRK FITNESS COACH",
    description: "Single day drop-in pass for workout enthusiasts.",
    pricing: [
      { duration: "1 Day", price: 99 }
    ],
    features: ["Full Gym Access", "Cardio Zone & Weights", "Locker Facility", "Trainer Assistance"]
  }
];

const FAQS = [
  {
    q: "How does the MRK FITNESS COACH online & in-gym coaching work?",
    a: "Every member gets a personalized dashboard. Head Fitness Coach Radha Krishna Maram designs your custom workout split and macro-balanced diet plan based on your intake assessment (goals, injuries, medical conditions). You submit daily activity logs and 10-day posture photos for continuous progress tracking."
  },
  {
    q: "What is included in the 10-Day Body Posture & Sizing Check-in?",
    a: "Every 10 days, you upload 4-side posture photos (Front, Back, Left, Right) along with 14-point body measurements (weight, waist, chest, arms, legs). Fitness Coach Radha Krishna reviews your photos and measurements to tweak your diet and workout routines for non-stop results."
  },
  {
    q: "Do I get a customized diet plan according to my dietary preferences?",
    a: "Yes! Diet plans are 100% customized for VEG, NON-VEG, EGGETARIAN, and VEGAN preferences. Meal slots (Breakfast, Pre-Workout, Post-Workout, Lunch, Dinner) list exact quantities and macro totals tailored to your target calories."
  },
  {
    q: "Can beginners join Personal Training with Head Fitness Coach Radha Krishna Maram?",
    a: "Absolutely! Whether you are a beginner taking your first steps or an advanced lifter aiming for peak performance, Fitness Coach Radha Krishna provides step-by-step guidance, form correction, and custom training splits."
  }
];

const transformationSlides = [
  { src: '/images/t1.png', title: '100% Natural Body Transformation', tag: 'Fat Loss & Muscle Building' },
  { src: '/images/t2.png', title: 'Body Recomposition & Core Sculpting', tag: 'Custom Diet & Workout Protocol' },
  { src: '/images/t3.png', title: 'Physique Transformation Results', tag: '1-on-1 Fitness Coaching' },
  { src: '/images/t4.png', title: 'Weight Loss & Endurance Transformation', tag: 'Dedicated Client Progress' },
  { src: '/images/t5.png', title: 'Lean Muscle Mass & Posture Transformation', tag: 'MRK Fitness Protocol' },
];

export default function HomePage() {
  const toast = useToast();
  const router = useRouter();
  const { user, userData } = useAuth();

  const [currentTransSlide, setCurrentTransSlide] = useState(0);
  const [selectedFullTransImage, setSelectedFullTransImage] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTransSlide(prev => (prev + 1) % transformationSlides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Responsive Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Interactive Calorie & Nutrition Calculator State
  const [calcWeight, setCalcWeight] = useState(75);
  const [calcHeight, setCalcHeight] = useState(175);
  const [calcAge, setCalcAge] = useState(28);
  const [calcGoal, setCalcGoal] = useState('fatloss');

  // Selected pricing tier map per plan
  const [selectedPricingMap, setSelectedPricingMap] = useState({});

  // Homepage Contact / Enquiry Form State
  const [homeContactForm, setHomeContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'Fat Loss',
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTime: 'Morning (9 AM - 12 PM)',
    message: ''
  });
  const [homeContactSubmitting, setHomeContactSubmitting] = useState(false);
  const [homeContactSubmitted, setHomeContactSubmitted] = useState(false);

  const handleHomeContactSubmit = async (e) => {
    e.preventDefault();
    if (!homeContactForm.name || !homeContactForm.email || !homeContactForm.message) {
      toast.warning('Please fill in Name, Email, and Message');
      return;
    }

    setHomeContactSubmitting(true);
    try {
      const { addEnquiry } = await import('@/lib/firestore');
      await addEnquiry({
        name: homeContactForm.name,
        email: homeContactForm.email,
        phone: homeContactForm.phone || '',
        category: homeContactForm.category || 'Fat Loss',
        preferredDate: homeContactForm.preferredDate || '',
        preferredTime: homeContactForm.preferredTime || '',
        message: homeContactForm.message,
        source: 'homepage_contact_form',
        status: 'new',
        createdAt: new Date().toISOString()
      });
      setHomeContactSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit enquiry. Please try again.');
    } finally {
      setHomeContactSubmitting(false);
    }
  };

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
        const activeOnly = (plansData || []).filter(p => p.status !== 'inactive');
        if (activeOnly && activeOnly.length > 0) {
          setPlans(activeOnly);
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
    const bmr = 10 * calcWeight + 6.25 * calcHeight - 5 * calcAge + 5;
    const maintenance = Math.round(bmr * 1.4);
    if (calcGoal === 'fatloss') return maintenance - 450;
    if (calcGoal === 'muscle') return maintenance + 350;
    return maintenance;
  };

  const estimatedCalories = calculateCalories();
  const proteinGrams = Math.round(calcWeight * 2.2);
  const carbsGrams = Math.round((estimatedCalories * 0.40) / 4);
  const fatGrams = Math.round((estimatedCalories * 0.25) / 9);

  return (
    <div style={styles.pageWrapper}>
      {/* 1. Sticky Navigation Header */}
      <header style={styles.navHeader}>
        <div style={styles.navContainer}>
          <div style={styles.brandGroup} onClick={() => router.push('/')}>
            <img src="/mrk-logo.png" alt="MRK FITNESS" style={{ height: isMobile ? '34px' : '44px', width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* Desktop Links */}
          {!isMobile && (
            <nav style={styles.navLinks}>
              <a href="#about" style={styles.link}>Who is MRK?</a>
              <a href="#reviews" style={styles.link}>Video Reviews</a>
              <a href="#special-populations" style={styles.link}>Special Populations</a>
              <a href="#specializations" style={styles.link}>Specializations</a>
              <a href="#offerings" style={styles.link}>Features</a>
              <a href="#calculator" style={styles.link}>Calorie Calculator</a>
              <a href="#plans" style={styles.link}>Pricing Plans</a>
              <a href="#faqs" style={styles.link}>FAQs</a>
              <a href="/contact" style={styles.link}>Contact</a>
            </nav>
          )}

          {/* Desktop Actions / Mobile Menu Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ ...styles.navActions, gap: isMobile ? '8px' : '14px' }}>
              {user ? (
                <Button onClick={handlePortalRedirect} style={{ ...styles.portalBtn, padding: isMobile ? '6px 12px' : '10px 20px', fontSize: isMobile ? '0.75rem' : '0.9rem' }}>
                  <ShieldCheck size={16} /> {!isMobile && 'Portal Dashboard'}
                </Button>
              ) : (
                <>
                  {!isMobile && (
                    <Button variant="ghost" onClick={() => router.push('/login')} style={{ fontSize: '0.85rem' }}>
                      Log In
                    </Button>
                  )}
                  <Button onClick={() => router.push('/login')} style={{ ...styles.ctaHeaderBtn, padding: isMobile ? '6px 14px' : '10px 22px', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                    {isMobile ? 'Login' : 'Get Started'} {!isMobile && <ArrowRight size={16} />}
                  </Button>
                </>
              )}
            </div>

            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={styles.hamburgerBtn}
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X size={22} color="#FFFFFF" /> : <Menu size={22} color="#FFFFFF" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Slide-out Drawer */}
        {isMobile && isMobileMenuOpen && (
          <div style={styles.mobileDrawer} className="animate-fade-up">
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>Who is MRK?</a>
            <a href="#reviews" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>Video Reviews</a>
            <a href="#special-populations" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>Special Populations</a>
            <a href="#specializations" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>Specializations</a>
            <a href="#offerings" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>Features</a>
            <a href="#calculator" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>Calorie Calculator</a>
            <a href="#plans" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>Pricing Plans</a>
            <a href="#faqs" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>FAQs</a>
            <a href="/contact" onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileLink}>Contact Us</a>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {user ? (
                <Button onClick={() => { setIsMobileMenuOpen(false); handlePortalRedirect(); }} style={{ width: '100%' }}>
                  <ShieldCheck size={16} /> Portal Dashboard
                </Button>
              ) : (
                <Button onClick={() => { setIsMobileMenuOpen(false); router.push('/login'); }} style={{ width: '100%' }}>
                  Get Started / Login <ArrowRight size={16} />
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section style={{ ...styles.heroSection, padding: isMobile ? '40px 16px 50px 16px' : '80px 16px 90px 16px' }}>
        <div style={styles.heroGlow1} />
        <div style={styles.heroGlow2} />
        <div style={styles.heroGlow3} />

        <div style={styles.heroContainer}>
          <div style={styles.heroBadge}>
            <Sparkles size={14} color="var(--accent, #E00008)" />
            <span>TRANSFORM YOUR BODY WITH MRK FITNESS COACH</span>
          </div>

          <h1 style={{ ...styles.heroTitle, fontSize: isMobile ? '2.1rem' : '3.2rem' }}>
            BUILD THE <span style={styles.gradientText}>BEST VERSION</span> <br />
            OF YOURSELF
          </h1>

          <p style={{ ...styles.heroSubtitle, fontSize: isMobile ? '0.9rem' : '1.05rem' }}>
            Personalized strength training routines, scientific fat-loss diets, 10-day posture reviews, and 24/7 direct coaching by Head Fitness Coach <strong>Radha Krishna Maram</strong>.
          </p>

          <div style={{ ...styles.heroBtnGroup, flexDirection: isMobile ? 'column' : 'row' }}>
            <Button onClick={() => router.push('/contact')} style={{ ...styles.mainCtaBtn, width: isMobile ? '100%' : 'auto', justifyContent: 'center' }} className="pulse-glow">
              Start Your Transformation <ChevronRight size={18} />
            </Button>
            <a
              href="https://www.instagram.com/_.mrk.fitness._?igsh=MTg2MnU3YjhzN2xrcg=="
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...styles.instaBtn, justifyContent: 'center', width: isMobile ? '100%' : 'auto' }}
            >
              <InstagramIcon size={18} color="var(--accent, #E00008)" /> DM Head Fitness Coach on Instagram
            </a>
          </div>

          {/* Key Program Highlights Bar */}
          <div style={{ ...styles.heroStatsRow, padding: isMobile ? '14px 16px' : '18px 32px', gap: isMobile ? '14px' : '32px' }}>
            <div style={styles.statBox}>
              <div style={{ ...styles.statNumber, fontSize: isMobile ? '1.2rem' : '1.5rem' }}>5 Years</div>
              <div style={styles.statLabel}>Specialized Coaching</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statBox}>
              <div style={{ ...styles.statNumber, fontSize: isMobile ? '1.2rem' : '1.5rem' }}>100%</div>
              <div style={styles.statLabel}>Custom Macro Diets</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statBox}>
              <div style={{ ...styles.statNumber, fontSize: isMobile ? '1.2rem' : '1.5rem' }}>Every 10 Days</div>
              <div style={styles.statLabel}>Posture Photo Audits</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statBox}>
              <div style={{ ...styles.statNumber, fontSize: isMobile ? '1.2rem' : '1.5rem' }}>24 / 7</div>
              <div style={styles.statLabel}>Direct Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHO IS MRK? (Coach Profile Section) */}
      <section id="about" style={{ ...styles.section, padding: isMobile ? '30px 16px' : '60px 16px' }}>
        <Card style={{ ...styles.aboutCard, padding: isMobile ? '18px' : '30px' }} className="glass-card">
          <div style={styles.aboutGrid}>
            {/* Coach Circle Avatar */}
            <div style={styles.aboutPhotoCol}>
              <div style={{ ...styles.coachAvatarCircle, width: isMobile ? '100px' : '130px', height: isMobile ? '100px' : '130px' }}>
                <img
                  src="/images/mrk_coach_avatar.jpg"
                  alt="Radha Krishna Maram"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  onError={(e) => { e.target.onerror = null; e.target.src = "/mrk-logo.png"; }}
                />
              </div>
              <h3 style={{ ...styles.coachName, fontSize: isMobile ? '1.2rem' : '1.4rem' }}>Radha Krishna Maram</h3>
              <p style={styles.coachTitle}>Head Fitness Coach & Strength Specialist</p>

              <a
                href="https://www.instagram.com/_.mrk.fitness._?igsh=MTg2MnU3YjhzN2xrcg=="
                target="_blank"
                rel="noreferrer"
                style={styles.socialPill}
              >
                <InstagramIcon size={16} color="var(--accent, #E00008)" />
                <span style={{ color: '#FFFFFF', fontWeight: 700 }}>@_.mrk.fitness._</span>
              </a>
            </div>

            {/* Coach Bio Text */}
            <div style={styles.aboutTextCol}>
              <div style={styles.sectionBadge}>MEET YOUR HEAD FITNESS COACH</div>
              <h2 style={{ ...styles.aboutHeadline, fontSize: isMobile ? '1.4rem' : '1.8rem' }}>WHO IS <span style={{ color: 'var(--accent, #E00008)' }}>MRK?</span></h2>

              <p style={styles.bioParagraph}>
                <strong>Radha Krishna Maram</strong> is a dedicated Fitness Coach and Strength & Weight-Loss Specialist with 5 years of hands-on experience helping individuals transform their bodies and lifestyles.
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

      {/* 3.4 REAL BODY TRANSFORMATIONS AUTO SLIDESHOW SECTION */}
      <section id="transformations" style={{ ...styles.section, padding: isMobile ? '35px 16px' : '65px 16px' }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>REAL MEMBER RESULTS</span>
          <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? '1.4rem' : '1.8rem' }}>
            BODY TRANSFORMATION GALLERY
          </h2>
          <p style={styles.sectionSub}>
            Explore real before & after physique transformations achieved through MRK FITNESS COACH programs.
          </p>
        </div>

        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          {/* Main Slideshow Card */}
          <Card style={{ padding: '0', overflow: 'hidden', borderRadius: '22px', border: '1px solid var(--border)', position: 'relative', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }} className="glass-card">
            <div 
              style={{ position: 'relative', width: '100%', height: isMobile ? '380px' : '560px', backgroundColor: '#000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onClick={() => setSelectedFullTransImage(transformationSlides[currentTransSlide].src)}
              title="Click to view full transformation image"
            >
              <img 
                src={transformationSlides[currentTransSlide].src}
                alt={transformationSlides[currentTransSlide].title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transition: 'all 0.5s ease-in-out',
                }}
              />
            </div>

            {/* Clean Title & Details Bar Below Image (Unobscured) */}
            <div style={{ padding: '16px 22px', backgroundColor: 'var(--card)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <Badge variant="danger" style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 8px' }}>
                    🔥 {transformationSlides[currentTransSlide].tag}
                  </Badge>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Transformation {currentTransSlide + 1} of {transformationSlides.length}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: isMobile ? '1.05rem' : '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {transformationSlides[currentTransSlide].title}
                </h3>
              </div>

              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setSelectedFullTransImage(transformationSlides[currentTransSlide].src)}
                style={{ fontSize: '0.82rem', fontWeight: 700, padding: '8px 16px' }}
              >
                🔍 View Fullscreen
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* 3.5 CLIENT VIDEO REVIEWS & TRANSFORMATIONS SECTION */}
      <section id="reviews" style={{ ...styles.section, background: 'rgba(18, 18, 20, 0.4)', padding: isMobile ? '35px 16px' : '65px 16px' }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>REAL MEMBER RESULTS</span>
          <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? '1.4rem' : '1.8rem' }}>CLIENT VIDEO REVIEWS & TRANSFORMATIONS</h2>
          <p style={styles.sectionSub}>Watch real video reviews and body transformation testimonials from MRK FITNESS COACH clients.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '22px', maxWidth: '960px', margin: '0 auto' }}>
          <Card style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }} className="glass-card">
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' }}>
              <video 
                controls 
                playsInline 
                preload="metadata"
                style={{ width: '100%', maxHeight: '480px', borderRadius: '12px', objectFit: 'contain', display: 'block' }}
              >
                <source src="/WhatsApp Video 2026-08-06 at 10.40.29 PM.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div style={{ padding: '12px 6px 4px 6px', textAlign: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                🎬 Member Transformation Review
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Client Video Testimonial • MRK FITNESS COACH Program
              </p>
            </div>
          </Card>

          <Card style={{ padding: '14px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }} className="glass-card">
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' }}>
              <video 
                controls 
                playsInline 
                preload="metadata"
                style={{ width: '100%', maxHeight: '480px', borderRadius: '12px', objectFit: 'contain', display: 'block' }}
              >
                <source src="/WhatsApp Video 2026-08-06 at 6.46.50 AM (1).mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div style={{ padding: '12px 6px 4px 6px', textAlign: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                🎥 Client Weight Loss Journey Review
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Real Client Video Review • 1-on-1 Fitness Coaching
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* 3.6 SPECIAL POPULATION MONITORING SECTION */}
      <section id="special-populations" style={{ ...styles.section, padding: isMobile ? '35px 16px' : '65px 16px' }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>CLINICAL & ADAPTIVE FITNESS</span>
          <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? '1.4rem' : '1.8rem' }}>SPECIAL POPULATION MONITORING</h2>
          <p style={styles.sectionSub}>Customized fitness, nutrition & rehab protocols tailored for specific health conditions.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* 1. Diabetic Clients */}
          <Card style={{ padding: '20px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px' }} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(0, 176, 255, 0.15)', borderRadius: '12px', color: '#00b0ff' }}>
                <Activity size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>Diabetic Clients</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Specialized glycemic control macro diets, low-GI food timing, glucose tracking audits, and insulin-sensitivity enhancement workouts.
            </p>
          </Card>

          {/* 2. PCOS-Related Clients */}
          <Card style={{ padding: '20px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px' }} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(233, 30, 99, 0.15)', borderRadius: '12px', color: '#e91e63' }}>
                <Heart size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>PCOS / PCOD Related Clients</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Hormone-balancing nutrition, low-cortisol resistance training, anti-inflammatory meal planning, and cycle-aware exercise splits.
            </p>
          </Card>

          {/* 3. Thyroid Clients */}
          <Card style={{ padding: '20px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px' }} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(156, 39, 176, 0.15)', borderRadius: '12px', color: '#ab47bc' }}>
                <Zap size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>Thyroid Clients</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Metabolic boost meal splits, energy management protocols, thyroid-safe resistance training, and weight stabilization plans.
            </p>
          </Card>

          {/* 4. Joint/Knee Pain Clients */}
          <Card style={{ padding: '20px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px' }} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(255, 145, 0, 0.15)', borderRadius: '12px', color: '#ff9100' }}>
                <ShieldAlert size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>Joint & Knee Pain Clients</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Low-impact hypertrophy, patellar tendon protection, cartilage-friendly mobility drills, and pain-free strength conditioning.
            </p>
          </Card>

          {/* 5. Disc Bulge & Spinal Problem Clients */}
          <Card style={{ padding: '20px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px' }} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(224, 0, 8, 0.15)', borderRadius: '12px', color: '#E00008' }}>
                <Activity size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>Disc Bulge & Spinal Problem</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Herniation-safe core stabilization, posterior chain balance, zero-axial-load resistance training, and spinal realignment.
            </p>
          </Card>

          {/* 6. Postpartum Recovery Clients */}
          <Card style={{ padding: '20px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px' }} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(0, 200, 83, 0.15)', borderRadius: '12px', color: '#00c853' }}>
                <UserCheck size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>Postpartum Recovery Clients</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Pelvic floor rehabilitation, diastasis recti repair, post-pregnancy body recomposition, and progressive stamina building.
            </p>
          </Card>

          {/* 7. Senior Fitness Concerns (50+ Years) */}
          <Card style={{ padding: '20px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px' }} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(255, 214, 0, 0.15)', borderRadius: '12px', color: '#ffd600' }}>
                <Award size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>Senior Fitness Concerns (50+ Yrs)</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Bone density enhancement, balance & stability workouts, longevity training, functional mobility, and active aging splits.
            </p>
          </Card>

        </div>
      </section>

      {/* 4. SPECIALIZATIONS SECTION */}
      <section id="specializations" style={{ ...styles.section, background: 'rgba(18, 18, 20, 0.4)', padding: isMobile ? '35px 16px' : '65px 16px' }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>EXPERT CORE CAPABILITIES</span>
          <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? '1.4rem' : '1.8rem' }}>PROGRAM SPECIALIZATIONS</h2>
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
            <h3 style={styles.specTitle}>Fat Loss Diets & Workouts</h3>
            <p style={styles.specDesc}>
              Calculated calorie deficit protocols paired with metabolic resistance workouts for accelerated body fat reduction.
            </p>
          </Card>

          <Card style={styles.specCard} className="glass-card">
            <div style={styles.specIconBox}>
              <Target size={22} color="#00c853" />
            </div>
            <h3 style={styles.specTitle}>Goal Setting & Tracking</h3>
            <p style={styles.specDesc}>
              Structured milestone tracking and 10-day posture photo reviews to guarantee weekly progress accountability.
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

      {/* 5. PROGRAM FEATURES & INCLUSIONS */}
      <section id="offerings" style={{ ...styles.section, padding: isMobile ? '35px 16px' : '65px 16px' }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>WHAT YOU GET WITH MRK FITNESS</span>
          <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? '1.4rem' : '1.8rem' }}>PROGRAM FEATURES & INCLUSIONS</h2>
          <p style={styles.sectionSub}>Complete 360-degree support to build the best version of you.</p>
        </div>

        <div style={styles.offeringsGrid}>
          {[
            'Customized Gym & Home Workout Splits',
            'Personalized Macro-Balanced Diet Plan',
            '10-Day Body Posture & Sizing Check-in Reviews',
            'Daily Activity, Steps & Water Intake Logging',
            'Fat Loss, Muscle Recomp & Strength Focus',
            '24/7 Direct WhatsApp & Call Coach Support'
          ].map((item, idx) => (
            <div key={idx} style={styles.offeringCard} className="glass-card">
              <div style={styles.offeringCheck}>
                <Check size={14} color="#FFFFFF" />
              </div>
              <span style={styles.offeringText}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 6. INTERACTIVE CALORIE & NUTRITION CALCULATOR */}
      <section id="calculator" style={{ ...styles.section, background: 'rgba(18, 18, 20, 0.4)', padding: isMobile ? '35px 16px' : '65px 16px' }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>INTERACTIVE FITNESS TOOL</span>
          <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? '1.4rem' : '1.8rem' }}>Estimate Your Daily Nutrition Target</h2>
          <p style={styles.sectionSub}>Get an instant estimate of your required calorie & macro intake.</p>
        </div>

        <Card style={{ ...styles.calcCard, padding: isMobile ? '18px' : '28px' }} className="glass-card">
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
                <label style={styles.label}>Age (years): <strong style={{ color: '#FFFFFF' }}>{calcAge} yrs</strong></label>
                <input
                  type="range"
                  min="16"
                  max="70"
                  value={calcAge}
                  onChange={(e) => setCalcAge(Number(e.target.value))}
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
                    💪 Muscle Gain
                  </button>

                  <button
                    onClick={() => setCalcGoal('maintenance')}
                    style={{ ...styles.goalBtn, ...(calcGoal === 'maintenance' ? styles.goalBtnActive : {}) }}
                  >
                    ⚡ Maintenance
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.calcResultsCol}>
              <div style={styles.resultBadge}>ESTIMATED DAILY TARGET</div>
              <div style={{ ...styles.resultCalorie, fontSize: isMobile ? '2.1rem' : '2.5rem' }}>
                {estimatedCalories} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Kcal / day</span>
              </div>

              <div style={styles.macroPillsRow}>
                <div style={styles.macroPill}>
                  <span style={{ color: '#ff5252' }}>🥩 Protein</span>
                  <strong>{proteinGrams}g</strong>
                </div>
                <div style={styles.macroPill}>
                  <span style={{ color: '#448aff' }}>🍞 Carbs</span>
                  <strong>{carbsGrams}g</strong>
                </div>
                <div style={styles.macroPill}>
                  <span style={{ color: '#ffb300' }}>🥑 Fats</span>
                  <strong>{fatGrams}g</strong>
                </div>
              </div>

              <Button onClick={() => router.push('/login')} style={{ width: '100%', marginTop: '18px', padding: '12px' }}>
                Get Custom MRK Plan for {calcWeight}kg <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 7. PRICING & MEMBERSHIP TIERS */}
      <section id="plans" style={{ ...styles.section, padding: isMobile ? '35px 16px' : '65px 16px' }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>JOIN MRK FITNESS TODAY</span>
          <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? '1.4rem' : '1.8rem' }}>MEMBERSHIP & PRICING PLANS</h2>
          <p style={styles.sectionSub}>Choose your commitment level and start transforming today.</p>
        </div>

        {loadingPlans ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spinner />
          </div>
        ) : (
          <div style={styles.plansGrid}>
            {plans.map((p, idx) => (
              <PlanCard 
                key={p.id || idx} 
                plan={p} 
                onSelect={() => router.push('/contact')}
              />
            ))}
          </div>
        )}
      </section>

      {/* 8. FAQS SECTION */}
      <section id="faqs" style={{ ...styles.section, background: 'rgba(18, 18, 20, 0.4)', padding: isMobile ? '35px 16px' : '65px 16px' }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionBadge}>FREQUENTLY ASKED QUESTIONS</span>
          <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? '1.4rem' : '1.8rem' }}>EVERYTHING YOU NEED TO KNOW</h2>
          <p style={styles.sectionSub}>Have questions about MRK Fitness programs? We have answers.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px', margin: '0 auto' }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <Card
                key={idx}
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                style={{ padding: '16px 20px', cursor: 'pointer', border: isOpen ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)' }}
                className="glass-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HelpCircle size={16} color="var(--accent)" /> {faq.q}
                  </h3>
                  <ChevronDown size={18} color="var(--text-secondary)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                {isOpen && (
                  <p style={{ margin: '12px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                    {faq.a}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* 8.5. HOMEPAGE CONTACT & ENQUIRY FORM SECTION */}
      <section id="contact" style={{ ...styles.section, padding: isMobile ? '40px 16px' : '70px 16px', backgroundColor: 'var(--card-hover)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={styles.badge}>
              <MessageCircle size={14} color="var(--accent, #E00008)" />
              <span>CONTACT FITNESS COACH</span>
            </div>
            <h2 style={{ ...styles.sectionTitle, fontSize: isMobile ? '1.6rem' : '2.2rem' }}>
              Start Your Fitness Transformation Today
            </h2>
            <p style={{ ...styles.sectionSubtitle, fontSize: '0.9rem' }}>
              Have questions about custom diets, workout splits, or personal coaching? Drop us a message below!
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
            {/* Contact Info Box */}
            <Card style={{ padding: '24px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px' }} className="glass-card">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 16px 0' }}>
                Head Coach Direct Contact
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.88rem' }}>


                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(224, 0, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <InstagramIcon size={20} color="var(--accent, #E00008)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Instagram DM</span>
                    <a href="https://www.instagram.com/_.mrk.fitness._?igsh=MTg2MnU3YjhzN2xrcg==" target="_blank" rel="noreferrer" style={{ color: 'var(--accent, #E00008)', fontWeight: 700, textDecoration: 'none' }}>
                      @_.mrk.fitness._
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(224, 0, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={20} color="var(--accent, #E00008)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Email Support</span>
                    <strong style={{ color: 'var(--text)' }}>mrkfitnesscoach@gmail.com</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ⚡ <strong>Response Time:</strong> Coach Radha Krishna Maram responds within 2 hours.
              </div>
            </Card>

            {/* Enquiry Form */}
            <Card style={{ padding: '24px', backgroundColor: 'var(--card)', border: '1px solid rgba(224, 0, 8, 0.3)', borderRadius: '16px' }} className="glass-card">
              {homeContactSubmitted ? (
                <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(0, 200, 83, 0.15)', border: '1px solid #00c853', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle2 size={32} color="#00c853" />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 8px 0' }}>
                    Enquiry Submitted Successfully!
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Thank you! Head Fitness Coach <strong>Radha Krishna Maram</strong> will reach out to you shortly.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setHomeContactSubmitted(false)} style={{ marginTop: '16px' }}>
                    Send Another Enquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleHomeContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={homeContactForm.name}
                      onChange={(e) => setHomeContactForm({ ...homeContactForm, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={homeContactForm.email}
                        onChange={(e) => setHomeContactForm({ ...homeContactForm, email: e.target.value })}
                        required
                        style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={homeContactForm.phone}
                        onChange={(e) => setHomeContactForm({ ...homeContactForm, phone: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                      Primary Fitness Goal
                    </label>
                    <select
                      value={homeContactForm.category}
                      onChange={(e) => setHomeContactForm({ ...homeContactForm, category: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.85rem' }}
                    >
                      <option value="Fat Loss">Fat Loss & Weight Management</option>
                      <option value="Muscle Building">Muscle Building & Strength</option>
                      <option value="Special Population Rehab">Special Population (Diabetic / PCOS / Thyroid)</option>
                      <option value="Senior Fitness">Senior Fitness (50+ Years)</option>
                      <option value="Membership Query">Membership & Pricing Inquiry</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                        Preferred Contact Date
                      </label>
                      <input
                        type="date"
                        value={homeContactForm.preferredDate}
                        onChange={(e) => setHomeContactForm({ ...homeContactForm, preferredDate: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                        Preferred Time Slot
                      </label>
                      <select
                        value={homeContactForm.preferredTime}
                        onChange={(e) => setHomeContactForm({ ...homeContactForm, preferredTime: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.85rem' }}
                      >
                        <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                        <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                        <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                        <option value="Night (8 PM - 10 PM)">Night (8 PM - 10 PM)</option>
                        <option value="Anytime">Anytime</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                      Your Message or Goals *
                    </label>
                    <textarea
                      placeholder="Tell Coach MRK about your current weight, fitness goals, or health conditions..."
                      value={homeContactForm.message}
                      onChange={(e) => setHomeContactForm({ ...homeContactForm, message: e.target.value })}
                      rows={3}
                      required
                      style={{ width: '100%', padding: '10px 12px', backgroundColor: 'var(--card-hover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.85rem', resize: 'vertical' }}
                    />
                  </div>

                  <Button type="submit" loading={homeContactSubmitting} style={{ padding: '12px', fontSize: '0.9rem', marginTop: '4px' }}>
                    <MessageCircle size={16} /> Send Message to Coach
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerContainer}>
          <div style={styles.footerBrand}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/mrk-logo.png" alt="MRK FITNESS COACH" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
            </div>
            <p style={{ margin: '10px 0 0', color: 'var(--text-secondary, #AAAAAA)', fontSize: '0.85rem', maxWidth: '360px', lineHeight: 1.5 }}>
              Guided by Head Fitness Coach Radha Krishna Maram. Personalized fitness coaching, strength training, scientific macro diets, and sustainable weight-loss planning.
            </p>
            <div style={{ marginTop: '14px' }}>
              <a
                href="https://www.instagram.com/_.mrk.fitness._?igsh=MTg2MnU3YjhzN2xrcg=="
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent, #E00008)', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}
              >
                <InstagramIcon size={18} /> Follow @_.mrk.fitness._
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
              <a href="#faqs" style={styles.footerLink}>FAQs</a>
              <a href="/contact" style={styles.footerLink}>Contact Support</a>
            </div>

            <div style={styles.footerCol}>
              <h4 style={styles.footerColTitle}>Client & Admin Portals</h4>
              <a href="/login" style={styles.footerLink}>Client Portal Login</a>
              <a href="/login" style={styles.footerLink}>Admin Dashboard Login</a>
            </div>
          </div>
        </div>

        <div style={styles.footerBottom}>
          © {new Date().getFullYear()} MRK FITNESS — Radha Krishna Maram. All rights reserved.
        </div>
      </footer>
      {/* FULL TRANSFORMATION IMAGE VIEWER MODAL */}
      <Modal
        isOpen={!!selectedFullTransImage}
        onClose={() => setSelectedFullTransImage(null)}
        title="Real Body Transformation"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          {selectedFullTransImage && (
            <img 
              src={selectedFullTransImage} 
              alt="Full Transformation Poster" 
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', border: '1px solid var(--border)' }}
            />
          )}
          <Button variant="ghost" size="sm" onClick={() => setSelectedFullTransImage(null)}>Close Full View</Button>
        </div>
      </Modal>
    </div>
  );
}

const styles = {
  pageWrapper: { backgroundColor: 'var(--bg, #080808)', color: '#FFFFFF', minHeight: '100vh', overflowX: 'hidden' },
  navHeader: { position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(14, 14, 18, 0.94)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' },
  navContainer: { maxWidth: '1140px', margin: '0 auto', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brandGroup: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
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
  heroGlow1: { position: 'absolute', top: '-100px', left: '15%', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(224, 0, 8, 0.25)', filter: 'blur(110px)', pointerEvents: 'none' },
  heroGlow2: { position: 'absolute', top: '100px', right: '15%', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(255, 145, 0, 0.16)', filter: 'blur(110px)', pointerEvents: 'none' },
  heroGlow3: { position: 'absolute', bottom: '0', left: '40%', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(224, 0, 8, 0.12)', filter: 'blur(90px)', pointerEvents: 'none' },
  heroContainer: { maxWidth: '880px', margin: '0 auto', position: 'relative', zIndex: 1 },
  heroBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(224, 0, 8, 0.15)', border: '1px solid rgba(224, 0, 8, 0.35)', color: 'var(--accent, #E00008)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800, marginBottom: '18px' },
  heroTitle: { fontWeight: 900, margin: '0 0 16px 0', letterSpacing: '-0.03em', lineHeight: 1.1 },
  gradientText: { background: 'linear-gradient(135deg, var(--accent, #E00008) 0%, #ff9100 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroSubtitle: { color: 'var(--text-secondary, #AAAAAA)', margin: '0 0 30px 0', lineHeight: 1.6 },
  heroBtnGroup: { display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' },
  mainCtaBtn: { padding: '12px 26px', fontSize: '0.92rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' },
  instaBtn: { padding: '12px 20px', borderRadius: '10px', backgroundColor: 'rgba(225, 48, 108, 0.15)', border: '1px solid rgba(225, 48, 108, 0.35)', color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' },
  heroStatsRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', backgroundColor: 'rgba(18, 18, 20, 0.85)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' },
  statBox: { textAlign: 'center' },
  statNumber: { fontWeight: 900, color: '#FFFFFF' },
  statLabel: { fontSize: '0.7rem', color: 'var(--text-secondary, #AAAAAA)', marginTop: '2px' },
  statDivider: { width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  section: { maxWidth: '1140px', margin: '0 auto' },
  sectionHeader: { textAlign: 'center', marginBottom: '32px' },
  sectionBadge: { fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent, #E00008)', textTransform: 'uppercase', letterSpacing: '1px' },
  sectionTitle: { fontWeight: 900, margin: '6px 0 8px 0', letterSpacing: '-0.02em' },
  sectionSub: { fontSize: '0.85rem', color: 'var(--text-secondary, #AAAAAA)', margin: 0 },
  aboutCard: {},
  aboutGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '26px', alignItems: 'center' },
  aboutPhotoCol: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  coachAvatarCircle: { borderRadius: '50%', backgroundColor: 'rgba(224, 0, 8, 0.15)', border: '2px solid var(--accent, #E00008)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(224, 0, 8, 0.35)', flexShrink: 0 },
  coachName: { fontWeight: 900, margin: '6px 0 2px 0', color: '#FFFFFF' },
  coachTitle: { fontSize: '0.78rem', color: 'var(--text-secondary, #AAAAAA)', margin: 0 },
  socialPill: { marginTop: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(225, 48, 108, 0.15)', border: '1px solid rgba(225, 48, 108, 0.3)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', textDecoration: 'none' },
  aboutTextCol: { display: 'flex', flexDirection: 'column', gap: '10px' },
  aboutHeadline: { fontWeight: 900, margin: '4px 0 10px 0', color: '#FFFFFF' },
  bioParagraph: { fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, margin: 0 },
  bioParagraphHighlight: { fontSize: '0.85rem', color: '#FFFFFF', fontStyle: 'italic', lineHeight: 1.6, margin: 0, paddingLeft: '12px', borderLeft: '3px solid var(--accent, #E00008)' },
  specGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' },
  specCard: { padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' },
  specIconBox: { width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  specTitle: { fontSize: '0.98rem', fontWeight: 800, margin: 0, color: '#FFFFFF' },
  specDesc: { fontSize: '0.8rem', color: 'var(--text-secondary, #AAAAAA)', margin: 0, lineHeight: 1.5 },
  offeringsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' },
  offeringCard: { padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px' },
  offeringCheck: { width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent, #E00008)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  offeringText: { fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' },
  calcCard: {},
  calcGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'center' },
  calcInputsCol: { display: 'flex', flexDirection: 'column', gap: '14px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.82rem', color: 'var(--text-secondary, #AAAAAA)' },
  slider: { width: '100%', accentColor: 'var(--accent, #E00008)', cursor: 'pointer' },
  goalBtnRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  goalBtn: { flex: 1, padding: '8px 10px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  goalBtnActive: { backgroundColor: 'rgba(224, 0, 8, 0.15)', color: '#FFFFFF', borderColor: 'var(--accent, #E00008)' },
  calcResultsCol: { padding: '20px', backgroundColor: 'rgba(0, 0, 0, 0.35)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' },
  resultBadge: { fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent, #E00008)', letterSpacing: '0.5px' },
  resultCalorie: { fontWeight: 800, color: '#FFFFFF', margin: '4px 0 12px 0' },
  macroPillsRow: { display: 'flex', justifyContent: 'space-around', gap: '6px', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' },
  macroPill: { display: 'flex', flexDirection: 'column', fontSize: '0.75rem', gap: '2px' },
  plansGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' },
  planCard: { display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' },
  planBadgeInline: { backgroundColor: 'rgba(224, 0, 8, 0.18)', color: 'var(--accent, #E00008)', border: '1px solid rgba(224, 0, 8, 0.4)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 },
  planName: { fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' },
  planCategory: { fontSize: '0.72rem', color: 'var(--text-secondary, #AAAAAA)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  planPriceBox: { display: 'flex', alignItems: 'baseline', marginBottom: '14px' },
  planPrice: { fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF' },
  planPeriod: { fontSize: '0.78rem', color: 'var(--text-secondary, #AAAAAA)' },
  planFeatureList: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  planFeatureItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.85)' },
  footer: { borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(10, 10, 12, 0.95)', padding: '45px 16px 20px 16px' },
  footerContainer: { maxWidth: '1140px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '28px' },
  footerBrand: { flex: 1, minWidth: '240px' },
  footerLinksGroup: { display: 'flex', gap: '40px', flexWrap: 'wrap' },
  footerCol: { display: 'flex', flexDirection: 'column', gap: '6px' },
  footerColTitle: { fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' },
  footerLink: { color: 'var(--text-secondary, #AAAAAA)', textDecoration: 'none', fontSize: '0.82rem', transition: 'color 0.2s' },
  footerBottom: { maxWidth: '1140px', margin: '24px auto 0 auto', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center', color: 'var(--text-muted, #666666)', fontSize: '0.72rem' }
};
