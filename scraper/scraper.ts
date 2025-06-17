console.log('[scraper.ts] Script loaded');
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

// Helper to get yesterday's date in YYYY-MM-DD format
function getYesterdayDateString(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const iso = d.toISOString();
    const parts = iso.split('T');
    return parts[0] || '';
}

// Scrape Yahoo Finance for a single symbol's closing price for yesterday
async function scrapeClosingPrice(driver: WebDriver, symbol: string): Promise<{ symbol: string, date: string, close: string | null }> {
    console.log(`[scrapeClosingPrice] Start for symbol: ${symbol}`);
    const url = `https://finance.yahoo.com/quote/${symbol}/history?p=${symbol}`;
    console.log(`[scrapeClosingPrice] Navigating to ${url}`);
    try {
        await driver.get(url);
        console.log(`[scrapeClosingPrice] Page loaded for ${symbol}`);
        
        // Wait for page to be fully loaded
        await driver.wait(until.elementLocated(By.css('body')), 30000);
        console.log(`[scrapeClosingPrice] Body element found`);
        
        // Find all tables
        const tables = await driver.findElements(By.css('table'));
        console.log(`[scrapeClosingPrice] Found ${tables.length} tables on the page`);
        
        // Define the expected headers
        const expectedHeaders = ["Date", "Open", "High", "Low", "Close", "Adj Close", "Volume"];
        let targetTable: any = null;
        for (const table of tables) {
            try {
                const thead = await table.findElement(By.css('thead'));
                const headerCells = await thead.findElements(By.css('tr th'));
                const headers: string[] = [];
                for (const cell of headerCells) {
                    const text = (await cell.getText()).trim();
                    headers.push(text);
                }
                console.log(`[scrapeClosingPrice] Table headers:`, headers);
                if (headers.length === expectedHeaders.length && headers.every((h, i) => h === expectedHeaders[i])) {
                    targetTable = table;
                    break;
                }
            } catch (e) {
                // Table might not have a thead, skip
                continue;
            }
        }
        if (!targetTable) {
            console.error('[scrapeClosingPrice] Could not find table with expected headers!');
            return { symbol, date: getYesterdayDateString(), close: null };
        }
        console.log('[scrapeClosingPrice] Found target table with expected headers.');
        
        // Get rows from tbody
        const tbody = await targetTable.findElement(By.css('tbody'));
        const rows = await tbody.findElements(By.css('tr'));
        console.log(`[scrapeClosingPrice] Found ${rows.length} rows in table for ${symbol}`);
        
        for (const row of rows) {
            const tds = await row.findElements(By.css('td'));
            if (tds.length < 7) {
                console.log(`[scrapeClosingPrice] Skipping row with ${tds.length} columns`);
                continue;
            }
            const dateText = await tds[0]?.getText() || '';
            const closeText = await tds[4]?.getText() || '';
            const parsedDate = new Date(dateText);
            const formattedDate = parsedDate.toISOString().split('T')[0];
            console.log(`[scrapeClosingPrice] Row: dateText=${dateText}, formattedDate=${formattedDate}, closeText=${closeText}`);
            
            if (formattedDate === getYesterdayDateString()) {
                console.log(`[scrapeClosingPrice] Match for yesterday: ${formattedDate} close=${closeText}`);
                return { symbol, date: formattedDate, close: closeText || null };
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
    options.addArguments('--headless'); // Run Chrome in headless mode
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080'); // Set a reasonable window size
    
    let driver: WebDriver | undefined;
    try {
        console.log('[scrapeYahooForSymbols] Building WebDriver...');
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        console.log('[scrapeYahooForSymbols] WebDriver built successfully');
        
        // Only try the first symbol
        const symbol = symbols[0];
        if (!symbol) {
            throw new Error('No symbols provided');
        }
        console.log(`[scrapeYahooForSymbols] Scraping symbol: ${symbol}`);
        const result = await scrapeClosingPrice(driver, symbol);
        console.log(`[scrapeYahooForSymbols] Result for ${symbol}:`, result);
        return [result];
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

// If run directly, demo with just AAPL
if (require.main === module) {
    scrapeYahooForSymbols(['AAPL']).then(console.log).catch(console.error);
} 