console.log('[scrape-db-symbols.ts] Script loaded');
import 'dotenv/config';
import { scrapeYahooForSymbols } from './scraper';

// Hardcoded list of stock symbols from the database
const symbols = [
  'AAPL', 'TSLA', 'GOOG', 'MSFT', 'AMZN', 'META', 'NVDA', 'AMD', 'INTC', 'IBM',
  'ORCL', 'CRM', 'ADBE', 'CSCO', 'NFLX', 'DIS', 'PYPL', 'V', 'MA', 'JPM',
  'BAC', 'WFC', 'GS', 'MS', 'JNJ', 'PFE', 'MRK', 'ABBV', 'LLY', 'UNH',
  'CVS', 'WMT', 'TGT', 'COST', 'HD', 'LOW', 'NKE', 'SBUX', 'MCD', 'KO',
  'PEP', 'PG', 'JNJ', 'MMM', 'GE', 'BA', 'CAT', 'DE', 'MMM', 'HON'
];

async function main() {
  console.log('[main] Starting scraping process...');
  console.log(`[main] Found ${symbols.length} symbols to scrape`);
  console.log('[main] Symbols:', symbols);

  try {
    console.log('[main] Calling scrapeYahooForSymbols...');
    const results = await scrapeYahooForSymbols(symbols);
    console.log('[main] Raw scraping results:', JSON.stringify(results, null, 2));
    console.log('[main] Scraping completed successfully');
  } catch (error) {
    console.error('[main] Error during scraping:', error);
  }
  console.log('[main] End of main');
}

main().catch((err) => {
  console.error('[main] Uncaught error:', err);
}); 