import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, Heart, Bell, User, Menu, X, Sun, Moon, Search,
  LogOut, Package, CalendarCheck, ChevronDown, MessageCircle,
  Sparkles, MapPin, Home as HomeIcon, Building2, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/authStore';
import PropertyChat from '../ai/PropertyChat';
import CompareBar from '../common/CompareBar';
import JoinLatestMeetingButton from '../common/JoinLatestMeetingButton';
import AtsReportButton from '../common/AtsReportButton';
import { useThemeStore, useNotifStore, useCartStore, useWishlistStore } from '../../context/stores';

export default function CustomerLayout() {
  const { user, logout } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const { fetch: fetchNotif, unread, push: pushNotif } = useNotifStore();
  const { fetch: fetchCart, count: cartCount } = useCartStore();
  const { fetch: fetchWish } = useWishlistStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (user) { fetchNotif(); fetchCart(); fetchWish(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    const socket = io('/', { path: '/socket.io', transports: ['websocket', 'polling'] });
    socket.emit('join', user._id);
    socket.on('notification', (notif) => { pushNotif(notif); toast(`🔔 ${notif.title}`, { icon: null }); });
    socket.on('orderUpdate', ({ status }) => { toast.success(`Order ${status.replace(/_/g, ' ')} 📦`); });
    // Disconnect on logout/user change to prevent memory leaks and duplicate listeners
    return () => { socket.off(); socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setUserDropdown(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQ.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
    setSearchOpen(false);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: <HomeIcon className="w-3.5 h-3.5" /> },
    { to: '/products', label: 'Properties', icon: <Building2 className="w-3.5 h-3.5" /> },
    { to: '/price-estimator', label: 'AI Estimator', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { to: '/ai-recommendations', label: 'AI Picks', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { to: '/location-insights', label: 'Locations', icon: <MapPin className="w-3.5 h-3.5" /> },
    { to: '/analytics', label: 'Dashboard Analytics', icon: <BarChart3 className="w-3.5 h-3.5" />, highlight: true },
  ];

  const isActive = (to) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
  const userRoles = user?.roles?.length ? user.roles : user ? [user.role] : [];
  const showSellerSection = location.pathname === '/' && user?.role === 'seller' && userRoles.includes('seller');
  const showAdminPanel = location.pathname === '/' && user?.role === 'admin' && userRoles.includes('admin');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#080c14] transition-colors duration-300">

      {/* NAVBAR */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-[#0d1117]/90 backdrop-blur-2xl shadow-lg shadow-black/5 dark:shadow-black/30 border-b border-gray-200/60 dark:border-gray-800/60'
          : 'bg-white/70 dark:bg-[#0d1117]/70 backdrop-blur-xl border-b border-gray-200/40 dark:border-gray-800/40'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-md shadow-primary-500/30 group-hover:shadow-glow transition-all duration-300 group-hover:scale-105">
                <span className="text-white text-lg leading-none">🏠</span>
              </div>
              <span className="font-black text-xl bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent hidden sm:block">
                HomeConnect
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map(l => (
                <Link key={l.to} to={l.to}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    l.highlight && !isActive(l.to)
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                      : isActive(l.to)
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                  }`}>
                  {(l.to === '/price-estimator' || l.to === '/ai-recommendations') && (
                    <span className="text-amber-500">{l.icon}</span>
                  )}
                  {l.highlight && !isActive(l.to) && (
                    <span className="text-indigo-500">{l.icon}</span>
                  )}
                  {l.label}
                  {isActive(l.to) && (
                    <motion.div layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
                  )}
                </Link>
              ))}
              {showSellerSection && (
                <Link to="/seller"
                  className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all duration-200">
                  <Building2 className="w-3.5 h-3.5" />
                  Seller Section
                </Link>
              )}
              {showAdminPanel && (
                <Link to="/admin"
                  className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all duration-200">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Admin Panel
                </Link>
              )}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-1">

              {/* Desktop Search */}
              <div className="hidden md:block relative" ref={searchRef}>
                <button
                  type="button"
                  onClick={() => setSearchOpen((open) => !open)}
                  className={`icon-btn ${searchOpen ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : ''}`}
                  title="Search properties"
                  aria-label="Search properties">
                  <Search className="w-4.5 h-4.5" />
                </button>

                <AnimatePresence>
                  {searchOpen && (
                    <motion.form
                      onSubmit={handleSearch}
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-xl shadow-black/10 dark:shadow-black/40">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            autoFocus
                            value={searchQ}
                            onChange={e => setSearchQ(e.target.value)}
                            placeholder="Search properties..."
                            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 outline-none transition-all"
                          />
                        </div>
                        <button type="submit" className="btn-primary text-sm px-4 py-2.5">
                          Search
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* Dark Mode Toggle */}
              <button onClick={toggle}
                className="icon-btn relative overflow-hidden group"
                title={dark ? 'Light mode' : 'Dark mode'}>
                <AnimatePresence mode="wait">
                  {dark
                    ? <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <Sun className="w-4.5 h-4.5" />
                      </motion.span>
                    : <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <Moon className="w-4.5 h-4.5" />
                      </motion.span>
                  }
                </AnimatePresence>
              </button>

              {user && (
                <>
                  {user.role === 'customer' && (
                    <AtsReportButton
                      user={user}
                      className="hidden xl:inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all active:scale-95"
                    />
                  )}

                  {user.role === 'customer' && (
                    <JoinLatestMeetingButton compact className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all active:scale-95" />
                  )}

                  {/* Notifications */}
                  <Link to="/notifications" className="icon-btn relative" title="Notifications">
                    <Bell className="w-4.5 h-4.5" />
                    <AnimatePresence>
                      {unread > 0 && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">
                          {unread > 9 ? '9+' : unread}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>

                  {/* Chat */}
                  <Link to="/chat" className="icon-btn" title="Messages">
                    <MessageCircle className="w-4.5 h-4.5" />
                  </Link>

                  {/* Wishlist */}
                  <Link to="/wishlist" className="icon-btn" title="Wishlist">
                    <Heart className="w-4.5 h-4.5" />
                  </Link>

                  {/* Cart */}
                  <Link to="/cart" className="icon-btn relative" title="Cart">
                    <ShoppingCart className="w-4.5 h-4.5" />
                    <AnimatePresence>
                      {cartCount > 0 && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">
                          {cartCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>

                  {/* User Dropdown */}
                  <div className="relative" ref={dropRef}>
                    <button onClick={() => setUserDropdown(!userDropdown)}
                      className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all duration-200">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${userDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {userDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 border border-gray-100 dark:border-gray-800 py-2 z-50">
                          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                              </div>
                            </div>
                          </div>
                          <div className="py-1">
                            {[
                              { to: '/profile', icon: <User className="w-4 h-4" />, label: 'My Profile' },
                              { to: '/orders', icon: <Package className="w-4 h-4" />, label: 'My Orders' },
                              { to: '/bookings', icon: <CalendarCheck className="w-4 h-4" />, label: 'My Bookings' },
                            ].map(item => (
                              <Link key={item.to} to={item.to} onClick={() => setUserDropdown(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                                <span className="text-gray-400 dark:text-gray-500">{item.icon}</span>
                                {item.label}
                              </Link>
                            ))}
                          </div>
                          {user.role === 'customer' && (
                            <div className="px-2 pb-1 space-y-1">
                              <AtsReportButton
                                user={user}
                                onClick={() => setUserDropdown(false)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                              />
                              <JoinLatestMeetingButton
                                onClick={() => setUserDropdown(false)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                              />
                            </div>
                          )}
                          <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                            <button onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                              <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {!user && (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="text-sm font-semibold text-gray-700 dark:text-gray-200 px-3.5 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary text-sm py-2 px-4">
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden icon-btn ml-1">
                <AnimatePresence mode="wait">
                  {menuOpen
                    ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-5 h-5" /></motion.span>
                    : <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Menu className="w-5 h-5" /></motion.span>
                  }
                </AnimatePresence>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="lg:hidden overflow-hidden border-t border-gray-200/60 dark:border-gray-800/60">
                <div className="py-4 space-y-1">
                  <form onSubmit={handleSearch} className="relative mb-3">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                      placeholder="Search properties…" className="input pl-10 text-sm py-2.5" />
                  </form>
                  {navLinks.map(l => (
                    <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive(l.to)
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                      }`}>
                      <span className="text-gray-400">{l.icon}</span>
                      {l.label}
                    </Link>
                  ))}
                  {showSellerSection && (
                    <Link to="/seller" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all">
                      <Building2 className="w-3.5 h-3.5" />
                      Seller Section
                    </Link>
                  )}
                  {showAdminPanel && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all">
                      <BarChart3 className="w-3.5 h-3.5" />
                      Admin Panel
                    </Link>
                  )}
                  {user?.role === 'customer' && (
                    <>
                      <AtsReportButton
                        user={user}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all"
                      />
                      <JoinLatestMeetingButton
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all"
                      />
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#0d1117] border-t border-gray-200/60 dark:border-gray-800/60 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-md">
                  <span className="text-white text-lg">🏠</span>
                </div>
                <span className="font-black text-xl bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent">
                  HomeConnect
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
                India's most trusted AI-powered real estate platform. Find verified properties with smart search and instant AI valuations.
              </p>
              <div className="flex items-center gap-3 mt-4">
                {['🏠', '🤖', '📍', '⭐'].map((icon, i) => (
                  <div key={i} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer">
                    {icon}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Explore</h4>
              <ul className="space-y-2.5">
                {[{to:'/products',label:'Properties'},{to:'/price-estimator',label:'Price Estimator'},{to:'/ai-recommendations',label:'AI Picks'},{to:'/location-insights',label:'Location Insights'}].map(l => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Account</h4>
              <ul className="space-y-2.5">
                {[{to:'/login',label:'Login'},{to:'/register',label:'Register'},{to:'/profile',label:'Profile'},{to:'/bookings',label:'Bookings'}].map(l => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200/60 dark:border-gray-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">© 2026 HomeConnect. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 dark:text-gray-500">Privacy</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">Terms</span>
              <Link to="/contact" className="text-xs text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>

      {user?.role === 'customer' && (
        <div className="fixed left-4 bottom-4 z-40 hidden lg:block">
          <JoinLatestMeetingButton className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-xl shadow-emerald-500/25 hover:bg-emerald-700 transition-all active:scale-95" />
        </div>
      )}

      <PropertyChat />
      <CompareBar />
    </div>
  );
}
