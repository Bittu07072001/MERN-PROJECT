import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, RefreshCw, Sparkles, Shield, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/authStore';
import api from '../../utils/api';

const FEATURES = [
  { icon: Sparkles, text: 'AI-Powered Property Search' },
  { icon: Shield,   text: 'Verified & Secure Listings' },
  { icon: CheckCircle, text: 'Instant Price Estimates' },
];

const getVisibleLoginRoles = (roles) =>
  roles.includes('seller') ? roles.filter(role => role !== 'customer') : roles;

export default function Login() {
  const { login, verifyOTP, selectRole } = useAuthStore();
  const navigate = useNavigate();

  const [step,    setStep]    = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [userId,  setUserId]  = useState('');
  const [masked,  setMasked]  = useState('');
  const [otp,     setOtp]     = useState(['', '', '', '', '', '']);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [form,    setForm]    = useState({ emailOrPhone: '', password: '' });

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.emailOrPhone || !form.password) return toast.error('Fill in all fields');
    setLoading(true);
    try {
      const res = await login(form.emailOrPhone, form.password);
      if (res.requireOTP) {
        setUserId(res.userId);
        setMasked(res.maskedContact);
        setStep('otp');
        toast.success('OTP sent to your email');
      } else {
        toast.success('Welcome back!');
        navigate(res.role === 'admin' ? '/admin' : res.role === 'seller' ? '/seller' : '/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter complete 6-digit OTP');
    setLoading(true);
    try {
      const res = await verifyOTP(userId, code, 'login');
      if (res.requireRoleSelection) {
        const visibleRoles = getVisibleLoginRoles(res.availableRoles || []);
        if (visibleRoles.length === 1) {
          const selected = await selectRole(res.userId, visibleRoles[0]);
          toast.success(`Signed in as ${selected.role}!`);
          navigate(selected.role === 'admin' ? '/admin' : selected.role === 'seller' ? '/seller' : '/');
          return;
        }
        setAvailableRoles(visibleRoles);
        setUserId(res.userId);
        setStep('role');
        toast.success('OTP verified! Choose your role.');
        return;
      }
      toast.success('Login successful!');
      navigate(res.role === 'admin' ? '/admin' : res.role === 'seller' ? '/seller' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally { setLoading(false); }
  };

  const handleSelectRole = async (role) => {
    setLoading(true);
    try {
      const res = await selectRole(userId, role);
      toast.success(`Signed in as ${role}!`);
      navigate(res.role === 'admin' ? '/admin' : res.role === 'seller' ? '/seller' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Role selection failed');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { userId, purpose: 'login' });
      toast.success('OTP resent!');
    } catch { toast.error('Failed to resend OTP'); }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#080c14]">

      {/* Left Panel */}
      <div className="hidden lg:flex w-[45%] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)' }}>
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl" />
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '36px 36px' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-xl">🏠</span>
            </div>
            <span className="font-black text-xl text-white">HomeConnect</span>
          </div>

          {/* Main content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
              <h2 className="text-4xl font-black text-white mb-4 leading-tight">
                Your Dream Home<br />
                <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">Starts Here</span>
              </h2>
              <p className="text-indigo-200 text-base mb-8 leading-relaxed max-w-sm">
                Access India's most trusted AI-powered real estate platform with verified listings and smart property insights.
              </p>
              <div className="space-y-4">
                {FEATURES.map((f, i) => (
                  <motion.div key={f.text}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                      <f.icon className="w-4 h-4 text-amber-300" />
                    </div>
                    <span className="text-indigo-100 text-sm font-medium">{f.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[{ n: '33+', l: 'Properties' }, { n: '4.8★', l: 'Rating' }, { n: 'AI', l: 'Powered' }].map(s => (
              <div key={s.l} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                <div className="font-black text-white text-lg">{s.n}</div>
                <div className="text-indigo-300 text-xs">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel – Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-md">
              <span className="text-white text-lg">🏠</span>
            </div>
            <span className="font-black text-xl bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">HomeConnect</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: step === 'otp' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: step === 'otp' ? -20 : 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}>

              <div className="mb-8">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                  {step === 'login' ? 'Welcome back 👋' : step === 'otp' ? 'Verify your identity' : 'Choose your role'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
                  {step === 'login' ? 'Sign in to your HomeConnect account' : step === 'otp' ? `OTP sent to ${masked}` : 'Select how you want to sign in today'}
                </p>
              </div>

              {step === 'role' ? (
                <div className="space-y-3">
                  {[
                    { value: 'customer', emoji: '🏠', label: 'Buyer',  desc: 'Browse and book properties', color: 'from-blue-500 to-indigo-500' },
                    { value: 'seller',   emoji: '🏢', label: 'Seller', desc: 'List and manage your properties', color: 'from-emerald-500 to-teal-500' },
                    { value: 'admin',    emoji: '🛡️', label: 'Admin',  desc: 'Manage the entire platform', color: 'from-rose-500 to-pink-500' },
                  ].filter(opt => getVisibleLoginRoles(availableRoles).includes(opt.value)).map(opt => (
                    <button key={opt.value} onClick={() => handleSelectRole(opt.value)} disabled={loading}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-left group">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${opt.color} flex items-center justify-center text-2xl flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                        {opt.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 dark:text-white">{opt.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{opt.desc}</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              ) : step === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email or Phone
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input name="emailOrPhone" value={form.emailOrPhone} onChange={handleChange}
                        placeholder="email@example.com or 9876543210"
                        className="input pl-10" autoFocus />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input name="password" value={form.password} onChange={handleChange}
                        type={showPw ? 'text' : 'password'}
                        placeholder="••••••••" className="input pl-10 pr-11" />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium transition-colors">
                      Forgot password?
                    </Link>
                  </div>

                  <button type="submit" disabled={loading}
                    className="btn-primary w-full py-3 text-base">
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                    }
                  </button>

                  <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 transition-colors">
                      Create account
                    </Link>
                  </p>
                </form>
              ) : step === 'otp' ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
                      Enter 6-digit OTP
                    </label>
                    <div className="flex justify-center gap-2.5">
                      {otp.map((d, i) => (
                        <input key={i} id={`otp-${i}`} maxLength={1} value={d}
                          onChange={e => handleOtpChange(e.target.value, i)}
                          onKeyDown={e => handleOtpKey(e, i)}
                          className="w-12 h-13 text-center text-xl font-black border-2 rounded-xl outline-none
                                     border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60
                                     text-gray-900 dark:text-white
                                     focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                                     transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  <button onClick={handleVerify} disabled={loading} className="btn-primary w-full py-3 text-base">
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : 'Verify & Login'
                    }
                  </button>

                  <div className="flex items-center justify-between text-sm">
                    <button onClick={() => setStep('login')}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                      ← Back
                    </button>
                    <button onClick={handleResend}
                      className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
