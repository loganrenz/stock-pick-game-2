CREATE TABLE "Pick" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"userId" INTEGER NOT NULL,
	"weekId" INTEGER NOT NULL,
	"symbol" TEXT NOT NULL,
	"entryPrice" REAL NOT NULL,
	"createdAt" TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" TEXT,
	"dailyPriceData" TEXT,
	"currentValue" REAL,
	"weekReturn" REAL,
	"returnPercentage" REAL,
	FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"username" TEXT NOT NULL,
	"password" TEXT,
	"jwtToken" TEXT,
	"createdAt" TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" TEXT
);
--> statement-breakpoint
CREATE UNIQUE INDEX "User_username_unique" ON "User" ("username");
--> statement-breakpoint
CREATE UNIQUE INDEX "User_jwtToken_unique" ON "User" ("jwtToken");
--> statement-breakpoint
CREATE TABLE "Week" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"weekNum" INTEGER NOT NULL,
	"startDate" TEXT NOT NULL,
	"endDate" TEXT,
	"winnerId" INTEGER,
	"createdAt" TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" TEXT,
	FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
--> statement-breakpoint
CREATE UNIQUE INDEX "Week_startDate_unique" ON "Week" ("startDate");