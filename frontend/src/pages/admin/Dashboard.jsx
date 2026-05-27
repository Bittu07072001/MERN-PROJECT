import { useState, useEffect, useCallback } from 'react';
import { Users, ShoppingBag, Package, DollarSign, TrendingUp, CheckCheck, X, Trash2, Radio, Store } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAdminLiveStore } from '../../context/stores';
import { formatOrderStatus, getOrderStatusColor } from '../../utils/orderStatus';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6'];
const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="card p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

function timeAgo(ts) {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function LiveFeed() {
  const { activities, markHandled, removeActivity, clearAll } = useAdminLiveStore();
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const unhandled = activities.filter(a => !a.handled);
  const handled   = activities.filter(a => a.handled);

  if (activities.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
        <Radio className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Waiting for live events…</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">New bookings and orders will appear here in real time</p>
    </div>
  );

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {unhandled.map(a => (
          <motion.div key={a.id}
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
              a.type === 'booking' ? 'bg-indigo-50 dark:bg-indigo-950' : 'bg-green-50 dark:bg-green-950'
            }`}>
              {a.type === 'booking' ? '📅' : '🛒'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                  a.type === 'booking'
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                }`}>
                  {a.type === 'booking' ? 'Booking' : 'Order'}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(a.arrivedAt)}</span>
              </div>
              {a.type === 'booking' ? (
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5 truncate">
                  {a.name} → <span className="text-indigo-600 dark:text-indigo-400">{a.property}</span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5 truncate">
                  #{a.orderNumber} · <span className="text-green-600 dark:text-green-400">₹{a.total?.toLocaleString()}</span>
                </p>
              )}
              {a.type === 'booking' && a.visitDate && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {new Date(a.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {a.visitTime}
                  {a.visitType === 'video-call' ? ' · Video Call' : ' · Site Visit'}
                </p>
              )}
              {a.type === 'order' && a.itemCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.itemCount} item{a.itemCount !== 1 ? 's' : ''} · by {a.user}</p>
              )}
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button onClick={() => markHandled(a.id)} title="Mark handled"
                className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center justify-center transition-colors">
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => removeActivity(a.id)} title="Dismiss"
                className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {handled.length > 0 && (
        <div className="pt-1">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">Handled</p>
          <AnimatePresence>
            {handled.map(a => (
              <motion.div key={a.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-2.5 rounded-xl opacity-50 mb-1.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-800 text-sm">
                  {a.type === 'booking' ? '📅' : '🛒'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate line-through">
                    {a.type === 'booking' ? `${a.name} → ${a.property}` : `#${a.orderNumber}`}
                  </p>
                </div>
                <button onClick={() => removeActivity(a.id)}
                  className="w-6 h-6 rounded-md text-gray-300 hover:text-red-400 flex items-center justify-center transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { activities, clearAll, pendingBookings, pendingOrders } = useAdminLiveStore();

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => <div key={i} className="card h-64 animate-pulse" />)}
      </div>
    </div>
  );

  const { stats = {}, recentOrders = [], topProducts = [], monthlyRevenue = [], categoryRevenue = [] } = data || {};

  const chartData = MONTHS.map((m, i) => {
    const found = monthlyRevenue.find(r => r._id === i + 1);
    return { month: m, revenue: found?.revenue || 0, orders: found?.orders || 0 };
  });

  const unhandledCount = activities.filter(a => !a.handled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Welcome back, Admin 👋</p>
        </div>
        {(pendingBookings > 0 || pendingOrders > 0) && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {pendingBookings + pendingOrders} pending action{(pendingBookings + pendingOrders) !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard icon={<Users className="w-6 h-6 text-blue-600" />} label="Active Buyers" value={(stats.activeBuyers ?? 0).toLocaleString()} color="bg-blue-50 dark:bg-blue-950" sub="Registered customers" />
        <StatCard icon={<Store className="w-6 h-6 text-purple-600" />} label="Active Sellers" value={(stats.activeSellers ?? 0).toLocaleString()} color="bg-purple-50 dark:bg-purple-950" sub="Property listers" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-6 h-6 text-blue-600" />}     label="Total Buyers"     value={(stats.totalBuyers ?? stats.totalUsers ?? 0).toLocaleString()} color="bg-blue-50 dark:bg-blue-950" />
        <StatCard icon={<ShoppingBag className="w-6 h-6 text-purple-600" />} label="Total Sellers" value={(stats.totalSellers || 0).toLocaleString()} color="bg-purple-50 dark:bg-purple-950" sub={`${stats.totalProducts || 0} properties`} />
        <StatCard icon={<Package className="w-6 h-6 text-orange-600" />} label="Total Orders"     value={stats.totalOrders?.toLocaleString() || 0} sub={`${stats.pendingOrders || 0} pending`} color="bg-orange-50 dark:bg-orange-950" />
        <StatCard icon={<DollarSign className="w-6 h-6 text-green-600" />} label="Total Revenue"  value={`₹${(stats.totalRevenue || 0).toLocaleString()}`} color="bg-green-50 dark:bg-green-950" />
      </div>

      {/* Charts + Live Feed */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue line chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" /> Monthly Revenue
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Revenue by Category</h2>
          {categoryRevenue.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryRevenue} dataKey="revenue" nameKey="_id" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    {categoryRevenue.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {categoryRevenue.slice(0, 4).map((c, i) => (
                  <div key={c._id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{c._id}</span>
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">₹{(c.revenue || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="text-center py-10 text-gray-400 text-sm">No data yet</div>}
        </div>
      </div>

      {/* Live Activity Feed + Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Live Activity Feed */}
        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              Live Activity Feed
              {unhandledCount > 0 && (
                <span className="text-xs font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  {unhandledCount}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {activities.length > 0 && (
                <button onClick={clearAll}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
              <Link to="/admin/bookings"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                All Bookings →
              </Link>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-80">
            <LiveFeed />
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              View all →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(o => (
                <div key={o._id} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{o.orderNumber}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{o.user?.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">₹{o.total?.toLocaleString()}</p>
                    <span className={`badge text-xs capitalize ${getOrderStatusColor(o.orderStatus)}`}>{formatOrderStatus(o.orderStatus)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">Top Properties by Views</h2>
        {topProducts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No listings yet</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topProducts.map((p, i) => (
              <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={p.images?.[0]?.url || 'https://placehold.co/40x40'} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{p.soldCount} enquiries · ₹{p.price?.toLocaleString()}</p>
                </div>
                <span className="badge bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs flex-shrink-0">#{i + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
