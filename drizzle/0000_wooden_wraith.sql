CREATE TABLE `Pick` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`weekId` integer NOT NULL,
	`symbol` text NOT NULL,
	`entryPrice` real NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text,
	`dailyPriceData` text,
	`currentValue` real,
	`weekReturn` real,
	`returnPercentage` real,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`weekId`) REFERENCES `Week`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text,
	`jwtToken` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_username_unique` ON `User` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_jwtToken_unique` ON `User` (`jwtToken`);--> statement-breakpoint
CREATE TABLE `Week` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`weekNum` integer NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text,
	`winnerId` integer,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text,
	FOREIGN KEY (`winnerId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Week_startDate_unique` ON `Week` (`startDate`);