CREATE TABLE `tiab_container` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text(256),
	`parent` text(256),
	`userId` integer NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text
);
--> statement-breakpoint
CREATE INDEX `path_parent_idx` ON `tiab_container` (`path`,`parent`);--> statement-breakpoint
CREATE TABLE `tiab_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(256),
	`userId` integer NOT NULL,
	`count` integer DEFAULT 1,
	`description` text,
	`container` text(256),
	`createdAt` text NOT NULL,
	`updatedAt` text
);
--> statement-breakpoint
CREATE INDEX `container_idx` ON `tiab_item` (`container`,`name`);--> statement-breakpoint
CREATE TABLE `tiab_user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text(255),
	`password` text(255)
);
