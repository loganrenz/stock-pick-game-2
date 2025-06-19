import { db } from '../api-helpers/lib/db.js';
import { weeks, picks } from '../api-helpers/lib/schema.js';
import { eq } from 'drizzle-orm';

async function verifyWeeks() {
  console.log('Verifying weeks data...');

  // Check Week 13
  const week13 = await db.query.weeks.findFirst({
    where: eq(weeks.weekNum, 13),
    with: {
      picks: {
        with: {
          user: true,
        },
      },
    },
  });
  console.log('\nWeek 13 data:', JSON.stringify(week13, null, 2));

  // Check Week 14
  const week14 = await db.query.weeks.findFirst({
    where: eq(weeks.weekNum, 14),
    with: {
      picks: {
        with: {
          user: true,
        },
      },
    },
  });
  console.log('\nWeek 14 data:', JSON.stringify(week14, null, 2));

  // Check Week 28
  const week28 = await db.query.weeks.findFirst({
    where: eq(weeks.weekNum, 28),
    with: {
      picks: {
        with: {
          user: true,
        },
      },
    },
  });
  console.log('\nWeek 28 data:', JSON.stringify(week28, null, 2));
}

verifyWeeks().catch(console.error);
