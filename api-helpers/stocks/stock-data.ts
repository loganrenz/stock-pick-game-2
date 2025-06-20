import axios from 'axios';
import { db } from '../lib/db.js';
import { stockPrices } from '../lib/schema.js';
import { eq } from 'drizzle-orm';
import { isPriceChangeRealistic } from '../lib/price-utils.js';

const STOCK_DATA_SERVER_URLS: string[] = [
  process.env.STOCK_DATA_SERVER_URL || 'https://stock-data-server.fly.dev',
];
if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development') {
  ///STOCK_DATA_SERVER_URLS.unshift('http://localhost:7788');
}

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Helper function to make requests with fallback URLs
 */
async function makeRequestWithFallback(
  path: string,
  config: import('axios').AxiosRequestConfig = {},
) {
  let lastError: any;
  for (const baseUrl of STOCK_DATA_SERVER_URLS) {
    const url = `${baseUrl}${path}`;
    try {
      const response = await axios({ ...config, url });
      console.log(`[STOCK-DATA] Request to ${url} successful.`);
      return response;
    } catch (error) {
      const e = error as any;
      console.warn(`[STOCK-DATA] Request to ${url} failed: ${e.message}`);
      lastError = error;
    }
  }
  console.error(`[STOCK-DATA] All request attempts failed for path ${path}.`);
  if (lastError) {
    throw lastError;
  }
  throw new Error(`All request attempts failed for path ${path}`);
}

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
export async function getStockData(symbol: string): Promise<StockData | null> {
  const upperSymbol = symbol.toUpperCase();
  try {
    const cached = await getCachedStockData(upperSymbol);
    if (cached?.lastUpdated && isCacheValid(cached.lastUpdated)) {
      console.log(`[STOCK-DATA] Using valid cache for ${upperSymbol}`);
      return cached;
    }

    if (cached) {
      console.log(`[STOCK-DATA] Cache for ${upperSymbol} is stale, fetching fresh data.`);
    } else {
      console.log(`[STOCK-DATA] No cache for ${upperSymbol}, fetching fresh data.`);
    }

    // Fetch fresh data from API
    const freshData = await fetchStockDataFromAPI(upperSymbol);
    if (freshData) {
      // Update cache
      await updateStockDataCache(upperSymbol, freshData);
      return freshData;
    }

    // If fetching fails, return stale data if it exists, otherwise null
    if (cached) {
      console.warn(`[STOCK-DATA] Fetch failed for ${upperSymbol}, returning stale data.`);
      return cached;
    }

    return null;
  } catch (error) {
    console.error(`[STOCK-DATA] Error getting stock data for ${upperSymbol}:`, error);
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
    if (cached?.lastUpdated && isCacheValid(cached.lastUpdated)) {
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
      where: eq(stockPrices.symbol, symbol),
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
    console.log(`[STOCK-DATA] Fetching fresh data for ${symbol} from API...`);
    const response = await makeRequestWithFallback(`/api/price/${symbol}`);
    console.log(`[STOCK-DATA] Raw response for ${symbol}:`, JSON.stringify(response.data, null, 2));

    if (!response.data || typeof response.data !== 'object') {
      console.error(`[STOCK-DATA] Invalid response data for ${symbol}:`, response.data);
      return null;
    }

    // Get historical data for daily prices
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let dailyPriceData: DailyPriceData | null = null;
    try {
      const historicalResp = await makeRequestWithFallback(
        `/api/historical/${symbol}?start=${startDate}&end=${endDate}`,
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
      const summaryResp = await makeRequestWithFallback(`/api/stock-summary`, {
        method: 'POST',
        data: {
          symbol: symbol,
        },
      });
      additionalData = summaryResp.data || {};
    } catch (summaryError) {
      console.warn(`[STOCK-DATA] Failed to fetch summary for ${symbol}:`, summaryError);
    }

    const stockData: StockData = {
      symbol: symbol,
      currentPrice: response.data.price || response.data.close || null,
      previousClose: response.data.previousClose || null,
      change: response.data.change || null,
      changePercent: response.data.changePercent || null,
      volume: response.data.volume || null,
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
    console.log(
      `[STOCK-DATA] Updating cache for ${symbol} with data:`,
      JSON.stringify(data, null, 2),
    );
    const existing = await db.query.stockPrices.findFirst({
      where: eq(stockPrices.symbol, symbol),
    });

    // Sanity check for price change
    if (!isPriceChangeRealistic(data.changePercent)) {
      console.warn(`[STOCK-DATA] Unrealistic price change for ${symbol}. Discarding update.`);
      return; // Skip the update completely
    }

    let marketCapValue: number | null = null;
    if (typeof data.marketCap === 'string') {
      const marketCapStr = data.marketCap as string;
      const value = parseFloat(marketCapStr.replace(/,/g, ''));
      const multiplier = marketCapStr.toUpperCase().includes('B')
        ? 1000000000
        : marketCapStr.toUpperCase().includes('M')
          ? 1000000
          : 1;
      marketCapValue = isNaN(value) ? null : value * multiplier;
    } else if (typeof data.marketCap === 'number') {
      marketCapValue = data.marketCap;
    }

    const updateData = {
      symbol: data.symbol,
      currentPrice: data.currentPrice,
      previousClose: data.previousClose,
      change: data.change,
      changePercent: data.changePercent,
      volume: data.volume,
      marketCap: marketCapValue,
      peRatio: data.peRatio,
      eps: data.eps,
      dividendYield: data.dividendYield,
      beta: data.beta,
      dailyPriceData: data.dailyPriceData ? JSON.stringify(data.dailyPriceData) : null,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`[STOCK-DATA] Preparing to update cache for ${symbol} with data:`, updateData);

    // Use upsert to insert or update
    await db.insert(stockPrices).values(updateData).onConflictDoUpdate({
      target: stockPrices.symbol,
      set: updateData,
    });

    console.log(`[STOCK-DATA] Successfully updated cache for ${symbol}`);
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
    const response = await makeRequestWithFallback(`/api/search/${query}`);

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

/**
 * Get historical data for a specific date range
 */
export async function getHistoricalData(
  symbol: string,
  startDate: string,
  endDate: string,
): Promise<DailyPriceData | null> {
  try {
    const path = `/api/historical/${symbol}?start=${startDate}&end=${endDate}`;
    const historicalResp = await makeRequestWithFallback(path);
    const historicalData = historicalResp.data;

    if (historicalData && Array.isArray(historicalData) && historicalData.length > 0) {
      const dailyPriceData: DailyPriceData = {};
      for (const day of historicalData) {
        const date = new Date(day.date).toISOString().split('T')[0];
        dailyPriceData[date] = {
          open: parseFloat(day.open),
          close: parseFloat(day.close),
        };
      }
      return dailyPriceData;
    }
    return null;
  } catch (error) {
    console.error(`[STOCK-DATA] Failed to fetch historical data for ${symbol}:`, error);
    return null;
  }
}
