import fs from 'fs';
import path from 'path';
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

// Helper to parse date to Yahoo format (YYYY-MM-DD)
function toYahooDate(date: string): string {
  return new Date(date).toISOString().split('T')[0];
}

// Scrape all daily prices for a symbol in a date range
async function scrapeHistoricalPrices(driver: WebDriver, symbol: string, startDate: string, endDate: string) {
  const url = `https://finance.yahoo.com/quote/${symbol}/history?period1=${Math.floor(new Date(startDate).getTime()/1000)}&period2=${Math.floor(new Date(endDate).getTime()/1000)}&interval=1d&filter=history&frequency=1d`;
  console.log(`[scrapeHistoricalPrices] Navigating to ${url}`);
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
  if (!targetTable) return [];
  const tbody = await targetTable.findElement(By.css('tbody'));
  const rows = await tbody.findElements(By.css('tr'));
  const prices = [];
  for (const row of rows as any[]) {
    const tds = await row.findElements(By.css('td'));
    if (tds.length < 7) continue;
    const [date, open, high, low, close, adjClose, volume] = await Promise.all(tds.map((td: any) => td.getText()));
    prices.push({ date, open, high, low, close, adjClose, volume });
  }
  return prices;
}

async function main() {
  const missingPath = path.resolve(__dirname, 'missing_price_data.json');
  const outputPath = path.resolve(__dirname, 'historical_price_results.json');
  const missing = JSON.parse(fs.readFileSync(missingPath, 'utf-8'));
  const options = new chrome.Options();
  options.addArguments('--headless');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=1920,1080');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  const results = [];
  try {
    for (const { pickId, symbol, startDate, endDate } of missing) {
      console.log(`[main] Scraping ${symbol} from ${startDate} to ${endDate}`);
      const prices = await scrapeHistoricalPrices(driver, symbol, startDate, endDate);
      results.push({ pickId, symbol, startDate, endDate, prices });
      // Optional: add a delay between requests
      await new Promise(res => setTimeout(res, 2000));
    }
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`Wrote results to ${outputPath}`);
  } catch (err) {
    console.error('Error during scraping:', err);
  } finally {
    await driver.quit();
  }
}

main().catch(err => {
  console.error('Uncaught error in main:', err);
}); 