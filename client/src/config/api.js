import axios from 'axios';

export const baseURL = '/api';

const api = axios.create({
  baseURL: baseURL,
});

// REQUEST INTERCEPTOR: Otomatis pasang token di setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Tangani error global (Token Expired → auto logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginURL = (error.config?.url === '/auth/login');
    const pathname = window.location.pathname || '';
    const isPublicPath = (
      pathname === '/'
      || pathname === '/login'
      || pathname.startsWith('/ppdb')
      || pathname === '/materi'
      || /^\/materi\/[^/]+$/.test(pathname)
    );


    if (error.response && error.response.status === 401 && !isLoginURL) {
      if (isPublicPath) {
        console.warn('Token tidak valid saat akses halaman publik. Token dibersihkan tanpa redirect.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return Promise.reject(error);
      }
      console.warn('Token expired atau tidak valid. Mengarahkan ke Login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
