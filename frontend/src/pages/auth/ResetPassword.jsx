import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const [pw, setPw]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (pw !== confirm)    return toast.error('Passwords do not match');
    if (pw.length < 6)     return toast.error('Minimum 6 characters');
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password: pw });
      toast.success('Password reset! Please login.');
      navigate('/login');
    } catch (err) { toast.error(err.response?.data?.message || 'Reset failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-2xl font-black text-center mb-6 dark:text-white">Set New Password</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="New Password" className="input" />
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm Password" className="input" />
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Resetting…' : 'Reset Password'}</button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
