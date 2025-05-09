CREATE TABLE `tiab_users_to_tags` (
	`userId` integer NOT NULL,
	`tagId` integer NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	PRIMARY KEY(`userId`, `tagId`),
	FOREIGN KEY (`userId`) REFERENCES `tiab_user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tagId`) REFERENCES `tiab_tag`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_name_idx` ON `tiab_tag` (`name`);--> statement-breakpoint
ALTER TABLE `tiab_tag` DROP COLUMN `userId`;