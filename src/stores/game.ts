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
    async submitNextWeekPick(symbol: string, weekId: number, user: any) {
      this.loading = true;
      this.error = null;
      try {
        // Find if the user already has a pick for this week
        const nextWeek = this.nextWeek;
        let userPick = null;
        if (user && nextWeek && Array.isArray(nextWeek.picks)) {
          userPick = nextWeek.picks.find(
            (p: any) => p.user.username?.toLowerCase().trim() === user.username?.toLowerCase().trim()
          );
        }
        console.log('[submitNextWeekPick] user:', user, 'userPick:', userPick);
        if (userPick) {
          // Update existing pick
          await axios.put('/api/picks/update', { pickId: userPick.id, symbol, entryPrice: 0 });
        } else {
          // Create new pick
          await axios.post('/api/picks/create', { symbol, weekId, entryPrice: 0 });
        }
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
    nextWeek: (state) => {
      if (!state.currentWeek || !Array.isArray(state.weeks)) return null;
      // Find the week with the next highest weekNum after currentWeek
      const next = state.weeks
        .filter(w => w.weekNum > state.currentWeek!.weekNum)
        .sort((a, b) => a.weekNum - b.weekNum)[0];
      return next || null;
    },
  },
}); 