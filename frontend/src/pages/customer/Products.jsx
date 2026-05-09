import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Sparkles, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import ProductCard from '../../components/common/ProductCard';
import { parseNLQuery, NL_EXAMPLES } from '../../utils/nlSearch';

const SORT_OPTIONS = [
  { label: 'Latest',       value: '-createdAt' },
  { label: 'Price: Low',   value: 'price' },
  { label: 'Price: High',  value: '-price' },
  { label: 'Top Rated',    value: '-ratings.average' },
  { label: 'Most Enquired', value: '-soldCount' },
];

export default function Products() {
  const [searchParams] = useSearchParams();
  const [products, setProducts]  = useState([]);
  const [total,    setTotal]     = useState(0);
  const [pages,    setPages]     = useState(1);
  const [loading,  setLoading]   = useState(true);
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const searchKey = searchParams.toString();

  const [filters, setFilters] = useState({
    search:   searchParams.get('search')    || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort:     searchParams.get('sort')     || '-createdAt',
    page:     Number(searchParams.get('page')) || 1,
    isFeatured: searchParams.get('isFeatured') || '',
    isTrending: searchParams.get('isTrending') || '',
  });
  const [nlParsed, setNlParsed] = useState(null);
  const [rawSearch, setRawSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const nextFilters = {
      search:   searchParams.get('search')    || '',
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sort:     searchParams.get('sort')     || '-createdAt',
      page:     Number(searchParams.get('page')) || 1,
      isFeatured: searchParams.get('isFeatured') || '',
      isTrending: searchParams.get('isTrending') || '',
    };

    setRawSearch(nextFilters.search);
    setNlParsed(null);
    setFilters(nextFilters);
  }, [searchKey]);

  useEffect(() => {
    api.get('/products/categories').then(r => setCategories(r.data.categories)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('limit', '12');
    try {
      const { data } = await api.get(`/products?${params}`);
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
    } catch {}
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));
  const clearFilters = () => setFilters({ search: '', category: '', minPrice: '', maxPrice: '', sort: '-createdAt', page: 1, isFeatured: '', isTrending: '' });

  const activeFilterCount = [filters.category, filters.minPrice, filters.maxPrice, filters.isFeatured, filters.isTrending].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">All Products</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} products found</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2 text-sm relative">
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {activeFilterCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">{activeFilterCount}</span>}
          </button>
          <select value={filters.sort} onChange={e => setFilter('sort', e.target.value)}
            className="input text-sm py-2 w-auto cursor-pointer">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Smart Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={rawSearch}
            onChange={e => {
              const val = e.target.value;
              setRawSearch(val);
              const parsed = parseNLQuery(val);
              if (parsed?.hasFilters) {
                setNlParsed(parsed);
                setFilters(f => ({
                  ...f,
                  search:   parsed.searchText || '',
                  category: parsed.category   || f.category,
                  minPrice: parsed.minPrice   || '',
                  maxPrice: parsed.maxPrice   || '',
                  page: 1,
                }));
              } else {
                setNlParsed(null);
                setFilter('search', val);
              }
            }}
            placeholder='Try: "3 BHK flat in Mumbai under 2 crore" or search by name…'
            className="input pl-11 pr-20 text-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <span className="hidden sm:flex items-center gap-1 text-xs text-indigo-500 font-semibold bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" /> AI
            </span>
            {rawSearch && (
              <button onClick={() => { setRawSearch(''); setNlParsed(null); setFilter('search', ''); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* NL parsed chips */}
        <AnimatePresence>
          {nlParsed?.parsed && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 flex-wrap overflow-hidden">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> AI detected:
              </span>
              {nlParsed.summary.map(s => (
                <span key={s} className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-medium">
                  {s}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Example hints */}
        {!rawSearch && (
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 flex-shrink-0">
              <Lightbulb className="w-3 h-3" /> Try:
            </span>
            {NL_EXAMPLES.slice(0, 3).map(ex => (
              <button key={ex} onClick={() => {
                setRawSearch(ex);
                const parsed = parseNLQuery(ex);
                if (parsed?.hasFilters) {
                  setNlParsed(parsed);
                  setFilters(f => ({ ...f, search: parsed.searchText || '', category: parsed.category || '', minPrice: parsed.minPrice || '', maxPrice: parsed.maxPrice || '', page: 1 }));
                }
              }} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline italic">"{ex}"</button>
            ))}
          </div>
        )}
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="card p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Category</label>
                  <select value={filters.category} onChange={e => setFilter('category', e.target.value)} className="input text-sm py-2">
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c._id} ({c.count})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Min Price (₹)</label>
                  <input type="number" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} placeholder="0" className="input text-sm py-2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Max Price (₹)</label>
                  <input type="number" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} placeholder="Any" className="input text-sm py-2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Product Type</label>
                  <div className="flex flex-col gap-2 mt-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={filters.isFeatured === 'true'} onChange={e => setFilter('isFeatured', e.target.checked ? 'true' : '')} className="accent-indigo-600" />
                      <span className="text-gray-700 dark:text-gray-300">Featured only</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={filters.isTrending === 'true'} onChange={e => setFilter('isTrending', e.target.checked ? 'true' : '')} className="accent-indigo-600" />
                      <span className="text-gray-700 dark:text-gray-300">Trending only</span>
                    </label>
                  </div>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={clearFilters} className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Clear all filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No products found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try different search terms or clear filters</p>
          <button onClick={clearFilters} className="btn-primary mt-4">Clear Filters</button>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button disabled={filters.page <= 1} onClick={() => setFilter('page', filters.page - 1)}
            className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">← Prev</button>
          <div className="flex gap-1">
            {[...Array(Math.min(pages, 7))].map((_, i) => {
              const pg = i + 1;
              return (
                <button key={pg} onClick={() => setFilter('page', pg)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${pg === filters.page ? 'bg-indigo-600 text-white shadow' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}>
                  {pg}
                </button>
              );
            })}
          </div>
          <button disabled={filters.page >= pages} onClick={() => setFilter('page', filters.page + 1)}
            className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
