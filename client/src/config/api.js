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
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Tangani error global (misal Token Expired)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Jika backend mengembalikan status 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.warn("Token expired atau tidak valid. Mengarahkan ke Login...");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Arahkan ke login
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;