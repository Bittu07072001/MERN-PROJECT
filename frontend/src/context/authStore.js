import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set, get) => ({
  user:        null,
  token:       localStorage.getItem('token'),
  loading:     true,
  initialized: false,

  init: async () => {
    const token = localStorage.getItem('token');
    if (!token) return set({ loading: false, initialized: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, token, loading: false, initialized: true });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      set({ user: null, token: null, loading: false, initialized: true });
    }
  },

  login: async (emailOrPhone, password) => {
    const { data } = await api.post('/auth/login', { emailOrPhone, password });
    if (data.requireOTP) return { requireOTP: true, userId: data.userId, maskedContact: data.maskedContact };
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, token: data.token });
    return { success: true, role: data.user.role };
  },

  verifyOTP: async (userId, otp, type = 'login') => {
    const endpoint = type === 'register' ? '/auth/verify-registration-otp' : '/auth/verify-login-otp';
    const { data } = await api.post(endpoint, { userId, otp });
    // Multi-role: user needs to pick which role to enter as
    if (data.requireRoleSelection) {
      return { requireRoleSelection: true, userId: data.userId, availableRoles: data.availableRoles };
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, token: data.token });
    return { success: true, role: data.user.role };
  },

  selectRole: async (userId, role) => {
    const { data } = await api.post('/auth/select-role', { userId, role });
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, token: data.token });
    return { success: true, role: data.user.role };
  },

  register: async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    return { success: true, userId: data.userId, requireOTPVerification: data.requireOTPVerification };
  },

  googleAuth: async ({ credential, roles }) => {
    const { data } = await api.post('/auth/google', { credential, roles });
    if (data.requireRoleSelection) {
      return { requireRoleSelection: true, userId: data.userId, availableRoles: data.availableRoles };
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, token: data.token });
    return { success: true, role: data.user.role };
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({ user: null, token: null });
  },

  updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
}));

export default useAuthStore;
