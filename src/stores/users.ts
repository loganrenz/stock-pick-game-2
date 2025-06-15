import { defineStore } from 'pinia'
import axios from '../utils/axios'

interface User {
  id: string
  username: string
  email: string
  wins: number
  createdAt: string
  updatedAt: string
}

interface UserState {
  users: User[]
  loading: boolean
  error: string | null
}

export const useUsersStore = defineStore('users', {
  state: (): UserState => ({
    users: [],
    loading: false,
    error: null
  }),

  getters: {
    getUserById: (state) => (id: string) => {
      return state.users.find(user => user.id === id)
    },
    getLeaderboard: (state) => {
      return [...state.users].sort((a, b) => b.wins - a.wins)
    }
  },

  actions: {
    async fetchUsers() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/users')
        this.users = response.data
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch users'
      } finally {
        this.loading = false
      }
    },

    async fetchUser(id: string) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`/api/users/${id}`)
        const index = this.users.findIndex(user => user.id === id)
        if (index !== -1) {
          this.users[index] = response.data
        } else {
          this.users.push(response.data)
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch user'
      } finally {
        this.loading = false
      }
    }
  }
}) 