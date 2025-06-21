import { db } from '../lib/db.js';
import { picks, stockPrices } from '../lib/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Migration to fix historically incorrect `returnPercentage` values in the `picks` table.
 *
 * This script iterates through all existing picks, fetches the correct current price
 * from the `stockPrices` table, recalculates the return percentage, and updates
 * the pick record. This corrects a data anomaly where return percentages were
 * calculated incorrectly or not at all.
 */
async function fixReturnPercentagesMigration() {
  console.log('Applying migration: 20250621_0001_fix_return_percentages.ts');
  console.log('🛠️  Starting script to fix return percentages for all picks...');

  const allPicks = await db.select().from(picks);

  console.log(`Found ${allPicks.length} picks to check and fix.`);

  let updatedCount = 0;
  let notFoundCount = 0;
  const notFoundSymbols = new Set<string>();

  for (const pick of allPicks) {
    // Find the current price for the symbol
    const stockPriceRecord = await db
      .select()
      .from(stockPrices)
      .where(eq(stockPrices.symbol, pick.symbol))
      .limit(1);

    if (stockPriceRecord.length > 0 && stockPriceRecord[0].currentPrice) {
      const currentPrice = stockPriceRecord[0].currentPrice;
      let calculatedReturn = 0;

      // Avoid division by zero if entryPrice is 0
      if (pick.entryPrice > 0) {
        calculatedReturn = ((currentPrice - pick.entryPrice) / pick.entryPrice) * 100;
      }

      // Only update if the stored value is different (and not NaN)
      if (
        isFinite(calculatedReturn) &&
        (!pick.returnPercentage || Math.abs(pick.returnPercentage - calculatedReturn) > 0.001)
      ) {
        console.log(
          `Fixing ${pick.symbol} (ID: ${pick.id}): Stored: ${
            pick.returnPercentage?.toFixed(2) ?? 'N/A'
          }%, Calculated: ${calculatedReturn.toFixed(2)}%`,
        );

        await db
          .update(picks)
          .set({
            returnPercentage: calculatedReturn,
            currentValue: currentPrice, // Also update currentValue for consistency
          })
          .where(eq(picks.id, pick.id));
        updatedCount++;
      }
    } else {
      notFoundCount++;
      notFoundSymbols.add(pick.symbol);
    }
  }

  console.log('\n✅ Migration finished!');
  console.log(`Total picks updated: ${updatedCount}`);
  if (notFoundCount > 0) {
    console.warn(
      `Could not find current price for ${
        notFoundSymbols.size
      } symbols (${notFoundCount} picks): ${Array.from(notFoundSymbols).join(', ')}`,
    );
  }
}

// Run the migration
fixReturnPercentagesMigration()
  .then(() => {
    console.log('Migration completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
