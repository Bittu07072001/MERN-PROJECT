import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, Shield, Video, Sparkles, Star, TrendingUp,
  Zap, Calculator, MessageCircle, BarChart3, MapPin, Search,
  Building2, Home as HomeIcon, TreePine, Briefcase
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import useAuthStore from '../../context/authStore';
import ProductCard from '../../components/common/ProductCard';

const CATEGORIES = [
  { name: 'Flat',        icon: Building2,  emoji: '🏢', color: 'from-blue-500 to-cyan-500',    bg: 'bg-blue-50 dark:bg-blue-950/30',   text: 'text-blue-600 dark:text-blue-400' },
  { name: 'Apartments',  icon: HomeIcon,   emoji: '🏘️', color: 'from-pink-500 to-rose-500',    bg: 'bg-pink-50 dark:bg-pink-950/30',   text: 'text-pink-600 dark:text-pink-400' },
  { name: 'Condominium', icon: Building2,  emoji: '🏙️', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400' },
  { name: 'Office',      icon: Briefcase,  emoji: '🏦', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'Commercial',  icon: Briefcase,  emoji: '🏬', color: 'from-slate-500 to-gray-700',   bg: 'bg-slate-50 dark:bg-slate-950/30', text: 'text-slate-600 dark:text-slate-400' },
  { name: 'Studio',      icon: HomeIcon,   emoji: '🛋️', color: 'from-cyan-500 to-blue-500',   bg: 'bg-cyan-50 dark:bg-cyan-950/30',   text: 'text-cyan-600 dark:text-cyan-400' },
  { name: 'Penthouse',   icon: Building2,  emoji: '🌆', color: 'from-fuchsia-500 to-pink-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
  { name: 'Villa',       icon: HomeIcon,   emoji: '🏡', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600 dark:text-purple-400' },
  { name: 'Plot',        icon: TreePine,   emoji: '🌍', color: 'from-rose-500 to-pink-500',    bg: 'bg-rose-50 dark:bg-rose-950/30',   text: 'text-rose-600 dark:text-rose-400' },
];

const FEATURES = [
  { icon: CheckCircle, title: 'Verified Listings', desc: '100% fraud-free properties', color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { icon: Shield,      title: 'Secure Deals',      desc: 'Encrypted & trusted',         color: 'text-blue-500',   bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { icon: Video,       title: 'Virtual Tours',     desc: 'HD video walkthroughs',       color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { icon: Sparkles,    title: 'AI-Powered',        desc: 'Smart recommendations',        color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
];

const AI_FEATURES = [
  { icon: BarChart3,      title: 'Investment Score', desc: 'AI rates every property 1–10 for ROI potential, factoring location, demand & trends.', gradient: 'from-indigo-500 to-indigo-700', accent: '#6366f1', link: '/products' },
  { icon: Calculator,     title: 'Price Estimator',  desc: 'Instant AI valuation — input city, BHK & area to get market price + EMI breakdown.',    gradient: 'from-violet-500 to-purple-700', accent: '#8b5cf6', link: '/price-estimator' },
  { icon: Zap,            title: 'Smart Search',     desc: 'Search in plain English — "3 BHK flat in Mumbai under 2 crore" — instant results.',      gradient: 'from-rose-500 to-pink-700',   accent: '#f43f5e', link: '/products' },
  { icon: MessageCircle,  title: 'HomeBot AI',       desc: 'Your 24/7 AI assistant for EMI, investment advice, booking help and property queries.',    gradient: 'from-teal-500 to-emerald-700', accent: '#14b8a6', link: '#' },
];

const STATS = [
  { value: '33+', label: 'Properties', icon: '🏠' },
  { value: '4.8', label: 'Star Rating', icon: '⭐' },
  { value: '500+', label: 'Happy Buyers', icon: '😊' },
  { value: 'AI', label: 'Powered', icon: '🤖' },
];

function AnimatedSection({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchHome = async () => {
      try {
        const [feat, trend] = await Promise.all([
          api.get('/products?isFeatured=true&limit=8'),
          api.get('/products?isTrending=true&limit=8'),
        ]);
        setFeatured(feat.data.products);
        setTrending(trend.data.products);
      } catch { toast.error('Failed to load properties'); }
      finally { setLoading(false); }
    };
    fetchHome();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="space-y-20">

      {/* ── HERO ────────────────────────────────────── */}
      <section className="relative">
        <div className="relative overflow-hidden rounded-3xl min-h-[520px] flex items-center"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #701a75 100%)' }}>

          {/* Animated orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-float-delay" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl animate-float-slow" />
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                style={{ left: `${8 + (i * 8) % 84}%`, top: `${10 + (i * 13) % 80}%` }}
                animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 3 + (i % 3), delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }} />
            ))}
          </div>

          <div className="relative z-10 w-full px-8 md:px-16 py-16">
            <div className="max-w-2xl">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> AI-Powered Real Estate Platform
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.1] text-white mb-6">
                Find Your Dream<br />
                <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                  Home with AI
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-indigo-200 text-lg mb-8 max-w-lg leading-relaxed">
                Verified properties with AI investment scores, instant price estimates, smart search, and a 24/7 AI assistant.
              </motion.p>

              {/* Hero Search */}
              <motion.form onSubmit={handleSearch}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex gap-2 max-w-md mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Try '3 BHK flat in Mumbai'…"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 border-0 outline-none text-sm font-medium shadow-xl"
                  />
                </div>
                <button type="submit" className="px-5 py-3.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-xl transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap text-sm">
                  <Search className="w-4 h-4" /> Search
                </button>
              </motion.form>

              {/* CTAs */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-3 items-center">
                <Link to="/products"
                  className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-all active:scale-95 shadow-lg text-sm">
                  Explore Properties <ArrowRight className="w-4 h-4" />
                </Link>
                {!user && (
                  <Link to="/register"
                    className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/25 transition-all text-sm">
                    Join Free
                  </Link>
                )}
              </motion.div>

              {/* Stats */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center gap-6 mt-8">
                {STATS.map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-lg">{s.icon}</span>
                    <div>
                      <span className="text-white font-black text-base">{s.value}</span>
                      <span className="text-indigo-300 text-xs ml-1">{s.label}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Right decoration */}
          <div className="absolute right-8 bottom-8 text-[200px] opacity-5 select-none pointer-events-none leading-none">🏡</div>
        </div>

        {/* Feature pills below hero */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="card-hover p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center flex-shrink-0`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{f.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────── */}
      <AnimatedSection delay={0.05}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle">Find the perfect property type for you</p>
          </div>
          <Link to="/products" className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors group">
            All Properties <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-9 gap-3">
          {CATEGORIES.map((cat, i) => (
            <motion.div key={cat.name}
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <Link to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800/60 hover:border-primary-200 dark:hover:border-primary-800/50 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                  <span className="text-2xl">{cat.emoji}</span>
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center leading-tight">{cat.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── AI FEATURES ─────────────────────────────── */}
      <AnimatedSection delay={0.05}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </span>
              AI-Powered Features
            </h2>
            <p className="section-subtitle">Smart tools that make property buying effortless</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AI_FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.25, ease: [0.16,1,0.3,1] } }}>
              <Link to={f.link} className="group block h-full card p-6 hover:shadow-luxury hover:border-primary-200/50 dark:hover:border-primary-700/30 transition-all duration-300 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                  style={{ background: f.accent }} />
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} text-white flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <f.icon className="w-5.5 h-5.5" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base">{f.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Learn more <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── FEATURED PROPERTIES ─────────────────────── */}
      {!loading && featured.length > 0 && (
        <AnimatedSection delay={0.05}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title flex items-center gap-2.5">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" /> Featured Properties
              </h2>
              <p className="section-subtitle">Hand-picked premium listings</p>
            </div>
            <Link to="/products?isFeatured=true"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors group">
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </AnimatedSection>
      )}

      {/* ── TRENDING ────────────────────────────────── */}
      {!loading && trending.length > 0 && (
        <AnimatedSection delay={0.05}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title flex items-center gap-2.5">
                <TrendingUp className="w-6 h-6 text-rose-500" /> Trending Now
              </h2>
              <p className="section-subtitle">Most viewed properties this week</p>
            </div>
            <Link to="/products?isTrending=true"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors group">
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trending.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </AnimatedSection>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton h-52 rounded-none" />
              <div className="p-4 space-y-3">
                <div className="skeleton h-3 w-1/3 rounded-lg" />
                <div className="skeleton h-4 w-4/5 rounded-lg" />
                <div className="skeleton h-3 w-2/3 rounded-lg" />
                <div className="flex justify-between items-center pt-1">
                  <div className="skeleton h-5 w-24 rounded-lg" />
                  <div className="skeleton h-8 w-8 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CTA BANNER ──────────────────────────────── */}
      <AnimatedSection>
        <div className="relative overflow-hidden rounded-3xl"
          style={{ background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 50%, #7c3aed 100%)' }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>
          <div className="relative z-10 px-8 md:px-16 py-14 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white/80 text-xs font-semibold mb-4">
              <Zap className="w-3 h-3 text-amber-300" /> Free AI Tool
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
              Know What Any Property is Worth
            </h2>
            <p className="text-indigo-200 text-base mb-8 max-w-xl mx-auto leading-relaxed">
              Enter city, BHK, area & amenities — get an instant AI price estimate, EMI breakdown, and investment score in seconds.
            </p>
            <Link to="/price-estimator"
              className="inline-flex items-center gap-2.5 bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-all active:scale-95 shadow-xl text-sm">
              <Calculator className="w-4 h-4" /> Try Price Estimator <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="absolute right-6 bottom-4 text-[160px] opacity-5 select-none pointer-events-none leading-none">🤖</div>
          <div className="absolute left-6 top-4 text-[120px] opacity-5 select-none pointer-events-none leading-none">🏡</div>
        </div>
      </AnimatedSection>
    </div>
  );
}
