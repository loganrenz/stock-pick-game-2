-- Migration: Add stock prices table and update picks table
-- Created: 2024-01-XX

-- Create stock prices table
CREATE TABLE "StockPrice" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"symbol" text NOT NULL,
	"currentPrice" real,
	"previousClose" real,
	"change" real,
	"changePercent" real,
	"volume" integer,
	"marketCap" real,
	"peRatio" real,
	"eps" real,
	"dividendYield" real,
	"beta" real,
	"dailyPriceData" text,
	"lastUpdated" text NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on symbol
CREATE UNIQUE INDEX "stock_prices_symbol_unique" ON "StockPrice" ("symbol");

-- Remove dailyPriceData column from picks table (data will be stored in StockPrice table)
-- Note: We'll keep the column for now to avoid data loss, but it will be deprecated
-- ALTER TABLE "Pick" DROP COLUMN "dailyPriceData"; 