import { db } from './db';
import { users, weeks, picks } from './schema';
import { eq, and } from 'drizzle-orm';

async function checkWeek31Picks() {
  try {
    console.log('Checking picks for week 31...');

    // Get week 31
    const week31 = await db.query.weeks.findFirst({
      where: eq(weeks.weekNum, 31),
      with: {
        picks: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!week31) {
      console.log('Week 31 not found!');
      return;
    }

    console.log(`Week 31 found: ${week31.startDate} to ${week31.endDate}`);
    console.log('Current picks:');

    for (const pick of week31.picks) {
      console.log(`- ${pick.user.username}: ${pick.symbol} (entry: $${pick.entryPrice})`);
    }
  } catch (error) {
    console.error('Error checking week 31 picks:', error);
  }
}

checkWeek31Picks()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
