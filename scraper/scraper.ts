console.log('[scraper.ts] Script loaded');
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

// Helper to get yesterday's date in YYYY-MM-DD format
function getYesterdayDateString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

// Scrape Yahoo Finance for a single symbol's closing price for yesterday
async function scrapeClosingPrice(driver: WebDriver, symbol: string): Promise<{ symbol: string, date: string, close: string | null }> {
    console.log(`[scrapeClosingPrice] Start for symbol: ${symbol}`);
    const url = `https://finance.yahoo.com/quote/${symbol}/history?p=${symbol}`;
    console.log(`[scrapeClosingPrice] Navigating to ${url}`);
    try {
        await driver.get(url);
        console.log(`[scrapeClosingPrice] Page loaded for ${symbol}`);
        await driver.wait(until.elementLocated(By.css('table[data-test="historical-prices"]')), 10000);
        console.log(`[scrapeClosingPrice] Found historical prices table for ${symbol}`);
        const table = await driver.findElement(By.css('table[data-test="historical-prices"]'));
        const rows = await table.findElements(By.css('tbody > tr'));
        console.log(`[scrapeClosingPrice] Found ${rows.length} rows in table for ${symbol}`);
        for (const row of rows) {
            const tds = await row.findElements(By.css('td'));
            if (tds.length < 6) continue;
            const dateText = await tds[0].getText();
            const closeText = await tds[4].getText();
            const parsedDate = new Date(dateText);
            const formattedDate = parsedDate.toISOString().split('T')[0];
            console.log(`[scrapeClosingPrice] Row: dateText=${dateText}, formattedDate=${formattedDate}, closeText=${closeText}`);
            if (formattedDate === getYesterdayDateString()) {
                console.log(`[scrapeClosingPrice] Match for yesterday: ${formattedDate} close=${closeText}`);
                return { symbol, date: formattedDate, close: closeText };
            }
        }
        console.log(`[scrapeClosingPrice] No match for yesterday for ${symbol}`);
        return { symbol, date: getYesterdayDateString(), close: null };
    } catch (err) {
        console.error(`[scrapeClosingPrice] Error for ${symbol}:`, err);
        return { symbol, date: getYesterdayDateString(), close: null };
    }
}

// Main function to scrape all symbols
export async function scrapeYahooForSymbols(symbols: string[]) {
    console.log(`[scrapeYahooForSymbols] Start for ${symbols.length} symbols`);
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    let driver: WebDriver;
    try {
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        const results = [];
        for (const symbol of symbols) {
            console.log(`[scrapeYahooForSymbols] Scraping symbol: ${symbol}`);
            const result = await scrapeClosingPrice(driver, symbol);
            console.log(`[scrapeYahooForSymbols] Result for ${symbol}:`, result);
            results.push(result);
        }
        console.log(`[scrapeYahooForSymbols] All results:`, results);
        return results;
    } catch (err) {
        console.error(`[scrapeYahooForSymbols] Error:`, err);
        throw err;
    } finally {
        if (driver) {
            await driver.quit();
            console.log(`[scrapeYahooForSymbols] Driver quit`);
        }
    }
}

// If run directly, demo with a few symbols
if (require.main === module) {
    scrapeYahooForSymbols(['AAPL', 'MSFT', 'GOOG']).then(console.log).catch(console.error);
} 