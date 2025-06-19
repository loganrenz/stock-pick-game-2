import { db } from './db';
import { users, weeks, picks } from './schema';
import { eq, isNull, or } from 'drizzle-orm';

async function fixMissingReturns() {
  try {
    console.log('Fixing missing weekReturn and returnPercentage data...');

    // Find all picks with missing weekReturn or returnPercentage
    const picksWithMissing = await db.query.picks.findMany({
      where: or(isNull(picks.weekReturn), isNull(picks.returnPercentage)),
      with: {
        user: true,
        week: true,
      },
      orderBy: picks.weekId,
    });

    if (picksWithMissing.length === 0) {
      console.log('No picks with missing weekReturn or returnPercentage found!');
      return;
    }

    console.log(
      `Found ${picksWithMissing.length} picks with missing weekReturn or returnPercentage:`,
    );

    let updatedCount = 0;

    for (const pick of picksWithMissing) {
      console.log(`Processing: Week ${pick.week.weekNum} - ${pick.user.username} - ${pick.symbol}`);

      // Calculate weekReturn and returnPercentage if we have entryPrice and currentValue
      if (pick.entryPrice && pick.currentValue) {
        const weekReturn = pick.currentValue - pick.entryPrice;
        const returnPercentage = ((pick.currentValue - pick.entryPrice) / pick.entryPrice) * 100;

        // Update the pick with the calculated values
        await db
          .update(picks)
          .set({
            weekReturn: weekReturn,
            returnPercentage: returnPercentage,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(picks.id, pick.id));

        console.log(
          `  Updated: Entry $${pick.entryPrice} -> Current $${pick.currentValue} = Return $${weekReturn.toFixed(2)}, Return% ${returnPercentage.toFixed(2)}`,
        );
        updatedCount++;
      } else {
        console.log(
          `  Skipped: Missing entryPrice (${pick.entryPrice}) or currentValue (${pick.currentValue})`,
        );
      }
    }

    console.log(`\nMigration complete! Updated ${updatedCount} picks.`);
  } catch (error) {
    console.error('Error fixing missing returns:', error);
  }
}

fixMissingReturns()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
