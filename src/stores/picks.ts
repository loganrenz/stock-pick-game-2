import { defineStore } from 'pinia'
import axios from '../utils/axios'

interface Pick {
  id: string
  userId: string
  weekId: string
  symbol: string
  price: number
  createdAt: string
  updatedAt: string
}

interface Week {
  id: string
  startDate: string
  endDate: string
  status: 'open' | 'closed'
  winnerId: string | null
  picks: Pick[]
}

interface PicksState {
  currentWeek: Week | null
  userPicks: Pick[]
  loading: boolean
  error: string | null
}

export const usePicksStore = defineStore('picks', {
  state: (): PicksState => ({
    currentWeek: null,
    userPicks: [],
    loading: false,
    error: null
  }),

  getters: {
    hasPicked: (state) => (symbol: string) => {
      return state.userPicks.some(pick => pick.symbol === symbol)
    }
  },

  actions: {
    async fetchCurrentWeek() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/weeks/current')
        this.currentWeek = response.data
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch current week'
      } finally {
        this.loading = false
      }
    },

    async fetchUserPicks() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/picks')
        this.userPicks = response.data
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch user picks'
      } finally {
        this.loading = false
      }
    },

    async makePick(symbol: string, price: number) {
      if (!this.currentWeek) {
        throw new Error('No active week found')
      }

      try {
        const response = await axios.post('/api/picks', {
          weekId: this.currentWeek.id,
          symbol,
          price
        })
        this.userPicks.push(response.data)
      } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to make pick')
      }
    }
  }
}) 