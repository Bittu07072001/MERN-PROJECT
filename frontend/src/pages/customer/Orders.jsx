// Orders.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, X } from 'lucide-react';
import api from '../../utils/api';
import { ORDER_STATUSES, formatOrderStatus, getOrderStatusColor } from '../../utils/orderStatus';

export default function Orders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = status ? `?status=${status}` : '';
      const { data } = await api.get(`/orders/my${params}`);
      setOrders(data.orders);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [status]);

  if (!loading && !orders.length) return (
    <div className="text-center py-24">
      <div className="text-7xl mb-4">📦</div>
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No orders yet</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Your orders will appear here</p>
      <Link to="/products" className="btn-primary">Start Shopping</Link>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Orders</h1>
        <select value={status} onChange={e => setStatus(e.target.value)} className="input text-sm py-2 w-auto">
          <option value="">All Orders</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{formatOrderStatus(s)}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card p-5 animate-pulse h-24" />)}</div>
      ) : orders.map(order => (
        <Link key={order._id} to={`/orders/${order._id}`} className="card p-5 flex items-center gap-4 hover:shadow-md transition-all group block">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-gray-900 dark:text-white">{order.orderNumber}</span>
              <span className={`badge text-xs capitalize ${getOrderStatusColor(order.orderStatus)}`}>
                {formatOrderStatus(order.orderStatus)}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {order.items?.length} item{order.items?.length > 1 ? 's' : ''} · ₹{order.total?.toLocaleString()} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
        </Link>
      ))}
    </div>
  );
}
