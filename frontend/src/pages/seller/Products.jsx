import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/seller/products?limit=100').then(r => {
      setProducts(r.data.products || []);
      setTotal(r.data.total ?? r.data.products?.length ?? 0);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this listing?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(p => p.filter(x => x._id !== id));
      setTotal(t => Math.max(0, t - 1));
      toast.success('Listing removed');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Listings ({total})</h1>
        <Link to="/seller/products/add" className="btn-primary text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> List Property</Link>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Property','Category','Price','Units','Enquiries','Status','Approval','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? [...Array(4)].map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td></tr>
              )) : products.map(p => (
                <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={p.images?.[0]?.url || `https://placehold.co/36x36`} alt={p.name} className="w-9 h-9 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                      <span className="font-medium text-gray-900 dark:text-white line-clamp-1 max-w-[150px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.category}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">₹{p.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${p.stock === 0 ? 'bg-red-100 text-red-700' : p.stock < 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.soldCount || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${
                      p.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      p.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.approvalStatus === 'approved' ? '✓ Live' : p.approvalStatus === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/products/${p._id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"><Eye className="w-4 h-4" /></Link>
                      <Link to={`/seller/products/edit/${p._id}`} className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></Link>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && products.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 dark:text-gray-500 mb-4">No products yet</p>
              <Link to="/seller/products/add" className="btn-primary text-sm">Add Your First Product</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
