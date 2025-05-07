DROP INDEX `path_parent_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `path_parent_idx` ON `tiab_container` (`path`,`parent`);--> statement-breakpoint
DROP INDEX `item_container_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `item_container_idx` ON `tiab_item` (`containerId`,`name`);