import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FMP_API_KEY = process.env.FINANCIAL_MODELING_PREP_API_KEY;

// Validate API keys
if (!ALPHA_VANTAGE_API_KEY) {
  console.error('[PRICE-DATA] ALPHA_VANTAGE_API_KEY is not set');
}
if (!FMP_API_KEY) {
  console.error('[PRICE-DATA] FINANCIAL_MODELING_PREP_API_KEY is not set');
}

async function fetchAlphaVantage(symbol: string) {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.error('[fetchAlphaVantage] No API key available');
    return { currentPrice: null, dailyPriceData: null };
  }

  try {
    console.log(`[fetchAlphaVantage] Fetching data for ${symbol} with API key: ${ALPHA_VANTAGE_API_KEY.substring(0, 4)}...`);
    // Current price
    const quoteResp = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    const quote = quoteResp.data['Global Quote'];
    const currentPrice = quote ? parseFloat(quote['05. price']) : null;

    // Daily prices
    const dailyResp = await axios.get(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    const data = dailyResp.data['Time Series (Daily)'];
    let dailyPriceData = null;
    if (data) {
      const days = Object.keys(data).slice(0, 5);
      dailyPriceData = {};
      for (const [i, day] of days.entries()) {
        dailyPriceData[['monday','tuesday','wednesday','thursday','friday'][i]] = {
          open: parseFloat(data[day]['1. open']),
          close: parseFloat(data[day]['4. close'])
        };
      }
    }
    console.log(`[fetchAlphaVantage] Result for ${symbol}: currentPrice=${currentPrice}, dailyPriceData=${JSON.stringify(dailyPriceData)}`);
    return { currentPrice, dailyPriceData };
  } catch (error) {
    console.log(`[fetchAlphaVantage] Error for ${symbol}:`, error?.message || error);
    return { currentPrice: null, dailyPriceData: null };
  }
}

async function fetchFMP(symbol: string) {
  if (!FMP_API_KEY) {
    console.error('[fetchFMP] No API key available');
    return { currentPrice: null, dailyPriceData: null };
  }

  try {
    console.log(`[fetchFMP] Fetching data for ${symbol} with API key: ${FMP_API_KEY.substring(0, 4)}...`);
    // Current price
    const quoteResp = await axios.get(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`
    );
    const quote = quoteResp.data && quoteResp.data[0];
    const currentPrice = quote ? quote.price : null;

    // Daily prices (last 5 days)
    const dailyResp = await axios.get(
      `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=5&apikey=${FMP_API_KEY}`
    );
    const data = dailyResp.data && dailyResp.data.historical;
    let dailyPriceData = null;
    if (data && Array.isArray(data)) {
      dailyPriceData = {};
      for (const [i, day] of data.entries()) {
        dailyPriceData[['monday','tuesday','wednesday','thursday','friday'][i]] = {
          open: day.open,
          close: day.close
        };
      }
    }
    console.log(`[fetchFMP] Result for ${symbol}: currentPrice=${currentPrice}, dailyPriceData=${JSON.stringify(dailyPriceData)}`);
    return { currentPrice, dailyPriceData };
  } catch (error) {
    console.log(`[fetchFMP] Error for ${symbol}:`, error?.message || error);
    return { currentPrice: null, dailyPriceData: null };
  }
}

export async function fetchPriceData(symbol: string) {
  // Try FMP first
  let { currentPrice, dailyPriceData } = await fetchFMP(symbol);
  // Fallback to Alpha Vantage if needed
  if (!currentPrice || !dailyPriceData) {
    const av = await fetchAlphaVantage(symbol);
    if (!currentPrice) currentPrice = av.currentPrice;
    if (!dailyPriceData) dailyPriceData = av.dailyPriceData;
  }
  return { currentPrice, dailyPriceData };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const symbol = req.query.symbol as string;
  if (!symbol) {
    return res.status(400).json({ error: 'Missing symbol' });
  }

  // Try Alpha Vantage first
  let { currentPrice, dailyPriceData } = await fetchAlphaVantage(symbol);

  // Fallback to FMP if needed
  if (!currentPrice || !dailyPriceData) {
    const fmp = await fetchFMP(symbol);
    if (!currentPrice) currentPrice = fmp.currentPrice;
    if (!dailyPriceData) dailyPriceData = fmp.dailyPriceData;
  }

  if (!currentPrice && !dailyPriceData) {
    return res.status(404).json({ error: 'No price data found for symbol' });
  }

  return res.status(200).json({ symbol, currentPrice, dailyPriceData });
}

export { fetchAlphaVantage, fetchFMP }; 