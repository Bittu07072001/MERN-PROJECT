import { useState, useEffect } from 'react';
import { Search, ChevronDown, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { ORDER_STATUSES, formatOrderStatus, getOrderStatusColor, normalizeOrderStatus } from '../../utils/orderStatus';

const PAGE_SIZE = 5;

export default function AdminOrders() {
  const [orders,  setOrders]  = useState([]);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search) p.set('search', search);
      if (status) p.set('status', status);
      const { data } = await api.get(`/admin/orders?${p}`);
      setOrders(data.orders);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [search, status, page]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(o => o.map(x => x._id === orderId ? data.order : x));
      toast.success('Order status updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setUpdating(null); }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Orders ({total})</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search order #…" className="input text-sm pl-9 py-2" />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input text-sm py-2 w-auto">
            <option value="">All Status</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{formatOrderStatus(s)}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Update'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td></tr>
              )) : orders.map(o => (
                <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{o.user?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{o.items?.length} items</td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">₹{o.total?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${o.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs capitalize ${getOrderStatusColor(o.orderStatus)}`}>
                      {formatOrderStatus(o.orderStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <select
                      value={normalizeOrderStatus(o.orderStatus)}
                      onChange={e => handleStatusUpdate(o._id, e.target.value)}
                      disabled={updating === o._id || normalizeOrderStatus(o.orderStatus) === 'handover_completed' || normalizeOrderStatus(o.orderStatus) === 'cancelled'}
                      className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40 cursor-pointer">
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{formatOrderStatus(s)}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && orders.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No orders found</div>}
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
    </div>
  );
}
