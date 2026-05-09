import { useState, useEffect } from 'react';
import { Users, Store, ArrowRightLeft, BarChart3, CheckCircle, Clock, XCircle, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const StatCard = ({ icon, label, value, color, sub }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    className="card p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </motion.div>
);

export default function AdminOverview() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [txTab, setTxTab]   = useState('transactions');

  useEffect(() => {
    api.get('/admin/overview').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
      </div>
      <div className="card h-64 animate-pulse" />
    </div>
  );

  const {
    totalBuyers = 0, totalSellers = 0,
    propertyApprovalStats = {},
    sellerBuyerTransactions = [],
    sellerPropertyStats = [],
  } = data || {};

  const STATUS_COLOR = {
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    visited:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Platform Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Users, properties, and transaction insights</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-6 h-6 text-blue-600" />}  label="Total Buyers"   value={totalBuyers}  color="bg-blue-50 dark:bg-blue-950"   sub="Registered customers" />
        <StatCard icon={<Store className="w-6 h-6 text-purple-600" />} label="Total Sellers"  value={totalSellers} color="bg-purple-50 dark:bg-purple-950" sub="Active on platform" />
        <StatCard icon={<CheckCircle className="w-6 h-6 text-green-600" />} label="Approved Properties" value={propertyApprovalStats.approved || 0} color="bg-green-50 dark:bg-green-950" />
        <StatCard icon={<Clock className="w-6 h-6 text-amber-600" />}  label="Pending Approval" value={propertyApprovalStats.pending || 0} color="bg-amber-50 dark:bg-amber-950" sub={`${propertyApprovalStats.rejected || 0} rejected`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl w-fit">
        {[
          { key: 'transactions', label: 'Seller → Buyer Transactions', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
          { key: 'sellers',      label: 'Seller Property Stats',        icon: <BarChart3 className="w-3.5 h-3.5" /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTxTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              txTab === t.key
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {txTab === 'transactions' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
              Seller → Buyer Transactions
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">{sellerBuyerTransactions.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Seller', 'Buyer', 'Property', 'Type', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sellerBuyerTransactions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No transactions yet</td></tr>
                ) : sellerBuyerTransactions.map((tx, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{tx.sellerName || '—'}</div>
                      <div className="text-xs text-gray-400">{tx.sellerEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{tx.buyerName || '—'}</div>
                      <div className="text-xs text-gray-400">{tx.buyerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[180px]">
                      <span className="line-clamp-1">{tx.propertyName || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs capitalize">
                        {tx.propertyType || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs capitalize ${STATUS_COLOR[tx.status] || 'bg-gray-100 text-gray-600'}`}>{tx.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                      {tx.visitDate ? new Date(tx.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {txTab === 'sellers' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              Seller Property Statistics
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">{sellerPropertyStats.length} sellers</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Seller', 'Total Properties', 'Approved', 'Pending', 'Rejected', 'Property Types'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sellerPropertyStats.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No seller data yet</td></tr>
                ) : sellerPropertyStats.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-xs">
                          {s.sellerName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{s.sellerName || 'Unknown'}</div>
                          <div className="text-xs text-gray-400">{s.sellerEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-black text-gray-900 dark:text-white text-lg">{s.total}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold">{s.approved}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold">{s.pending}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold">{s.rejected}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(s.types || []).slice(0, 4).map(t => (
                          <span key={t} className="badge bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs">{t}</span>
                        ))}
                        {(s.types || []).length > 4 && (
                          <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs">+{s.types.length - 4}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
