import { useState, useEffect } from 'react';
import { User, Lock, MapPin, Shield, Plus, Trash2, Eye, EyeOff, QrCode, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import useAuthStore from '../../context/authStore';

const TAB_LIST = [
  { key: 'profile',   icon: <User className="w-4 h-4" />,    label: 'Profile' },
  { key: 'security',  icon: <Lock className="w-4 h-4" />,    label: 'Security' },
  { key: 'addresses', icon: <MapPin className="w-4 h-4" />,  label: 'Addresses' },
  { key: 'twofa',     icon: <Shield className="w-4 h-4" />,  label: '2FA' },
];

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab]         = useState('profile');
  const [saving, setSaving]   = useState(false);

  // Profile form
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });

  // Password
  const [pw, setPw]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);

  // Address
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [addrForm, setAddrForm]   = useState({ label: '', street: '', city: '', state: '', pincode: '', country: 'India', isDefault: false });
  const [showAddrForm, setShowAddrForm] = useState(false);

  // 2FA
  const [tfaSecret, setTfaSecret] = useState('');
  const [tfaQr,     setTfaQr]     = useState('');
  const [tfaOtp,    setTfaOtp]    = useState('');
  const [tfaLoading, setTfaLoading] = useState(false);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (!pw.currentPassword || !pw.newPassword) return toast.error('Fill all fields');
    if (pw.newPassword !== pw.confirmPassword)   return toast.error('Passwords do not match');
    if (pw.newPassword.length < 6)               return toast.error('Min 6 characters');
    setSaving(true);
    try {
      await api.put('/users/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed successfully!');
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setSaving(false); }
  };

  const handleAddAddress = async () => {
    if (!addrForm.street || !addrForm.city || !addrForm.state || !addrForm.pincode)
      return toast.error('Fill required address fields');
    setSaving(true);
    try {
      const { data } = await api.post('/users/address', addrForm);
      setAddresses(data.addresses);
      updateUser({ addresses: data.addresses });
      setAddrForm({ label: '', street: '', city: '', state: '', pincode: '', country: 'India', isDefault: false });
      setShowAddrForm(false);
      toast.success('Address added!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteAddress = async (idx) => {
    try {
      const { data } = await api.delete(`/users/address/${idx}`);
      setAddresses(data.addresses);
      updateUser({ addresses: data.addresses });
      toast.success('Address removed');
    } catch { toast.error('Failed to remove'); }
  };

  const handleSetup2FA = async () => {
    setTfaLoading(true);
    try {
      const { data } = await api.get('/auth/setup-2fa');
      setTfaSecret(data.secret);
      setTfaQr(data.otpauthUrl);
    } catch { toast.error('Failed to setup 2FA'); }
    finally { setTfaLoading(false); }
  };

  const handleEnable2FA = async () => {
    if (!tfaOtp) return toast.error('Enter OTP from authenticator app');
    setTfaLoading(true);
    try {
      await api.post('/auth/enable-2fa', { otp: tfaOtp });
      updateUser({ isTwoFactorEnabled: true });
      toast.success('2FA enabled!');
      setTfaSecret(''); setTfaQr(''); setTfaOtp('');
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP'); }
    finally { setTfaLoading(false); }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Disable Two-Factor Authentication?')) return;
    setTfaLoading(true);
    try {
      await api.post('/auth/disable-2fa');
      updateUser({ isTwoFactorEnabled: false });
      toast.success('2FA disabled');
    } catch { toast.error('Failed'); }
    finally { setTfaLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Profile</h1>

      {/* Avatar card */}
      <div className="card p-5 flex items-center gap-5">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-2xl flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="font-black text-lg text-gray-900 dark:text-white">{user?.name}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="badge bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 capitalize">{user?.role}</span>
            {user?.isEmailVerified && <span className="badge bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">✓ Verified</span>}
            {user?.isTwoFactorEnabled && <span className="badge bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">🔐 2FA On</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-x-auto">
        {TAB_LIST.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${tab === t.key ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white">Personal Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit mobile number" className="input text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
              <input value={user?.email} disabled className="input text-sm opacity-60 cursor-not-allowed" />
            </div>
          </div>
          <button onClick={handleProfileSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            Save Changes
          </button>
        </motion.div>
      )}

      {/* Security tab */}
      {tab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white">Change Password</h2>
          <div className="space-y-3">
            {[['currentPassword', 'Current Password'], ['newPassword', 'New Password'], ['confirmPassword', 'Confirm New Password']].map(([k, label]) => (
              <div key={k}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={pw[k]}
                    onChange={e => setPw(p => ({ ...p, [k]: e.target.value }))}
                    placeholder="••••••••" className="input text-sm pr-10" />
                  {k === 'currentPassword' && (
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button onClick={handlePasswordChange} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Changing…' : 'Change Password'}
          </button>
        </motion.div>
      )}

      {/* Addresses tab */}
      {tab === 'addresses' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {addresses.map((addr, i) => (
            <div key={i} className="card p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{addr.label || `Address ${i + 1}`}</p>
                    {addr.isDefault && <span className="badge bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs">Default</span>}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{addr.street}, {addr.city}, {addr.state} — {addr.pincode}</p>
                </div>
              </div>
              <button onClick={() => handleDeleteAddress(i)} className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {!showAddrForm ? (
            <button onClick={() => setShowAddrForm(true)} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add New Address
            </button>
          ) : (
            <div className="card p-5 space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white">New Address</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[['label','Label (Home/Work)', false], ['street','Street Address *', true], ['city','City *', false], ['state','State *', false], ['pincode','Pincode *', false]].map(([k, p, full]) => (
                  <input key={k} value={addrForm[k]} onChange={e => setAddrForm(a => ({ ...a, [k]: e.target.value }))}
                    placeholder={p} className={`input text-sm ${full ? 'sm:col-span-2' : ''}`} />
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={addrForm.isDefault} onChange={e => setAddrForm(a => ({ ...a, isDefault: e.target.checked }))} className="accent-indigo-600" />
                Set as default address
              </label>
              <div className="flex gap-2">
                <button onClick={handleAddAddress} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving…' : 'Save Address'}</button>
                <button onClick={() => setShowAddrForm(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 2FA tab */}
      {tab === 'twofa' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add an extra layer of security with an authenticator app like Google Authenticator or Authy.</p>
              <div className={`mt-2 badge ${user?.isTwoFactorEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                {user?.isTwoFactorEnabled ? '✓ Enabled' : '✗ Disabled'}
              </div>
            </div>
          </div>

          {!user?.isTwoFactorEnabled ? (
            <div className="space-y-4">
              {!tfaSecret ? (
                <button onClick={handleSetup2FA} disabled={tfaLoading} className="btn-primary text-sm flex items-center gap-2">
                  {tfaLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <QrCode className="w-4 h-4" />}
                  Setup 2FA
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Secret Key (manual entry):</p>
                    <code className="text-xs bg-white dark:bg-gray-900 px-3 py-2 rounded-lg block font-mono text-indigo-600 dark:text-indigo-400 break-all">{tfaSecret}</code>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Enter OTP from Authenticator App</label>
                    <input value={tfaOtp} onChange={e => setTfaOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} className="input text-sm" />
                  </div>
                  <button onClick={handleEnable2FA} disabled={tfaLoading} className="btn-primary text-sm flex items-center gap-2">
                    {tfaLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Enable 2FA
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleDisable2FA} disabled={tfaLoading} className="text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-colors font-semibold">
              {tfaLoading ? 'Disabling…' : 'Disable 2FA'}
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
