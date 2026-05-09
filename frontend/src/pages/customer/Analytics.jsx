import { useState, useEffect, useMemo } from 'react';
import { Users, Store, Building2, CheckCircle, TrendingUp, BarChart2, PieChart as PieIcon, Grid } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector,
} from 'recharts';
import api from '../../utils/api';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6','#f97316','#a855f7'];

const StatCard = ({ icon, label, value, sub, color, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    className="card p-6 flex items-start gap-4">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value?.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  </motion.div>
);

// Active Pie slice renderer
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill={fill} className="text-sm font-bold">{payload.name}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#6b7280" fontSize={13}>{value} properties</text>
      <text x={cx} y={cy + 32} textAnchor="middle" fill="#9ca3af" fontSize={11}>{(percent * 100).toFixed(1)}%</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={innerRadius - 2} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

// Heatmap cell
function HeatCell({ value, max, label }) {
  const intensity = max > 0 ? value / max : 0;
  const bg = intensity === 0
    ? 'bg-gray-100 dark:bg-gray-800'
    : intensity < 0.25 ? 'bg-indigo-100 dark:bg-indigo-900/40'
    : intensity < 0.5  ? 'bg-indigo-300 dark:bg-indigo-700/60'
    : intensity < 0.75 ? 'bg-indigo-500'
    : 'bg-indigo-700 dark:bg-indigo-500';
  const text = intensity > 0.5 ? 'text-white' : 'text-gray-700 dark:text-gray-300';
  return (
    <div title={`${label}: ${value}`}
      className={`${bg} ${text} flex items-center justify-center rounded-lg text-xs font-bold transition-all hover:scale-105 cursor-default`}
      style={{ minHeight: 36 }}>
      {value > 0 ? value : ''}
    </div>
  );
}

export default function Analytics() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('histogram');
  const [activePie, setActivePie] = useState(0);

  useEffect(() => {
    api.get('/analytics/public')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Build heatmap grid: rows = sellers, cols = categories
  const heatmapGrid = useMemo(() => {
    if (!data) return { sellers: [], categories: [], grid: {} };
    const sellers    = [...new Set(data.heatmap.map(h => h.sellerName))].filter(Boolean);
    const categories = [...new Set(data.heatmap.map(h => h.category))].filter(Boolean);
    const grid = {};
    data.heatmap.forEach(h => {
      if (!h.sellerName || !h.category) return;
      if (!grid[h.sellerName]) grid[h.sellerName] = {};
      grid[h.sellerName][h.category] = (grid[h.sellerName][h.category] || 0) + h.count;
    });
    return { sellers, categories, grid };
  }, [data]);

  const heatMax = useMemo(() => {
    let m = 0;
    Object.values(heatmapGrid.grid).forEach(row => Object.values(row).forEach(v => { if (v > m) m = v; }));
    return m;
  }, [heatmapGrid]);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
      </div>
      <div className="card h-96 animate-pulse" />
    </div>
  );

  const { totals = {}, sellerStats = [], categoryDist = [] } = data || {};

  // Histogram data: seller vs total listings + sold
  const histogramData = sellerStats.slice(0, 15).map(s => ({
    name: s.sellerName?.split(' ')[0] || 'Unknown',
    fullName: s.sellerName || 'Unknown',
    Listings: s.total,
    Sold: s.sold,
    Views: s.views,
  }));

  // Pie data: category distribution
  const pieData = categoryDist.map(c => ({ name: c._id || 'Other', value: c.count }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const full = histogramData.find(h => h.name === label);
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl p-3 text-sm min-w-[140px]">
        <p className="font-bold text-gray-900 dark:text-white mb-1.5">{full?.fullName || label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-bold text-gray-900 dark:text-white">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const tabs = [
    { key: 'histogram', label: 'Histogram',  icon: <BarChart2 className="w-4 h-4" /> },
    { key: 'piechart',  label: 'Pie Chart',   icon: <PieIcon   className="w-4 h-4" /> },
    { key: 'heatmap',   label: 'Heat Map',    icon: <Grid      className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Dashboard Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Live platform stats — buyers, sellers, and property insights</p>
          </div>
        </div>
      </motion.div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard delay={0}    icon={<Users className="w-7 h-7 text-blue-600" />}   label="Active Buyers"     value={totals.buyers}             color="bg-blue-50 dark:bg-blue-950"   sub="Registered customers" />
        <StatCard delay={0.07} icon={<Store className="w-7 h-7 text-purple-600" />} label="Active Sellers"    value={totals.sellers}            color="bg-purple-50 dark:bg-purple-950" sub="Property listers" />
        <StatCard delay={0.14} icon={<Building2 className="w-7 h-7 text-emerald-600" />} label="Total Properties" value={totals.properties}     color="bg-emerald-50 dark:bg-emerald-950" sub="All active listings" />
        <StatCard delay={0.21} icon={<CheckCircle className="w-7 h-7 text-amber-600" />} label="Approved Listings" value={totals.approvedProperties} color="bg-amber-50 dark:bg-amber-950" sub="Verified & live" />
      </div>

      {/* Live count pulse bar */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
        className="card p-4 flex flex-wrap items-center gap-6">
        {[
          { label: 'Buyers', value: totals.buyers,   color: 'bg-blue-500' },
          { label: 'Sellers', value: totals.sellers,  color: 'bg-purple-500' },
          { label: 'Properties', value: totals.properties, color: 'bg-emerald-500' },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stat.color}`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${stat.color}`} />
            </span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              <span className="font-black text-gray-900 dark:text-white">{stat.value?.toLocaleString()}</span> {stat.label} online
            </span>
          </div>
        ))}
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 font-medium">● Live Data</span>
      </motion.div>

      {/* Charts Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Seller Comparison Charts</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Compare sellers by listings, sales, and property categories</p>
          </div>
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === t.key
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* HISTOGRAM */}
        {activeTab === 'histogram' && (
          <motion.div key="histogram" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            {histogramData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <BarChart2 className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">No seller data yet. Add sellers and properties to see the chart.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  {[
                    { color: '#6366f1', label: 'Total Listings' },
                    { color: '#10b981', label: 'Properties Sold' },
                    { color: '#f59e0b', label: 'Total Views' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{l.label}</span>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={histogramData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                    barCategoryGap="25%" barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Listings" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Sold"     fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Views"    fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </motion.div>
        )}

        {/* PIE CHART */}
        {activeTab === 'piechart' && (
          <motion.div key="piechart" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <PieIcon className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">No property categories yet.</p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height={380}>
                    <PieChart>
                      <Pie
                        activeIndex={activePie}
                        activeShape={renderActiveShape}
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        innerRadius={80} outerRadius={130}
                        onMouseEnter={(_, idx) => setActivePie(idx)}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} properties`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="lg:w-64 w-full grid grid-cols-2 lg:grid-cols-1 gap-2">
                  {pieData.map((d, i) => (
                    <button key={d.name} onClick={() => setActivePie(i)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl transition-all text-left ${
                        activePie === i ? 'bg-gray-100 dark:bg-gray-800 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{d.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{d.value} listings</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* HEATMAP */}
        {activeTab === 'heatmap' && (
          <motion.div key="heatmap" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            {heatmapGrid.sellers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Grid className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">No data available to display heat map.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-5 flex-wrap">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Each cell shows how many properties a seller has in each category.
                  </p>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Low</span>
                    {['bg-gray-100 dark:bg-gray-800','bg-indigo-100 dark:bg-indigo-900/40','bg-indigo-300 dark:bg-indigo-700/60','bg-indigo-500','bg-indigo-700 dark:bg-indigo-500'].map((c, i) => (
                      <div key={i} className={`w-5 h-5 rounded ${c}`} />
                    ))}
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">High</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-max">
                    {/* Header row */}
                    <div className="flex gap-2 mb-2 items-center">
                      <div className="w-36 flex-shrink-0" />
                      {heatmapGrid.categories.map(cat => (
                        <div key={cat} className="w-20 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 truncate px-1" title={cat}>
                          {cat}
                        </div>
                      ))}
                      <div className="w-14 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Total</div>
                    </div>
                    {/* Rows */}
                    {heatmapGrid.sellers.map(seller => {
                      const row = heatmapGrid.grid[seller] || {};
                      const rowTotal = Object.values(row).reduce((a, b) => a + b, 0);
                      return (
                        <div key={seller} className="flex gap-2 mb-2 items-center">
                          <div className="w-36 flex-shrink-0 text-xs font-semibold text-gray-700 dark:text-gray-300 truncate pr-2" title={seller}>
                            {seller}
                          </div>
                          {heatmapGrid.categories.map(cat => (
                            <div key={cat} className="w-20">
                              <HeatCell value={row[cat] || 0} max={heatMax} label={`${seller} / ${cat}`} />
                            </div>
                          ))}
                          <div className="w-14">
                            <div className="flex items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs font-black" style={{ minHeight: 36 }}>
                              {rowTotal}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Column totals */}
                    <div className="flex gap-2 mt-3 items-center border-t border-gray-200 dark:border-gray-700 pt-3">
                      <div className="w-36 flex-shrink-0 text-xs font-bold text-gray-900 dark:text-white">Category Total</div>
                      {heatmapGrid.categories.map(cat => {
                        const total = heatmapGrid.sellers.reduce((acc, s) => acc + (heatmapGrid.grid[s]?.[cat] || 0), 0);
                        return (
                          <div key={cat} className="w-20">
                            <div className="flex items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-black" style={{ minHeight: 36 }}>
                              {total}
                            </div>
                          </div>
                        );
                      })}
                      <div className="w-14">
                        <div className="flex items-center justify-center rounded-lg bg-indigo-800 dark:bg-indigo-500 text-white text-xs font-black" style={{ minHeight: 36 }}>
                          {heatmapGrid.sellers.reduce((a, s) => a + Object.values(heatmapGrid.grid[s] || {}).reduce((x, y) => x + y, 0), 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Seller Leaderboard */}
      {sellerStats.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="card p-6">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">Seller Leaderboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Ranked by total property listings</p>
          <div className="space-y-3">
            {sellerStats.slice(0, 10).map((s, i) => {
              const maxTotal = sellerStats[0]?.total || 1;
              const pct = Math.round((s.total / maxTotal) * 100);
              const cats = [...new Set(s.categories || [])];
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                    i === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    : i === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : i === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{s.sellerName || 'Unknown'}</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {cats.slice(0, 3).map(c => (
                            <span key={c} className="badge bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] py-0">{c}</span>
                          ))}
                          {cats.length > 3 && <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] py-0">+{cats.length - 3}</span>}
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <span className="text-sm font-black text-gray-900 dark:text-white">{s.total}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">listings</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.5 + i * 0.05, duration: 0.7, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Category breakdown table */}
      {categoryDist.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="card p-6">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">Category Breakdown</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">All property types on the platform</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categoryDist.map((c, i) => (
              <div key={c._id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors text-center">
                <div className="w-10 h-10 rounded-2xl mx-auto mb-2 flex items-center justify-center"
                  style={{ background: `${COLORS[i % COLORS.length]}20` }}>
                  <Building2 className="w-5 h-5" style={{ color: COLORS[i % COLORS.length] }} />
                </div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">{c._id || 'Other'}</p>
                <p className="text-2xl font-black mt-1" style={{ color: COLORS[i % COLORS.length] }}>{c.count}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{c.sold} sold · {c.views} views</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
