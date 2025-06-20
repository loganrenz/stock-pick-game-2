import { defineStore } from 'pinia';
import api from '../utils/axios.js';

interface User {
  id: number;
  username: string;
  email: string;
  wins: number;
  createdAt: string;
  updatedAt: string;
}

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
}

export const useUsersStore = defineStore('users', {
  state: (): UserState => ({
    users: [],
    loading: false,
    error: null,
  }),

  getters: {
    getUserById: (state) => (id: number) => {
      return state.users.find((user) => user.id === id);
    },
    getLeaderboard: (state) => {
      return [...state.users].sort((a, b) => b.wins - a.wins);
    },
  },

  actions: {
    async fetchUsers() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/users');
        this.users = response.data;
      } catch (error) {
        console.error('Failed to fetch users:', error);
        this.error = 'Failed to fetch users';
      } finally {
        this.loading = false;
      }
    },

    async fetchUser(id: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get(`/users/${id}`);
        const index = this.users.findIndex((user) => user.id === id);
        if (index !== -1) {
          this.users[index] = response.data;
        } else {
          this.users.push(response.data);
        }
        return response.data;
      } catch (error) {
        console.error('Failed to fetch user:', error);
        this.error = 'Failed to fetch user';
      } finally {
        this.loading = false;
      }
    },
  },
});
