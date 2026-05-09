import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, UserX, UserCheck, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const EMPTY = { name: '', email: '', phone: '', password: '', isActive: true };

export default function AdminSellers() {
  const [sellers, setSellers]   = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set('search', search);
      const { data } = await api.get(`/admin/sellers?${p}`);
      setSellers(data.sellers || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchSellers(); }, [search]);

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (s) => { setForm({ name: s.name, email: s.email, phone: s.phone || '', password: '', isActive: s.isActive }); setModal(s._id); };
  const closeModal = () => { setModal(null); setForm(EMPTY); };

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email are required');
    setSaving(true);
    try {
      if (modal === 'add') {
        if (!form.password) return toast.error('Password is required');
        const { data } = await api.post('/admin/sellers', form);
        setSellers(s => [data.seller, ...s]);
        toast.success('Seller added successfully');
      } else {
        const payload = { name: form.name, email: form.email, phone: form.phone, isActive: form.isActive };
        const { data } = await api.put(`/admin/sellers/${modal}`, payload);
        setSellers(s => s.map(x => x._id === modal ? data.seller : x));
        toast.success('Seller updated');
      }
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleToggle = async (sellerId, isActive) => {
    try {
      const { data } = await api.put(`/admin/sellers/${sellerId}`, { isActive: !isActive });
      setSellers(s => s.map(x => x._id === sellerId ? data.seller : x));
      toast.success(!isActive ? 'Seller activated' : 'Seller deactivated');
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/sellers/${deleteId}`);
      setSellers(s => s.filter(x => x._id !== deleteId));
      toast.success('Seller removed');
      setDeleteId(null);
    } catch { toast.error('Failed to remove seller'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Sellers ({sellers.length})</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage all seller accounts on the platform</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sellers…" className="input text-sm pl-9 py-2" />
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
            <Plus className="w-4 h-4" /> Add Seller
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Seller', 'Email', 'Phone', 'Verified', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td></tr>
              )) : sellers.map(s => (
                <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-xs flex-shrink-0">
                        {s.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{s.email}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{s.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${s.isEmailVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {s.isEmailVerified ? '✓ Yes' : '✗ No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${s.isOnline ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {s.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggle(s._id, s.isActive)}
                        className={`p-1.5 rounded-lg transition-colors ${s.isActive ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-950'}`}
                        title={s.isActive ? 'Deactivate' : 'Activate'}>
                        {s.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setDeleteId(s._id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors" title="Remove">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && sellers.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No sellers found</div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md z-10">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  {modal === 'add' ? 'Add New Seller' : 'Edit Seller'}
                </h3>
                <button onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Full Name *', name: 'name', placeholder: 'Seller name', type: 'text' },
                  { label: 'Email *', name: 'email', placeholder: 'email@example.com', type: 'email' },
                  { label: 'Phone', name: 'phone', placeholder: '9876543210', type: 'tel' },
                  ...(modal === 'add' ? [{ label: 'Password *', name: 'password', placeholder: 'Min. 6 characters', type: 'password' }] : []),
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{f.label}</label>
                    <input name={f.name} type={f.type} value={form[f.name]} placeholder={f.placeholder}
                      onChange={e => setForm(x => ({ ...x, [e.target.name]: e.target.value }))}
                      className="input w-full" />
                  </div>
                ))}
                {modal !== 'add' && (
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="sellerActive" checked={form.isActive}
                      onChange={e => setForm(x => ({ ...x, isActive: e.target.checked }))}
                      className="w-4 h-4 rounded text-primary-600" />
                    <label htmlFor="sellerActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active account</label>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Save className="w-4 h-4" />{modal === 'add' ? 'Add Seller' : 'Save Changes'}</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10 text-center">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Remove Seller?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">This action cannot be undone. The seller account will be permanently deleted.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
