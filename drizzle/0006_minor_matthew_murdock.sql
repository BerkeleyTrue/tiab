CREATE TABLE `tiab_containers_to_tags` (
	`containerId` integer NOT NULL,
	`tagId` integer NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	PRIMARY KEY(`containerId`, `tagId`),
	FOREIGN KEY (`containerId`) REFERENCES `tiab_container`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tagId`) REFERENCES `tiab_tag`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tiab_items_to_tags` (
	`itemId` integer NOT NULL,
	`tagId` integer NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	PRIMARY KEY(`itemId`, `tagId`),
	FOREIGN KEY (`itemId`) REFERENCES `tiab_item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tagId`) REFERENCES `tiab_tag`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tiab_tag` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(256) NOT NULL,
	`userId` integer NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text
);
