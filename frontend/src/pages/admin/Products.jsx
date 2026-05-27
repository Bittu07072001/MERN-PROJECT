import { useState, useEffect } from 'react';
import { Search, Eye, Trash2, CheckCircle, XCircle, Pencil, X, Save, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const APPROVAL_COLORS = {
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const EMPTY_FORM = {
  name: '', description: '', price: '', category: '', stock: 1, seller: '',
  discountPrice: '', isFeatured: false, isTrending: false,
};

export default function AdminProducts() {
  const PAGE_SIZE = 10;
  const [products, setProducts]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilter]   = useState('');
  const [loading, setLoading]       = useState(true);
  const [sellers, setSellers]       = useState([]);
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteId, setDeleteId]     = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search)       p.set('search', search);
      if (filterStatus) p.set('approvalStatus', filterStatus);
      const { data } = await api.get(`/admin/products?${p}`);
      setProducts(data.products || []);
      setTotal(data.total ?? data.products?.length ?? 0);
      setPages(Math.max(1, Math.ceil((data.total ?? 0) / PAGE_SIZE)));
    } catch {} finally { setLoading(false); }
  };

  const fetchSellers = async () => {
    try {
      const { data } = await api.get('/admin/sellers');
      setSellers(data.sellers || []);
    } catch {}
  };

  useEffect(() => { setPage(1); }, [search, filterStatus]);
  useEffect(() => { fetchProducts(); }, [search, filterStatus, page]);
  useEffect(() => { fetchSellers(); }, []);

  const handleApprove = async (id) => {
    try {
      const { data } = await api.put(`/admin/products/${id}/approve`);
      setProducts(p => p.map(x => x._id === id ? data.product : x));
      toast.success('Property approved');
    } catch { toast.error('Failed to approve'); }
  };

  const openReject = (p) => { setRejectModal(p._id); setRejectReason(''); };
  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error('Please provide a rejection reason');
    try {
      const { data } = await api.put(`/admin/products/${rejectModal}/reject`, { reason: rejectReason });
      setProducts(p => p.map(x => x._id === rejectModal ? data.product : x));
      toast.success('Property rejected');
      setRejectModal(null);
    } catch { toast.error('Failed to reject'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/products/${deleteId}`);
      setProducts(p => p.filter(x => x._id !== deleteId));
      setTotal(t => Math.max(0, t - 1));
      if (products.length === 1 && page > 1) setPage(p => p - 1);
      toast.success('Property deleted');
      setDeleteId(null);
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (p) => {
    setForm({
      name: p.name, description: p.description, price: p.price,
      category: p.category, stock: p.stock, seller: p.seller?._id || '',
      discountPrice: p.discountPrice || '', isFeatured: !!p.isFeatured, isTrending: !!p.isTrending,
    });
    setModal(p._id);
  };
  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.name || !form.description || !form.price || !form.category || !form.seller)
      return toast.error('Please fill all required fields');
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/products/${modal}`, { ...form, price: Number(form.price), stock: Number(form.stock), discountPrice: Number(form.discountPrice) || 0 });
      setProducts(p => p.map(x => x._id === modal ? data.product : x));
      toast.success('Property updated');
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const pendingCount = products.filter(p => p.approvalStatus === 'pending').length;
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Properties ({total})</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
              {pendingCount} propert{pendingCount !== 1 ? 'ies' : 'y'} awaiting approval
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search properties…" className="input text-sm pl-9 py-2" />
          </div>
          <div className="relative flex items-center">
            <Filter className="absolute left-3 w-4 h-4 text-gray-400" />
            <select value={filterStatus} onChange={e => setFilter(e.target.value)} className="input text-sm py-2 pl-9 w-auto">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Property', 'Seller', 'Category', 'Price', 'Approval', 'Active', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td></tr>
              )) : products.map(p => (
                <tr key={p._id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${p.approvalStatus === 'pending' ? 'border-l-2 border-l-amber-400' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={p.images?.[0]?.url || 'https://placehold.co/36x36'} alt={p.name}
                        className="w-9 h-9 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                      <span className="font-medium text-gray-900 dark:text-white line-clamp-1 max-w-[150px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.seller?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.category}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                    ₹{(p.discountPrice > 0 ? p.discountPrice : p.price)?.toLocaleString()}
                    {p.discountPrice > 0 && <span className="text-xs text-gray-400 line-through ml-1">₹{p.price?.toLocaleString()}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className={`badge text-xs capitalize ${APPROVAL_COLORS[p.approvalStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {p.approvalStatus || 'pending'}
                      </span>
                      {p.approvalStatus === 'rejected' && p.rejectionReason && (
                        <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5 max-w-[120px] line-clamp-1">{p.rejectionReason}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/products/${p._id}`}
                        className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button onClick={() => openEdit(p)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {p.approvalStatus !== 'approved' && (
                        <button onClick={() => handleApprove(p._id)}
                          className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg transition-colors" title="Approve">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {p.approvalStatus !== 'rejected' && (
                        <button onClick={() => openReject(p)}
                          className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-lg transition-colors" title="Reject">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setDeleteId(p._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && products.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No properties found</div>
          )}
        </div>
        {!loading && total > PAGE_SIZE && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {start}-{end} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Previous
              </button>
              {[...Array(pages)].map((_, i) => {
                const pageNumber = i + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`min-w-9 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                      page === pageNumber
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Property Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  Edit Property
                </h3>
                <button onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Property Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 3BHK Apartment in Mumbai" className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description *</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Property description..." rows={3} className="input w-full resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Price (₹) *</label>
                    <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="5000000" className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Discount Price (₹)</label>
                    <input type="number" value={form.discountPrice} onChange={e => setForm(f => ({ ...f, discountPrice: e.target.value }))} placeholder="0" className="input w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category *</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input w-full">
                      <option value="">Select type</option>
                      {['Apartment', 'Villa', 'Plot', 'House', 'Flat', 'Commercial', 'Office', 'Shop', 'Penthouse', 'Studio'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Units Available</label>
                    <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} min={0} className="input w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Assign Seller *</label>
                  <select value={form.seller} onChange={e => setForm(f => ({ ...f, seller: e.target.value }))} className="input w-full">
                    <option value="">Select seller</option>
                    {sellers.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 rounded text-primary-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isTrending} onChange={e => setForm(f => ({ ...f, isTrending: e.target.checked }))} className="w-4 h-4 rounded text-primary-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trending</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Save className="w-4 h-4" />Save Changes</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Reject Property</h3>
                <button onClick={() => setRejectModal(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Provide a reason so the seller understands what needs to be fixed.</p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                placeholder="e.g. Images are blurry, incorrect pricing, missing details..."
                className="input w-full resize-none mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button onClick={handleReject} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">Reject</button>
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
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Delete Property?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">This will permanently delete the property listing.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
