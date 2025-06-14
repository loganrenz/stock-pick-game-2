import { defineStore } from 'pinia';
import type { Week, User, Pick } from '../types';
import axios from 'axios';

interface GameState {
  weeks: Week[];
  currentWeek: Week | null;
  users: User[];
  loading: boolean;
  error: string | null;
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    weeks: [],
    currentWeek: null,
    users: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchWeeks() {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get('/api/weeks');
        this.weeks = res.data;
        this.currentWeek = this.weeks.find((w: Week) => !w.winnerId) || null;
      } catch (err) {
        this.error = 'Failed to fetch weeks';
      } finally {
        this.loading = false;
      }
    },
    async fetchUsers() {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get('/api/users');
        this.users = res.data;
      } catch (err) {
        this.error = 'Failed to fetch users';
      } finally {
        this.loading = false;
      }
    },
    async submitPick(weekId: number, symbol: string, priceAtPick: number) {
      this.loading = true;
      this.error = null;
      try {
        await axios.post('/api/picks', { weekId, symbol, priceAtPick });
        await this.fetchWeeks();
      } catch (err) {
        this.error = 'Failed to submit pick';
      } finally {
        this.loading = false;
      }
    },
  },
  getters: {
    getWeekById: (state) => (id: number) => state.weeks.find(w => w.id === id),
    getUserById: (state) => (id: number) => state.users.find(u => u.id === id),
    getCurrentWeekPicks: (state) => state.currentWeek ? state.currentWeek.picks : [],
    getHistoricalWeeks: (state) => state.weeks.filter(w => w.winnerId),
  },
}); 