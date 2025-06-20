import { defineStore } from 'pinia';
import type { Week, Pick } from '../types';
import axios from 'axios';

interface GameState {
  weeks: Week[];
  currentWeek: Week | null;
  loading: boolean;
  error: string | null;
  allWeeks: Week[];
  hideNextWeekPicks: boolean;
  scoreboard: Array<{ username: string; wins: number }>;
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    weeks: [] as Week[],
    currentWeek: null,
    loading: false,
    error: null,
    allWeeks: [] as Week[],
    hideNextWeekPicks: false,
    scoreboard: [],
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
          })),
        }));
      } catch (err) {
        this.error = 'Failed to fetch weeks';
      } finally {
        this.loading = false;
      }
    },
    async fetchCurrentWeek() {
      // This function is deprecated and will be removed.
      // For now, it just calls fetchAll to ensure correct data is loaded.
      await this.fetchAll();
    },
    async fetchAll() {
      this.loading = true;
      this.error = null;
      try {
        const [weeksRes, currentWeekRes] = await Promise.all([
          axios.get('/api/weeks'),
          axios.get('/api/weeks/current'),
        ]);

        // Try to fetch scoreboard separately to handle any issues
        let scoreboardData = [];
        try {
          const scoreboardRes = await axios.get('/api/scoreboard');
          scoreboardData = Array.isArray(scoreboardRes.data) ? scoreboardRes.data : [];
        } catch (scoreboardError) {
          console.error('Failed to fetch scoreboard:', scoreboardError);
          scoreboardData = [];
        }

        this.weeks = weeksRes.data.weeks.map((week: any) => ({
          ...week,
          picks: week.picks.map((pick: any) => ({
            ...pick,
            // Simplify mapping, trust the API to send correct fields
          })),
        }));
        this.currentWeek = {
          ...currentWeekRes.data,
          picks: currentWeekRes.data.picks.map((pick: any) => ({
            ...pick,
            // Simplify mapping, trust the API to send correct fields
          })),
        };
        this.scoreboard = scoreboardData;
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
        const nextWeek = this.activeNextWeek;
        let userPick = null;
        if (user && nextWeek && Array.isArray(nextWeek.picks)) {
          userPick = nextWeek.picks.find(
            (p: any) =>
              p.user.username?.toLowerCase().trim() === user.username?.toLowerCase().trim(),
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
        this.scoreboard = res.data;
        return res.data;
      } catch (err) {
        this.error = 'Failed to fetch scoreboard';
        this.scoreboard = [];
        return [];
      } finally {
        this.loading = false;
      }
    },
    async fetchAllWeeks() {
      this.loading = true;
      try {
        const response = await axios.get('/api/weeks');
        const weeks = response.data.weeks || response.data;

        // Transform picks to include user data
        const formattedWeeks = weeks.map((week: any) => ({
          ...week,
          picks:
            week.picks?.map((pick: any) => ({
              ...pick,
              user: pick.user || { id: pick.userId, username: 'Unknown' },
              dailyPriceData: null, // We'll get this from the stock data API if needed
            })) || [],
        }));

        this.allWeeks = formattedWeeks;
      } catch (error) {
        console.error('Error fetching all weeks:', error);
        this.error = error instanceof Error ? error.message : 'Failed to fetch all weeks';
      } finally {
        this.loading = false;
      }
    },
    async createPick(pickData: CreatePickData) {
      try {
        const response = await axios.post('/api/picks/create', pickData);
        const newPick = {
          ...response.data,
          user: { id: response.data.userId, username: 'Current User' },
          dailyPriceData: null, // We'll get this from the stock data API if needed
        };

        if (this.currentWeek) {
          this.currentWeek.picks.push(newPick);
        }
        return newPick;
      } catch (error) {
        console.error('Error creating pick:', error);
        throw error;
      }
    },
    async updatePick(pickId: number, updateData: Partial<Pick>) {
      try {
        const response = await axios.put('/api/picks/update', {
          pickId,
          ...updateData,
        });

        // Update the pick in the current week
        if (this.currentWeek) {
          const pickIndex = this.currentWeek.picks.findIndex((p) => p.id === pickId);
          if (pickIndex !== -1) {
            this.currentWeek.picks[pickIndex] = {
              ...this.currentWeek.picks[pickIndex],
              ...response.data,
              dailyPriceData: null, // We'll get this from the stock data API if needed
            };
          }
        }

        return response.data;
      } catch (error) {
        console.error('Error updating pick:', error);
        throw error;
      }
    },
    toggleNextWeekPicksVisibility() {
      this.hideNextWeekPicks = !this.hideNextWeekPicks;
      // Save preference to localStorage
      localStorage.setItem('hideNextWeekPicks', this.hideNextWeekPicks.toString());
    },
    async init() {
      // Load preference from localStorage
      const hideNextWeekPicks = localStorage.getItem('hideNextWeekPicks');
      if (hideNextWeekPicks !== null) {
        this.hideNextWeekPicks = hideNextWeekPicks === 'true';
      }
      await this.fetchCurrentWeek();
      await this.fetchWeeks();
    },
  },
  getters: {
    getWeekById: (state) => (id: number) => state.weeks.find((w) => w.id === id),
    getCurrentWeekPicks: (state) => (state.currentWeek ? state.currentWeek.picks : []),
    getHistoricalWeeks: (state) => {
      const now = new Date();
      return [...state.weeks]
        .filter((w) => {
          const endDate = new Date(w.endDate);
          return endDate < now;
        })
        .sort((a, b) => b.weekNum - a.weekNum);
    },
    nextWeek: (state) => {
      if (!state.currentWeek || !Array.isArray(state.weeks)) return null;
      const now = new Date();
      // Find the week with the next highest weekNum after currentWeek
      const next = state.weeks
        .filter((w) => w.weekNum > state.currentWeek!.weekNum && new Date(w.startDate) > now)
        .sort((a, b) => a.weekNum - b.weekNum)[0];
      return next || null;
    },
    activeNextWeek: (state) => {
      if (!state.currentWeek || !Array.isArray(state.weeks)) return null;
      const now = new Date();
      // Find the week that starts after the current week ends
      const next = state.weeks
        .filter((w) => new Date(w.startDate) > new Date(state.currentWeek!.endDate))
        .sort((a, b) => a.weekNum - b.weekNum)[0];
      return next || null;
    },
  },
});
