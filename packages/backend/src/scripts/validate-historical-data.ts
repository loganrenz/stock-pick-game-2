import { db } from '../lib/db.js';
import { stockPrices, picks } from '../lib/schema.js';
import { eq } from 'drizzle-orm';

interface ValidationResult {
  symbol: string;
  hasHistoricalData: boolean;
  dataPoints: number;
  dateRange: {
    earliest: string | null;
    latest: string | null;
  };
  sampleData: Record<string, { open: number; close: number }> | null;
  issues: string[];
}

async function validateHistoricalData(): Promise<ValidationResult[]> {
  console.log('🔍 Starting historical data validation...\n');

  // Get all unique symbols from picks
  const allPicks = await db.select({ symbol: picks.symbol }).from(picks);
  const symbols = [...new Set(allPicks.map((pick) => pick.symbol))];

  console.log(`📊 Found ${symbols.length} unique symbols to validate\n`);

  const results: ValidationResult[] = [];

  for (const symbol of symbols) {
    const result: ValidationResult = {
      symbol,
      hasHistoricalData: false,
      dataPoints: 0,
      dateRange: { earliest: null, latest: null },
      sampleData: null,
      issues: [],
    };

    try {
      // Get stock price data
      const stockData = await db.select().from(stockPrices).where(eq(stockPrices.symbol, symbol));

      if (stockData.length === 0) {
        result.issues.push('No stock price record found');
        results.push(result);
        continue;
      }

      const stock = stockData[0];

      // Check if historical data exists
      if (!stock.dailyPriceData) {
        result.issues.push('No dailyPriceData field');
        results.push(result);
        continue;
      }

      // Parse the JSON data
      let parsedData: Record<string, { open: number; close: number }>;
      try {
        parsedData = JSON.parse(stock.dailyPriceData);
      } catch (error) {
        result.issues.push(`Invalid JSON in dailyPriceData: ${error}`);
        results.push(result);
        continue;
      }

      // Validate data structure
      const dataKeys = Object.keys(parsedData);
      if (dataKeys.length === 0) {
        result.issues.push('Empty historical data');
        results.push(result);
        continue;
      }

      result.hasHistoricalData = true;
      result.dataPoints = dataKeys.length;

      // Get date range
      const dates = dataKeys.sort();
      result.dateRange.earliest = dates[0];
      result.dateRange.latest = dates[dates.length - 1];

      // Validate each data point
      for (const [date, data] of Object.entries(parsedData)) {
        if (!data.open || !data.close) {
          result.issues.push(`Missing open/close for date ${date}`);
        }
        if (typeof data.open !== 'number' || typeof data.close !== 'number') {
          result.issues.push(`Invalid data types for date ${date}`);
        }
        if (data.open <= 0 || data.close <= 0) {
          result.issues.push(`Invalid price values for date ${date}`);
        }
      }

      // Get sample data (first 3 entries)
      const sampleEntries = Object.entries(parsedData).slice(0, 3);
      result.sampleData = Object.fromEntries(sampleEntries);
    } catch (error) {
      result.issues.push(`Error processing ${symbol}: ${error}`);
    }

    results.push(result);
  }

  return results;
}

function printValidationReport(results: ValidationResult[]): void {
  console.log('📋 HISTORICAL DATA VALIDATION REPORT\n');
  console.log('='.repeat(80));

  // Summary statistics
  const totalSymbols = results.length;
  const symbolsWithData = results.filter((r) => r.hasHistoricalData).length;
  const symbolsWithIssues = results.filter((r) => r.issues.length > 0).length;
  const totalDataPoints = results.reduce((sum, r) => sum + r.dataPoints, 0);

  console.log(`📊 SUMMARY:`);
  console.log(`   Total symbols: ${totalSymbols}`);
  console.log(`   Symbols with historical data: ${symbolsWithData}`);
  console.log(`   Symbols with issues: ${symbolsWithIssues}`);
  console.log(`   Total data points: ${totalDataPoints}`);
  console.log(
    `   Average data points per symbol: ${(totalDataPoints / symbolsWithData).toFixed(1)}`,
  );
  console.log('');

  // Symbols with issues
  const symbolsWithIssuesList = results.filter((r) => r.issues.length > 0);
  if (symbolsWithIssuesList.length > 0) {
    console.log('❌ SYMBOLS WITH ISSUES:');
    console.log('-'.repeat(40));
    for (const result of symbolsWithIssuesList) {
      console.log(`\n${result.symbol}:`);
      for (const issue of result.issues) {
        console.log(`  - ${issue}`);
      }
    }
    console.log('');
  }

  // Sample data for first 5 symbols
  console.log('✅ SAMPLE DATA (First 5 symbols):');
  console.log('-'.repeat(40));
  const validResults = results
    .filter((r) => r.hasHistoricalData && r.issues.length === 0)
    .slice(0, 5);

  for (const result of validResults) {
    console.log(`\n${result.symbol}:`);
    console.log(`  Data points: ${result.dataPoints}`);
    console.log(`  Date range: ${result.dateRange.earliest} to ${result.dateRange.latest}`);
    if (result.sampleData) {
      console.log(`  Sample data:`);
      for (const [date, data] of Object.entries(result.sampleData)) {
        console.log(
          `    ${date}: Open: $${data.open.toFixed(2)}, Close: $${data.close.toFixed(2)}`,
        );
      }
    }
  }

  console.log('\n' + '='.repeat(80));
}

async function main() {
  try {
    const results = await validateHistoricalData();
    printValidationReport(results);

    // Exit with error code if there are issues
    const hasIssues = results.some((r) => r.issues.length > 0);
    process.exit(hasIssues ? 1 : 0);
  } catch (error) {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  }
}

// Run the validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateHistoricalData, printValidationReport };
