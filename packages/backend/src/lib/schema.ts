import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, real, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password'),
  jwtToken: text('jwtToken'),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt'),
});

export const weeks = sqliteTable('weeks', {
  id: integer('id').primaryKey(),
  weekNum: integer('weekNum').notNull(),
  startDate: text('startDate').notNull().unique(),
  endDate: text('endDate'),
  winnerId: integer('winnerId').references(() => users.id),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt'),
});

export const stockPrices = sqliteTable('stock_prices', {
  id: integer('id').primaryKey(),
  symbol: text('symbol').notNull(),
  currentPrice: real('currentPrice'),
  previousClose: real('previousClose'),
  change: real('change'),
  changePercent: real('changePercent'),
  volume: integer('volume'),
  marketCap: real('marketCap'),
  peRatio: real('peRatio'),
  eps: real('eps'),
  dividendYield: real('dividendYield'),
  beta: real('beta'),
  dailyPriceData: text('dailyPriceData'), // JSON string of daily OHLCV data
  lastUpdated: text('lastUpdated')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const picks = sqliteTable('picks', {
  id: integer('id').primaryKey(),
  userId: integer('userId')
    .notNull()
    .references(() => users.id),
  weekId: integer('weekId')
    .notNull()
    .references(() => weeks.id),
  symbol: text('symbol').notNull(),
  entryPrice: real('entryPrice').notNull(),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt'),
  currentValue: real('currentValue'),
  weekReturn: real('weekReturn'),
  returnPercentage: real('returnPercentage'),
  lastClosePrice: real('lastClosePrice'),
  lastClosePriceUpdatedAt: text('lastClosePriceUpdatedAt'),
});

// Define unique constraints
export const picksUniqueIndex = uniqueIndex('picks_user_week_unique').on(
  picks.userId,
  picks.weekId,
);
export const stockPricesUniqueIndex = uniqueIndex('stock_prices_symbol_unique').on(
  stockPrices.symbol,
);

export const usersRelations = relations(users, ({ many }) => ({
  picks: many(picks),
}));

export const weeksRelations = relations(weeks, ({ many, one }) => ({
  picks: many(picks),
  winner: one(users, {
    fields: [weeks.winnerId],
    references: [users.id],
  }),
}));

export const picksRelations = relations(picks, ({ one }) => ({
  user: one(users, {
    fields: [picks.userId],
    references: [users.id],
  }),
  week: one(weeks, {
    fields: [picks.weekId],
    references: [weeks.id],
  }),
}));

export const stockPricesRelations = relations(stockPrices, ({ many }) => ({
  picks: many(picks),
}));
