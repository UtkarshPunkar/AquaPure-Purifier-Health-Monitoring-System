import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  Droplets,
  Lock,
  Mail,
  ArrowRight,
  Moon,
  Sun,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  Menu,
  Activity,
  Cpu,
  Workflow,
  BarChart3,
  Layers,
  FileCheck,
  Phone,
  Copy,
  ExternalLink,
  LifeBuoy,
  Settings,
  AlertTriangle,
  Zap,
  Check,
  User as UserIcon,
  Building2,
  CheckCircle,
  Twitter,
  Linkedin,
  Instagram,
  Github,
} from 'lucide-react';
import { UserRole } from '../types';
import { ScrollReveal } from '../components/common/ScrollReveal';

// Animated Counter for Stats (Count-Up Animation from lower to higher)
interface AnimatedCounterProps {
  target: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  target,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
}) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = React.useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime: number | null = null;
          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            // Ease-out cubic animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentVal = easeOut * target;
            setCount(currentVal);
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(target);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.15 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return (
    <span ref={elementRef} className="tabular-nums font-black">
      {prefix}
      {decimals > 0 ? count.toFixed(decimals) : Math.round(count)}
      {suffix}
    </span>
  );
};

export const LoginPage: React.FC = () => {
  const { login, signUp, quickLogin, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Modal, Scroll and Navigation States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll listener for dynamic glass navbar blur & elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Login Form State
  const [email, setEmail] = useState('mithilesh@aquapure.edu');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Sign Up Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupOrg, setSignupOrg] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('VIEWER');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Contacts Data (as requested)
  const contactsList = [
    {
      name: 'Utkarsh Punkar',
      role: 'AI/ML Engineer & Systems Architect',
      email: 'utkarshpunkar.aiml23@sbjit.edu.in',
      phone: '8010379670',
      tag: 'Lead Developer',
      color: 'from-blue-600 to-cyan-500',
    },
    {
      name: 'Vedant Bhanarkar',
      role: 'AI/ML & IoT Telemetry Specialist',
      email: 'vedant.aiml23@sbjit.edu.in',
      phone: null,
      tag: 'IoT Architect',
      color: 'from-cyan-600 to-blue-500',
    },
    {
      name: 'Gayatri Borikar',
      role: 'Computer Vision & AI Analytics Lead',
      email: 'gayatri.aiml23d@sbjit.edu.in',
      phone: null,
      tag: 'AI Vision Lead',
      color: 'from-sky-600 to-indigo-500',
    },
    {
      name: 'Mithilesh Kose',
      role: 'Full Stack & Predictive Maintenance',
      email: 'mithileshkose@sbjit.edu.in',
      phone: null,
      tag: 'Platform Lead',
      color: 'from-blue-500 to-sky-400',
    },
  ];

  const handleOpenAuth = (tab: 'login' | 'signup') => {
    setAuthTab(tab);
    setLoginError(null);
    setSignupError(null);
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoginLoading(true);
    try {
      await login(email, password, rememberMe);
      setIsAuthModalOpen(false);
      navigate('/');
    } catch (err: any) {
      setLoginError(err.response?.data?.error || 'Invalid credentials. Please verify your login details.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setIsSignupLoading(true);
    try {
      await signUp(signupName, signupEmail, signupPassword, signupRole, signupOrg || 'Apex Campus');
      setIsAuthModalOpen(false);
      navigate('/');
    } catch (err: any) {
      setSignupError(err.response?.data?.error || 'Unable to register account. Please try again.');
    } finally {
      setIsSignupLoading(false);
    }
  };

  const handleQuickRole = async (role: UserRole) => {
    setLoginError(null);
    setIsLoginLoading(true);
    try {
      await quickLogin(role);
      setIsAuthModalOpen(false);
      navigate('/');
    } catch (err: any) {
      setLoginError('Unable to perform quick login.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setIsForgotModalOpen(false);
      setForgotEmail('');
    }, 2500);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070d19] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 selection:bg-[#4FC3F7] selection:text-slate-950 relative overflow-x-clip">
      {/* =========================================================================
          RADIANT AMBIENT GLOWING BEAMS & ORBS (Clean Background without Grid Lines)
         ========================================================================= */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Top Radiant Center Glow Beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] sm:w-[1050px] h-[550px] bg-gradient-to-b from-[#4FC3F7]/30 via-sky-500/20 to-transparent blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />
        {/* Secondary Cyan Hero Ambient Light */}
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[480px] sm:w-[700px] h-[300px] bg-[#4FC3F7]/25 blur-[90px] rounded-full pointer-events-none" />
        {/* Floating Mid-Section Glow Spheres */}
        <div className="absolute top-[35%] -left-32 w-[450px] h-[450px] bg-[#4FC3F7]/15 dark:bg-[#4FC3F7]/10 blur-[110px] rounded-full pointer-events-none animate-float-slow" />
        <div className="absolute top-[55%] -right-32 w-[500px] h-[500px] bg-blue-600/15 dark:bg-blue-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse-glow" />
        <div className="absolute top-[75%] left-1/4 w-[600px] h-[400px] bg-[#4FC3F7]/15 dark:bg-[#4FC3F7]/10 blur-[130px] rounded-full pointer-events-none" />
      </div>

      {/* =========================================================================
          HEADER / NAVBAR (Sticky Blended Glassmorphism: Home, Features, Help, Contacts)
         ========================================================================= */}
      <header className={`sticky top-0 z-50 glass-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo */}
            <a href="#home" className="flex items-center gap-3 group interactive-btn">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0288D1] via-[#29B6F6] to-[#4FC3F7] flex items-center justify-center text-slate-950 shadow-lg shadow-[#4FC3F7]/30 group-hover:scale-105 group-hover:shadow-[#4FC3F7]/50 transition-all duration-300">
                <Droplets size={22} className="stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                    Aqua<span className="text-[#0288D1] dark:text-[#4FC3F7]">Pure</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-100/80 dark:bg-sky-950/80 text-sky-700 dark:text-[#4FC3F7] border border-sky-200 dark:border-sky-800 shadow-[0_0_10px_rgba(79,195,247,0.2)]">
                    Smart IoT
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
                  Water Safety &amp; Telemetry
                </span>
              </div>
            </a>

            {/* Desktop Navigation Menu: Home, Features, Help, Contacts */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 glass-pill p-1.5 rounded-full shadow-xs">
              <a
                href="#home"
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0288D1] dark:hover:text-[#4FC3F7] rounded-full hover:bg-white/90 dark:hover:bg-slate-800/90 hover:shadow-xs transition-all nav-link-animated"
              >
                Home
              </a>
              <a
                href="#features"
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0288D1] dark:hover:text-[#4FC3F7] rounded-full hover:bg-white/90 dark:hover:bg-slate-800/90 hover:shadow-xs transition-all nav-link-animated"
              >
                Features
              </a>
              <a
                href="#help"
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0288D1] dark:hover:text-[#4FC3F7] rounded-full hover:bg-white/90 dark:hover:bg-slate-800/90 hover:shadow-xs transition-all nav-link-animated"
              >
                Help
              </a>
              <a
                href="#contacts"
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#0288D1] dark:hover:text-[#4FC3F7] rounded-full hover:bg-white/90 dark:hover:bg-slate-800/90 hover:shadow-xs transition-all nav-link-animated"
              >
                Contacts
              </a>
            </nav>

            {/* Header Right Actions: Theme Toggle + Login + Sign Up */}
            <div className="hidden sm:flex items-center space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 glass-pill transition-all cursor-pointer hover:border-[#4FC3F7] interactive-btn"
                aria-label="Toggle Theme"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
              </button>

              {/* Login Button */}
              <button
                onClick={() => handleOpenAuth('login')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#0288D1] dark:hover:text-[#4FC3F7] glass-pill hover:bg-white/90 dark:hover:bg-slate-800/90 hover:border-[#4FC3F7]/60 transition-all cursor-pointer shadow-xs interactive-btn"
              >
                Login
              </button>

              {/* Sign Up Button (#4FC3F7 Blue Theme Gradient) */}
              <button
                onClick={() => handleOpenAuth('signup')}
                className="px-4 py-2 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-[#4FC3F7] via-[#29B6F6] to-[#0288D1] hover:from-[#29B6F6] hover:to-[#0277BD] shadow-md shadow-[#4FC3F7]/30 hover:shadow-lg hover:shadow-[#4FC3F7]/40 transition-all cursor-pointer flex items-center gap-1.5 group interactive-btn shimmer-sweep"
              >
                <span>Sign Up</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform stroke-[2.5]" />
              </button>
            </div>

            {/* Mobile Hamburger Menu Button */}
            <div className="flex sm:hidden items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                aria-label="Open menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="sm:hidden px-4 pt-3 pb-6 bg-white dark:bg-[#0b1324] border-b border-slate-200 dark:border-slate-800 space-y-3 animate-in slide-in-from-top-2">
            <div className="flex flex-col space-y-1">
              <a
                href="#home"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800"
              >
                Home
              </a>
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800"
              >
                Features
              </a>
              <a
                href="#help"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800"
              >
                Help
              </a>
              <a
                href="#contacts"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800"
              >
                Contacts
              </a>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOpenAuth('login')}
                className="py-2.5 px-3 text-xs font-bold text-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800"
              >
                Login
              </button>
              <button
                onClick={() => handleOpenAuth('signup')}
                className="py-2.5 px-3 text-xs font-bold text-center rounded-xl text-slate-950 bg-gradient-to-r from-[#4FC3F7] to-[#0288D1] shadow-sm font-bold"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          HERO SECTION (Buildify Style with Staggered Entrance Animations)
         ========================================================================= */}
      <section id="home" className="relative pt-16 pb-14 sm:pt-24 sm:pb-20 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Glowing Pill Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-sky-50/90 dark:bg-sky-950/70 border border-[#4FC3F7]/50 dark:border-[#4FC3F7]/40 text-slate-800 dark:text-[#4FC3F7] text-xs font-semibold mb-6 shadow-[0_0_20px_rgba(79,195,247,0.25)] animate-fade-in-down">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4FC3F7] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0288D1]" />
              </span>
              <span>Next-Gen Smart IoT Water Safety &amp; Purifier Telemetry</span>
            </div>

            {/* Hero Main Headline with Glowing Gradient */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] max-w-3xl mx-auto animate-fade-in-up stagger-1">
              Build, Monitor &amp; Protect{' '}
              <span className="bg-gradient-to-r from-[#4FC3F7] via-[#29B6F6] to-[#0288D1] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(79,195,247,0.35)]">
                Smart Water Purity.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed animate-fade-in-up stagger-2">
              Centralized water quality telemetry, computer vision contamination diagnostics, predictive filter health
              modeling, and campus-wide IoT automation.
            </p>

            {/* Hero Action Buttons (#4FC3F7 Blue Theme) */}
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto animate-fade-in-up stagger-3">
              <button
                onClick={() => handleOpenAuth('login')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#4FC3F7] via-[#29B6F6] to-[#0288D1] hover:from-[#29B6F6] hover:to-[#0277BD] text-slate-950 font-black text-sm shadow-[0_0_30px_rgba(79,195,247,0.4)] hover:shadow-[0_0_40px_rgba(79,195,247,0.6)] transition-all flex items-center justify-center gap-2 group cursor-pointer interactive-btn shimmer-sweep"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform stroke-[2.5]" />
              </button>

              <button
                onClick={() => handleOpenAuth('signup')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/90 text-slate-800 dark:text-slate-100 font-bold text-sm border border-[#4FC3F7]/50 hover:border-[#4FC3F7] shadow-md shadow-slate-200/50 dark:shadow-none hover:shadow-[0_0_20px_rgba(79,195,247,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer interactive-btn"
              >
                <Sparkles size={16} className="text-[#0288D1] dark:text-[#4FC3F7] transition-transform group-hover:rotate-12" />
                <span>Create Account</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          METRICS & NUMBERS SECTION (Above Core Features with Count-Up Animation)
         ========================================================================= */}
      <section className="py-12 sm:py-16 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" threshold={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {/* Metric 1 */}
              <div className="p-8 rounded-3xl bg-white/80 dark:bg-[#0b162c]/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md shadow-lg shadow-sky-500/5 interactive-card card-glow-hover flex flex-col justify-center text-left">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-2.5 flex items-center text-[#0288D1] dark:text-[#4FC3F7]">
                  <AnimatedCounter target={10} suffix="x" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 leading-snug">
                  Faster smart water telemetry &amp; anomaly diagnostics
                </p>
              </div>

              {/* Metric 2 */}
              <div className="p-8 rounded-3xl bg-white/80 dark:bg-[#0b162c]/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md shadow-lg shadow-sky-500/5 interactive-card card-glow-hover flex flex-col justify-center text-left">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-2.5 flex items-center text-[#0288D1] dark:text-[#4FC3F7]">
                  <AnimatedCounter target={99.9} decimals={1} suffix="%" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 leading-snug">
                  Continuous potable purity monitoring uptime
                </p>
              </div>

              {/* Metric 3 */}
              <div className="p-8 rounded-3xl bg-white/80 dark:bg-[#0b162c]/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md shadow-lg shadow-sky-500/5 interactive-card card-glow-hover flex flex-col justify-center text-left">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-2.5 flex items-center text-[#0288D1] dark:text-[#4FC3F7]">
                  <AnimatedCounter target={85} suffix="%" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 leading-snug">
                  Reduction in purifier and sensor failures
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* =========================================================================
          CORE FEATURES SECTION (Buildify Exact Sticky Stacking Card Overlap Flow)
         ========================================================================= */}
      <section id="features" className="py-20 sm:py-28 relative z-10 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left Column: Sticky Title, Description & Callout Banner */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-8 self-start">
              <ScrollReveal direction="left">
                {/* Header Title & Subtitle */}
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0288D1] via-[#29B6F6] to-[#4FC3F7] text-slate-950 flex items-center justify-center shadow-lg shadow-[#4FC3F7]/40 animate-pulse-glow">
                      <Sparkles size={24} className="stroke-[2.5]" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Core features
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
                    Everything you need to build, deploy, and scale water monitoring intelligence — designed for speed,
                    reliability, and real-world production use.
                  </p>
                </div>

                {/* Prominent Callout Card (Gradient using #4FC3F7 Blue Shade) */}
                <div className="mt-8 p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-[#4FC3F7] via-[#29B6F6] to-[#0288D1] text-slate-950 shadow-[0_0_40px_rgba(79,195,247,0.35)] hover:shadow-[0_0_50px_rgba(79,195,247,0.5)] relative overflow-hidden group transition-all duration-300 interactive-card">
                  {/* Background ambient decorative shapes */}
                  <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/20 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                  <div className="absolute -left-8 -top-8 w-28 h-28 rounded-full bg-white/15 blur-lg pointer-events-none" />

                  <p className="text-base sm:text-lg font-black leading-snug relative z-10 mb-6 text-slate-950">
                    Trusted by campus teams and laboratories monitoring intelligent smart water purity.
                  </p>

                  <button
                    onClick={() => handleOpenAuth('signup')}
                    className="relative z-10 inline-flex items-center gap-2 bg-slate-950 text-white hover:bg-slate-900 font-bold px-5 py-2.5 rounded-full text-xs shadow-md transition-all cursor-pointer group/btn interactive-btn shimmer-sweep"
                  >
                    <span>Explore use cases</span>
                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform duration-200" />
                  </button>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column: Sticky Stacking Feature Cards (Popping & Overlapping on each other on scrolling) */}
            <div className="lg:col-span-7 relative pb-32 space-y-0">
              {/* Card 1: Warm Peach / Amber Pastel Card */}
              <div
                className="sticky z-10 mb-[32vh] sm:mb-[40vh] p-7 sm:p-9 rounded-3xl bg-[#fff7ed] dark:bg-[#150d03] border border-orange-200/90 dark:border-orange-900/70 hover:border-orange-400 dark:hover:border-orange-500 shadow-[0_-8px_25px_rgba(0,0,0,0.06),0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.5),0_25px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-300 group cursor-default interactive-card"
                style={{ top: '100px' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-13 h-13 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Droplets size={26} className="stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-100/90 dark:bg-orange-950/80 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800/60 shadow-xs">
                    Feature 01
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2.5">
                  AI Contamination Vision
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Design intelligent safety models with modular logic, memory, and automated hazard alerts — no complex setup required.
                </p>
              </div>

              {/* Card 2: Soft Mint / Emerald Pastel Card */}
              <div
                className="sticky z-20 mb-[32vh] sm:mb-[40vh] p-7 sm:p-9 rounded-3xl bg-[#f0fdf4] dark:bg-[#05170d] border border-emerald-200/90 dark:border-emerald-900/70 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-[0_-8px_25px_rgba(0,0,0,0.06),0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.5),0_25px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-300 group cursor-default interactive-card"
                style={{ top: '125px' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-13 h-13 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Workflow size={26} className="stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100/90 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                    Feature 02
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2.5">
                  Workflow Orchestration
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Chain actions, sensor threshold triggers, and maintenance decisions to automate multi-step purifier workflows reliably.
                </p>
              </div>

              {/* Card 3: Soft Periwinkle / Indigo Pastel Card */}
              <div
                className="sticky z-30 mb-[32vh] sm:mb-[40vh] p-7 sm:p-9 rounded-3xl bg-[#f1f4ff] dark:bg-[#091124] border border-indigo-200/90 dark:border-indigo-900/70 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-[0_-8px_25px_rgba(0,0,0,0.06),0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.5),0_25px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-300 group cursor-default interactive-card"
                style={{ top: '150px' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-13 h-13 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Cpu size={26} className="stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100/90 dark:bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
                    Feature 03
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2.5">
                  Plug &amp; Play Hardware Integrations
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Connect Raspberry Pi Pico W, ESP32 nodes, databases, and telemetry tools seamlessly with built-in WebSocket connectors.
                </p>
              </div>

              {/* Card 4: Soft Sky / Cyan Pastel Card */}
              <div
                className="sticky z-40 mb-[32vh] sm:mb-[40vh] p-7 sm:p-9 rounded-3xl bg-[#f0f9ff] dark:bg-[#041322] border border-sky-200/90 dark:border-sky-900/70 hover:border-sky-400 dark:hover:border-sky-500 shadow-[0_-8px_25px_rgba(0,0,0,0.06),0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.5),0_25px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-300 group cursor-default interactive-card"
                style={{ top: '175px' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-13 h-13 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <ShieldCheck size={26} className="stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-100/90 dark:bg-sky-950/80 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800/60 shadow-xs">
                    Feature 04
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2.5">
                  Production-Ready Security &amp; Purity
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Built-in safeguards, rate limits, and hardware isolation to run monitoring securely at scale and safeguard campus health data.
                </p>
              </div>

              {/* Card 5: Soft Lavender / Purple Pastel Card */}
              <div
                className="sticky z-50 mb-[32vh] sm:mb-[40vh] p-7 sm:p-9 rounded-3xl bg-[#faf5ff] dark:bg-[#12081f] border border-purple-200/90 dark:border-purple-900/70 hover:border-purple-400 dark:hover:border-purple-500 shadow-[0_-8px_25px_rgba(0,0,0,0.06),0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.5),0_25px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-300 group cursor-default interactive-card"
                style={{ top: '200px' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-13 h-13 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Activity size={26} className="stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100/90 dark:bg-purple-950/80 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800/60 shadow-xs">
                    Feature 05
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2.5">
                  Real-Time Live Telemetry
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Track sensor executions, live pH/TDS streams, and purifier performance metrics in real time with continuous anomaly alerts.
                </p>
              </div>

              {/* Card 6: Soft Aqua / Teal Pastel Card */}
              <div
                className="sticky z-[60] mb-8 p-7 sm:p-9 rounded-3xl bg-[#f0fdfa] dark:bg-[#041614] border border-teal-200/90 dark:border-teal-900/70 hover:border-teal-400 dark:hover:border-teal-500 shadow-[0_-8px_25px_rgba(0,0,0,0.06),0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.5),0_25px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-300 group cursor-default interactive-card"
                style={{ top: '225px' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-13 h-13 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Layers size={26} className="stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-100/90 dark:bg-teal-950/80 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800/60 shadow-xs">
                    Feature 06
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2.5">
                  Filter Health &amp; Scalable Infrastructure
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Quantify Remaining Useful Life (RUL) across filtration stages and balance device telemetry workloads across multiple facilities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HELP SECTION (Technical Guidance, Calibration, Protocols & Support with Glow)
         ========================================================================= */}
      <section id="help" className="py-20 sm:py-28 relative z-10 transition-colors border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Decorative Corner Junction Crosshair Nodes */}
          <span className="hidden lg:block absolute -left-2 top-0 text-sky-500/40 dark:text-sky-400/30 font-mono text-xs select-none">+</span>
          <span className="hidden lg:block absolute -right-2 top-0 text-sky-500/40 dark:text-sky-400/30 font-mono text-xs select-none">+</span>

          {/* Section Header */}
          <ScrollReveal direction="up">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/90 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
                <LifeBuoy size={14} className="text-blue-500" />
                <span>Help &amp; System Documentation</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Fast assistance &amp; technical guidance.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Find technical documentation, sensor calibration instructions, and emergency response procedures for your
                facility's water infrastructure.
              </p>
            </div>
          </ScrollReveal>

          {/* Help Guide Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScrollReveal direction="up" delay={0}>
              <div className="h-full p-6 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/80 dark:border-slate-800 shadow-sm interactive-card card-glow-hover flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4 font-bold text-sm shadow-xs">
                    01
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    IoT Node Provisioning
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    Learn how to flash firmware to your Pico W or ESP32 node and connect telemetry to the `/api/iot/sensor-data` endpoint.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenAuth('login')}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 hover:underline cursor-pointer pt-2 group"
                >
                  <span>View Node Setup Docs</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="h-full p-6 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/80 dark:border-slate-800 shadow-sm interactive-card card-glow-hover flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 font-bold text-sm shadow-xs">
                    02
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    Sensor Thresholds &amp; Alerts
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    Configure custom safety thresholds for potable water (pH 6.5 - 8.5, TDS &lt; 300 PPM, Turbidity &lt; 5 NTU)
                    with real-time technician dispatch.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenAuth('login')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline cursor-pointer pt-2 group"
                >
                  <span>Configure Threshold Rules</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <div className="h-full p-6 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/80 dark:border-slate-800 shadow-sm interactive-card card-glow-hover flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 font-bold text-sm shadow-xs">
                    03
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    Emergency Contamination Lock
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    Instructions for automated solenoid valve isolation upon critical bacterial or heavy chemical detection
                    to prevent hazardous distribution.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenAuth('login')}
                  className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5 hover:underline cursor-pointer pt-2 group"
                >
                  <span>Read Emergency Protocol</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </ScrollReveal>
          </div>

          {/* Quick Help Desk CTA Banner with Glow */}
          <ScrollReveal direction="up" delay={150}>
            <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-sky-900/20 via-blue-900/20 to-cyan-900/20 border border-sky-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-sm shadow-[0_0_30px_rgba(56,189,248,0.1)] card-glow-hover">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-sky-600/40 animate-pulse-glow">
                  <LifeBuoy size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Need on-campus engineering support or sensor calibration assistance?
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    Our development and research team is available to assist your deployment directly.
                  </p>
                </div>
              </div>
              <a
                href="#contacts"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4FC3F7] via-[#29B6F6] to-[#0288D1] hover:from-[#29B6F6] hover:to-[#0277BD] text-slate-950 text-xs font-black shrink-0 shadow-md shadow-[#4FC3F7]/30 hover:shadow-lg hover:shadow-[#4FC3F7]/40 transition-all flex items-center gap-2 interactive-btn shimmer-sweep"
              >
                <span>Contact Engineering Team</span>
                <ArrowRight size={14} className="stroke-[2.5]" />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* =========================================================================
          CONTACTS SECTION (Buildify Exact Style Card with Social Links & Dev Team)
         ========================================================================= */}
      <section id="contacts" className="py-16 sm:py-24 relative z-10 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            {/* Main Large Rounded Card Container (Matching Buildify Reference) */}
            <div className="relative rounded-[2.5rem] bg-[#f0f7ff] dark:bg-[#0c182e] border border-sky-200/90 dark:border-sky-900/50 p-8 sm:p-12 lg:p-14 overflow-hidden shadow-xl shadow-sky-950/5 dark:shadow-black/30 interactive-card">
              {/* Giant Background Watermark Text & Icon (Exact Buildify Watermark Style) */}
              <div className="absolute -bottom-8 -left-4 text-sky-600/[0.06] dark:text-sky-400/[0.03] font-black text-8xl sm:text-9xl md:text-[12rem] lg:text-[14rem] leading-none select-none pointer-events-none tracking-tighter flex items-center gap-6">
                <Droplets className="w-28 h-28 sm:w-44 sm:h-44 opacity-30 shrink-0 stroke-[2]" />
                <span>AquaPure</span>
              </div>

              <div className="relative z-10 space-y-10 sm:space-y-12">
                {/* TOP ROW: Brand Header on Left & Social Channels on Right (Buildify Reference) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-8 pb-8 border-b border-sky-200/60 dark:border-sky-900/40">
                  {/* Left: Brand Logo & Inquiries Subtitle */}
                  <div className="max-w-md">
                    <div className="flex items-center gap-3 group mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/30 group-hover:scale-105 transition-transform duration-300">
                        <Droplets size={24} className="stroke-[2.5]" />
                      </div>
                      <span className="font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">
                        Aqua<span className="text-sky-600 dark:text-sky-400">Pure</span>
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
                      For further assistance or additional inquiries, feel free to contact us.
                    </p>
                  </div>

                  {/* Right: SOCIAL Links Column (Buildify Layout) */}
                  <div className="shrink-0 space-y-3">
                    <p className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      SOCIAL
                    </p>
                    <div className="flex flex-col space-y-2.5">
                      <a
                        href="https://twitter.com"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors group/soc interactive-btn"
                      >
                        <Twitter size={16} className="text-sky-500 group-hover/soc:scale-110 transition-transform" />
                        <span>Twitter</span>
                      </a>
                      <a
                        href="https://linkedin.com"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors group/soc interactive-btn"
                      >
                        <Linkedin size={16} className="text-sky-500 group-hover/soc:scale-110 transition-transform" />
                        <span>Linkedin</span>
                      </a>
                      <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors group/soc interactive-btn"
                      >
                        <Instagram size={16} className="text-sky-500 group-hover/soc:scale-110 transition-transform" />
                        <span>Instagram</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* MIDDLE ROW: Get in Touch with Development Team */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Get in touch with the development team.
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Department of Artificial Intelligence &amp; Machine Learning (AIML-23) &bull; SBJIT, Nagpur.
                      </p>
                    </div>

                    <a
                      href="mailto:utkarshpunkar.aiml23@sbjit.edu.in?subject=AquaPure%20Telemetry%20Inquiry"
                      className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-100/80 dark:bg-sky-950/60 px-4 py-2 rounded-xl hover:bg-sky-200/80 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800/60 transition-all self-start sm:self-auto interactive-btn"
                    >
                      <Mail size={14} />
                      <span>Send Team Inquiry</span>
                    </a>
                  </div>

                  {/* 4 Core Team Members Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {contactsList.map((contact, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-white/90 dark:bg-[#0f1d38]/90 backdrop-blur-sm border border-sky-100 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-sky-300 dark:hover:border-sky-600 transition-all group flex flex-col justify-between interactive-card card-glow-hover"
                      >
                        <div>
                          {/* Avatar & Role */}
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${contact.color} text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0 group-hover:scale-105 transition-transform`}
                            >
                              {contact.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {contact.name}
                              </h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                {contact.tag}
                              </p>
                            </div>
                          </div>

                          {/* Email Link & Copy Action */}
                          <div className="flex items-center justify-between text-[11px] py-2 border-t border-slate-100 dark:border-slate-800/80">
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 truncate flex items-center gap-1.5 transition-colors font-medium mr-2"
                              title={contact.email}
                            >
                              <Mail size={13} className="shrink-0 text-sky-500" />
                              <span className="truncate">{contact.email}</span>
                            </a>
                            <button
                              onClick={() => copyToClipboard(contact.email, idx)}
                              className="p-1 rounded text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0 interactive-btn"
                              title="Copy Email"
                            >
                              {copiedIndex === idx ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </div>

                        {/* Phone for Utkarsh */}
                        {contact.phone && (
                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <a
                              href={`tel:${contact.phone}`}
                              className="text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1.5 transition-colors font-bold"
                            >
                              <Phone size={13} className="shrink-0 text-emerald-500" />
                              <span>+91 {contact.phone}</span>
                            </a>
                            <button
                              onClick={() => copyToClipboard(contact.phone!, idx + 100)}
                              className="p-1 rounded text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0 interactive-btn"
                              title="Copy Phone"
                            >
                              {copiedIndex === idx + 100 ? (
                                <Check size={13} className="text-emerald-500" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
         ========================================================================= */}
      <footer className="py-12 bg-white dark:bg-[#070d19] border-t border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-blue-600 text-white flex items-center justify-center shadow-xs">
              <Droplets size={16} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">AquaPure Smart Water Platform</p>
              <p className="text-[11px]">IoT Telemetry &amp; Predictive Maintenance Portal</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <a href="#home" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Home
            </a>
            <a href="#features" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Features
            </a>
            <a href="#help" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Help
            </a>
            <a href="#contacts" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Contacts
            </a>
            <button
              onClick={() => handleOpenAuth('login')}
              className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-semibold cursor-pointer"
            >
              Sign In
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry Service Live &bull; v2.4.0</span>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          AUTHENTICATION MODAL (Tabbed: Sign In & Create Account)
         ========================================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-[#0e172a] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 relative overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer interactive-btn"
            >
              <X size={18} />
            </button>

            {/* Modal Header & Brand Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-cyan-500 text-white shadow-lg shadow-sky-600/25 mb-3 animate-pulse-glow">
                <Droplets size={28} className="stroke-[2.5]" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {authTab === 'login' ? 'Sign In to AquaPure' : 'Create AquaPure Account'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {authTab === 'login'
                  ? 'Access real-time telemetry, filter analytics & AI alerts.'
                  : 'Register for centralized campus water telemetry access.'}
              </p>
            </div>

            {/* Tab Switcher (Login vs Sign Up) */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-6 border border-slate-200/60 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setLoginError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer interactive-btn ${
                  authTab === 'login'
                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signup');
                  setSignupError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer interactive-btn ${
                  authTab === 'signup'
                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* TAB 1: LOGIN FORM */}
            {authTab === 'login' && (
              <>
                {loginError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs mb-4 flex items-center gap-2 animate-shake">
                    <AlertTriangle size={15} className="shrink-0 text-rose-500" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        placeholder="mithilesh@aquapure.edu"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsForgotModalOpen(true)}
                        className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 interactive-btn"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 accent-sky-600"
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Remember Me
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoginLoading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#4FC3F7] via-[#29B6F6] to-[#0288D1] hover:from-[#29B6F6] hover:to-[#0277BD] text-slate-950 text-xs font-black shadow-lg shadow-[#4FC3F7]/30 hover:shadow-[#4FC3F7]/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 interactive-btn shimmer-sweep"
                  >
                    <span>{isLoginLoading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
                    <ArrowRight size={16} className="stroke-[2.5]" />
                  </button>
                </form>

                {/* 1-Click Demo Logins */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    <Sparkles size={13} className="text-amber-500 animate-pulse" />
                    <span>1-Click Demo Logins</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickRole('ADMIN')}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all text-center cursor-pointer interactive-btn"
                    >
                      Administrator
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickRole('TECHNICAL_HEAD')}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all text-center cursor-pointer interactive-btn"
                    >
                      Technical Head
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickRole('MAINTENANCE_STAFF')}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all text-center cursor-pointer interactive-btn"
                    >
                      Maintenance Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickRole('VIEWER')}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all text-center cursor-pointer interactive-btn"
                    >
                      Viewer (Read-Only)
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: SIGN UP FORM */}
            {authTab === 'signup' && (
              <>
                {signupError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs mb-4 flex items-center gap-2 animate-shake">
                    <AlertTriangle size={15} className="shrink-0 text-rose-500" />
                    <span>{signupError}</span>
                  </div>
                )}

                <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserIcon size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        placeholder="Dr. Rajesh Gupta"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        placeholder="rajesh.gupta@sbjit.edu.in"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Campus / Organization
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Building2 size={14} />
                        </div>
                        <input
                          type="text"
                          value={signupOrg}
                          onChange={(e) => setSignupOrg(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                          placeholder="SBJIT Campus"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Requested Role
                      </label>
                      <select
                        value={signupRole}
                        onChange={(e) => setSignupRole(e.target.value as UserRole)}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="MAINTENANCE_STAFF">Maintenance Staff</option>
                        <option value="TECHNICAL_HEAD">Technical Head</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 interactive-btn"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSignupLoading}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#4FC3F7] via-[#29B6F6] to-[#0288D1] hover:from-[#29B6F6] hover:to-[#0277BD] text-slate-950 text-xs font-black shadow-lg shadow-[#4FC3F7]/30 hover:shadow-[#4FC3F7]/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 interactive-btn shimmer-sweep"
                  >
                    <span>{isSignupLoading ? 'Registering Account...' : 'Create Account & Enter'}</span>
                    <ArrowRight size={16} className="stroke-[2.5]" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          FORGOT PASSWORD MODAL
         ========================================================================= */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#0e172a] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative animate-scale-up">
            <button
              onClick={() => {
                setIsForgotModalOpen(false);
                setForgotSuccess(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer interactive-btn"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Reset Your Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter your registered email to receive verification reset instructions.
            </p>

            {forgotSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in-up">
                <CheckCircle size={18} className="shrink-0 text-emerald-600" />
                <span>Password reset link sent to your email! (Simulated)</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user@aquapure.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4FC3F7] via-[#29B6F6] to-[#0288D1] hover:from-[#29B6F6] hover:to-[#0277BD] text-slate-950 text-xs font-black shadow-md shadow-[#4FC3F7]/30 hover:shadow-[#4FC3F7]/50 transition-all cursor-pointer interactive-btn shimmer-sweep"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
