import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, XCircle, Edit2 } from 'lucide-react';
import api from '../../utils/api';

export default function SellerInventory() {
  const [data,    setData]    = useState({ lowStock: [], outOfStock: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/seller/inventory').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const Section = ({ title, icon, items, color }) => (
    <div className="card p-5">
      <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 ${color}`}>{icon} {title} ({items.length})</h2>
      {items.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">All good here! ✅</p>
      ) : (
        <div className="space-y-3">
          {items.map(p => (
            <div key={p._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <img src={p.images?.[0]?.url || `https://placehold.co/44x44`} alt={p.name} className="w-11 h-11 rounded-lg object-cover bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.category} · ₹{p.price.toLocaleString()}</p>
              </div>
              <div className="text-right flex-shrink-0 flex items-center gap-2">
                <div>
                  <p className={`text-base font-black ${p.stock === 0 ? 'text-red-500' : 'text-yellow-500'}`}>{p.stock}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">in stock</p>
                </div>
                <Link to={`/seller/products/edit/${p._id}`} className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) return <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="card h-48 animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">Inventory Alerts</h1>
      <div className="grid lg:grid-cols-2 gap-5">
        <Section title="Low Stock (< 10 units)" icon={<AlertTriangle className="w-5 h-5" />} items={data.lowStock} color="text-yellow-600 dark:text-yellow-400" />
        <Section title="Out of Stock" icon={<XCircle className="w-5 h-5" />} items={data.outOfStock} color="text-red-600 dark:text-red-400" />
      </div>
    </div>
  );
}
