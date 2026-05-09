import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function ForgotPassword() {
  const [step, setStep]     = useState('request'); // request | otp
  const [loading, setLoading] = useState(false);
  const [userId, setUserId]   = useState('');
  const [masked, setMasked]   = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPw, setNewPw]    = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1=request, 2=otp, 3=reset

  const handleRequest = async e => {
    e.preventDefault();
    if (!emailOrPhone) return toast.error('Enter email or phone');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { emailOrPhone });
      setUserId(data.userId);
      setMasked(data.maskedContact);
      setCurrentStep(2);
      toast.success('OTP sent to your email');
    } catch (err) { toast.error(err.response?.data?.message || 'User not found'); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) document.getElementById(`fp-otp-${idx + 1}`)?.focus();
  };
  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) document.getElementById(`fp-otp-${idx - 1}`)?.focus();
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter 6-digit OTP');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-reset-otp', { userId, otp: code });
      setResetToken(data.resetToken);
      setCurrentStep(3);
      toast.success('OTP verified!');
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  const handleReset = async e => {
    e.preventDefault();
    if (newPw.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${resetToken}`, { password: newPw });
      toast.success('Password reset successfully! Please login.');
      window.location.href = '/login';
    } catch (err) { toast.error(err.response?.data?.message || 'Reset failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              {currentStep === 1 ? 'Forgot Password' : currentStep === 2 ? 'Enter OTP' : 'New Password'}
            </h1>
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-2 rounded-full transition-all duration-300 ${s === currentStep ? 'w-6 bg-indigo-600' : s < currentStep ? 'w-2 bg-indigo-400' : 'w-2 bg-gray-300 dark:bg-gray-700'}`} />
              ))}
            </div>
          </div>

          {currentStep === 1 && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={emailOrPhone} onChange={e => setEmailOrPhone(e.target.value)}
                  placeholder="Email or Phone Number" className="input pl-10" autoFocus />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Send OTP</span><ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="text-center text-sm"><Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">← Back to Login</Link></p>
            </form>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">OTP sent to <span className="font-semibold text-gray-800 dark:text-gray-200">{masked}</span></p>
              <div className="flex justify-center gap-2">
                {otp.map((d, i) => (
                  <input key={i} id={`fp-otp-${i}`} maxLength={1} value={d}
                    onChange={e => handleOtpChange(e.target.value, i)} onKeyDown={e => handleOtpKey(e, i)}
                    className="w-11 h-12 text-center text-lg font-bold border-2 rounded-xl outline-none border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 transition-all"
                  />
                ))}
              </div>
              <button onClick={handleVerifyOtp} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verify OTP'}
              </button>
              <div className="flex justify-between text-sm">
                <button onClick={() => setCurrentStep(1)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">← Back</button>
                <button onClick={handleRequest} className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  <RefreshCw className="w-3.5 h-3.5" /> Resend
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <form onSubmit={handleReset} className="space-y-4">
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                placeholder="New Password (min 6 chars)" className="input" autoFocus />
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
