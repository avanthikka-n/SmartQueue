import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartqueue_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      if (localStorage.getItem('smartqueue_token')) {
        localStorage.removeItem('smartqueue_token');
        localStorage.removeItem('smartqueue_user');
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
