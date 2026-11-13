import axios from 'axios';

const api = axios.create({
  baseURL: 'https://footwear-erp-2x2l.onrender.com/api',
  timeout: 45000, // 45s to handle Render free-tier wake-up
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('solefit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('solefit_token');
        localStorage.removeItem('solefit_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
