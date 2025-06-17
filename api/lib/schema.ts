import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, real, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('User', (table) => ({
  id: integer('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password'),
  jwtToken: text('jwtToken').unique(),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt'),
}));

export const weeks = sqliteTable('Week', (table) => ({
  id: integer('id').primaryKey(),
  weekNum: integer('weekNum').notNull(),
  startDate: text('startDate').notNull().unique(),
  endDate: text('endDate'),
  winnerId: integer('winnerId').references(() => users.id),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt'),
}));

export const picks = sqliteTable('Pick', (table) => ({
  id: integer('id').primaryKey(),
  userId: integer('userId').notNull().references(() => users.id),
  weekId: integer('weekId').notNull().references(() => weeks.id),
  symbol: text('symbol').notNull(),
  entryPrice: real('entryPrice').notNull(),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt'),
  dailyPriceData: text('dailyPriceData'),
  currentValue: real('currentValue'),
  weekReturn: real('weekReturn'),
  returnPercentage: real('returnPercentage'),
}));

// Define unique constraint separately
export const picksUniqueIndex = uniqueIndex('picks_user_week_unique').on(picks.userId, picks.weekId);

export const usersRelations = relations(users, ({ many }) => ({
  picks: many(picks),
}));

export const weeksRelations = relations(weeks, ({ many }) => ({
  picks: many(picks),
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