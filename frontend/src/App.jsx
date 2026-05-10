import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './context/authStore';
import { useThemeStore } from './context/stores';

// Layouts
import CustomerLayout from './components/layout/CustomerLayout';
import AdminLayout    from './components/layout/AdminLayout';
import SellerLayout   from './components/layout/SellerLayout';

// Auth
import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import DevLogin       from './pages/auth/DevLogin';
import ResetPassword  from './pages/auth/ResetPassword';

// Customer
import Home               from './pages/customer/Home';
import Products           from './pages/customer/Products';
import ProductDetail      from './pages/customer/ProductDetail';
import Cart               from './pages/customer/Cart';
import Checkout           from './pages/customer/Checkout';
import Orders             from './pages/customer/Orders';
import OrderDetail        from './pages/customer/OrderDetail';
import Wishlist           from './pages/customer/Wishlist';
import Profile            from './pages/customer/Profile';
import Notifications      from './pages/customer/Notifications';
import Bookings           from './pages/customer/Bookings';
import PriceEstimator     from './pages/customer/PriceEstimator';
import Chat               from './pages/customer/Chat';
import AIRecommendations  from './pages/customer/AIRecommendations';
import LocationSuggestions from './pages/customer/LocationSuggestions';
import Compare             from './pages/customer/Compare';
import Contact             from './pages/customer/Contact';
import Analytics           from './pages/customer/Analytics';
import Meeting             from './Meeting';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers     from './pages/admin/Users';
import AdminOrders    from './pages/admin/Orders';
import AdminProducts  from './pages/admin/Products';
import AdminCoupons   from './pages/admin/Coupons';
import AdminBookings  from './pages/admin/Bookings';
import AdminAILogs    from './pages/admin/AILogs';
import AdminOverview  from './pages/admin/Overview';
import AdminSellers   from './pages/admin/Sellers';
import ScheduleMeeting from './pages/admin/ScheduleMeeting';

// Seller
import SellerDashboard from './pages/seller/Dashboard';
import SellerProducts  from './pages/seller/Products';
import SellerOrders    from './pages/seller/Orders';
import SellerInventory from './pages/seller/Inventory';
import AddProduct      from './pages/seller/AddProduct';
import EditProduct     from './pages/seller/EditProduct';

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#080c14]">
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-900" />
        <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-sm">🏠</span>
        </div>
      </div>
      <div className="text-center">
        <p className="font-black text-lg bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
          HomeConnect
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Loading your experience…</p>
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, initialized } = useAuthStore();
  if (!initialized) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles) {
    const userRoles = user.roles?.length ? user.roles : [user.role];
    const hasAllowedRole = allowedRoles.some(role => user.role === role || userRoles.includes(role));
    if (!hasAllowedRole) return <Navigate to="/" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, initialized } = useAuthStore();
  if (!initialized) return <Loading />;
  if (user) {
    if (user.role === 'admin')  return <Navigate to="/admin"  replace />;
    if (user.role === 'seller') return <Navigate to="/seller" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
};

const CustomerRoute = ({ children }) => {
  const { user, initialized } = useAuthStore();
  if (!initialized) return <Loading />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'seller') return <Navigate to="/seller" replace />;
  return children;
};

export default function App() {
  const { init } = useAuthStore();
  const { dark } = useThemeStore();

  useEffect(() => {
    init();
    document.documentElement.classList.toggle('dark', dark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:!bg-gray-900 dark:!text-white !rounded-2xl !shadow-xl',
          style: {
            borderRadius: '16px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: { primary: '#6366f1', secondary: 'white' },
          },
          duration: 3500,
        }}
      />
      <Routes>
        {/* Auth */}
        <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"        element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/dev-login" element={<DevLogin />} />
        <Route path="/meeting/:roomName" element={<ProtectedRoute allowedRoles={['admin','seller','customer']}><Meeting /></ProtectedRoute>} />

        {/* Customer */}
        <Route path="/" element={<CustomerRoute><CustomerLayout /></CustomerRoute>}>
          <Route index element={<Home />} />
          <Route path="products"         element={<Products />} />
          <Route path="products/:id"     element={<ProductDetail />} />
          <Route path="cart"             element={<ProtectedRoute allowedRoles={['customer']}><Cart /></ProtectedRoute>} />
          <Route path="checkout"         element={<ProtectedRoute allowedRoles={['customer']}><Checkout /></ProtectedRoute>} />
          <Route path="orders"           element={<ProtectedRoute allowedRoles={['customer']}><Orders /></ProtectedRoute>} />
          <Route path="orders/:id"       element={<ProtectedRoute allowedRoles={['customer']}><OrderDetail /></ProtectedRoute>} />
          <Route path="wishlist"         element={<ProtectedRoute allowedRoles={['customer']}><Wishlist /></ProtectedRoute>} />
          <Route path="profile"          element={<ProtectedRoute allowedRoles={['customer']}><Profile /></ProtectedRoute>} />
          <Route path="notifications"    element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="bookings"         element={<ProtectedRoute allowedRoles={['customer']}><Bookings /></ProtectedRoute>} />
          <Route path="price-estimator"  element={<PriceEstimator />} />
          <Route path="chat"             element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="chat/:receiverId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="ai-recommendations" element={<AIRecommendations />} />
          <Route path="location-insights"  element={<LocationSuggestions />} />
          <Route path="compare"            element={<Compare />} />
          <Route path="contact"            element={<Contact />} />
          <Route path="analytics"          element={<Analytics />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index            element={<AdminDashboard />} />
          <Route path="overview"  element={<AdminOverview />} />
          <Route path="users"     element={<AdminUsers fixedRole="customer" title="Buyers" />} />
          <Route path="admins"    element={<AdminUsers fixedRole="admin" title="Admin" />} />
          <Route path="sellers"   element={<AdminSellers />} />
          <Route path="orders"    element={<AdminOrders />} />
          <Route path="products"  element={<AdminProducts />} />
          <Route path="coupons"   element={<AdminCoupons />} />
          <Route path="bookings"  element={<AdminBookings />} />
          <Route path="ai-logs"   element={<AdminAILogs />} />
          <Route path="schedule-meeting" element={<ScheduleMeeting />} />
        </Route>

        {/* Seller */}
        <Route path="/seller" element={<ProtectedRoute allowedRoles={['seller','admin']}><SellerLayout /></ProtectedRoute>}>
          <Route index                    element={<SellerDashboard />} />
          <Route path="products"          element={<SellerProducts />} />
          <Route path="products/add"      element={<AddProduct />} />
          <Route path="products/edit/:id" element={<EditProduct />} />
          <Route path="orders"            element={<SellerOrders />} />
          <Route path="inventory"         element={<SellerInventory />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
