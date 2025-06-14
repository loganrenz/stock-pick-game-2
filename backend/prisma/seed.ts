import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create users with passwords
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
    },
  });
  const patrick = await prisma.user.upsert({
    where: { username: 'patrick' },
    update: {},
    create: {
      username: 'patrick',
      password: await bcrypt.hash('patrickpw', 10),
    },
  });
  const taylor = await prisma.user.upsert({
    where: { username: 'taylor' },
    update: {},
    create: {
      username: 'taylor',
      password: await bcrypt.hash('taylorpw', 10),
    },
  });
  const logan = await prisma.user.upsert({
    where: { username: 'logan' },
    update: {},
    create: {
      username: 'logan',
    },
  });

  // Backfill weeks and picks from spreadsheet (partial example, add all weeks as needed)
  const weeksData = [
    {
      weekNum: 1,
      startDate: new Date('2024-11-18'),
      winnerId: taylor.id,
      picks: [
        { userId: patrick.id, symbol: 'PLUG', priceAtPick: 1.89, createdAt: new Date('2024-11-18'), currentPrice: 1.92, weekReturn: 0.03, weekReturnPct: 1.6, totalReturn: -31.7 },
        { userId: taylor.id, symbol: 'BHVN', priceAtPick: 44.11, createdAt: new Date('2024-11-18'), currentPrice: 45.59, weekReturn: 1.48, weekReturnPct: 3.4, totalReturn: -65.0 },
      ],
    },
    // ... Add all other weeks and picks from the spreadsheet here ...
  ];

  for (const weekData of weeksData) {
    const { picks, ...weekInfo } = weekData;
    const week = await prisma.week.create({ data: weekInfo });
    for (const pickData of picks) {
      await prisma.pick.create({ data: { ...pickData, weekId: week.id } });
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 