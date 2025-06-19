import { db } from './db';
import { users, weeks, picks } from './schema';
import { eq, isNull, or } from 'drizzle-orm';

async function checkMissingData() {
  try {
    console.log('Checking for picks with missing data...');

    // Find picks with missing currentValue, weekReturn, or returnPercentage
    const picksWithMissingData = await db.query.picks.findMany({
      where: or(
        isNull(picks.currentValue),
        isNull(picks.weekReturn),
        isNull(picks.returnPercentage),
      ),
      with: {
        user: true,
        week: true,
      },
      orderBy: picks.weekId,
    });

    if (picksWithMissingData.length === 0) {
      console.log('No picks with missing data found!');
      return;
    }

    console.log(`Found ${picksWithMissingData.length} picks with missing data:`);

    for (const pick of picksWithMissingData) {
      console.log(`- Week ${pick.week.weekNum}: ${pick.user.username} - ${pick.symbol}`);
      console.log(
        `  Entry: $${pick.entryPrice}, Current: ${pick.currentValue || 'MISSING'}, Return: ${pick.weekReturn || 'MISSING'}, Return%: ${pick.returnPercentage || 'MISSING'}`,
      );
    }

    // Group by week for better organization
    const byWeek = picksWithMissingData.reduce(
      (acc, pick) => {
        const weekNum = pick.week.weekNum;
        if (!acc[weekNum]) acc[weekNum] = [];
        acc[weekNum].push(pick);
        return acc;
      },
      {} as Record<number, typeof picksWithMissingData>,
    );

    console.log('\nSummary by week:');
    for (const [weekNum, weekPicks] of Object.entries(byWeek)) {
      console.log(`Week ${weekNum}: ${weekPicks.length} picks with missing data`);
    }
  } catch (error) {
    console.error('Error checking missing data:', error);
  }
}

checkMissingData()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
