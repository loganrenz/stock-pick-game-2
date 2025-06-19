// DEV/TEST ONLY: This script drops and recreates all tables. DO NOT USE IN PRODUCTION!
import 'dotenv/config';
import { db } from './db.js';
import { sql } from 'drizzle-orm';
import { config } from './config.js';

console.log('[RESET-DB] TURSO_DB_URL:', config.database.url);

async function main() {
  try {
    // Test connection
    await db.run(sql`SELECT 1;`);
    console.log('DB connection successful');
  } catch (err) {
    console.error('DB connection failed:', err);
    throw err;
  }

  try {
    // Drop tables if they exist (order matters due to foreign keys)
    await db.run(sql`DROP TABLE IF EXISTS Pick;`);
    await db.run(sql`DROP TABLE IF EXISTS Week;`);
    await db.run(sql`DROP TABLE IF EXISTS User;`);
    await db.run(sql`DROP TABLE IF EXISTS StockPrice;`);
    await db.run(sql`DROP TABLE IF EXISTS __drizzle_migrations;`);
    console.log('Creating tables...');

    // Create users table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS User (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT,
        jwtToken TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT
      );
    `);

    // Create weeks table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS Week (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weekNum INTEGER NOT NULL,
        startDate TEXT NOT NULL UNIQUE,
        endDate TEXT,
        winnerId INTEGER REFERENCES User(id),
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT
      );
    `);

    // Create stock prices table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS StockPrice (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL UNIQUE,
        currentPrice REAL,
        previousClose REAL,
        change REAL,
        changePercent REAL,
        volume INTEGER,
        marketCap REAL,
        peRatio REAL,
        eps REAL,
        dividendYield REAL,
        beta REAL,
        dailyPriceData TEXT,
        lastUpdated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create picks table (without dailyPriceData column)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS Pick (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL REFERENCES User(id),
        weekId INTEGER NOT NULL REFERENCES Week(id),
        symbol TEXT NOT NULL,
        entryPrice REAL NOT NULL,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT,
        currentValue REAL,
        weekReturn REAL,
        returnPercentage REAL,
        UNIQUE(userId, weekId)
      );
    `);

    console.log('Tables created successfully!');
  } catch (err) {
    console.error('Reset failed:', err);
    throw err;
  }
}

export default main;

// Only run if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url === process.argv[1]) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
