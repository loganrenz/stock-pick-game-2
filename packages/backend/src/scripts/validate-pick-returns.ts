import { db } from '../lib/db.js';
import { picks, stockPrices } from '../lib/schema.js';
import { eq } from 'drizzle-orm';

interface PickReturnValidation {
  pickId: number;
  symbol: string;
  weekId: number;
  userId: number;
  entryPrice: number;
  currentValue: number;
  calculatedReturn: number;
  storedReturn: number;
  returnDifference: number;
  hasHistoricalData: boolean;
  validationDate: string;
  issues: string[];
}

async function validatePickReturns(): Promise<PickReturnValidation[]> {
  console.log('🔍 Starting pick return validation...\n');

  // Get all picks with their data
  const allPicks = await db
    .select({
      id: picks.id,
      symbol: picks.symbol,
      weekId: picks.weekId,
      userId: picks.userId,
      entryPrice: picks.entryPrice,
      currentValue: picks.currentValue,
      returnPercentage: picks.returnPercentage,
      createdAt: picks.createdAt,
    })
    .from(picks)
    .orderBy(picks.weekId, picks.symbol);

  console.log(`📊 Found ${allPicks.length} picks to validate\n`);

  const results: PickReturnValidation[] = [];

  for (const pick of allPicks) {
    const result: PickReturnValidation = {
      pickId: pick.id,
      symbol: pick.symbol,
      weekId: pick.weekId,
      userId: pick.userId,
      entryPrice: pick.entryPrice,
      currentValue: pick.currentValue || 0,
      calculatedReturn: 0,
      storedReturn: pick.returnPercentage || 0,
      returnDifference: 0,
      hasHistoricalData: false,
      validationDate: new Date().toISOString().split('T')[0],
      issues: [],
    };

    try {
      // Get historical data for this symbol
      const stockData = await db
        .select()
        .from(stockPrices)
        .where(eq(stockPrices.symbol, pick.symbol));

      if (stockData.length === 0) {
        result.issues.push('No stock price data found');
        results.push(result);
        continue;
      }

      const stock = stockData[0];

      if (!stock.dailyPriceData) {
        result.issues.push('No historical data available');
        results.push(result);
        continue;
      }

      // Parse historical data
      let historicalData: Record<string, { open: number; close: number }>;
      try {
        historicalData = JSON.parse(stock.dailyPriceData);
      } catch (error) {
        result.issues.push(`Invalid JSON in historical data: ${error}`);
        results.push(result);
        continue;
      }

      result.hasHistoricalData = true;

      // Find the price on the pick creation date
      const pickDate = new Date(pick.createdAt).toISOString().split('T')[0];

      if (!historicalData[pickDate]) {
        result.issues.push(`No historical data for pick date: ${pickDate}`);
        results.push(result);
        continue;
      }

      const pickDatePrice = historicalData[pickDate].close;

      // Use current value from stock data if available, otherwise use pick's current value
      const currentPrice = stock.currentPrice || pick.currentValue || 0;

      if (currentPrice <= 0) {
        result.issues.push('Invalid current price');
        results.push(result);
        continue;
      }

      // Calculate return percentage
      const calculatedReturn = ((currentPrice - pickDatePrice) / pickDatePrice) * 100;
      result.calculatedReturn = Math.round(calculatedReturn * 100) / 100; // Round to 2 decimal places
      result.returnDifference = Math.abs(result.calculatedReturn - result.storedReturn);

      // Validate the calculation
      if (Math.abs(result.returnDifference) > 0.01) {
        result.issues.push(
          `Return calculation mismatch: calculated=${result.calculatedReturn}%, stored=${result.storedReturn}%`,
        );
      }

      // Additional validations
      if (Math.abs(pick.entryPrice - pickDatePrice) > 0.01) {
        result.issues.push(
          `Entry price mismatch: stored=${pick.entryPrice}, historical=${pickDatePrice}`,
        );
      }

      if (Math.abs(pick.currentValue - currentPrice) > 0.01) {
        result.issues.push(
          `Current value mismatch: stored=${pick.currentValue}, stock=${currentPrice}`,
        );
      }
    } catch (error) {
      result.issues.push(`Error processing pick: ${error}`);
    }

    results.push(result);
  }

  return results;
}

