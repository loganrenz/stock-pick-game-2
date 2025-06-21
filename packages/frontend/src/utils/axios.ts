import axios from 'axios';

const isProduction = import.meta.env.PROD;

// Create a configured axios instance for API calls
const api = axios.create({
  baseURL: isProduction ? '/api' : 'http://localhost:6969/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
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
  },
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // Check for new token in response headers
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      localStorage.setItem('token', newToken);
    }
    return response;
  },
  (error) => {
    // Remove the automatic logout on 401 - let the auth store handle it
    return Promise.reject(error);
  },
);

export default api;
