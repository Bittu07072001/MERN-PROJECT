import { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const EMPTY = { code: '', description: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxDiscountAmount: '', usageLimit: 100, validUntil: '', applicableCategories: '', isActive: true };

export default function AdminCoupons() {
  const [coupons,  setCoupons]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try { const { data } = await api.get('/admin/coupons'); setCoupons(data.coupons); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSave = async () => {
    if (!form.code || !form.discountValue || !form.validUntil) return toast.error('Fill required fields');
    setSaving(true);
    try {
      const payload = { ...form, discountValue: Number(form.discountValue), minOrderAmount: Number(form.minOrderAmount) || 0, usageLimit: Number(form.usageLimit) || 100 };
      if (editId) {
        const { data } = await api.put(`/admin/coupons/${editId}`, payload);
        setCoupons(c => c.map(x => x._id === editId ? data.coupon : x));
        toast.success('Coupon updated!');
      } else {
        const { data } = await api.post('/admin/coupons', payload);
        setCoupons(c => [data.coupon, ...c]);
        toast.success('Coupon created!');
      }
      setForm(EMPTY); setShowForm(false); setEditId(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      setCoupons(c => c.filter(x => x._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const startEdit = (coupon) => {
    setForm({ ...coupon, applicableCategories: coupon.applicableCategories?.join(',') || '' });
    setEditId(coupon._id);
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Coupons ({coupons.length})</h1>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }} className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-6 space-y-4">
            <h2 className="font-bold text-gray-900 dark:text-white">{editId ? 'Edit Coupon' : 'New Coupon'}</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Code *</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" className="input text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type *</label>
                <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))} className="input text-sm">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Value * {form.discountType === 'percentage' ? '(%)' : '(₹)'}</label>
                <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} placeholder={form.discountType === 'percentage' ? '20' : '100'} className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Min Order (₹)</label>
                <input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} placeholder="500" className="input text-sm" />
              </div>
              {form.discountType === 'percentage' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Max Discount (₹)</label>
                  <input type="number" value={form.maxDiscountAmount} onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))} placeholder="500" className="input text-sm" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="100" className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Valid Until *</label>
                <input type="date" value={form.validUntil?.slice(0, 10)} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} className="input text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. 20% off all electronics" className="input text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-indigo-600" />
                Active
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {editId ? 'Update Coupon' : 'Create Coupon'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY); }} className="btn-secondary text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="card h-36 animate-pulse" />)
          : coupons.map(c => (
          <div key={c._id} className={`card p-5 border-2 ${c.isActive ? 'border-indigo-200 dark:border-indigo-800' : 'border-gray-200 dark:border-gray-700 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                <code className="font-black text-base text-indigo-600 dark:text-indigo-400">{c.code}</code>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(c._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
              {c.maxDiscountAmount ? ` (max ₹${c.maxDiscountAmount})` : ''}
            </p>
            {c.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{c.description}</p>}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-400 dark:text-gray-500">
              <span>{c.usedCount}/{c.usageLimit} used</span>
              <span>Expires {new Date(c.validUntil).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="mt-2">
              <span className={`badge text-xs ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {c.isActive ? '● Active' : '● Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
      {!loading && coupons.length === 0 && !showForm && (
        <div className="text-center py-16">
          <Tag className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-gray-500">No coupons yet. Create your first one!</p>
        </div>
      )}
    </div>
  );
}
