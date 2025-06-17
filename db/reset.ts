import { prisma } from '../api/lib/db.ts';

async function reset() {
  console.log('Starting database reset...');
  try {
    // Drop all tables
    await prisma.$queryRaw`DROP TABLE IF EXISTS pick`;
    await prisma.$queryRaw`DROP TABLE IF EXISTS week`;
      await prisma.$queryRaw`DROP TABLE IF EXISTS user`;
      await prisma.$queryRaw`DROP TABLE IF EXISTS test`;
    console.log('Tables dropped successfully.');

  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reset(); 