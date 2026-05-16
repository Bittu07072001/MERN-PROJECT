import { useState } from 'react';
import { MapPin, TrendingUp, TrendingDown, Minus, Sparkles, Loader2, Info, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Gurgaon', 'Noida', 'Thane', 'Navi Mumbai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kochi'];
const PROPERTY_TYPES = ['Flat', 'Apartments', 'Condominium', 'Office', 'Commercial', 'Studio', 'Penthouse', 'Villa', 'Plot'];

function TrendBadge({ trend }) {
  if (trend === 'rising') return (
    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
      <TrendingUp className="w-3 h-3" /> Rising
    </span>
  );
  if (trend === 'declining') return (
    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">
      <TrendingDown className="w-3 h-3" /> Declining
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full font-semibold">
      <Minus className="w-3 h-3" /> Stable
    </span>
  );
}

function ScoreBar({ score }) {
  const color = score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-indigo-500' : score >= 4 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{score}/10</span>
    </div>
  );
}

export default function LocationSuggestions() {
  const [form, setForm] = useState({ city: '', budget: '', propertyType: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.city) { toast.error('Please select a city'); return; }
    setLoading(true);
    setData(null);
    try {
      const { data: res } = await api.post('/ai/location-suggestions', {
        city: form.city,
        budget: form.budget ? Number(form.budget) : undefined,
        propertyType: form.propertyType || undefined,
      });
      setData(res);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI service unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">AI Location Insights</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto">
          Get smart, AI-powered location analysis — top localities, market trends, investment scores, and buying tips.
        </p>
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                <MapPin className="w-3.5 h-3.5 inline mr-1" /> City *
              </label>
              <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Budget (₹)
              </label>
              <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                placeholder="Optional"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Property Type
              </label>
              <select value={form.propertyType} onChange={e => setForm(f => ({ ...f, propertyType: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Any type</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition-all active:scale-98 disabled:opacity-60">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'AI is analyzing locations…' : 'Analyze Locations'}
          </button>
        </form>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => <div key={j} className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {data && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Market Insights */}
            {data.marketInsights && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Market Insights — {form.city}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{data.marketInsights}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Top Localities */}
            {data.topLocalities?.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-500" /> Top Localities in {form.city}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.topLocalities.map((loc, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full flex items-center justify-center">
                              {i + 1}
                            </span>
                            <h3 className="font-bold text-gray-900 dark:text-white">{loc.name}</h3>
                          </div>
                          {loc.avgPrice && <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mt-1">{loc.avgPrice}</p>}
                        </div>
                        <TrendBadge trend={loc.trend} />
                      </div>

                      {loc.investmentScore && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Investment Score</p>
                          <ScoreBar score={loc.investmentScore} />
                        </div>
                      )}

                      {loc.pros?.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {loc.pros.map((pro, j) => (
                            <div key={j} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <span className="text-green-500 mt-0.5">✓</span> {pro}
                            </div>
                          ))}
                        </div>
                      )}

                      {loc.connectivity && (
                        <div className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-lg px-3 py-2">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" /> {loc.connectivity}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Buying Tips */}
            {data.buyingTips?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-yellow-400" /> Buying Tips for {form.city}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {data.buyingTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3">
                      <span className="w-5 h-5 bg-yellow-400 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
