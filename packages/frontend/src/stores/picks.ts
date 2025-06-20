import { defineStore } from 'pinia';
import api from '../utils/axios.js';

interface Pick {
  id: number;
  userId: number;
  weekId: number;
  symbol: string;
  entryPrice?: number;
  currentValue?: number;
  weekReturn?: number;
  returnPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

interface Week {
  id: number;
  weekNum: number;
  startDate: string;
  endDate: string;
  winnerId?: number;
  createdAt: string;
  updatedAt: string;
}

interface PicksState {
  userPicks: Pick[];
  currentWeek: Week | null;
  loading: boolean;
  error: string | null;
}

export const usePicksStore = defineStore('picks', {
  state: (): PicksState => ({
    userPicks: [],
    currentWeek: null,
    loading: false,
    error: null,
  }),

  getters: {
    currentWeekPick: (state) => {
      if (!state.currentWeek) return null;
      return state.userPicks.find((pick) => pick.weekId === state.currentWeek!.id);
    },
  },

  actions: {
    async fetchCurrentWeek() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/weeks/current');
        this.currentWeek = response.data;
      } catch (error) {
        console.error('Failed to fetch current week:', error);
        this.error = 'Failed to fetch current week';
      } finally {
        this.loading = false;
      }
    },

    async fetchUserPicks() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/picks');
        this.userPicks = response.data;
      } catch (error) {
        console.error('Failed to fetch user picks:', error);
        this.error = 'Failed to fetch user picks';
      } finally {
        this.loading = false;
      }
    },

    async createPick(symbol: string) {
      if (!this.currentWeek) {
        throw new Error('No current week available');
      }

      try {
        const response = await api.post('/picks', {
          weekId: this.currentWeek.id,
          symbol,
          entryPrice: 0,
        });
        const newPick = response.data;
        this.userPicks.push(newPick);
        return newPick;
      } catch (error) {
        console.error('Failed to create pick:', error);
        throw error;
      }
    },
  },
});
