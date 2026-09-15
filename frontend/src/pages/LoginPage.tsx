import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  Droplets,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
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
  KeyRound,
  Send,
  RefreshCw,
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

// Dynamic Password Strength Calculator for Sign Up
const getPasswordStrength = (pass: string) => {
  if (!pass) return { score: 0, label: '', color: 'bg-slate-300 dark:bg-slate-700', text: 'text-slate-400', width: '0%' };
  let score = 0;
  if (pass.length >= 6) score++;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-gradient-to-r from-rose-500 to-amber-500', text: 'text-rose-400', width: '25%' };
  if (score <= 3) return { score: 2, label: 'Moderate', color: 'bg-gradient-to-r from-[#00E5FF] to-sky-400', text: 'text-sky-400', width: '60%' };
  if (score === 4) return { score: 3, label: 'Strong', color: 'bg-gradient-to-r from-[#00E5FF] via-[#29B6F6] to-[#0288D1]', text: 'text-[#00E5FF]', width: '85%' };
  return { score: 4, label: 'Ultra Pure Shielded', color: 'bg-gradient-to-r from-[#00E5FF] via-[#00B0FF] to-emerald-400', text: 'text-[#00E5FF]', width: '100%' };
};

export const LoginPage: React.FC = () => {
  const { login, signUp, user } = useAuth();
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

  // Auto-open modal if navigated with query param or direct login action
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'signup' || tab === 'register') {
      setAuthTab('signup');
      setIsAuthModalOpen(true);
    } else if (tab === 'login' || params.get('open') === 'true') {
      setAuthTab('login');
      setIsAuthModalOpen(true);
    }
  }, []);

  // Scroll listener for dynamic glass navbar blur & elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Login Form State - NO DEFAULT CREDENTIALS
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Sign Up Form State - 3-Step OTP Verification Flow
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupOrg, setSignupOrg] = useState('S.B. Jain Campus');
  const [signupOtp, setSignupOtp] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSimulatedOtp, setSignupSimulatedOtp] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Forgot Password Modal State with 2-Step OTP Reset
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSimulatedOtp, setForgotSimulatedOtp] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Resend Countdown Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Contacts Data
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
    setLoginSuccessMessage(null);
    setSignupError(null);
    setSignupStep(1);
    setSignupOtp('');
    setSignupSimulatedOtp(null);
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccessMessage(null);
    if (!email.trim() || !password) {
      setLoginError('Please enter your email and password.');
      return;
    }
    setIsLoginLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
      setIsAuthModalOpen(false);
      navigate('/');
    } catch (err: any) {
      setLoginError(err.response?.data?.error || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Step 1: Request 6-digit OTP for signup
  const handleSendSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    if (!signupName.trim()) {
      setSignupError('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setSignupError('Please enter a valid Gmail / Email address.');
      return;
    }
    setIsSendingOtp(true);
    try {
      const res = await api.sendOtp(signupEmail.trim().toLowerCase(), 'signup');
      if (res.otp) {
        setSignupSimulatedOtp(res.otp);
      }
      setSignupStep(2);
      setResendTimer(60);
    } catch (err: any) {
      setSignupError(err.response?.data?.error || 'Failed to send verification code. Please check your email.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    if (signupOtp.trim().length !== 6) {
      setSignupError('Please enter the 6-digit verification code.');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await api.verifyOtp(signupEmail.trim().toLowerCase(), signupOtp.trim());
      setSignupStep(3);
    } catch (err: any) {
      setSignupError(err.response?.data?.error || 'Invalid OTP verification code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP
  const handleResendSignupOtp = async () => {
    if (resendTimer > 0) return;
    setSignupError(null);
    setIsSendingOtp(true);
    try {
      const res = await api.sendOtp(signupEmail.trim().toLowerCase(), 'signup');
      if (res.otp) {
        setSignupSimulatedOtp(res.otp);
      }
      setResendTimer(60);
    } catch (err: any) {
      setSignupError(err.response?.data?.error || 'Unable to resend code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 3: Set Password & Finalize Account Creation
  const handleFinalizeSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    if (signupPassword.length < 5) {
      setSignupError('Password must be at least 5 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match. Please verify.');
      return;
    }
    setIsSignupLoading(true);
    try {
      await signUp(
        signupName.trim(),
        signupEmail.trim().toLowerCase(),
        signupPassword,
        signupOtp.trim(),
        signupOrg.trim() || 'S.B. Jain Campus'
      );
      setIsAuthModalOpen(false);
      navigate('/');
    } catch (err: any) {
      setSignupError(err.response?.data?.error || 'Unable to register account. Please try again.');
    } finally {
      setIsSignupLoading(false);
    }
  };

  // Forgot Password: Send OTP
  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotError('Please enter your registered email address.');
      return;
    }
    setIsForgotLoading(true);
    try {
      const res = await api.sendOtp(forgotEmail.trim().toLowerCase(), 'forgot-password');
      if (res.otp) {
        setForgotSimulatedOtp(res.otp);
      }
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'No account found with this email.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Forgot Password: Reset Password with OTP
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (forgotOtp.trim().length !== 6) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (forgotNewPassword.length < 5) {
      setForgotError('New password must be at least 5 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    setIsForgotLoading(true);
    try {
      await api.resetPassword({
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword,
      });
      setIsForgotModalOpen(false);
      setEmail(forgotEmail.trim().toLowerCase());
      setPassword('');
      setLoginSuccessMessage('Password reset successfully! Please sign in with your new password.');
      setAuthTab('login');
      setIsAuthModalOpen(true);
      setForgotStep(1);
      setForgotOtp('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setForgotSimulatedOtp(null);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'Failed to reset password. Please check your code.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="home-motion-shell min-h-screen bg-slate-50 dark:bg-[#070d19] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 selection:bg-[#4FC3F7] selection:text-slate-950 relative overflow-x-clip">
      <div className="home-motion-orb home-motion-orb-one" aria-hidden="true" />
      <div className="home-motion-orb home-motion-orb-two" aria-hidden="true" />
      <div className="home-motion-grid" aria-hidden="true" />
      <div className="home-motion-beam" aria-hidden="true" />
      <div className="home-motion-particle home-motion-particle-one" aria-hidden="true" />
      <div className="home-motion-particle home-motion-particle-two" aria-hidden="true" />
      <div className="home-motion-particle home-motion-particle-three" aria-hidden="true" />
      <div className="home-water-bubble home-water-bubble-one" aria-hidden="true" />
      <div className="home-water-bubble home-water-bubble-two" aria-hidden="true" />
      <div className="home-water-bubble home-water-bubble-three" aria-hidden="true" />
      <div className="home-water-bubble home-water-bubble-four" aria-hidden="true" />
      <div className="home-water-bubble home-water-bubble-five" aria-hidden="true" />

      {/* =========================================================================
          HEADER / NAVBAR (Sticky Blended Glassmorphism: Home, Features, Help, Contacts)
         ========================================================================= */}
      <header className={`sticky top-0 z-50 glass-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo */}
            <a href="#home" className="flex items-center gap-3 group interactive-btn">
              <img
                src="/aquapure-logo.png"
                alt="AquaPure Logo"
                className="w-10 h-10 rounded-xl object-contain bg-white dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700/80 shadow-lg shadow-sky-500/20 group-hover:scale-105 group-hover:shadow-sky-500/40 transition-all duration-300"
              />
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
                className="lg:sticky z-10 mb-6 lg:mb-[34vh] p-7 sm:p-9 rounded-3xl bg-[#fff7ed] dark:bg-[#150d03] border border-orange-200/90 dark:border-orange-900/70 hover:border-orange-400 dark:hover:border-orange-500 shadow-[0_-8px_25px_rgba(0,0,0,0.06),0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.5),0_25px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-300 group cursor-default interactive-card"
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
                className="lg:sticky z-20 mb-6 lg:mb-[34vh] p-7 sm:p-9 rounded-3xl bg-[#f0fdf4] dark:bg-[#05170d] border border-emerald-200/90 dark:border-emerald-900/70 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-[0_-8px_25px_rgba(0,0,0,0.06),0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.5),0_25px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-300 group cursor-default interactive-card"
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
                className="lg:sticky z-30 mb-6 lg:mb-[34vh] p-7 sm:p-9 rounded-3xl bg-[#f1f4ff] dark:bg-[#091124] border border-indigo-200/90 dark:border-indigo-900/70 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-[0_-8px_25px_rgba(0,0,0,0.06),0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.5),0_25px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-300 group cursor-default interactive-card"
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
                className="lg:sticky z-40 mb-6 lg:mb-[34vh] p-7 sm:p-9 rounded-3xl bg-[#f0f9ff] dark:bg-[#041322] border border-sky-200/90 dark:border-sky-900/70 hover:border-sky-400 dark:hover:border-sky-500 shadow-[0_-8px_25px_rgba(0,0,0,0.06),0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.5),0_25px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-300 group cursor-default interactive-card"
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
                className="lg:sticky z-50 mb-6 lg:mb-[34vh] p-7 sm:p-9 rounded-3xl bg-[#faf5ff] dark:bg-[#12081f] border border-purple-200/90 dark:border-purple-900/70 hover:border-purple-400 dark:hover:border-purple-500 shadow-[0_-8px_25px_rgba(0,0,0,0.06),0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.5),0_25px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-300 group cursor-default interactive-card"
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
                className="lg:sticky z-[60] mb-6 lg:mb-8 p-7 sm:p-9 rounded-3xl bg-[#f0fdfa] dark:bg-[#041614] border border-teal-200/90 dark:border-teal-900/70 hover:border-teal-400 dark:hover:border-teal-500 shadow-[0_-8px_25px_rgba(0,0,0,0.06),0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.5),0_25px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-300 group cursor-default interactive-card"
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
                  <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4 font-bold text-sm shadow-xs">01</div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">IoT Node Provisioning</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">Learn how to flash firmware to your Pico W or ESP32 node and connect telemetry to the `/api/iot/sensor-data` endpoint.</p>
                </div>
                <button onClick={() => handleOpenAuth('login')} className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 hover:underline cursor-pointer pt-2 group">
                  <span>View Node Setup Docs</span><ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="h-full p-6 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/80 dark:border-slate-800 shadow-sm interactive-card card-glow-hover flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 font-bold text-sm shadow-xs">02</div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Sensor Thresholds &amp; Alerts</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">Configure custom safety thresholds for potable water (pH 6.5 - 8.5, TDS &lt; 300 PPM, Turbidity &lt; 5 NTU) with real-time technician dispatch.</p>
                </div>
                <button onClick={() => handleOpenAuth('login')} className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline cursor-pointer pt-2 group">
                  <span>Configure Threshold Rules</span><ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <div className="h-full p-6 rounded-2xl bg-white dark:bg-[#0e172a] border border-slate-200/80 dark:border-slate-800 shadow-sm interactive-card card-glow-hover flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 font-bold text-sm shadow-xs">03</div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Emergency Contamination Lock</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">Instructions for automated solenoid valve isolation upon critical bacterial or heavy chemical detection to prevent hazardous distribution.</p>
                </div>
                <button onClick={() => handleOpenAuth('login')} className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5 hover:underline cursor-pointer pt-2 group">
                  <span>Read Emergency Protocol</span><ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </ScrollReveal>
          </div>

          
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
                      <img
                        src="/aquapure-logo.png"
                        alt="AquaPure Logo"
                        className="w-11 h-11 rounded-2xl object-contain bg-white dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700/80 shadow-lg shadow-sky-600/30 group-hover:scale-105 transition-transform duration-300"
                      />
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
          AUTHENTICATION MODAL (Enhanced with Electric Blue Animations & Effects)
         ========================================================================= */}
      {/* =========================================================================
          AUTHENTICATION & SIGN UP MODAL (Flanked by Dual-Side Electric Blue Telemetry Wings)
         ========================================================================= */}
      {isAuthModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-2xl animate-fade-in duration-200 overflow-y-auto"
          onClick={() => setIsAuthModalOpen(false)}
        >
          {/* Ambient Radiant Blue Glow Behind Modal */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#0288D1]/30 via-[#00E5FF]/20 to-blue-600/25 rounded-full blur-[130px] pointer-events-none animate-blue-aura" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[#00E5FF]/20 rounded-full blur-[90px] pointer-events-none animate-pulse-glow" />

          {/* Screen-Edge Holographic Rail Effects on Both Left & Right Sides */}
          <div className="fixed left-5 top-1/4 bottom-1/4 w-10 pointer-events-none hidden lg:block opacity-80">
            <div className="absolute left-1 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#00E5FF]/70 to-transparent" />
            <div className="absolute left-0 top-0 h-24 w-px bg-gradient-to-b from-transparent via-[#00E5FF] to-transparent shadow-[0_0_12px_#00E5FF] animate-side-laser-down" />
            <div className="absolute left-0 top-1/4 w-3 h-3 rounded-full border border-[#00E5FF] shadow-[0_0_12px_#00E5FF] animate-ping" />
            <div className="absolute left-0 top-1/2 w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_10px_#00E5FF] animate-pulse" />
            <div className="absolute left-0 top-3/4 w-3 h-3 rounded-full border border-[#0288D1] shadow-[0_0_10px_#0288D1] animate-pulse" />
            <div className="absolute left-1 top-1/4 ml-3 w-6 border-t border-[#00E5FF]/40" />
            <div className="absolute left-1 top-1/2 ml-3 w-4 border-t border-[#00E5FF]/30" />
            <div className="absolute left-1 top-3/4 ml-3 w-6 border-t border-[#0288D1]/40" />
          </div>
          <div className="fixed right-5 top-1/4 bottom-1/4 w-10 pointer-events-none hidden lg:block opacity-80">
            <div className="absolute right-1 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#00E5FF]/70 to-transparent" />
            <div className="absolute right-0 top-0 h-24 w-px bg-gradient-to-t from-transparent via-[#00E5FF] to-transparent shadow-[0_0_12px_#00E5FF] animate-side-laser-up" />
            <div className="absolute right-0 top-1/4 w-3 h-3 rounded-full border border-[#00E5FF] shadow-[0_0_12px_#00E5FF] animate-ping" />
            <div className="absolute right-0 top-1/2 w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_10px_#00E5FF] animate-pulse" />
            <div className="absolute right-0 top-3/4 w-3 h-3 rounded-full border border-[#0288D1] shadow-[0_0_10px_#0288D1] animate-pulse" />
            <div className="absolute right-1 top-1/4 mr-3 w-6 border-t border-[#00E5FF]/40" />
            <div className="absolute right-1 top-1/2 mr-3 w-4 border-t border-[#00E5FF]/30" />
            <div className="absolute right-1 top-3/4 mr-3 w-6 border-t border-[#0288D1]/40" />
          </div>

          {/* Triple-Column Centered Modal Layout: [LEFT WING] + [SIGN IN / SIGN UP CARD] + [RIGHT WING] */}
          <div
            className="relative z-10 flex items-center justify-center gap-5 max-w-6xl w-full my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* -------------------------------------------------------------
                CENTER MAIN SIGN IN / SIGN UP MODAL CARD
               ------------------------------------------------------------- */}
            <div className="relative w-full max-w-md p-[1.5px] rounded-3xl bg-gradient-to-b from-[#00E5FF] via-[#0288D1] to-[#01579B] shadow-[0_0_50px_rgba(2,136,209,0.35),0_20px_50px_rgba(0,0,0,0.6)] animate-scale-up overflow-hidden">
              {/* Modal Body */}
              <div className="bg-white/95 dark:bg-[#071124]/95 backdrop-blur-2xl rounded-[calc(1.5rem-1.5px)] p-6 sm:p-8 relative overflow-hidden">
                {/* Electric Blue Laser Scanline Pulse on Card */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent shadow-[0_0_15px_#00E5FF] animate-blue-scanline pointer-events-none" />

                {/* Floating Hydro Bubbles inside Modal */}
                <div className="absolute right-5 top-12 w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#00E5FF] to-white blur-[0.5px] animate-bubble-1 pointer-events-none" />
                <div className="absolute left-6 bottom-14 w-3 h-3 rounded-full bg-gradient-to-tr from-[#0288D1] to-[#4FC3F7] blur-[0.5px] animate-bubble-3 pointer-events-none" />
                <div className="absolute right-10 bottom-24 w-2 h-2 rounded-full bg-gradient-to-tr from-cyan-300 to-white blur-[0.5px] animate-bubble-2 pointer-events-none" />

                {/* Top Close Button */}
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-[#00E5FF] dark:hover:text-[#00E5FF] hover:bg-sky-50 dark:hover:bg-slate-800/80 transition-all cursor-pointer interactive-btn z-20 border border-transparent hover:border-[#00E5FF]/40"
                >
                  <X size={18} />
                </button>

                {/* Modal Header & Brand Icon with Animated Blue Ripples */}
                <div className="text-center mb-6 relative">
                  <div className="relative inline-flex items-center justify-center mb-3">
                    {/* Expanding Water Ripple Waves */}
                    <div className="absolute w-16 h-16 rounded-full border border-[#00E5FF]/40 animate-water-ripple pointer-events-none" />
                    <div className="absolute w-20 h-20 rounded-full border border-sky-400/25 animate-water-ripple pointer-events-none" style={{ animationDelay: '1.2s' }} />
                    {/* Orbit Ring */}
                    <div className="absolute w-18 h-18 rounded-full border border-dashed border-[#00E5FF]/50 animate-orbit-slow pointer-events-none" />

                    <div className="relative p-1.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#00E5FF]/60 shadow-[0_0_20px_rgba(0,229,255,0.4)] animate-pulse-glow z-10">
                      <img
                        src="/aquapure-logo.png"
                        alt="AquaPure Logo"
                        className="w-12 h-12 rounded-xl object-contain"
                      />
                    </div>
                  </div>

                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {authTab === 'login' ? 'Sign In to AquaPure' : 'Create AquaPure Account'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    {authTab === 'login'
                      ? 'Access real-time telemetry, filter analytics & AI alerts.'
                      : 'Register for centralized S.B. Jain campus water telemetry access.'}
                  </p>
                </div>

                {/* Tab Switcher (Login vs Sign Up) with Glowing Blue Active Tab */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl mb-6 border border-sky-200/60 dark:border-sky-900/50 shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('login');
                      setLoginError(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer interactive-btn ${
                      authTab === 'login'
                        ? 'bg-gradient-to-r from-[#00E5FF] via-[#29B6F6] to-[#0288D1] text-slate-950 font-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
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
                        ? 'bg-gradient-to-r from-[#00E5FF] via-[#29B6F6] to-[#0288D1] text-slate-950 font-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* TAB 1: LOGIN FORM */}
                {authTab === 'login' && (
                  <>
                    {loginSuccessMessage && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs mb-4 flex items-center gap-2 animate-fade-in-up">
                        <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                        <span>{loginSuccessMessage}</span>
                      </div>
                    )}

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
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0288D1] dark:text-[#4FC3F7]">
                            <Mail size={16} />
                          </div>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 focus:border-[#00E5FF] focus:shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all"
                            placeholder="Enter your email (e.g. name@gmail.com)"
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
                            onClick={() => {
                              setIsForgotModalOpen(true);
                              setForgotStep(1);
                              setForgotError(null);
                              setForgotSimulatedOtp(null);
                            }}
                            className="text-[11px] font-semibold text-[#0288D1] dark:text-[#4FC3F7] hover:underline cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0288D1] dark:text-[#4FC3F7]">
                            <Lock size={16} />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 focus:border-[#00E5FF] focus:shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#00E5FF] transition-colors interactive-btn"
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
                            className="h-4 w-4 rounded border-slate-300 text-[#0288D1] focus:ring-[#00E5FF] accent-[#0288D1]"
                          />
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            Remember Me
                          </span>
                        </label>
                      </div>

                      {/* Electric Blue Sign In Action Button */}
                      <button
                        type="submit"
                        disabled={isLoginLoading}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#29B6F6] to-[#0288D1] hover:from-[#29B6F6] hover:to-[#01579B] text-slate-950 text-xs font-black shadow-[0_0_25px_rgba(0,229,255,0.4)] hover:shadow-[0_0_35px_rgba(0,229,255,0.65)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 interactive-btn shimmer-sweep"
                      >
                        <span>{isLoginLoading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
                        <ArrowRight size={16} className="stroke-[2.5]" />
                      </button>
                    </form>
                  </>
                )}

                {/* TAB 2: SIGN UP / REGISTRATION FORM (With 3-Step OTP Verification Flow) */}
                {authTab === 'signup' && (
                  <div className="space-y-4">
                    {/* Step Progress Bar */}
                    <div className="flex items-center justify-between px-1 mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${signupStep >= 1 ? 'bg-[#00E5FF] text-slate-950 font-black' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                          1
                        </div>
                        <span className={`text-[11px] font-bold ${signupStep === 1 ? 'text-[#00E5FF]' : 'text-slate-400'}`}>
                          Details
                        </span>
                      </div>
                      <div className={`h-0.5 flex-1 mx-2 rounded-full ${signupStep >= 2 ? 'bg-[#00E5FF]' : 'bg-slate-200 dark:bg-slate-800'}`} />
                      <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${signupStep >= 2 ? 'bg-[#00E5FF] text-slate-950 font-black' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                          2
                        </div>
                        <span className={`text-[11px] font-bold ${signupStep === 2 ? 'text-[#00E5FF]' : 'text-slate-400'}`}>
                          OTP
                        </span>
                      </div>
                      <div className={`h-0.5 flex-1 mx-2 rounded-full ${signupStep >= 3 ? 'bg-[#00E5FF]' : 'bg-slate-200 dark:bg-slate-800'}`} />
                      <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${signupStep >= 3 ? 'bg-[#00E5FF] text-slate-950 font-black' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                          3
                        </div>
                        <span className={`text-[11px] font-bold ${signupStep === 3 ? 'text-[#00E5FF]' : 'text-slate-400'}`}>
                          Password
                        </span>
                      </div>
                    </div>

                    {/* In-Modal OTP Simulation Helper Toast */}
                    {signupSimulatedOtp && (
                      <div className="p-3 rounded-xl bg-cyan-950/60 border border-[#00E5FF]/40 text-[#00E5FF] text-xs flex items-center justify-between animate-fade-in-down shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                        <div className="flex items-center gap-2">
                          <KeyRound size={15} className="shrink-0 animate-pulse text-[#00E5FF]" />
                          <div>
                            <span className="font-bold">Verification Code: </span>
                            <span className="font-mono font-black text-sm tracking-wider text-white bg-[#0288D1]/80 px-1.5 py-0.5 rounded">
                              {signupSimulatedOtp}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSignupOtp(signupSimulatedOtp);
                            setSignupError(null);
                          }}
                          className="text-[10px] font-black uppercase px-2 py-1 rounded bg-[#00E5FF] text-slate-950 hover:bg-white transition-colors cursor-pointer"
                        >
                          Autofill
                        </button>
                      </div>
                    )}

                    {signupError && (
                      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-shake">
                        <AlertTriangle size={15} className="shrink-0 text-rose-500" />
                        <span>{signupError}</span>
                      </div>
                    )}

                    {/* STEP 1: Enter Name & Email to send OTP */}
                    {signupStep === 1 && (
                      <form onSubmit={handleSendSignupOtp} className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Full Name
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0288D1] dark:text-[#4FC3F7]">
                              <UserIcon size={16} />
                            </div>
                            <input
                              type="text"
                              required
                              value={signupName}
                              onChange={(e) => setSignupName(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 focus:border-[#00E5FF] focus:shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all"
                              placeholder="e.g. Utkarsh Punkar"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Email Address (Real Gmail / Institutional)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0288D1] dark:text-[#4FC3F7]">
                              <Mail size={16} />
                            </div>
                            <input
                              type="email"
                              required
                              value={signupEmail}
                              onChange={(e) => setSignupEmail(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 focus:border-[#00E5FF] focus:shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all"
                              placeholder="e.g. utkarshpunkar7@gmail.com"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            We will send a 6-digit OTP verification code to this email.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Campus / Organization
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0288D1] dark:text-[#4FC3F7]">
                              <Building2 size={15} />
                            </div>
                            <input
                              type="text"
                              value={signupOrg}
                              onChange={(e) => setSignupOrg(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 focus:border-[#00E5FF] transition-all"
                              placeholder="S.B. Jain Campus"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSendingOtp}
                          className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#29B6F6] to-[#0288D1] hover:from-[#29B6F6] hover:to-[#01579B] text-slate-950 text-xs font-black shadow-[0_0_25px_rgba(0,229,255,0.4)] hover:shadow-[0_0_35px_rgba(0,229,255,0.65)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 interactive-btn shimmer-sweep"
                        >
                          <Send size={15} />
                          <span>{isSendingOtp ? 'Sending Verification Code...' : 'Send 6-Digit Verification Code'}</span>
                        </button>
                      </form>
                    )}

                    {/* STEP 2: Enter & Verify 6-Digit OTP */}
                    {signupStep === 2 && (
                      <form onSubmit={handleVerifySignupOtp} className="space-y-4 animate-fade-in-up">
                        <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-center">
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            Enter the 6-digit code sent to:
                          </p>
                          <p className="text-xs font-bold text-[#0288D1] dark:text-[#4FC3F7] mt-0.5 font-mono">
                            {signupEmail}
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                            6-Digit Verification Code
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            required
                            autoFocus
                            value={signupOtp}
                            onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full py-3 text-center text-xl font-mono font-black tracking-[0.4em] rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/50 focus:border-[#00E5FF] focus:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
                            placeholder="••••••"
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => setSignupStep(1)}
                            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowLeft size={13} />
                            <span>Change Email</span>
                          </button>

                          <button
                            type="button"
                            disabled={resendTimer > 0 || isSendingOtp}
                            onClick={handleResendSignupOtp}
                            className={`flex items-center gap-1 font-bold ${
                              resendTimer > 0
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-[#0288D1] dark:text-[#4FC3F7] hover:underline cursor-pointer'
                            }`}
                          >
                            <RefreshCw size={13} className={isSendingOtp ? 'animate-spin' : ''} />
                            <span>{resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}</span>
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={isVerifyingOtp || signupOtp.length !== 6}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#29B6F6] to-[#0288D1] hover:from-[#29B6F6] hover:to-[#01579B] text-slate-950 text-xs font-black shadow-[0_0_25px_rgba(0,229,255,0.4)] hover:shadow-[0_0_35px_rgba(0,229,255,0.65)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 interactive-btn shimmer-sweep"
                        >
                          <ShieldCheck size={16} />
                          <span>{isVerifyingOtp ? 'Verifying Code...' : 'Verify Code & Proceed'}</span>
                        </button>
                      </form>
                    )}

                    {/* STEP 3: Set Password & Finalize Account Creation */}
                    {signupStep === 3 && (
                      <form onSubmit={handleFinalizeSignup} className="space-y-3.5 animate-fade-in-up">
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                Email Verified ✓
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                {signupEmail}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                            Role: Viewer (User)
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Create Password
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0288D1] dark:text-[#4FC3F7]">
                              <Lock size={16} />
                            </div>
                            <input
                              type={showSignupPassword ? 'text' : 'password'}
                              required
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 focus:border-[#00E5FF] transition-all"
                              placeholder="Minimum 5 characters"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignupPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#00E5FF] interactive-btn transition-colors"
                            >
                              {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>

                          {/* Dynamic Real-Time Password Strength Meter */}
                          {signupPassword && (
                            <div className="mt-2 p-2.5 rounded-xl bg-sky-50/60 dark:bg-slate-900/90 border border-[#00E5FF]/30 animate-fade-in">
                              <div className="flex items-center justify-between text-[10px] mb-1.5">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Security Matrix:</span>
                                <span className={`font-bold ${getPasswordStrength(signupPassword).text}`}>
                                  {getPasswordStrength(signupPassword).label}
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${getPasswordStrength(signupPassword).color} shadow-[0_0_8px_#00E5FF]`}
                                  style={{ width: getPasswordStrength(signupPassword).width }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0288D1] dark:text-[#4FC3F7]">
                              <Lock size={16} />
                            </div>
                            <input
                              type={showSignupConfirmPassword ? 'text' : 'password'}
                              required
                              value={signupConfirmPassword}
                              onChange={(e) => setSignupConfirmPassword(e.target.value)}
                              className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 focus:border-[#00E5FF] transition-all"
                              placeholder="Re-enter password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignupConfirmPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#00E5FF] interactive-btn transition-colors"
                            >
                              {showSignupConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Your account will be created with default <strong>Viewer</strong> access. Technical Head can upgrade your permissions upon review.
                        </p>

                        <button
                          type="submit"
                          disabled={isSignupLoading}
                          className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#29B6F6] to-[#0288D1] hover:from-[#29B6F6] hover:to-[#01579B] text-slate-950 text-xs font-black shadow-[0_0_25px_rgba(0,229,255,0.4)] hover:shadow-[0_0_35px_rgba(0,229,255,0.65)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 interactive-btn shimmer-sweep"
                        >
                          <span>{isSignupLoading ? 'Saving Account Credentials...' : 'Create Account & Enter'}</span>
                          <ArrowRight size={16} className="stroke-[2.5]" />
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Secure Session Footer in Blue */}
                <div className="mt-4 pt-3 text-center border-t border-sky-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[10px] text-[#0288D1] dark:text-[#4FC3F7] font-semibold">
                  <ShieldCheck size={13} className="text-[#00E5FF]" />
                  <span>256-bit Encrypted Telemetry Grid &bull; S.B. Jain Campus</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          FORGOT PASSWORD MODAL (2-Step OTP Verification Reset)
         ========================================================================= */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#071328] rounded-3xl shadow-2xl shadow-[#00E5FF]/20 border border-[#00E5FF]/40 p-6 relative animate-scale-up overflow-hidden blue-pulse-aura">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent animate-blue-scanline pointer-events-none" />
            <button
              onClick={() => {
                setIsForgotModalOpen(false);
                setForgotError(null);
                setForgotSimulatedOtp(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-[#00E5FF] dark:hover:text-[#00E5FF] p-1.5 rounded-lg cursor-pointer interactive-btn transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#00E5FF]/15 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF]">
                <KeyRound size={16} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reset Password with OTP
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-sky-200/70 mb-4">
              Verify your registered email with a 6-digit OTP code to create a new password.
            </p>

            {/* In-Modal OTP Simulation Helper Toast */}
            {forgotSimulatedOtp && (
              <div className="p-3 rounded-xl bg-cyan-950/60 border border-[#00E5FF]/40 text-[#00E5FF] text-xs flex items-center justify-between mb-3 animate-fade-in-down">
                <div className="flex items-center gap-2">
                  <KeyRound size={15} className="shrink-0 text-[#00E5FF]" />
                  <div>
                    <span className="font-bold">Reset OTP: </span>
                    <span className="font-mono font-black text-sm tracking-wider text-white bg-[#0288D1]/80 px-1.5 py-0.5 rounded">
                      {forgotSimulatedOtp}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotOtp(forgotSimulatedOtp);
                    setForgotError(null);
                  }}
                  className="text-[10px] font-black uppercase px-2 py-1 rounded bg-[#00E5FF] text-slate-950 hover:bg-white transition-colors cursor-pointer"
                >
                  Autofill
                </button>
              </div>
            )}

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs mb-3 flex items-center gap-2 animate-shake">
                <AlertTriangle size={15} className="shrink-0 text-rose-500" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendForgotOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-sky-200 mb-1">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1933] border border-slate-200 dark:border-[#0288D1]/40 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-sky-400/40"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#0288D1] to-[#01579B] hover:from-[#38BDF8] hover:to-[#0288D1] text-slate-950 text-xs font-bold shadow-lg shadow-[#00E5FF]/25 hover:shadow-[#00E5FF]/40 transition-all cursor-pointer interactive-btn shimmer-sweep flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send size={14} />
                  <span>{isForgotLoading ? 'Sending OTP Code...' : 'Send Reset Code'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3 animate-fade-in-up">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-sky-200 mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full px-3.5 py-2.5 text-center font-mono font-bold tracking-widest rounded-xl bg-slate-50 dark:bg-[#0b1933] border border-slate-200 dark:border-[#0288D1]/40 text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-sky-200 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      required
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Minimum 5 characters"
                      className="w-full px-3.5 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1933] border border-slate-200 dark:border-[#0288D1]/40 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00E5FF]"
                    >
                      {showForgotNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-sky-200 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showForgotNewPassword ? 'text' : 'password'}
                    required
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1933] border border-slate-200 dark:border-[#0288D1]/40 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#0288D1] to-[#01579B] hover:from-[#38BDF8] hover:to-[#0288D1] text-slate-950 text-xs font-bold shadow-lg shadow-[#00E5FF]/25 hover:shadow-[#00E5FF]/40 transition-all cursor-pointer interactive-btn shimmer-sweep flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <CheckCircle2 size={14} />
                    <span>{isForgotLoading ? 'Updating...' : 'Set Password'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
