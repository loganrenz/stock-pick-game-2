import { db } from './db';
import { users, weeks, picks } from './schema';
import { eq } from 'drizzle-orm';
import { getStockData } from '../stocks/stock-data';

async function updateWeek31Picks() {
  try {
    console.log('Updating picks for week 31...');

    // Get week 31
    const week31 = await db.query.weeks.findFirst({
      where: eq(weeks.weekNum, 31),
    });

    if (!week31) {
      console.log('Week 31 not found!');
      return;
    }

    console.log(`Week 31 found: ${week31.startDate} to ${week31.endDate}`);

    // Get users
    const patrick = await db.query.users.findFirst({
      where: eq(users.username, 'patrick'),
    });
    const logan = await db.query.users.findFirst({
      where: eq(users.username, 'logan'),
    });
    const taylor = await db.query.users.findFirst({
      where: eq(users.username, 'taylor'),
    });

    if (!patrick || !logan || !taylor) {
      console.log('One or more users not found!');
      console.log('patrick:', !!patrick);
      console.log('logan:', !!logan);
      console.log('taylor:', !!taylor);
      return;
    }

    // Delete existing picks for week 31
    console.log('Deleting existing picks for week 31...');
    await db.delete(picks).where(eq(picks.weekId, week31.id));
    console.log('Existing picks deleted.');

    // Fetch entry prices from the stock API
    console.log('Fetching entry prices from stock API...');
    const fatData = await getStockData('FAT', true);
    const baData = await getStockData('BA', true);

    let fatEntry = 0;
    if (fatData?.dailyPriceData?.monday?.open) {
      fatEntry = fatData.dailyPriceData.monday.open;
    }
    let baEntry = 0;
    if (baData?.dailyPriceData?.monday?.open) {
      baEntry = baData.dailyPriceData.monday.open;
    }

    // Create new picks
    console.log('Creating new picks...');

    // Patrick: SLDE (IPO this week, use Wednesday close, manually set to 20.25)
    await db.insert(picks).values({
      userId: patrick.id,
      weekId: week31.id,
      symbol: 'SLDE',
      entryPrice: 20.25,
      currentValue: null,
      weekReturn: null,
      returnPercentage: null,
    });
    console.log(`Created pick for patrick: SLDE (entry: $20.25)`);

    // Logan: FAT
    await db.insert(picks).values({
      userId: logan.id,
      weekId: week31.id,
      symbol: 'FAT',
      entryPrice: fatEntry,
      currentValue: null,
      weekReturn: null,
      returnPercentage: null,
    });
    console.log(`Created pick for logan: FAT (entry: $${fatEntry})`);

    // Taylor: BA
    await db.insert(picks).values({
      userId: taylor.id,
      weekId: week31.id,
      symbol: 'BA',
      entryPrice: baEntry,
      currentValue: null,
      weekReturn: null,
      returnPercentage: null,
    });
    console.log(`Created pick for taylor: BA (entry: $${baEntry})`);

    console.log('Week 31 picks updated successfully!');
  } catch (error) {
    console.error('Error updating week 31 picks:', error);
  }
}

updateWeek31Picks()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
