CREATE TABLE `tiab_container` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text(256) NOT NULL,
	`parent` text(256) NOT NULL,
	`userId` integer NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text
);
--> statement-breakpoint
CREATE INDEX `path_parent_idx` ON `tiab_container` (`path`,`parent`);--> statement-breakpoint
CREATE TABLE `tiab_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(256) NOT NULL,
	`userId` integer NOT NULL,
	`count` integer DEFAULT 1,
	`description` text,
	`containerId` integer NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text
);
--> statement-breakpoint
CREATE INDEX `item_container_idx` ON `tiab_item` (`containerId`,`name`);--> statement-breakpoint
CREATE TABLE `tiab_user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text(255),
	`password` text(255)
);
