import { useState } from 'react';
import { Sparkles, MapPin, DollarSign, Home, Loader2, TrendingUp, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const CATEGORIES = ['Flat', 'Apartments', 'Condominium', 'Office', 'Commercial', 'Studio', 'Penthouse', 'Villa', 'Plot'];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Gurgaon', 'Noida', 'Thane', 'Navi Mumbai'];

function fmt(n) {
  if (!n) return '—';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)} L`;
  return `₹${n.toLocaleString()}`;
}

export default function AIRecommendations() {
  const [form, setForm] = useState({ category: '', budget: '', city: '' });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.city && !form.category && !form.budget) {
      toast.error('Please fill at least one preference');
      return;
    }
    setLoading(true);
    setResults(null);
    setSummary('');
    try {
      const params = new URLSearchParams();
      if (form.category) params.set('category', form.category);
      if (form.budget) params.set('budget', form.budget);
      if (form.city) params.set('city', form.city);
      params.set('limit', '4');

      const { data } = await api.get(`/ai/recommendations?${params}`);
      setResults(data.recommendations || []);
      setSummary(data.summary || '');
    } catch (err) {
      const msg = err.response?.data?.message || 'AI service unavailable';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">AI Property Recommendations</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto">
          Powered by Groq AI — tell us your preferences and get personalized property picks with detailed reasoning.
        </p>
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                <Home className="w-3.5 h-3.5 inline mr-1" /> Property Type
              </label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Any type</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                <DollarSign className="w-3.5 h-3.5 inline mr-1" /> Max Budget (₹)
              </label>
              <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                placeholder="e.g. 5000000"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              {form.budget && <p className="text-xs text-indigo-600 mt-1">{fmt(Number(form.budget))}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                <MapPin className="w-3.5 h-3.5 inline mr-1" /> Preferred City
              </label>
              <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Any city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-all active:scale-98 disabled:opacity-60">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'AI is analyzing properties…' : 'Get AI Recommendations'}
          </button>
        </form>
      </motion.div>

      {/* AI Summary */}
      <AnimatePresence>
        {summary && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">AI Summary</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {results && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {results.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🔍</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No matches found</h3>
                <p className="text-gray-500 mt-1">Try broadening your preferences</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  {results.length} AI-Curated Recommendations
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.map(({ property: p, reason }, i) => {
                    const price = p.discountPrice > 0 ? p.discountPrice : p.price;
                    return (
                      <motion.div key={p._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all group">
                        <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <img
                            src={p.images?.[0]?.url || `https://placehold.co/400x300/e2e8f0/64748b?text=${encodeURIComponent(p.category)}`}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={e => { e.currentTarget.src = `https://placehold.co/400x300/e2e8f0/64748b?text=${encodeURIComponent(p.category)}`; }}
                          />
                          <div className="absolute top-2 left-2 flex gap-1">
                            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">#{i + 1} AI Pick</span>
                            <span className="bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-medium">{p.category}</span>
                          </div>
                          {p.ratings?.count > 0 && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 px-2 py-0.5 rounded-full">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{p.ratings.average}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{p.name}</h3>
                            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">{fmt(price)}</p>
                          </div>
                          <div className="flex items-start gap-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-3">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">{reason}</p>
                          </div>
                          <Link to={`/products/${p._id}`}
                            className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
                            View Property →
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
