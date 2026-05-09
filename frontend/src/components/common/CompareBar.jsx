import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCompare, ArrowRight } from 'lucide-react';
import { useCompareStore } from '../../context/stores';

function fmt(n) {
  if (!n) return '—';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString()}`;
}

export default function CompareBar() {
  const { items, remove, clear } = useCompareStore();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <GitCompare className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-gray-900 dark:text-white hidden sm:inline">
                Compare <span className="text-indigo-600">({items.length}/3)</span>
              </span>
            </div>

            <div className="flex-1 flex items-center gap-2 overflow-x-auto">
              {items.map(p => {
                const price = p.discountPrice > 0 ? p.discountPrice : p.price;
                return (
                  <div key={p._id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 flex-shrink-0">
                    <img
                      src={p.images?.[0]?.url || `https://placehold.co/40x40/e2e8f0/64748b?text=${encodeURIComponent(p.category || 'P')}`}
                      alt={p.name}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      onError={e => { e.currentTarget.src = `https://placehold.co/40x40/e2e8f0/64748b?text=P`; }}
                    />
                    <div className="min-w-0 max-w-[120px]">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{fmt(price)}</p>
                    </div>
                    <button
                      onClick={() => remove(p._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {items.length < 3 && (
                <div className="w-20 h-12 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-400 text-xs text-center flex-shrink-0">
                  + Add
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={clear}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                Clear
              </button>
              <button
                onClick={() => navigate('/compare')}
                disabled={items.length < 2}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
                Compare <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
