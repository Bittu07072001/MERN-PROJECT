import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ShoppingBag, Package, Tag,
  CalendarCheck, Menu, LogOut, Sun, Moon, Sparkles, ChevronRight, BarChart3, Store, ShieldCheck, Video, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { io as socketIO } from 'socket.io-client';
import useAuthStore from '../../context/authStore';
import { useThemeStore, useAdminLiveStore } from '../../context/stores';
import AdminAtsReportButton from '../common/AdminAtsReportButton';
import { socketURL } from '../../utils/socket';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const { pendingBookings, pendingOrders, pendingProperties, fetch: fetchCounts,
          onNewBooking, onNewOrder, clearBookings, clearOrders } = useAdminLiveStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchCounts();
    const socket = socketIO(socketURL, { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('joinAdmin');

    const playAlert = (freq = 520, type = 'booking') => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const freqs = type === 'booking' ? [freq, freq * 1.25] : [freq, freq * 1.5];
        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = f; osc.type = 'sine';
          gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
          gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.15 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.22);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.22);
        });
        setTimeout(() => ctx.close(), 800);
      } catch {}
    };

    socket.on('admin:newBooking', (data) => {
      onNewBooking(data);
      playAlert(520, 'booking');
      toast.custom((t) => (
        <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`${t.visible ? 'opacity-100' : 'opacity-0'} flex items-start gap-3 bg-white dark:bg-gray-900 border border-primary-200 dark:border-primary-800 rounded-2xl shadow-xl px-4 py-3 max-w-sm`}>
          <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📅</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">New Booking Request</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {data.name} for <span className="font-medium text-primary-600 dark:text-primary-400">{data.property}</span>
            </p>
          </div>
        </motion.div>
      ), { duration: 5000, position: 'top-right' });
    });

    socket.on('admin:newOrder', (data) => {
      onNewOrder(data);
      playAlert(660, 'order');
      toast.custom((t) => (
        <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`${t.visible ? 'opacity-100' : 'opacity-0'} flex items-start gap-3 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-xl px-4 py-3 max-w-sm`}>
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🛒</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">New Order Placed</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              #{data.orderNumber} · <span className="font-medium text-emerald-600 dark:text-emerald-400">₹{data.total?.toLocaleString()}</span>
            </p>
          </div>
        </motion.div>
      ), { duration: 5000, position: 'top-right' });
    });

    return () => { socket.off(); socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.pathname === '/admin/bookings') clearBookings();
    if (location.pathname === '/admin/orders') clearOrders();
  }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate('/login'); toast.success('Logged out'); };

  const NAV = [
    { to: '/admin',           icon: <LayoutDashboard className="w-4.5 h-4.5" />, label: 'Dashboard',  badge: 0,               color: 'text-blue-500' },
    { to: '/admin/overview',  icon: <BarChart3 className="w-4.5 h-4.5" />,       label: 'Overview',   badge: 0,               color: 'text-sky-500' },
    { to: '/admin/users',     icon: <Users className="w-4.5 h-4.5" />,           label: 'Buyers',     badge: 0,               color: 'text-purple-500' },
    { to: '/admin/admins',    icon: <ShieldCheck className="w-4.5 h-4.5" />,     label: 'Admin',      badge: 0,               color: 'text-red-500' },
    { to: '/admin/sellers',   icon: <Store className="w-4.5 h-4.5" />,           label: 'Sellers',    badge: 0,               color: 'text-orange-500' },
    { to: '/admin/orders',    icon: <Package className="w-4.5 h-4.5" />,         label: 'Orders',     badge: pendingOrders,   color: 'text-amber-500' },
    { to: '/admin/products',  icon: <ShoppingBag className="w-4.5 h-4.5" />,     label: 'Properties', badge: pendingProperties, color: 'text-emerald-500' },
    { to: '/admin/coupons',   icon: <Tag className="w-4.5 h-4.5" />,             label: 'Coupons',    badge: 0,               color: 'text-rose-500' },
    { to: '/admin/bookings',  icon: <CalendarCheck className="w-4.5 h-4.5" />,   label: 'Bookings',   badge: pendingBookings,  color: 'text-cyan-500' },
    { to: '/admin/schedule-meeting', icon: <Video className="w-4.5 h-4.5" />,    label: 'Schedule Meeting', badge: 0,           color: 'text-indigo-500' },
    { to: '/admin/ai-logs',   icon: <Sparkles className="w-4.5 h-4.5" />,        label: 'AI Logs',    badge: 0,               color: 'text-violet-500' },
  ];

  const NavItem = ({ item }) => {
    const active = location.pathname === item.to;
    return (
      <Link to={item.to} onClick={() => setOpen(false)}
        className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          active
            ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
        }`}>
        <span className={active ? 'text-white' : item.color}>{item.icon}</span>
        <span className="flex-1">{item.label}</span>
        <AnimatePresence>
          {item.badge > 0 && (
            <motion.span key={item.badge}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${
                active ? 'bg-white text-primary-600' : 'bg-rose-500 text-white'
              }`}>
              {item.badge > 99 ? '99+' : item.badge}
            </motion.span>
          )}
        </AnimatePresence>
        {active && <ChevronRight className="w-3 h-3 text-white/70" />}
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d1117]">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800/60">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-md shadow-primary-500/30">
            <span className="text-white text-lg">🏠</span>
          </div>
          <div>
            <div className="font-black text-base bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent">
              HomeConnect
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-500 font-semibold uppercase tracking-wider">Admin Panel</div>
          </div>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-3.5 py-2 mt-1">Management</div>
        <AdminAtsReportButton
          user={user}
          onClick={() => setOpen(false)}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all duration-200"
        />
        {NAV.map(item => <NavItem key={item.to} item={item} />)}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800/60 space-y-3">
        {/* Live alert */}
        {(pendingBookings > 0 || pendingOrders > 0 || pendingProperties > 0) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="px-3.5 py-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              Live — needs attention
            </p>
            {pendingBookings > 0   && <p className="text-[11px] text-amber-600 dark:text-amber-300">📅 {pendingBookings} pending booking{pendingBookings !== 1 ? 's' : ''}</p>}
            {pendingOrders > 0     && <p className="text-[11px] text-amber-600 dark:text-amber-300">📦 {pendingOrders} pending order{pendingOrders !== 1 ? 's' : ''}</p>}
            {pendingProperties > 0 && <p className="text-[11px] text-amber-600 dark:text-amber-300">🏠 {pendingProperties} propert{pendingProperties !== 1 ? 'ies' : 'y'} awaiting approval</p>}
          </motion.div>
        )}

        {/* User info */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-[11px] text-primary-500 dark:text-primary-400 font-medium">Administrator</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={toggle}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/60 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            {dark ? <><Sun className="w-3.5 h-3.5" /> Light</> : <><Moon className="w-3.5 h-3.5" /> Dark</>}
          </button>
          <button onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>
    </div>
  );

  const currentPage = NAV.find(n => n.to === location.pathname)?.label || 'Admin';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#080c14] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 border-r border-gray-200 dark:border-gray-800/60">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-60 z-50 lg:hidden shadow-2xl border-r border-gray-200 dark:border-gray-800">
              <Sidebar />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="bg-white dark:bg-[#0d1117] border-b border-gray-200 dark:border-gray-800/60 px-5 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)}
              className="lg:hidden icon-btn">
              <Menu className="w-4.5 h-4.5" />
            </button>
            <div>
              <h1 className="font-bold text-sm text-gray-900 dark:text-white">{currentPage}</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-500 hidden sm:block">
                HomeConnect Admin Panel
              </p>
            </div>
            {(pendingBookings > 0 || pendingOrders > 0) && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-full">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  {pendingBookings + pendingOrders} pending
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/chat" className="icon-btn" title="Messages">
              <MessageCircle className="w-4.5 h-4.5" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800/60">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Live</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
