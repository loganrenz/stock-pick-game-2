import express from 'express';
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import { parse, format, isValid } from 'date-fns';

const PORT = process.env.PORT || 3456;
const app = express();
app.use(express.json());

let driver: WebDriver | null = null;

// In-memory cache for OHLC data
export type OhlcValue = {
  symbol: string;
  date: string;
  open: string;
  high: string;
  low: string;
  close: string;
  adjClose: string;
  volume: string;
};
type OhlcKey = string; // e.g. "AAPL:2025-06-16"
const ohlcCache: Record<OhlcKey, OhlcValue> = {};

async function startBrowser() {
  const options = new chrome.Options();
  options.addArguments('--headless');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=1920,1080');
  try {
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    console.log('[server] Browser started');
  } catch (err) {
    console.error('[server] Failed to start browser:', err);
    driver = null;
    throw err;
  }
}

async function stopBrowser() {
  if (driver) {
    await driver.quit();
    driver = null;
    console.log('[server] Browser stopped');
  }
}

async function scrapeOhlc(symbol: string, date: string): Promise<OhlcValue> {
  if (!driver) throw new Error('Browser not started');
  const url = `https://finance.yahoo.com/quote/${symbol}/history`;
  await driver.get(url);
  await driver.wait(until.elementLocated(By.css('body')), 20000);
  const tables = await driver.findElements(By.css('table'));
  let targetTable: any = null;
  const expectedHeaders = ["Date", "Open", "High", "Low", "Close", "Adj Close", "Volume"];
  for (const table of tables) {
    try {
      const thead = await table.findElement(By.css('thead'));
      const headerCells = await thead.findElements(By.css('tr th'));
      const headers: string[] = [];
      for (const cell of headerCells) {
        const text = (await cell.getText()).trim();
        headers.push(text);
      }
      if (headers.length === expectedHeaders.length && headers.every((h, i) => h === expectedHeaders[i])) {
        targetTable = table;
        break;
      }
    } catch (e) { continue; }
  }
  if (!targetTable) throw new Error('Could not find historical prices table');
  const tbody = await targetTable.findElement(By.css('tbody'));
  const rows = await tbody.findElements(By.css('tr'));
  for (const row of rows as any[]) {
    const tds = await row.findElements(By.css('td'));
    if (tds.length < 7) continue;
    const [dateText, open, high, low, close, adjClose, volume] = await Promise.all(tds.map((td: any) => td.getText()));
    // Try to match the requested date (format: 'YYYY-MM-DD')
    const parsedDate = new Date(dateText);
    const formattedDate = parsedDate.toISOString().split('T')[0];
    if (formattedDate === date) {
      return { symbol, date: formattedDate, open, high, low, close, adjClose, volume };
    }
  }
  throw new Error(`No data found for ${symbol} on ${date}`);
}

app.locals.scrapeOhlc = scrapeOhlc;

function robustNormalizeDate(dateStr: string): string {
  if (!dateStr) return dateStr;
  const formats = [
    'yyyy-MM-dd',
    'yyyy/MM/dd',
    'MM/dd/yyyy',
    'M/d/yyyy',
    'MM-dd-yyyy',
    'M-d-yyyy'
  ];
  for (const fmt of formats) {
    try {
      const parsed = parse(dateStr, fmt, new Date());
      if (isValid(parsed)) {
        return format(parsed, 'yyyy-MM-dd');
      }
    } catch {}
  }
  // fallback to Date constructor
  const parsed = new Date(dateStr);
  if (isValid(parsed)) {
    return format(parsed, 'yyyy-MM-dd');
  }
  return dateStr;
}

app.post('/api/stock', async (req, res) => {
  const { symbol, date } = req.body;
  console.log(`[api/stock] Incoming request: symbol=${symbol}, date=${date}`);
  const normalizedDate = robustNormalizeDate(date);
  if (!symbol || !normalizedDate) {
    console.log('[api/stock] Missing symbol or date');
    res.status(400).json({ error: 'Missing symbol or date' });
    return;
  }
  const cacheKey = `${symbol}:${normalizedDate}`;
  if (ohlcCache[cacheKey]) {
    console.log(`[api/stock] Cache hit for ${cacheKey}`);
    res.json(ohlcCache[cacheKey]);
    return;
  }
  try {
    const ohlc = await req.app.locals.scrapeOhlc(symbol, normalizedDate);
    ohlcCache[cacheKey] = ohlc;
    console.log(`[api/stock] Scraped and returning data for ${cacheKey}:`, ohlc);
    res.json(ohlc);
  } catch (err: any) {
    console.error(`[api/stock] Error for ${cacheKey}:`, err.message || err);
    res.status(500).json({ error: err.message || 'Scraping failed' });
  }
});

if (require.main === module) {
  (async () => {
    try {
      await startBrowser();
      app.listen(PORT, () => {
        console.log(`[server] Listening on port ${PORT}`);
      });
      // Keep the process alive
      setInterval(() => {}, 1000);
    } catch (err) {
      console.error('[server] Fatal error during startup:', err);
      process.exit(1);
    }
  })();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('[server] Shutting down...');
    await stopBrowser();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    console.log('[server] Shutting down...');
    await stopBrowser();
    process.exit(0);
  });
  process.on('exit', async () => {
    console.log('[server] Process exit detected, cleaning up browser...');
    await stopBrowser();
  });
}

export { app, startBrowser, stopBrowser, scrapeOhlc }; 