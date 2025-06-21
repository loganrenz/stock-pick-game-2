import { Router } from 'express';
import yahooFinance from 'yahoo-finance2';
import { db } from '../lib/db.js';
import { stockPrices } from '../lib/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getPrice } from '../services/stockService.js';

const router = Router();

// GET /api/stocks/:symbol - Get current quote for a symbol
router.get('/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const quote = await yahooFinance.quote(symbol, {
      fields: [
        'symbol',
        'regularMarketPrice',
        'regularMarketChange',
        'regularMarketChangePercent',
        'marketState',
        'shortName',
        'longName',
        'regularMarketPreviousClose',
      ],
    });
    if (!quote) return res.status(404).json({ error: 'Stock not found' });
    res.json(quote);
  } catch (error: any) {
    console.error(`Error fetching quote for ${symbol}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// GET /api/stocks/history/:symbol - Get historical data for a symbol
router.get('/history/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { period1, interval = '1d' } = req.query;

  if (!period1) return res.status(400).json({ error: 'A start date (period1) is required' });

  try {
    const chart = await yahooFinance.chart(symbol, {
      period1: period1 as string,
      interval: interval as '1d' | '1wk' | '1mo',
    });

    if (!chart || chart.quotes.length === 0) {
      return res.status(404).json({ error: `No historical data found for ${symbol}` });
    }

    res.json(chart);
  } catch (error: any) {
    console.error(`Error fetching historical data for ${symbol}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// POST /api/stocks/refresh/:symbol - Force a refresh of a single stock's price
router.post('/refresh/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const price = await getPrice(symbol);
    if (price === null) {
      return res.status(404).json({ error: `Could not fetch price for ${symbol}` });
    }

    await db
      .insert(stockPrices)
      .values({ symbol, currentPrice: price, lastUpdated: new Date().toISOString() })
      .onConflictDoUpdate({
        target: stockPrices.symbol,
        set: { currentPrice: price, lastUpdated: new Date().toISOString() },
      });

    const updatedStock = await db.query.stockPrices.findFirst({
      where: eq(stockPrices.symbol, symbol),
    });
    res.status(200).json(updatedStock);
  } catch (error: any) {
    console.error(`Error refreshing price for ${symbol}:`, error.message);
    res.status(500).json({ error: 'Failed to refresh stock price' });
  }
});

// GET /api/stocks - Get all stocks from our database
router.get('/', async (req, res) => {
  try {
    const allStocks = await db.query.stockPrices.findMany();
    res.json(allStocks);
  } catch (error: any) {
    console.error('Error fetching all stocks:', error.message);
    res.status(500).json({ error: 'Failed to fetch stocks from database' });
  }
});

export default router;
