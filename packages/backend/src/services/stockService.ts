import yahooFinance from 'yahoo-finance2';

/**
 * Fetches the current price for a given stock symbol.
 * @param symbol The stock symbol to fetch the price for.
 * @returns The current market price, or null if an error occurs.
 */
export async function getPrice(symbol: string): Promise<number | null> {
  try {
    const quote = await yahooFinance.quote(symbol, {
      fields: ['regularMarketPrice'],
    });

    if (quote && typeof quote.regularMarketPrice === 'number') {
      return quote.regularMarketPrice;
    }

    console.warn(`Could not retrieve a valid price for ${symbol}. Quote received:`, quote);
    return null;
  } catch (error: any) {
    console.error(`Error fetching price for ${symbol} from yahoo-finance2:`, error.message);
    return null;
  }
}
