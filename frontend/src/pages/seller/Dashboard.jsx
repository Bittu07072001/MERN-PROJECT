import { useState, useEffect } from 'react';
import { ShoppingBag, Package, DollarSign, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

export default function SellerDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/seller/dashboard').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}</div>
    </div>
  );

  const { stats = {}, recentProducts = [] } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Seller Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your listings and enquiries</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<ShoppingBag className="w-6 h-6 text-purple-600" />} label="My Listings" value={stats.totalProducts || 0} color="bg-purple-50 dark:bg-purple-950" />
        <StatCard icon={<Package className="w-6 h-6 text-orange-600" />} label="Total Orders" value={stats.totalOrders || 0} color="bg-orange-50 dark:bg-orange-950" />
        <StatCard icon={<DollarSign className="w-6 h-6 text-green-600" />} label="Revenue" value={`₹${(stats.revenue || 0).toLocaleString()}`} color="bg-green-50 dark:bg-green-950" />
        <StatCard icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />} label="Pending Orders" value={stats.pendingOrders || 0} color="bg-yellow-50 dark:bg-yellow-950" />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 dark:text-white">Recent Listings</h2>
          <Link to="/seller/products/add" className="btn-primary text-sm">+ List Property</Link>
        </div>
        {recentProducts.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">No listings yet</p>
            <Link to="/seller/products/add" className="btn-primary text-sm mt-3 inline-block">List Your First Property</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentProducts.map(p => (
              <div key={p._id} className="flex items-center gap-3">
                <img src={p.images?.[0]?.url || `https://placehold.co/48x48`} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">₹{p.price.toLocaleString()} · {p.stock} in stock</p>
                </div>
                <Link to={`/seller/products/edit/${p._id}`} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Edit</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
