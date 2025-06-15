import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Get all weeks ordered by startDate
  const weeks = await prisma.week.findMany({ orderBy: { startDate: 'asc' } });

  // 2. Remove duplicate startDates
  const seenStartDates = new Set();
  const validWeeks: typeof weeks = [];
  for (const week of weeks) {
    if (seenStartDates.has(week.startDate.getTime())) {
      await prisma.pick.deleteMany({ where: { weekId: week.id } });
      await prisma.week.delete({ where: { id: week.id } });
      continue;
    }
    seenStartDates.add(week.startDate.getTime());
    validWeeks.push(week);
  }

  // 3. Resequence weekNum using new logic
  const firstWeek = validWeeks[0];
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  for (const week of validWeeks) {
    const diff = week.startDate.getTime() - firstWeek.startDate.getTime();
    const weekNum = 1 + Math.round(diff / msPerWeek);
    await prisma.week.update({ where: { id: week.id }, data: { weekNum } });
  }

  // 4. Remove orphaned picks (picks pointing to deleted weeks)
  const allPicks = await prisma.pick.findMany();
  const validWeekIds = new Set(validWeeks.map(w => w.id));
  for (const pick of allPicks) {
    if (!validWeekIds.has(pick.weekId)) {
      await prisma.pick.delete({ where: { id: pick.id } });
    }
  }

  console.log('Week resequencing and cleanup complete.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
}); 