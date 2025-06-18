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
    weeks: [] as Week[],
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
        this.weeks = res.data.weeks.map((week: any) => ({
          ...week,
          picks: week.picks.map((pick: any) => ({
            ...pick,
            entryPrice: pick.entryPrice ?? pick.priceAtPick,
            currentValue: pick.currentValue ?? pick.currentPrice,
            returnPercentage: pick.returnPercentage ?? pick.weekReturnPct,
            dailyPriceData: pick.dailyPriceData ?? pick.dailyPrices,
          }))
        }));
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
        const res = await axios.get('/api/weeks/current');
        this.currentWeek = {
          ...res.data,
          picks: res.data.picks.map((pick: any) => ({
            ...pick,
            entryPrice: pick.entryPrice ?? pick.priceAtPick,
            currentValue: pick.currentValue ?? pick.currentPrice,
            returnPercentage: pick.returnPercentage ?? pick.weekReturnPct,
            dailyPriceData: pick.dailyPriceData ?? pick.dailyPrices,
          }))
        };
      } catch (err) {
        this.error = 'Failed to fetch current week';
      } finally {
        this.loading = false;
      }
    },
    async fetchAll() {
      this.loading = true;
      this.error = null;
      try {
        const [weeksRes, currentWeekRes] = await Promise.all([
          axios.get('/api/weeks'),
          axios.get('/api/weeks/current')
        ]);
        this.weeks = weeksRes.data.weeks.map((week: any) => ({
          ...week,
          picks: week.picks.map((pick: any) => ({
            ...pick,
            entryPrice: pick.entryPrice ?? pick.priceAtPick,
            currentValue: pick.currentValue ?? pick.currentPrice,
            returnPercentage: pick.returnPercentage ?? pick.weekReturnPct,
            dailyPriceData: pick.dailyPriceData ?? pick.dailyPrices,
          }))
        }));
        this.currentWeek = {
          ...currentWeekRes.data,
          picks: currentWeekRes.data.picks.map((pick: any) => ({
            ...pick,
            entryPrice: pick.entryPrice ?? pick.priceAtPick,
            currentValue: pick.currentValue ?? pick.currentPrice,
            returnPercentage: pick.returnPercentage ?? pick.weekReturnPct,
            dailyPriceData: pick.dailyPriceData ?? pick.dailyPrices,
          }))
        };
      } catch (err) {
        this.error = 'Failed to fetch data';
      } finally {
        this.loading = false;
      }
    },
    async submitPick(symbol: string) {
      this.loading = true;
      this.error = null;
      try {
        if (!this.currentWeek?.id) {
          throw new Error('No current week available');
        }
        await axios.post('/api/picks', { symbol, weekId: this.currentWeek.id });
        await this.fetchWeeks();
        await this.fetchCurrentWeek();
      } catch (err) {
        this.error = 'Failed to submit pick';
      } finally {
        this.loading = false;
      }
    },
    async submitNextWeekPick(symbol: string, weekId: number) {
      this.loading = true;
      this.error = null;
      try {
        await axios.post('/api/weeks/next/picks', { symbol, weekId });
        await this.fetchWeeks();
        await this.fetchCurrentWeek();
      } catch (err) {
        this.error = 'Failed to submit next week pick';
      } finally {
        this.loading = false;
      }
    },
    async fetchScoreboard() {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get('/api/scoreboard');
        return res.data;
      } catch (err) {
        this.error = 'Failed to fetch scoreboard';
        return [];
      } finally {
        this.loading = false;
      }
    }
  },
  getters: {
    getWeekById: (state) => (id: number) => state.weeks.find(w => w.id === id),
    getCurrentWeekPicks: (state) => state.currentWeek ? state.currentWeek.picks : [],
    getHistoricalWeeks: (state) => [...state.weeks].sort((a, b) => b.weekNum - a.weekNum),
  },
}); 