function printReturnValidationReport(results: PickReturnValidation[]): void {
  console.log('📋 PICK RETURN VALIDATION REPORT\n');
  console.log('='.repeat(80));

  // Summary statistics
  const totalPicks = results.length;
  const picksWithData = results.filter((r) => r.hasHistoricalData).length;
  const picksWithIssues = results.filter((r) => r.issues.length > 0).length;
  const picksWithReturnMismatch = results.filter((r) =>
    r.issues.some((issue) => issue.includes('Return calculation mismatch')),
  ).length;

  console.log(`📊 SUMMARY:`);
  console.log(`   Total picks: ${totalPicks}`);
  console.log(`   Picks with historical data: ${picksWithData}`);
  console.log(`   Picks with issues: ${picksWithIssues}`);
  console.log(`   Picks with return calculation mismatches: ${picksWithReturnMismatch}`);
  console.log('');

  // Picks with issues
  const picksWithIssuesList = results.filter((r) => r.issues.length > 0);
  if (picksWithIssuesList.length > 0) {
    console.log('❌ PICKS WITH ISSUES:');
    console.log('-'.repeat(60));
    for (const result of picksWithIssuesList) {
      console.log(
        `\nPick ID: ${result.pickId} | Symbol: ${result.symbol} | Week: ${result.weekId}`,
      );
      console.log(`  Entry Price: $${result.entryPrice} | Current Value: $${result.currentValue}`);
      console.log(
        `  Calculated Return: ${result.calculatedReturn}% | Stored Return: ${result.storedReturn}%`,
      );
      for (const issue of result.issues) {
        console.log(`  - ${issue}`);
      }
    }
    console.log('');
  }

  // Sample valid picks
  console.log('✅ SAMPLE VALID PICKS (First 10):');
  console.log('-'.repeat(60));
  const validPicks = results
    .filter((r) => r.hasHistoricalData && r.issues.length === 0)
    .slice(0, 10);

  for (const result of validPicks) {
    console.log(`\nPick ID: ${result.pickId} | Symbol: ${result.symbol} | Week: ${result.weekId}`);
    console.log(`  Entry Price: $${result.entryPrice} | Current Value: $${result.currentValue}`);
    console.log(
      `  Return: ${result.calculatedReturn}% (calculated) | ${result.storedReturn}% (stored)`,
    );
  }

  // Return distribution analysis
  console.log('\n📈 RETURN DISTRIBUTION ANALYSIS:');
  console.log('-'.repeat(40));
  const validReturns = results.filter((r) => r.hasHistoricalData && r.issues.length === 0);
  const returns = validReturns.map((r) => r.calculatedReturn);

  if (returns.length > 0) {
    const positiveReturns = returns.filter((r) => r > 0).length;
    const negativeReturns = returns.filter((r) => r < 0).length;
    const zeroReturns = returns.filter((r) => r === 0).length;

    console.log(
      `   Positive returns: ${positiveReturns} (${((positiveReturns / returns.length) * 100).toFixed(1)}%)`,
    );
    console.log(
      `   Negative returns: ${negativeReturns} (${((negativeReturns / returns.length) * 100).toFixed(1)}%)`,
    );
    console.log(
      `   Zero returns: ${zeroReturns} (${((zeroReturns / returns.length) * 100).toFixed(1)}%)`,
    );

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const maxReturn = Math.max(...returns);
    const minReturn = Math.min(...returns);

    console.log(`   Average return: ${avgReturn.toFixed(2)}%`);
    console.log(`   Best return: ${maxReturn.toFixed(2)}%`);
    console.log(`   Worst return: ${minReturn.toFixed(2)}%`);
  }

  console.log('\n' + '='.repeat(80));
}

async function main() {
  try {
    const results = await validatePickReturns();
    printReturnValidationReport(results);

    // Exit with error code if there are issues
    const hasIssues = results.some((r) => r.issues.length > 0);
    process.exit(hasIssues ? 1 : 0);
  } catch (error) {
    console.error('❌ Return validation script failed:', error);
    process.exit(1);
  }
}

// Run the validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validatePickReturns, printReturnValidationReport };
