import { create } from 'zustand';
import api from '../utils/api';

// ─── THEME ────────────────────────────────────────────────────────────────────
export const useThemeStore = create((set) => ({
  dark: localStorage.getItem('darkMode') === 'true' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches,
  toggle: () => set((state) => {
    const next = !state.dark;
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
    return { dark: next };
  }),
  setDark: (val) => {
    localStorage.setItem('darkMode', String(val));
    document.documentElement.classList.toggle('dark', val);
    set({ dark: val });
  },
}));

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const useNotifStore = create((set) => ({
  notifications: [],
  unread: 0,

  fetch: async () => {
    try {
      const { data } = await api.get('/notifications');
      set({ notifications: data.notifications, unread: data.unread });
    } catch {}
  },

  markRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((s) => ({
        notifications: s.notifications.map(n => n._id === id ? { ...n, isRead: true } : n),
        unread: Math.max(0, s.unread - 1),
      }));
    } catch {}
  },

  markAllRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((s) => ({ notifications: s.notifications.map(n => ({ ...n, isRead: true })), unread: 0 }));
    } catch {}
  },

  push: (notif) => set((s) => ({
    notifications: [notif, ...s.notifications].slice(0, 30),
    unread: s.unread + 1,
  })),
}));

// ─── WISHLIST ─────────────────────────────────────────────────────────────────
export const useWishlistStore = create((set, get) => ({
  wishlist: null,
  fetch: async () => {
    try { const { data } = await api.get('/wishlist'); set({ wishlist: data.wishlist }); } catch {}
  },
  toggle: async (productId) => {
    try {
      const { data } = await api.post('/wishlist/toggle', { productId });
      set({ wishlist: data.wishlist });
      return data.added;
    } catch { return false; }
  },
  isInWishlist: (productId) => {
    const { wishlist } = get();
    return wishlist?.products?.some(p => (p._id || p) === productId) || false;
  },
}));

// ─── ADMIN LIVE COUNTS ────────────────────────────────────────────────────────
export const useAdminLiveStore = create((set, get) => ({
  pendingBookings:   0,
  pendingOrders:     0,
  pendingProperties: 0,
  activities: [],

  fetch: async () => {
    try {
      const { data } = await api.get('/admin/live-counts');
      set({ pendingBookings: data.pendingBookings, pendingOrders: data.pendingOrders, pendingProperties: data.pendingProperties || 0 });
    } catch {}
  },

  onNewBooking: (booking) => set((s) => ({
    pendingBookings: s.pendingBookings + 1,
    activities: [
      { id: booking._id + '_b_' + Date.now(), type: 'booking', handled: false, arrivedAt: Date.now(), ...booking },
      ...s.activities,
    ].slice(0, 50),
  })),

  onNewOrder: (order) => set((s) => ({
    pendingOrders: s.pendingOrders + 1,
    activities: [
      { id: order._id + '_o_' + Date.now(), type: 'order', handled: false, arrivedAt: Date.now(), ...order },
      ...s.activities,
    ].slice(0, 50),
  })),

  markHandled: (id) => set((s) => ({
    activities: s.activities.map(a => a.id === id ? { ...a, handled: true } : a),
  })),

  removeActivity: (id) => set((s) => ({
    activities: s.activities.filter(a => a.id !== id),
  })),

  clearAll: () => set({ activities: [] }),

  clearBookings: () => set({ pendingBookings: 0 }),
  clearOrders:   () => set({ pendingOrders: 0 }),
}));

// ─── COMPARE ──────────────────────────────────────────────────────────────────
export const useCompareStore = create((set, get) => ({
  items: [],
  add: (product) => set((s) => {
    if (s.items.length >= 3) return s;
    if (s.items.some(p => p._id === product._id)) return s;
    return { items: [...s.items, product] };
  }),
  remove: (productId) => set((s) => ({ items: s.items.filter(p => p._id !== productId) })),
  clear: () => set({ items: [] }),
  isIn: (productId) => get().items.some(p => p._id === productId),
}));

// ─── CART ─────────────────────────────────────────────────────────────────────
export const useCartStore = create((set, get) => ({
  cart: null,
  count: 0,

  fetch: async () => {
    try {
      const { data } = await api.get('/cart');
      set({ cart: data.cart, count: data.cart?.items?.length || 0 });
    } catch {}
  },

  add: async (productId, quantity = 1) => {
    try {
      const { data } = await api.post('/cart/add', { productId, quantity });
      set({ cart: data.cart, count: data.cart?.items?.length || 0 });
      return true;
    } catch { return false; }
  },

  update: async (productId, quantity) => {
    try {
      const { data } = await api.put(`/cart/item/${productId}`, { quantity });
      set({ cart: data.cart, count: data.cart?.items?.length || 0 });
    } catch {}
  },

  remove: async (productId) => {
    try {
      const { data } = await api.delete(`/cart/item/${productId}`);
      set({ cart: data.cart, count: data.cart?.items?.length || 0 });
    } catch {}
  },

  clear: async () => {
    try { await api.delete('/cart/clear'); set({ cart: null, count: 0 }); } catch {}
  },

  total: () => {
    const { cart } = get();
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => {
      const price = item.product?.discountPrice > 0 ? item.product.discountPrice : item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);
  },
}));
