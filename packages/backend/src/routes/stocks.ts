import express from 'express';
import { db } from '../lib/db';
import { stockPrices, picks } from '../lib/schema';
import { eq, inArray } from 'drizzle-orm';
import yahooFinance from 'yahoo-finance2';

// Suppress survey notice to keep logs clean
yahooFinance.suppressNotices(['yahooSurvey', 'ripHistorical']);

// Set concurrency to 1 to prevent issues with multiple simultaneous requests
yahooFinance.setGlobalConfig({ concurrency: 1 });

const router = express.Router();

// Yahoo Finance function using yahoo-finance2 library
async function getYahooFinanceQuote(symbol: string) {
  try {
    // Use the quote method with proper error handling and custom headers
    const quote = await yahooFinance.quote(symbol, {
      timeout: 10000,
      retry: {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 5000,
      },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    // Create the data object and filter out undefined values
    const priceData = {
      currentPrice: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      previousClose: quote.regularMarketPreviousClose,
      volume: quote.regularMarketVolume,
      marketCap: quote.marketCap,
      peRatio: quote.trailingPE,
      eps: quote.trailingEps,
      dividendYield: quote.dividendYield,
      beta: quote.beta,
      lastUpdated: new Date().toISOString(),
    };

    // Filter out undefined values to prevent database errors
    const filteredData = Object.fromEntries(
      Object.entries(priceData).filter(([_, value]) => value !== undefined),
    );

    // Ensure we have at least the essential data
    if (!filteredData.currentPrice) {
      throw new Error(`No current price available for ${symbol}`);
    }

    return filteredData;
  } catch (error) {
    console.error(`Error getting Yahoo Finance quote for ${symbol}:`, error);
    throw error;
  }
}

// Yahoo Finance function to get historical data using chart method
async function getYahooFinanceHistorical(
  symbol: string,
  startDate: Date,
  endDate: Date = new Date(),
) {
  try {
    const chart = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
      timeout: 10000,
      retry: {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 5000,
      },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    // Log the full chart object for debugging
    console.log('Chart response for', symbol, JSON.stringify(chart, null, 2));

    // Transform the data into the format we need
    const dailyData: Record<string, { open: number; close: number }> = {};

    if (chart.quotes && Array.isArray(chart.quotes)) {
      chart.quotes.forEach((day) => {
        if (!day.date) {
          console.warn(`Skipping missing date for ${symbol}:`, day);
          return;
        }
        const date = new Date(day.date);
        if (isNaN(date.getTime())) {
          console.warn(`Skipping invalid date for ${symbol}:`, day);
          return;
        }
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        dailyData[dateKey] = {
          open: day.open,
          close: day.close,
        };
      });
    } else {
      console.warn(`No quotes array found in chart for ${symbol}`);
    }

    return dailyData;
  } catch (error) {
    console.error(`Error getting Yahoo Finance chart data for ${symbol}:`, error);
    throw error;
  }
}

// Function to get historical data in 30-day chunks
async function getYahooFinanceHistoricalChunked(
  symbol: string,
  startDate: Date,
  endDate: Date = new Date(),
) {
  const allData: Record<string, { open: number; close: number }> = {};
  const chunkSize = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  let currentStart = new Date(startDate);

  while (currentStart < endDate) {
    const currentEnd = new Date(Math.min(currentStart.getTime() + chunkSize, endDate.getTime()));

    console.log(
      `Fetching ${symbol} from ${currentStart.toISOString()} to ${currentEnd.toISOString()}`,
    );

    try {
      const chunkData = await getYahooFinanceHistorical(symbol, currentStart, currentEnd);

      // Merge the data
      Object.assign(allData, chunkData);

      // Move to next chunk
      currentStart = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000); // Add 1 day

      // Add delay between chunks
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching chunk for ${symbol}:`, error);
      // Continue with next chunk
      currentStart = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  return allData;
}

// Update prices for all active picks
router.post('/update-prices', async (req, res) => {
  try {
    // Get all unique symbols from active picks
    const activePicks = await db.select({ symbol: picks.symbol }).from(picks);
    const symbols = [...new Set(activePicks.map((pick) => pick.symbol))];

    let updated = 0;
    let failed = 0;

    for (const symbol of symbols) {
      try {
        const priceData = await getYahooFinanceQuote(symbol);

        // Update or insert stock price
        await db
          .insert(stockPrices)
          .values({
            symbol,
            ...priceData,
          })
          .onConflictDoUpdate({
            target: stockPrices.symbol,
            set: {
              ...priceData,
            },
          });

        // Update picks with current value and return percentage
        const allPicksForSymbol = await db.select().from(picks).where(eq(picks.symbol, symbol));

        for (const pick of allPicksForSymbol) {
          const returnPercentage =
            ((priceData.currentPrice - pick.entryPrice) / pick.entryPrice) * 100;

          await db
            .update(picks)
            .set({
              currentValue: priceData.currentPrice,
              returnPercentage: returnPercentage,
            })
            .where(eq(picks.id, pick.id));
        }

        updated++;

        // Add a small delay between requests to be respectful to Yahoo's servers
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Failed to update price for ${symbol}:`, error);
        failed++;
      }
    }

    res.json({ updated, failed, total: symbols.length });
  } catch (error) {
    console.error('Error updating prices:', error);
    res.status(500).json({ error: 'Failed to update prices' });
  }
});

