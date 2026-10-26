import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error parsing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error?.message || error.message || 'Lỗi kết nối máy chủ';
    return Promise.reject(new Error(message));
  }
);

export default api;
