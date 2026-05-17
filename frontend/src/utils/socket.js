const configuredSocketURL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '';
const isBrowser = typeof window !== 'undefined';
const isLocalPage = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const isLocalSocketURL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(configuredSocketURL);

export const socketURL = (isLocalSocketURL && !isLocalPage ? '' : configuredSocketURL).replace(/\/$/, '') || '/';
