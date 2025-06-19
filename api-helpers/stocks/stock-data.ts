import axios from 'axios';
import { db } from '../lib/db.js';
import { stockPrices } from '../lib/schema.js';
import { eq } from 'drizzle-orm';

const STOCK_DATA_SERVER_URL = 'http://localhost:3000';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

interface StockData {
  symbol: string;
  currentPrice: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  marketCap: number | null;
  peRatio: number | null;
  eps: number | null;
  dividendYield: number | null;
  beta: number | null;
  dailyPriceData: Record<string, { open: number; close: number }> | null;
  lastUpdated?: string;
}

interface DailyPriceData {
  [key: string]: {
    open: number;
    close: number;
  };
}

interface AdditionalData {
  marketCap?: number;
  MarketCapitalization?: number;
  peRatio?: number;
  PERatio?: number;
  eps?: number;
  EPS?: number;
  dividendYield?: number;
  DividendYield?: number;
  beta?: number;
  Beta?: number;
}

/**
 * Get stock data from cache or fetch from API
 */
export async function getStockData(
  symbol: string,
  forceRefresh = false,
): Promise<StockData | null> {
  try {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await getCachedStockData(symbol);
      if (cached && isCacheValid(cached.lastUpdated)) {
        return cached;
      }
    }

    // Fetch fresh data from API
    const freshData = await fetchStockDataFromAPI(symbol);
    if (freshData) {
      // Update cache
      await updateStockDataCache(symbol, freshData);
      return freshData;
    }

    return null;
  } catch (error) {
    console.error(`[STOCK-DATA] Error getting stock data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get stock data for multiple symbols efficiently
 */
export async function getMultipleStockData(
  symbols: string[],
): Promise<Record<string, StockData | null>> {
  const results: Record<string, StockData | null> = {};

  // Check cache for all symbols first
  const cachePromises = symbols.map(async (symbol) => {
    const cached = await getCachedStockData(symbol);
    return { symbol, cached };
  });

  const cacheResults = await Promise.all(cachePromises);
  const symbolsToFetch: string[] = [];

  // Determine which symbols need fresh data
  for (const { symbol, cached } of cacheResults) {
    if (cached && isCacheValid(cached.lastUpdated)) {
      results[symbol] = cached;
    } else {
      symbolsToFetch.push(symbol);
      results[symbol] = null;
    }
  }

  // Fetch fresh data for symbols that need it
  if (symbolsToFetch.length > 0) {
    const fetchPromises = symbolsToFetch.map(async (symbol) => {
      const freshData = await fetchStockDataFromAPI(symbol);
      if (freshData) {
        await updateStockDataCache(symbol, freshData);
        results[symbol] = freshData;
      }
    });

    await Promise.all(fetchPromises);
  }

  return results;
}

/**
 * Get cached stock data from database
 */
async function getCachedStockData(symbol: string): Promise<StockData | null> {
  try {
    const cached = await db.query.stockPrices.findFirst({
      where: eq(stockPrices.symbol, symbol.toUpperCase()),
    });

    if (!cached) return null;

    return {
      symbol: cached.symbol,
      currentPrice: cached.currentPrice,
      previousClose: cached.previousClose,
      change: cached.change,
      changePercent: cached.changePercent,
      volume: cached.volume,
      marketCap: cached.marketCap,
      peRatio: cached.peRatio,
      eps: cached.eps,
      dividendYield: cached.dividendYield,
      beta: cached.beta,
      dailyPriceData: cached.dailyPriceData ? JSON.parse(cached.dailyPriceData) : null,
      lastUpdated: cached.lastUpdated,
    };
  } catch (error) {
    console.error(`[STOCK-DATA] Error getting cached data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Check if cache is still valid
 */
function isCacheValid(lastUpdated: string): boolean {
  const lastUpdateTime = new Date(lastUpdated).getTime();
  const now = Date.now();
  return now - lastUpdateTime < CACHE_DURATION;
}

/**
 * Fetch stock data from the external API
 */
async function fetchStockDataFromAPI(symbol: string): Promise<StockData | null> {
  try {
    console.log(`[STOCK-DATA] Fetching fresh data for ${symbol}`);

    // Get current price and quote data
    const [priceResp, quoteResp] = await Promise.all([
      axios.get(`${STOCK_DATA_SERVER_URL}/api/price/${symbol}`),
      axios.get(`${STOCK_DATA_SERVER_URL}/api/quote/${symbol}`),
    ]);

    const priceData = priceResp.data;
    const quoteData = quoteResp.data;

    if (!priceData && !quoteData) {
      console.warn(`[STOCK-DATA] No data received for ${symbol}`);
      return null;
    }

    // Get historical data for daily prices
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let dailyPriceData: DailyPriceData | null = null;
    try {
      const historicalResp = await axios.get(
        `${STOCK_DATA_SERVER_URL}/api/historical/${symbol}?start=${startDate}&end=${endDate}`,
      );
      const historicalData = historicalResp.data;

      if (historicalData && Array.isArray(historicalData) && historicalData.length > 0) {
        const last5Days = historicalData.slice(-5);
        dailyPriceData = {};
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

        for (let i = 0; i < Math.min(last5Days.length, 5); i++) {
          const day = last5Days[i];
          dailyPriceData[dayNames[i]] = {
            open: parseFloat(day.open),
            close: parseFloat(day.close),
          };
        }
      }
    } catch (historicalError) {
      console.warn(`[STOCK-DATA] Failed to fetch historical data for ${symbol}:`, historicalError);
    }

    // Get additional details from stock summary
    let additionalData: AdditionalData = {};
    try {
      const summaryResp = await axios.post(`${STOCK_DATA_SERVER_URL}/api/stock-summary`, {
        symbol: symbol,
      });
      additionalData = summaryResp.data || {};
    } catch (summaryError) {
      console.warn(`[STOCK-DATA] Failed to fetch summary for ${symbol}:`, summaryError);
    }

    const stockData: StockData = {
      symbol: symbol.toUpperCase(),
      currentPrice: priceData?.price || quoteData?.price || quoteData?.close || null,
      previousClose: quoteData?.previousClose || null,
      change: quoteData?.change || null,
      changePercent: quoteData?.changePercent || null,
      volume: quoteData?.volume || null,
      marketCap: additionalData?.marketCap || additionalData?.MarketCapitalization || null,
      peRatio: additionalData?.peRatio || additionalData?.PERatio || null,
      eps: additionalData?.eps || additionalData?.EPS || null,
      dividendYield: additionalData?.dividendYield || additionalData?.DividendYield || null,
      beta: additionalData?.beta || additionalData?.Beta || null,
      dailyPriceData,
    };

    console.log(`[STOCK-DATA] Successfully fetched data for ${symbol}`);
    return stockData;
  } catch (error) {
    console.error(`[STOCK-DATA] Error fetching data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Update stock data cache in database
 */
async function updateStockDataCache(symbol: string, data: StockData): Promise<void> {
  try {
    const updateData = {
      symbol: data.symbol,
      currentPrice: data.currentPrice,
      previousClose: data.previousClose,
      change: data.change,
      changePercent: data.changePercent,
      volume: data.volume,
      marketCap: data.marketCap,
      peRatio: data.peRatio,
      eps: data.eps,
      dividendYield: data.dividendYield,
      beta: data.beta,
      dailyPriceData: data.dailyPriceData ? JSON.stringify(data.dailyPriceData) : null,
      lastUpdated: new Date().toISOString(),
    };

    // Use upsert to insert or update
    await db.insert(stockPrices).values(updateData).onConflictDoUpdate({
      target: stockPrices.symbol,
      set: updateData,
    });

    console.log(`[STOCK-DATA] Updated cache for ${symbol}`);
  } catch (error) {
    console.error(`[STOCK-DATA] Error updating cache for ${symbol}:`, error);
  }
}

/**
 * Search for stocks by company name
 */
export async function searchStocks(query: string): Promise<
  Array<{
    symbol: string;
    name: string;
    type: string;
    region: string;
    currency: string;
  }>
> {
  try {
    const response = await axios.get(`${STOCK_DATA_SERVER_URL}/api/search/${query}`);

    if (response.data && Array.isArray(response.data)) {
      return response.data.map((match: any) => ({
        symbol: match.symbol || match.Symbol,
        name: match.name || match.Name,
        type: match.type || match.Type,
        region: match.region || match.Region,
        currency: match.currency || match.Currency,
      }));
    }

    return [];
  } catch (error) {
    console.error(`[STOCK-DATA] Error searching stocks for "${query}":`, error);
    return [];
  }
}

/**
 * Get current price for a symbol (lightweight version)
 */
export async function getCurrentPrice(symbol: string): Promise<number | null> {
  const stockData = await getStockData(symbol);
  return stockData?.currentPrice || null;
}

/**
 * Get daily price data for a symbol
 */
export async function getDailyPriceData(symbol: string): Promise<DailyPriceData | null> {
  const stockData = await getStockData(symbol);
  return stockData?.dailyPriceData || null;
}
