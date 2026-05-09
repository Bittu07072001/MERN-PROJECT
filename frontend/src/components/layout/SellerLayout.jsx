import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, BarChart2, Plus, Menu, LogOut, Sun, Moon, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/authStore';
import { useThemeStore } from '../../context/stores';

const NAV = [
  { to: '/seller',              icon: <LayoutDashboard className="w-4.5 h-4.5" />, label: 'Dashboard',     color: 'text-blue-500' },
  { to: '/seller/products',     icon: <ShoppingBag className="w-4.5 h-4.5" />,    label: 'My Listings',   color: 'text-emerald-500' },
  { to: '/seller/products/add', icon: <Plus className="w-4.5 h-4.5" />,           label: 'List Property', color: 'text-amber-500' },
  { to: '/seller/orders',       icon: <Package className="w-4.5 h-4.5" />,        label: 'Orders',        color: 'text-rose-500' },
  { to: '/seller/inventory',    icon: <BarChart2 className="w-4.5 h-4.5" />,      label: 'Inventory',     color: 'text-violet-500' },
];

export default function SellerLayout() {
  const { user, logout } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); toast.success('Logged out'); };

  const NavItem = ({ item }) => {
    const active = location.pathname === item.to;
    return (
      <Link to={item.to} onClick={() => setOpen(false)}
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          active
            ? 'bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-lg shadow-violet-500/25'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
        }`}>
        <span className={active ? 'text-white' : item.color}>{item.icon}</span>
        <span className="flex-1">{item.label}</span>
        {active && <ChevronRight className="w-3 h-3 text-white/70" />}
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d1117]">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800/60">
        <Link to="/seller" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/30">
            <span className="text-white text-lg">🏠</span>
          </div>
          <div>
            <div className="font-black text-base bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
              HomeConnect
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-500 font-semibold uppercase tracking-wider">Seller Portal</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-3.5 py-2 mt-1">Seller Tools</div>
        {NAV.map(item => <NavItem key={item.to} item={item} />)}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800/60 space-y-3">
        {/* Quick add button */}
        <Link to="/seller/products/add"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all hover:from-violet-700 hover:to-purple-600 active:scale-[0.97]">
          <Plus className="w-4 h-4" /> New Listing
        </Link>

        {/* User info */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-[11px] text-violet-500 dark:text-violet-400 font-medium">Seller Account</p>
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

  const currentPage = NAV.find(n => n.to === location.pathname)?.label || 'Seller';

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

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white dark:bg-[#0d1117] border-b border-gray-200 dark:border-gray-800/60 px-5 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden icon-btn">
              <Menu className="w-4.5 h-4.5" />
            </button>
            <div>
              <h1 className="font-bold text-sm text-gray-900 dark:text-white">{currentPage}</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-500 hidden sm:block">HomeConnect Seller Portal</p>
            </div>
          </div>
          <Link to="/seller/products/add"
            className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all active:scale-95">
            <Plus className="w-3.5 h-3.5" /> New Listing
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
