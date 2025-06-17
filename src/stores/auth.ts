import { defineStore } from 'pinia';
import axios from 'axios';

interface User {
  id: number;
  username: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/',  // Use relative URLs
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    const token = localStorage.getItem('token');
    return {
      token,
      user: null
    };
  },

  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    username: (state): string | null => state.user?.username ?? null
  },

  actions: {
    async login(username: string, password: string): Promise<void> {
      try {
        const response = await api.post('/api/auth/login', { username, password });
        const { token, user } = response.data;
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        // Set the token in axios defaults
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },

    async logout(): Promise<void> {
      try {
        if (this.token) {
          await api.post('/api/auth/logout');
        }
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        // Remove the token from axios defaults
        delete api.defaults.headers.common['Authorization'];
      }
    },

    async fetchUser(): Promise<void> {
      try {
        const response = await api.get('/api/auth/me');
        this.user = response.data;
      } catch (error) {
        console.error('Failed to fetch user:', error);
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        // Remove the token from axios defaults
        delete api.defaults.headers.common['Authorization'];
        throw error;
      }
    },

    // Initialize auth state
    async initialize(): Promise<void> {
      const token = localStorage.getItem('token');
      if (token) {
        this.token = token;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          await this.fetchUser();
        } catch (error) {
          // If fetchUser fails, clear the token
          this.token = null;
          this.user = null;
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
    }
  }
}); 