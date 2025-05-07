ALTER TABLE `tiab_container` ADD `isPublic` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `tiab_container` ADD `isDeleted` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `tiab_item` ADD `isDeleted` integer DEFAULT false;