CREATE TABLE `picks` (
	`id` integer PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`weekId` integer NOT NULL,
	`symbol` text NOT NULL,
	`entryPrice` real NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text,
	`currentValue` real,
	`weekReturn` real,
	`returnPercentage` real,
	`lastClosePrice` real,
	`lastClosePriceUpdatedAt` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`weekId`) REFERENCES `weeks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stock_prices` (
	`id` integer PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`currentPrice` real,
	`previousClose` real,
	`change` real,
	`changePercent` real,
	`volume` integer,
	`marketCap` real,
	`peRatio` real,
	`eps` real,
	`dividendYield` real,
	`beta` real,
	`dailyPriceData` text,
	`lastUpdated` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text,
	`jwtToken` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `weeks` (
	`id` integer PRIMARY KEY NOT NULL,
	`weekNum` integer NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text,
	`winnerId` integer,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text,
	FOREIGN KEY (`winnerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weeks_startDate_unique` ON `weeks` (`startDate`);