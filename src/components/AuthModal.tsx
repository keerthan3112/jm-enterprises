import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  Lock, 
  Phone, 
  Mail, 
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  Lightbulb,
  RotateCcw
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import jmLogo from '../assets/logo.png';
import { LampAnimation } from './LampAnimation';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User) => void;
  isDark?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'login',
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin'>('login');
  
  // Interactive Lamp Light state: turned on initially by user
  const [isLampOn, setIsLampOn] = useState(false);

  // Form pops up AFTER blast happens and lamp goes off!
  const [isFormPopped, setIsFormPopped] = useState(false);

  // Customer login credentials
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [showCustomerPassword, setShowCustomerPassword] = useState(false);

  // Register credentials
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Admin credentials
  const [adminId, setAdminId] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // When modal opens: start with light OFF so user can trigger the blast & pop-up
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab === 'register' ? 'register' : 'login');
      setError('');
      setIsLampOn(false);
      setIsFormPopped(true);
    }
  }, [isOpen, initialTab]);

  // Turn on lamp to trigger car rush and blast
  const handleStartSequence = () => {
    setIsFormPopped(false);
    setIsLampOn(true);
  };

  // Called when blast finishes and lamp turns OFF
  const handleLampGoesOff = () => {
    setIsLampOn(false); // Lamp goes OFF as requested!
    setIsFormPopped(true); // Login page pops up immediately after the blast!
  };

  // Password strength evaluation for registration
  const passwordStrength = useMemo(() => {
    if (!regPassword) {
      return { score: 0, label: 'Enter password', color: 'bg-slate-200', textColor: 'text-slate-400' };
    }

    const hasMinLength = regPassword.length >= 8;
    const hasLower = /[a-z]/.test(regPassword);
    const hasUpper = /[A-Z]/.test(regPassword);
    const hasNumber = /[0-9]/.test(regPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(regPassword);

    let criteriaCount = 0;
    if (hasLower) criteriaCount++;
    if (hasUpper) criteriaCount++;
    if (hasNumber) criteriaCount++;
    if (hasSpecial) criteriaCount++;

    if (!hasMinLength) {
      return { 
        score: 1, 
        label: `Too short (${regPassword.length}/8 min characters)`, 
        color: 'bg-rose-500', 
        textColor: 'text-rose-600' 
      };
    }

    if (criteriaCount <= 1) {
      return { score: 1, label: 'Weak (add numbers/symbols)', color: 'bg-rose-500', textColor: 'text-rose-600' };
    } else if (criteriaCount === 2) {
      return { score: 2, label: 'Fair (add uppercase & symbols)', color: 'bg-amber-500', textColor: 'text-amber-600' };
    } else if (criteriaCount === 3) {
      return { score: 3, label: 'Good password', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
    } else {
      return { score: 4, label: 'Strong password', color: 'bg-emerald-600', textColor: 'text-emerald-700' };
    }
  }, [regPassword]);

  if (!isOpen) return null;

  // Handle Customer Login
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!customerIdentifier.trim() || !customerPassword) {
      setError('Please enter your username / phone / email and password.');
      return;
    }

    setLoading(true);
    try {
      const { user } = await api.login(customerIdentifier.trim(), customerPassword);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Customer Register
  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!regName.trim() || !regPassword) {
      setError('Please enter your name and password.');
      return;
    }
    if (!regPhone.trim() && !regEmail.trim()) {
      setError('Please provide your phone number or email address.');
      return;
    }
    if (regPassword.length < 8) {
      setError('Password must be a minimum of 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const { user } = await api.register({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
      });
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const idToUse = adminId.trim() || 'admin';
    const pwdToUse = adminPasscode || 'admin123';

    setLoading(true);
    try {
      const { user } = await api.login(idToUse, pwdToUse);
      if (user.role !== 'admin') {
        setError('Entered credentials do not have Admin permissions.');
        return;
      }
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Admin login failed. Please check ID and Passcode.');
    } finally {
      setLoading(false);
    }
  };

  const fillCustomerDemo = () => {
    setCustomerIdentifier('customer@example.com');
    setCustomerPassword('customer123');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      
      {/* Main Container with Lamp + Car Crash Blast + Popping Login Card */}
      <div className="relative w-full max-w-md my-auto flex flex-col items-center">
        
        {/* Floating Top Bar with Actions & Close Button */}
        <div className="w-full flex items-center justify-end mb-2 px-2 text-white">
          <div className="flex items-center gap-2">
            {/* Replay Blast Animation Button: appears ONLY after the lamp is blasted */}
            {isFormPopped && (
              <button
                onClick={handleStartSequence}
                className="px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-sm bg-slate-800 text-amber-400 border-amber-400/40 hover:bg-slate-700 active:scale-95 animate-in fade-in duration-300"
                title="Click to replay car crash and blast animation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay Blast</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================
            THE INTERACTIVE TABLE LAMP + SPEEDING CAR BLAST ANIMATION
           ======================================================== */}
        <div className="relative z-20 -mb-6 w-full">
          <LampAnimation
            isOn={isLampOn}
            onToggle={handleStartSequence}
            onLampGoesOff={handleLampGoesOff}
          />
        </div>

        {/* ========================================================
            STATE A: BEFORE START (LIGHT IS OFF, WAITING FOR USER)
           ======================================================== */}
        {!isLampOn && !isFormPopped && (
          <div className="relative z-10 w-full rounded-3xl p-6 sm:p-8 bg-slate-900/90 border border-slate-800 text-center shadow-2xl backdrop-blur-md animate-in fade-in duration-300 flex flex-col items-center">
            <div 
              onClick={handleStartSequence}
              className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4 cursor-pointer hover:scale-105 hover:bg-amber-400/20 transition-all shadow-lg shadow-amber-500/10"
            >
              <Lightbulb className="w-8 h-8 animate-pulse text-amber-400" />
            </div>

            <h3 className="text-lg font-bold font-display text-white">
              Turn On The Light
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
              Pull the cord on the lamp above <span className="text-amber-400 font-bold inline-block animate-bounce">↓</span> or click below. A car will rush in, hit the lamp with a blast, the lamp will go off, and the login page will pop up!
            </p>

            <button
              type="button"
              onClick={handleStartSequence}
              className="mt-5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-amber-300"
            >
              <Lightbulb className="w-4 h-4 text-slate-950" />
              <span>Turn On Light &amp; Launch Blast</span>
            </button>
          </div>
        )}

        {/* ========================================================
            STATE B: LIGHT IS ON -> CAR IS SPEEDING & BLASTING
           ======================================================== */}
        {isLampOn && !isFormPopped && (
          <div className="relative z-10 w-full h-36 rounded-3xl flex flex-col items-center justify-center text-center p-4">
            <div className="px-4 py-2 rounded-full bg-slate-900/80 border border-amber-400/30 backdrop-blur-md shadow-lg flex items-center gap-2 animate-pulse">
              <span className="text-base select-none">🏎️</span>
              <span className="text-xs font-bold text-amber-300 tracking-wide">
                Car is speeding towards the lamp...!
              </span>
            </div>
          </div>
        )}

        {/* ========================================================
            STATE C: BLAST HAPPENED, LAMP WENT OFF, LOGIN PAGE POPS UP!
           ======================================================== */}
        {isFormPopped && (
          <div 
            className="relative z-10 w-full rounded-3xl transition-all duration-500 overflow-hidden border bg-white text-slate-900 border-amber-300/80 shadow-[0_12px_50px_rgba(251,191,36,0.3),0_0_20px_rgba(0,0,0,0.4)] animate-in zoom-in-75 fade-in duration-300"
          >
            {/* Brand & Tab Navigation */}
            <div className="px-6 pt-5 pb-3 border-b bg-slate-50 border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-black border border-amber-400/50 p-1 flex items-center justify-center shrink-0 shadow-sm">
                  <img src={jmLogo} alt="JM Enterprises" className="w-full h-full object-contain rounded-lg" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold font-display tracking-tight text-slate-950">
                    {activeTab === 'login' && 'Welcome'}
                    {activeTab === 'register' && 'Create Account'}
                    {activeTab === 'admin' && 'Admin Terminal'}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    JM Enterprises · Stationery &amp; Xerox
                  </p>
                </div>
              </div>

              {/* 3-Tab Selector Pill */}
              <div className="p-1 rounded-xl border bg-slate-200/80 border-slate-300 flex items-center gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setError(''); }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-white text-slate-950 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setError(''); }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-white text-emerald-700 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('admin'); setError(''); }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-[#0a1538] text-amber-300 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-6">
              {/* ========================================================
                  TAB 1: SIGN IN (MATCHING USER'S IMAGE CODE)
                  <div class="login-form">
                    <h2>Welcome</h2>
                    <div class="form-group">Username</div>
                    <div class="form-group">Password</div>
                    <button class="login-btn">Sign In</button>
                  </div>
                 ======================================================== */}
              {activeTab === 'login' && (
                <form onSubmit={handleCustomerLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">
                      Username / Mobile / Email
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Enter name, phone or email"
                        value={customerIdentifier}
                        onChange={(e) => setCustomerIdentifier(e.target.value)}
                        required
                        autoFocus
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-slate-400 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showCustomerPassword ? 'text' : 'password'}
                        placeholder="Enter Password"
                        value={customerPassword}
                        onChange={(e) => setCustomerPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-slate-400 transition-all"
                      />
                      {/* Password Viewer Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 focus:outline-none p-1 cursor-pointer transition-colors"
                        title={showCustomerPassword ? 'Hide password' : 'Show password'}
                        aria-label={showCustomerPassword ? 'Hide password' : 'Show password'}
                      >
                        {showCustomerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="login-btn w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0a1538] to-[#162760] hover:from-[#10204f] hover:to-[#21357a] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99] border border-[#2b449b]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 text-amber-400" />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>

                  {/* Quick Demo Helper */}
                  <div className="pt-1.5 text-center">
                    <button
                      type="button"
                      onClick={fillCustomerDemo}
                      className="text-xs text-amber-700 hover:text-amber-900 font-semibold underline decoration-amber-400 cursor-pointer"
                    >
                      ⚡ Quick Demo: customer@example.com / customer123
                    </button>
                  </div>

                  <div className="pt-2 text-center border-t border-slate-100 text-xs text-slate-500">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setActiveTab('register'); setError(''); }}
                      className="text-[#0a1538] hover:underline font-bold cursor-pointer"
                    >
                      Register here
                    </button>
                  </div>
                </form>
              )}

              {/* ========================================================
                  TAB 2: REGISTER (MIN 8 CHARS + PASSWORD STRENGTH CHECKER)
                 ======================================================== */}
              {activeTab === 'register' && (
                <form onSubmit={handleCustomerRegister} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Prashanth Singh"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        autoFocus
                        className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="e.g. 8747991688"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        required
                        className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-700">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Create Password * (Min 8 characters)
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {regPassword.length}/8
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Minimum 8 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                      {/* Password Viewer Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 focus:outline-none p-1 cursor-pointer transition-colors"
                        title={showRegPassword ? 'Hide password' : 'Show password'}
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Checker Bar */}
                    {regPassword && (
                      <div className="mt-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-600">
                            Password Strength:
                          </span>
                          <span className={`font-bold ${passwordStrength.textColor}`}>
                            {passwordStrength.label}
                          </span>
                        </div>

                        {/* 4-Segment Strength Bar */}
                        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                          <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-300'}`} />
                          <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-300'}`} />
                          <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-300'}`} />
                          <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-slate-300'}`} />
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                          <span className={regPassword.length >= 8 ? 'text-emerald-600 font-bold' : ''}>
                            {regPassword.length >= 8 ? '✓' : '•'} 8+ chars
                          </span>
                          <span className={/[0-9]/.test(regPassword) ? 'text-emerald-600 font-bold' : ''}>
                            {/[0-9]/.test(regPassword) ? '✓' : '•'} Numbers
                          </span>
                          <span className={/[A-Z]/.test(regPassword) ? 'text-emerald-600 font-bold' : ''}>
                            {/[A-Z]/.test(regPassword) ? '✓' : '•'} Uppercase
                          </span>
                          <span className={/[^A-Za-z0-9]/.test(regPassword) ? 'text-emerald-600 font-bold' : ''}>
                            {/[^A-Za-z0-9]/.test(regPassword) ? '✓' : '•'} Symbols
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99] mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-500">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => { setActiveTab('login'); setError(''); }}
                      className="text-[#0a1538] hover:underline font-bold cursor-pointer"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              )}

              {/* ========================================================
                  TAB 3: ADMIN ACCESS
                 ======================================================== */}
              {activeTab === 'admin' && (
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">
                      Admin Clearance ID
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={adminId}
                        onChange={(e) => setAdminId(e.target.value)}
                        autoFocus
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">
                      Store Master Passcode
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showAdminPasscode ? 'text' : 'password'}
                        value={adminPasscode}
                        onChange={(e) => setAdminPasscode(e.target.value)}
                        required
                        className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:ring-2 focus:ring-amber-500"
                      />
                      {/* Password Viewer Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 focus:outline-none p-1 cursor-pointer transition-colors"
                        title={showAdminPasscode ? 'Hide passcode' : 'Show passcode'}
                        aria-label={showAdminPasscode ? 'Hide passcode' : 'Show passcode'}
                      >
                        {showAdminPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Verifying Admin...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-slate-950" />
                        <span>Sign In as Admin</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center border-t border-slate-100 text-xs text-slate-500">
                    Are you a customer?{' '}
                    <button
                      type="button"
                      onClick={() => { setActiveTab('login'); setError(''); }}
                      className="text-[#0a1538] hover:underline font-bold cursor-pointer"
                    >
                      Go to Customer Login
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
