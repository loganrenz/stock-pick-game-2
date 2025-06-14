import { defineStore } from 'pinia';
import type { Week, Pick } from '../types';
import axios from 'axios';

interface GameState {
  weeks: Week[];
  currentWeek: Week | null;
  loading: boolean;
  error: string | null;
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    weeks: [],
    currentWeek: null,
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
        // Set currentWeek to the latest week (first in sorted list)
        this.currentWeek = this.weeks[0] || null;
      } catch (err) {
        this.error = 'Failed to fetch weeks';
      } finally {
        this.loading = false;
      }
    },
    async fetchCurrentWeek() {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get('/api/current-week');
        this.currentWeek = res.data;
      } catch (err) {
        this.error = 'Failed to fetch current week';
      } finally {
        this.loading = false;
      }
    },
    async submitPick(symbol: string) {
      this.loading = true;
      this.error = null;
      try {
        await axios.post('/api/picks', { symbol });
        await this.fetchWeeks();
        await this.fetchCurrentWeek();
      } catch (err) {
        this.error = 'Failed to submit pick';
      } finally {
        this.loading = false;
      }
    },
    async submitNextWeekPick(symbol: string) {
      this.loading = true;
      this.error = null;
      try {
        await axios.post('/api/picks/next-week', { symbol });
        await this.fetchWeeks();
        await this.fetchCurrentWeek();
      } catch (err) {
        this.error = 'Failed to submit next week pick';
      } finally {
        this.loading = false;
      }
    },
  },
  getters: {
    getWeekById: (state) => (id: number) => state.weeks.find(w => w.id === id),
    getCurrentWeekPicks: (state) => state.currentWeek ? state.currentWeek.picks : [],
    getHistoricalWeeks: (state) => [...state.weeks].sort((a, b) => b.weekNum - a.weekNum),
  },
}); 