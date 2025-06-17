import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FMP_API_KEY = process.env.FINANCIAL_MODELING_PREP_API_KEY;

async function fetchAlphaVantage(symbol: string) {
  try {
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
    return { currentPrice, dailyPriceData };
  } catch (error) {
    return { currentPrice: null, dailyPriceData: null };
  }
}

async function fetchFMP(symbol: string) {
  try {
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
    return { currentPrice, dailyPriceData };
  } catch (error) {
    return { currentPrice: null, dailyPriceData: null };
  }
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