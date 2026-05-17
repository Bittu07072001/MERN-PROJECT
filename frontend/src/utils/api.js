import axios from 'axios';

const configuredApiOrigin = import.meta.env.VITE_API_URL || '';
const isBrowser = typeof window !== 'undefined';
const isLocalPage = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const isLocalApiOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(configuredApiOrigin);
const apiOrigin = isLocalApiOrigin && !isLocalPage ? '' : configuredApiOrigin;
const apiBaseURL = apiOrigin ? `${apiOrigin.replace(/\/$/, '')}/api` : '/api';

const api = axios.create({ baseURL: apiBaseURL, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const rt = localStorage.getItem('refreshToken');
      if (rt) {
        try {
          const { data } = await axios.post(`${apiBaseURL}/auth/refresh-token`, { refreshToken: rt });
          localStorage.setItem('token', data.token);
          orig.headers.Authorization = `Bearer ${data.token}`;
          return api(orig);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
