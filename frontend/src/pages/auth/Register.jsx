import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Sparkles, Shield, Star, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/authStore';
import api from '../../utils/api';

export default function Register() {
  const { register, verifyOTP, selectRole } = useAuthStore();
  const navigate = useNavigate();

  const [step,    setStep]    = useState('form');
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [userId,  setUserId]  = useState('');
  const [masked,  setMasked]  = useState('');
  const [otp,     setOtp]     = useState(['', '', '', '', '', '']);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [form,    setForm]    = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', roles: ['customer'] });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Fill all required fields');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password, roles: form.roles });
      setUserId(res.userId);
      setMasked(res.maskedContact || form.email);
      setStep('otp');
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) document.getElementById(`reg-otp-${idx + 1}`)?.focus();
  };

  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) document.getElementById(`reg-otp-${idx - 1}`)?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter complete 6-digit OTP');
    setLoading(true);
    try {
      const res = await verifyOTP(userId, code, 'register');
      if (res.requireRoleSelection) {
        setAvailableRoles(res.availableRoles);
        setUserId(res.userId);
        setStep('role');
        toast.success('Email verified! Now choose your role.');
        return;
      }
      toast.success('Account created! Welcome to HomeConnect 🎉');
      navigate(res.role === 'admin' ? '/admin' : res.role === 'seller' ? '/seller' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('reg-otp-0')?.focus();
    } finally { setLoading(false); }
  };

  const handleSelectRole = async (role) => {
    setLoading(true);
    try {
      const res = await selectRole(userId, role);
      toast.success(`Logged in as ${role}! Welcome 🎉`);
      navigate(res.role === 'admin' ? '/admin' : res.role === 'seller' ? '/seller' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Role selection failed');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { userId, purpose: 'register' });
      toast.success('OTP resent!');
    } catch { toast.error('Failed to resend OTP'); }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#080c14]">

      {/* Left Panel */}
      <div className="hidden lg:flex w-[45%] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)' }}>
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/15 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/15 rounded-full -translate-x-1/4 translate-y-1/4 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '36px 36px' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-xl">🏠</span>
            </div>
            <span className="font-black text-xl text-white">HomeConnect</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <h2 className="text-4xl font-black text-white mb-4 leading-tight">
              Join Thousands of<br />
              <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                Happy Home Buyers
              </span>
            </h2>
            <p className="text-indigo-200 text-base mb-8 leading-relaxed max-w-sm">
              Create your free account and discover India's most trusted AI-powered real estate platform.
            </p>
            <div className="space-y-4">
              {[
                { icon: Sparkles, label: 'AI-powered property matching' },
                { icon: Shield,   label: 'Verified & fraud-free listings' },
                { icon: Star,     label: 'Instant price estimates & EMI calculator' },
              ].map((f, i) => (
                <motion.div key={f.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-4 h-4 text-amber-300" />
                  </div>
                  <span className="text-indigo-100 text-sm font-medium">{f.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/15">
            <div className="flex -space-x-2">
              {['A','B','C','D'].map((l, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 border-2 border-indigo-900 flex items-center justify-center text-white text-xs font-bold">
                  {l}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white text-xs font-semibold">500+ buyers joined this month</p>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />)}
                <span className="text-indigo-300 text-[10px] ml-1">4.8/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-md">

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
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}>

              <div className="mb-7">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                  {step === 'form' ? 'Create your account 🎉' : step === 'otp' ? 'Verify your email' : 'Choose your role'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
                  {step === 'form' ? "Join HomeConnect — it's free forever" : step === 'otp' ? `OTP sent to ${masked}` : 'Select which role you want to enter as'}
                </p>
              </div>

              {step === 'role' ? (
                <div className="space-y-3">
                  {[
                    { value: 'customer', emoji: '🏠', label: 'Buyer',  desc: 'Browse and book properties', color: 'from-blue-500 to-indigo-500' },
                    { value: 'seller',   emoji: '🏢', label: 'Seller', desc: 'List and manage your properties', color: 'from-emerald-500 to-teal-500' },
                    { value: 'admin',    emoji: '🛡️', label: 'Admin',  desc: 'Manage the entire platform', color: 'from-rose-500 to-pink-500' },
                  ].filter(opt => availableRoles.includes(opt.value)).map(opt => (
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
              ) : step === 'form' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input name="name" value={form.name} onChange={handleChange}
                        placeholder="Your full name" className="input pl-10" autoFocus required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input name="email" value={form.email} onChange={handleChange} type="email"
                        placeholder="email@example.com" className="input pl-10" required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input name="phone" value={form.phone} onChange={handleChange} type="tel"
                        placeholder="9876543210" className="input pl-10" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input name="password" value={form.password} onChange={handleChange}
                        type={showPw ? 'text' : 'password'}
                        placeholder="Min. 6 characters" className="input pl-10 pr-11" required />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 transition-colors">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                        type="password" placeholder="Repeat your password" className="input pl-10" required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Account Type <span className="text-xs text-gray-400 font-normal">(select one)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Account type">
                      {[
                        { value: 'customer', emoji: '🏠', label: 'Buyer',  desc: 'Find & book properties' },
                        { value: 'seller',   emoji: '🏢', label: 'Seller', desc: 'List & sell properties' },
                        { value: 'admin',    emoji: '🛡️', label: 'Admin',  desc: 'Manage the platform' },
                      ].map(opt => {
                        const selected = form.roles.includes(opt.value);
                        return (
                          <button key={opt.value} type="button"
                            onClick={() => setForm(f => ({
                              ...f,
                              roles: [opt.value]
                            }))}
                            role="radio"
                            aria-checked={selected}
                            className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                              selected
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}>
                            {selected && (
                              <CheckCircle2 className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-primary-500" />
                            )}
                            <div className="font-bold text-sm text-gray-900 dark:text-white">{opt.emoji} {opt.label}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                    {/*
                      <p className="text-xs text-primary-600 dark:text-primary-400 mt-1.5">
                        ✓ Multi-role account — you'll choose your role at each login
                      </p>
                    */}
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
                    }
                  </button>

                  <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 transition-colors">
                      Sign in
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
                        <input key={i} id={`reg-otp-${i}`} maxLength={1} value={d}
                          onChange={e => handleOtpChange(e.target.value, i)}
                          onKeyDown={e => handleOtpKey(e, i)}
                          className="w-12 h-12 text-center text-xl font-black border-2 rounded-xl outline-none
                                     border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60
                                     text-gray-900 dark:text-white
                                     focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                                     transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  <button onClick={handleVerify} disabled={loading} className="btn-primary w-full py-3">
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : 'Verify & Create Account'
                    }
                  </button>

                  <div className="flex items-center justify-between text-sm">
                    <button onClick={() => setStep('form')}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                      ← Back
                    </button>
                    <button onClick={handleResend}
                      className="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 transition-colors">
                      Resend OTP
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
