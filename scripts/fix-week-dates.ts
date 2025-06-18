import { db } from '../api-helpers/lib/db.js';
import { weeks } from '../api-helpers/lib/schema.js';
import { eq } from 'drizzle-orm';

function isMonday(date: Date) {
  return date.getDay() === 1;
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // if Sunday, go back 6 days
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getFriday(monday: Date) {
  const f = new Date(monday);
  f.setDate(monday.getDate() + 4);
  f.setHours(23, 59, 59, 999);
  return f;
}

async function main() {
  const allWeeks = await db.query.weeks.findMany();
  for (const week of allWeeks) {
    const start = new Date(week.startDate);
    const end = new Date(week.endDate);
    const correctMonday = getMonday(start);
    const correctFriday = getFriday(correctMonday);
    let needsUpdate = false;
    if (start.getTime() !== correctMonday.getTime()) {
      console.log(`[FIX] Week ${week.weekNum}: startDate ${week.startDate} -> ${correctMonday.toISOString()}`);
      needsUpdate = true;
    }
    if (end.getTime() !== correctFriday.getTime()) {
      console.log(`[FIX] Week ${week.weekNum}: endDate ${week.endDate} -> ${correctFriday.toISOString()}`);
      needsUpdate = true;
    }
    if (needsUpdate) {
      await db.update(weeks)
        .set({ startDate: correctMonday.toISOString(), endDate: correctFriday.toISOString() })
        .where(eq(weeks.id, week.id));
    }
  }
  console.log('[FIX] Week date correction complete.');
}

main().catch(e => { console.error(e); process.exit(1); }); 