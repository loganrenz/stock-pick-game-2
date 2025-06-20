import { defineStore } from 'pinia';
import api from '../utils/axios.js';

interface Stock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  lastUpdated: string;
}

interface StocksState {
  stocks: Stock[];
  loading: boolean;
  error: string | null;
}

export const useStocksStore = defineStore('stocks', {
  state: (): StocksState => ({
    stocks: [],
    loading: false,
    error: null,
  }),

  getters: {
    getStockBySymbol: (state) => (symbol: string) => {
      return state.stocks.find((stock) => stock.symbol === symbol);
    },
  },

  actions: {
    async fetchStocks() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/stocks');
        this.stocks = response.data;
      } catch (error) {
        console.error('Failed to fetch stocks:', error);
        this.error = 'Failed to fetch stocks';
      } finally {
        this.loading = false;
      }
    },

    async fetchStockPrice(symbol: string) {
      try {
        const response = await api.get(`/stocks/stock-details?symbol=${symbol}`);
        const stock = this.stocks.find((s) => s.symbol === symbol);
        if (stock) {
          Object.assign(stock, response.data);
        }
        return response.data;
      } catch (error) {
        console.error('Failed to fetch stock price:', error);
        throw error;
      }
    },
  },
});