// Refresh price for a specific symbol
router.post('/refresh-price', async (req, res) => {
  try {
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const priceData = await getYahooFinanceQuote(symbol);

    // Update or insert stock price
    await db
      .insert(stockPrices)
      .values({
        symbol,
        ...priceData,
      })
      .onConflictDoUpdate({
        target: stockPrices.symbol,
        set: {
          ...priceData,
        },
      });

    // Update picks with current value and return percentage
    const allPicksForSymbol = await db.select().from(picks).where(eq(picks.symbol, symbol));

    for (const pick of allPicksForSymbol) {
      const returnPercentage = ((priceData.currentPrice - pick.entryPrice) / pick.entryPrice) * 100;

      await db
        .update(picks)
        .set({
          currentValue: priceData.currentPrice,
          returnPercentage: returnPercentage,
        })
        .where(eq(picks.id, pick.id));
    }

    res.json(priceData);
  } catch (error) {
    console.error(`Error refreshing price for ${symbol}:`, error);
    res.status(500).json({ error: 'Failed to refresh price' });
  }
});

// Get stock details
router.get('/stock-details', async (req, res) => {
  try {
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const stock = await db
      .select()
      .from(stockPrices)
      .where(eq(stockPrices.symbol, symbol as string));

    if (stock.length === 0) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.json(stock[0]);
  } catch (error) {
    console.error('Error getting stock details:', error);
    res.status(500).json({ error: 'Failed to get stock details' });
  }
});

// Get all stocks
router.get('/', async (req, res) => {
  try {
    const stocks = await db.select().from(stockPrices);
    res.json(stocks);
  } catch (error) {
    console.error('Error getting stocks:', error);
    res.status(500).json({ error: 'Failed to get stocks' });
  }
});

// Update historical data for all stock picks
router.post('/update-historical', async (req, res) => {
  try {
    // Get all unique symbols from picks with their creation dates
    const picksWithDates = await db
      .select({
        symbol: picks.symbol,
        createdAt: picks.createdAt,
      })
      .from(picks)
      .orderBy(picks.createdAt);

    const symbols = [...new Set(picksWithDates.map((pick) => pick.symbol))];

    let updated = 0;
    let failed = 0;

    for (const symbol of symbols) {
      try {
        // For each symbol, use the earliest pick date as the start
        const symbolPicks = picksWithDates.filter((pick) => pick.symbol === symbol);
        const earliestDate = new Date(
          Math.min(...symbolPicks.map((pick) => new Date(pick.createdAt).getTime())),
        );
        const endDate = new Date();

        console.log(
          `Fetching historical data for ${symbol} from ${earliestDate.toISOString()} to ${endDate.toISOString()}`,
        );

        const historicalData = await getYahooFinanceHistoricalChunked(
          symbol,
          earliestDate,
          endDate,
        );

        // Update the stock_prices table with historical data
        await db
          .insert(stockPrices)
          .values({
            symbol,
            dailyPriceData: JSON.stringify(historicalData),
            lastUpdated: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: stockPrices.symbol,
            set: {
              dailyPriceData: JSON.stringify(historicalData),
              lastUpdated: new Date().toISOString(),
            },
          });

        updated++;

        // Add a delay between symbols to be respectful to Yahoo's servers
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to update historical data for ${symbol}:`, error);
        failed++;
      }
    }

    res.json({
      updated,
      failed,
      total: symbols.length,
      message: `Updated historical data for ${updated} symbols, failed for ${failed} symbols`,
    });
  } catch (error) {
    console.error('Error updating historical data:', error);
    res.status(500).json({ error: 'Failed to update historical data' });
  }
});

// Test historical data for a single symbol
router.post('/test-historical', async (req, res) => {
  try {
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    // Test with a recent date range
    const startDate = new Date('2025-01-01');
    const endDate = new Date();

    console.log(
      `Testing historical data for ${symbol} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const historicalData = await getYahooFinanceHistorical(symbol, startDate, endDate);

    res.json({
      symbol,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      data: historicalData,
      dataLength: Object.keys(historicalData).length,
    });
  } catch (error) {
    console.error('Error testing historical data:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
