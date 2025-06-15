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

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    user: null
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    username: (state): string | null => state.user?.username ?? null
  },

  actions: {
    async login(username: string, password: string): Promise<void> {
      try {
        const response = await axios.post('/api/auth/login', { username, password });
        const { token } = response.data;
        this.token = token;
        localStorage.setItem('token', token);
        await this.fetchUser();
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },

    async logout(): Promise<void> {
      try {
        await axios.post('/api/auth/logout');
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
      }
    },

    async fetchUser(): Promise<void> {
      try {
        const response = await axios.get('/api/auth/me');
        this.user = response.data;
      } catch (error) {
        console.error('Failed to fetch user:', error);
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        throw error;
      }
    }
  }
}); 