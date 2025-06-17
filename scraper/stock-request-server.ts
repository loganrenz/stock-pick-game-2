import express from 'express';
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

const PORT = process.env.PORT || 3000;
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
  driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  console.log('[server] Browser started');
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

app.post('/api/stock', async (req, res) => {
  const { symbol, date } = req.body;
  if (!symbol || !date) {
    res.status(400).json({ error: 'Missing symbol or date' });
    return;
  }
  const cacheKey = `${symbol}:${date}`;
  if (ohlcCache[cacheKey]) {
    res.json(ohlcCache[cacheKey]);
    return;
  }
  try {
    const ohlc = await req.app.locals.scrapeOhlc(symbol, date);
    ohlcCache[cacheKey] = ohlc;
    res.json(ohlc);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Scraping failed' });
  }
});

if (require.main === module) {
  app.listen(PORT, async () => {
    await startBrowser();
    console.log(`[server] Listening on port ${PORT}`);
  });

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
}

export { app, startBrowser, stopBrowser, scrapeOhlc }; 