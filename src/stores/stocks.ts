import { defineStore } from 'pinia'
import axios from '../utils/axios'

interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

interface StockState {
  stocks: Stock[]
  loading: boolean
  error: string | null
}

export const useStockStore = defineStore('stocks', {
  state: (): StockState => ({
    stocks: [],
    loading: false,
    error: null
  }),

  getters: {
    getStockBySymbol: (state) => (symbol: string) => {
      return state.stocks.find(stock => stock.symbol === symbol)
    }
  },

  actions: {
    async fetchStocks() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/stocks')
        this.stocks = response.data
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch stocks'
      } finally {
        this.loading = false
      }
    },

    async fetchStockPrice(symbol: string) {
      try {
        const response = await axios.get(`/api/stocks/stock-details?symbol=${symbol}`)
        const stock = this.stocks.find(s => s.symbol === symbol)
        if (stock) {
          stock.price = response.data.price
          stock.change = response.data.change
          stock.changePercent = response.data.changePercent
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error)
      }
    }
  }
}) 