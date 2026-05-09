import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const STATUS_COLORS = { placed:'bg-blue-100 text-blue-700', confirmed:'bg-indigo-100 text-indigo-700', processing:'bg-yellow-100 text-yellow-700', shipped:'bg-orange-100 text-orange-700', out_for_delivery:'bg-amber-100 text-amber-700', delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700' };
const STATUSES = ['placed','confirmed','processing','shipped','out_for_delivery','delivered','cancelled'];

export default function SellerOrders() {
  const [orders,  setOrders]  = useState([]);
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(true);
  const [updating,setUpdating]= useState(null);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit: '50' });
    if (status) p.set('status', status);
    api.get(`/seller/orders?${p}`).then(r => setOrders(r.data.orders)).catch(() => {}).finally(() => setLoading(false));
  }, [status]);

  const handleStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(o => o.map(x => x._id === orderId ? data.order : x));
      toast.success('Status updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setUpdating(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Orders ({orders.length})</h1>
        <select value={status} onChange={e => setStatus(e.target.value)} className="input text-sm py-2 w-auto">
          <option value="">All Orders</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>{['Order #','Customer','Items','Total','Status','Date','Action'].map(h => <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td></tr>)
                : orders.map(o => (
                <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{o.user?.name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{o.items?.length}</td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">₹{o.total?.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`badge text-xs capitalize ${STATUS_COLORS[o.orderStatus] || ''}`}>{o.orderStatus?.replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <select value={o.orderStatus} onChange={e => handleStatus(o._id, e.target.value)}
                      disabled={updating === o._id || ['delivered','cancelled'].includes(o.orderStatus)}
                      className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-40 cursor-pointer">
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && orders.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No orders yet</div>}
        </div>
      </div>
    </div>
  );
}
