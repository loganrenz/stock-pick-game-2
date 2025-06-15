/*
  Warnings:

  - You are about to drop the column `currentPrice` on the `Pick` table. All the data in the column will be lost.
  - You are about to drop the column `dailyPrices` on the `Pick` table. All the data in the column will be lost.
  - You are about to drop the column `priceAtPick` on the `Pick` table. All the data in the column will be lost.
  - You are about to drop the column `totalReturn` on the `Pick` table. All the data in the column will be lost.
  - You are about to drop the column `weekReturnPct` on the `Pick` table. All the data in the column will be lost.
  - Added the required column `entryPrice` to the `Pick` table without a default value. This is not possible if the table is not empty.

*/
-- Create new table with renamed columns
CREATE TABLE "Pick_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "weekId" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "entryPrice" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "dailyPriceData" TEXT,
    "currentValue" REAL,
    "weekReturn" REAL,
    "returnPercentage" REAL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Copy data from old table to new table
INSERT INTO "Pick_new" (
    "id", "userId", "weekId", "symbol", "entryPrice", "createdAt", "updatedAt",
    "dailyPriceData", "currentValue", "weekReturn", "returnPercentage"
)
SELECT 
    "id", "userId", "weekId", "symbol", "priceAtPick", "createdAt", "updatedAt",
    "dailyPrices", "currentPrice", "weekReturn", "weekReturnPct"
FROM "Pick";

-- Drop old table
DROP TABLE "Pick";

-- Rename new table to original name
ALTER TABLE "Pick_new" RENAME TO "Pick";

-- Recreate unique constraint
CREATE UNIQUE INDEX "Pick_userId_weekId_key" ON "Pick"("userId", "weekId");
