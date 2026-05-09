import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, Sparkles, Loader2, Star, TrendingUp, CheckCircle, XCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useCompareStore } from '../../context/stores';
import { computeInvestmentScore } from '../../utils/aiScore';

function fmt(n) {
  if (!n) return '—';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)} L`;
  return `₹${n.toLocaleString()}`;
}

const ROWS = [
  { key: 'price',    label: 'Price',            render: (p) => fmt(p.discountPrice > 0 ? p.discountPrice : p.price) },
  { key: 'category', label: 'Type',             render: (p) => p.category || '—' },
  { key: 'brand',    label: 'Builder/Brand',    render: (p) => p.brand || '—' },
  { key: 'stock',    label: 'Availability',     render: (p) => p.stock > 0
      ? <span className="flex items-center gap-1 text-green-600 font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Available</span>
      : <span className="flex items-center gap-1 text-red-500 font-semibold"><XCircle className="w-3.5 h-3.5" /> Not Available</span>
  },
  { key: 'rating',   label: 'Rating',           render: (p) => p.ratings?.count > 0
      ? <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /><span className="font-bold">{p.ratings.average}</span><span className="text-gray-400 text-xs">({p.ratings.count})</span></div>
      : <span className="text-gray-400">No reviews</span>
  },
  { key: 'aiScore',  label: 'AI Investment Score', render: (p) => {
    const s = computeInvestmentScore(p);
    if (!s) return <span className="text-gray-400">—</span>;
    const colorMap = { green: 'text-green-600', blue: 'text-indigo-600', yellow: 'text-yellow-600', red: 'text-red-500' };
    return <span className={`font-black text-lg ${colorMap[s.color] || 'text-gray-700'}`}>{s.score}/10 <span className="text-sm font-semibold">· {s.label}</span></span>;
  }},
  { key: 'discount', label: 'Discount',         render: (p) => p.discountPrice > 0
      ? <span className="text-green-600 font-bold">{Math.round(((p.price - p.discountPrice) / p.price) * 100)}% OFF</span>
      : <span className="text-gray-400">No discount</span>
  },
  { key: 'shipping', label: 'Registration/Delivery', render: (p) => p.shippingInfo?.freeShipping
      ? <span className="text-green-600 font-semibold">Free</span>
      : <span>₹{p.shippingInfo?.shippingCost || 50}</span>
  },
];

const ATTR_KEYS_TO_SHOW = ['bedrooms', 'bathrooms', 'area', 'floor', 'parking', 'furnishing', 'age', 'facing', 'amenities', 'city', 'location', 'bhk', 'carpet area', 'built-up area', 'plot area'];

function getAllAttrKeys(items) {
  const keys = new Set();
  items.forEach(p => {
    p.attributes?.forEach(a => {
      const k = a.key?.toLowerCase() || '';
      if (ATTR_KEYS_TO_SHOW.some(kw => k.includes(kw))) keys.add(a.key);
    });
  });
  return [...keys];
}

export default function Compare() {
  const { items, remove } = useCompareStore();
  const navigate = useNavigate();
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items.length < 2) navigate('/products');
  }, [items.length]);

  const handleAIAnalysis = async () => {
    setLoading(true);
    setAiAnalysis(null);
    try {
      const { data } = await api.post('/ai/compare', {
        properties: items.map(p => ({
          _id: p._id,
          name: p.name,
          category: p.category,
          price: p.discountPrice > 0 ? p.discountPrice : p.price,
          originalPrice: p.price,
          brand: p.brand,
          rating: p.ratings?.average,
          reviewCount: p.ratings?.count,
          stock: p.stock,
          attributes: p.attributes?.slice(0, 10),
          shortDescription: p.shortDescription,
          tags: p.tags?.slice(0, 5),
        })),
      });
      setAiAnalysis(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI analysis unavailable');
    } finally {
      setLoading(false);
    }
  };

  if (items.length < 2) return null;

  const attrKeys = getAllAttrKeys(items);
  const COLORS = ['indigo', 'purple', 'rose'];
  const HEADER_COLORS = [
    'from-indigo-500 to-indigo-700',
    'from-purple-500 to-purple-700',
    'from-rose-500 to-rose-700',
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-indigo-500" />
            Property Comparison
            <span className="text-sm font-semibold text-gray-400">({items.length} properties)</span>
          </h1>
        </div>
        <button
          onClick={handleAIAnalysis}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-60 text-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'AI is analyzing…' : 'Get AI Analysis'}
        </button>
      </motion.div>

      {/* Comparison Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-36 p-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  Feature
                </th>
                {items.map((p, i) => {
                  const price = p.discountPrice > 0 ? p.discountPrice : p.price;
                  return (
                    <th key={p._id} className="p-0 border-b border-gray-200 dark:border-gray-800 min-w-[200px]">
                      <div className={`bg-gradient-to-br ${HEADER_COLORS[i]} p-4 text-white relative`}>
                        <button
                          onClick={() => remove(p._id)}
                          className="absolute top-2 right-2 w-5 h-5 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-16 h-16 rounded-xl overflow-hidden mb-3 mx-auto border-2 border-white/30">
                          <img
                            src={p.images?.[0]?.url || `https://placehold.co/80x80/e2e8f0/64748b?text=${encodeURIComponent(p.category || 'P')}`}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={e => { e.currentTarget.src = `https://placehold.co/80x80/e2e8f0/64748b?text=P`; }}
                          />
                        </div>
                        <p className="text-sm font-bold text-center leading-tight line-clamp-2">{p.name}</p>
                        <p className="text-xl font-black text-center mt-1 text-white">{fmt(price)}</p>
                        <div className="flex justify-center mt-2">
                          <Link to={`/products/${p._id}`} onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors">
                            View <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, ri) => (
                <tr key={row.key} className={ri % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'}>
                  <td className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-r border-gray-100 dark:border-gray-800">
                    {row.label}
                  </td>
                  {items.map(p => (
                    <td key={p._id} className="p-4 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-gray-800 last:border-r-0">
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}

              {attrKeys.map((key, ki) => (
                <tr key={key} className={ki % 2 === 1 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'}>
                  <td className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-r border-gray-100 dark:border-gray-800">
                    {key}
                  </td>
                  {items.map(p => {
                    const attr = p.attributes?.find(a => a.key === key);
                    return (
                      <td key={p._id} className="p-4 text-sm text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-gray-800 last:border-r-0">
                        {attr ? attr.value : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* AI Analysis */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-8 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">Groq AI is analyzing your selected properties…</p>
            <p className="text-sm text-gray-400 mt-1">Comparing price, value, investment potential & more</p>
          </motion.div>
        )}

        {aiAnalysis && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> AI Analysis
            </h2>

            {/* Winner */}
            {aiAnalysis.winner && (
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-1">AI Recommendation</p>
                <p className="text-xl font-black mb-1">🏆 {aiAnalysis.winner}</p>
                <p className="text-sm text-indigo-100 leading-relaxed">{aiAnalysis.winnerReason}</p>
              </div>
            )}

            {/* Per-property breakdown */}
            {aiAnalysis.breakdown?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiAnalysis.breakdown.map((b, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${HEADER_COLORS[i]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {i + 1}
                      </div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{b.name}</p>
                    </div>
                    {b.pros?.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {b.pros.map((pro, j) => (
                          <div key={j} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" /> {pro}
                          </div>
                        ))}
                      </div>
                    )}
                    {b.cons?.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {b.cons.map((con, j) => (
                          <div key={j} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" /> {con}
                          </div>
                        ))}
                      </div>
                    )}
                    {b.investmentScore && (
                      <div className="mt-2 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-2">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <span className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">Investment: {b.investmentScore}/10</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Summary */}
            {aiAnalysis.summary && (
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Detailed Analysis</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{aiAnalysis.summary}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
