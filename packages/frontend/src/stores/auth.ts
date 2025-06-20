import { defineStore } from 'pinia';
import api from '../utils/axios.js';

interface User {
  id: number;
  username: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
}

// Cache for refresh token requests to prevent race conditions
let refreshPromise: Promise<void> | null = null;

// Add response interceptor to handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If there's already a refresh in progress, wait for it
      if (refreshPromise) {
        try {
          await refreshPromise;
          const authStore = useAuthStore();
          originalRequest.headers.Authorization = `Bearer ${authStore.token}`;
          return api(originalRequest);
        } catch (refreshError) {
          const authStore = useAuthStore();
          authStore.logout();
          return Promise.reject(refreshError);
        }
      }

      // Start a new refresh
      try {
        const authStore = useAuthStore();
        refreshPromise = authStore.refreshToken();
        await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${authStore.token}`;
        refreshPromise = null;
        return api(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        // Refresh token failed, logout user
        const authStore = useAuthStore();
        authStore.logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    const token = localStorage.getItem('token');
    return {
      token,
      user: null,
    };
  },

  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    username: (state): string | null => state.user?.username ?? null,
  },

  actions: {
    async login(username: string, password: string): Promise<void> {
      try {
        const response = await api.post('/auth/login', { username, password });
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
          await api.post('/auth/logout');
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
        const response = await api.get('/auth/me');
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
    },

    async refreshToken(): Promise<void> {
      try {
        const response = await api.post('/auth/refresh-token');
        const { token } = response.data;
        this.token = token;
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Clear all auth state on refresh failure
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        throw error;
      }
    },

    // Check if token is about to expire and refresh if needed
    async checkTokenExpiry(): Promise<void> {
      if (!this.token) return;

      try {
        // Decode the JWT to check expiration
        const payload = JSON.parse(atob(this.token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = payload.exp - now;

        // If token expires in less than 5 minutes, refresh it
        if (timeUntilExpiry < 300) {
          await this.refreshToken();
        }
      } catch (error) {
        console.error('Error checking token expiry:', error);
        // If we can't decode the token, it's probably invalid
        this.logout();
      }
    },

    // Check if user is still authenticated
    async checkAuth(): Promise<boolean> {
      if (!this.token) return false;

      try {
        await this.fetchUser();
        return true;
      } catch (error) {
        console.error('Auth check failed:', error);
        this.logout();
        return false;
      }
    },
  },
});
