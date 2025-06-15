/*
  Warnings:

  - A unique constraint covering the columns `[userId,weekId]` on the table `Pick` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[startDate]` on the table `Week` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Pick_userId_weekId_key" ON "Pick"("userId", "weekId");

-- CreateIndex
CREATE UNIQUE INDEX "Week_startDate_key" ON "Week"("startDate");
