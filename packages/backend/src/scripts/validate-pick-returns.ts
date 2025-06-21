import { db } from '../lib/db.js';
import { picks, stockPrices } from '../lib/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getPrice } from '../services/stockService.js';

interface Discrepancy {
  pickId: number;
  message: string;
}

async function validatePickReturns(): Promise<Discrepancy[]> {
  const discrepancies: Discrepancy[] = [];
  const allPicks = await db.select().from(picks);

  for (const pick of allPicks) {
    const latestStockPrice = await db.query.stockPrices.findFirst({
      where: eq(stockPrices.symbol, pick.symbol),
      orderBy: (stockPrices, { desc }) => [desc(stockPrices.lastUpdated)],
    });

    if (!latestStockPrice || latestStockPrice.currentPrice === null) {
      discrepancies.push({
        pickId: pick.id,
        message: `No recent price found for stock ${pick.symbol}`,
      });
      continue;
    }

    const currentPrice = latestStockPrice.currentPrice;
    const expectedReturn = ((currentPrice - pick.entryPrice) / pick.entryPrice) * 100;

    // Check current value
    if (pick.currentValue === null || Math.abs(pick.currentValue - currentPrice) > 0.01) {
      discrepancies.push({
        pickId: pick.id,
        message: `Current value mismatch for ${pick.symbol}. DB: ${pick.currentValue}, Fetched: ${currentPrice}`,
      });
    }

    // Check return percentage
    if (pick.returnPercentage === null || Math.abs(pick.returnPercentage - expectedReturn) > 0.01) {
      discrepancies.push({
        pickId: pick.id,
        message: `Return percentage mismatch for ${pick.symbol}. DB: ${pick.returnPercentage}%, Calculated: ${expectedReturn}%`,
      });
    }
  }

  return discrepancies;
}

async function main() {
  console.log('Validating all pick returns...');
  const discrepancies = await validatePickReturns();

  if (discrepancies.length === 0) {
    console.log('✅ All pick returns are consistent.');
  } else {
    console.error(`❌ Found ${discrepancies.length} discrepancies:`);
    discrepancies.forEach((d) => console.error(`  - Pick ID ${d.pickId}: ${d.message}`));
  }
}

main().catch((error) => {
  console.error('An error occurred during validation:', error);
});
