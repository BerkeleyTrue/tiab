DROP INDEX `path_parent_idx`;--> statement-breakpoint
ALTER TABLE `tiab_container` ADD `parentId` integer REFERENCES tiab_container(id);--> statement-breakpoint
CREATE UNIQUE INDEX `path_parent_id_idx` ON `tiab_container` (`path`,`parentId`);--> statement-breakpoint
DROP VIEW `containers_pathname`;--> statement-breakpoint
ALTER TABLE `tiab_container` DROP COLUMN `parent`;--> statement-breakpoint
CREATE VIEW `containers_pathname` AS 
WITH RECURSIVE recur_pathname AS (
  -- Base case: top-level containers (no parent)
  SELECT
    id,
    path,
    parent_id,
    path AS pathname,
    0 AS depth
  FROM 
    "tiab_container"
  WHERE 
    parent_id IS NULL

  UNION ALL

  -- Recursive case: add child containers to the path
  SELECT
    c.id,
    c.path,
    c.parent_id,
    rp.pathname || '/' || c.path AS pathname,
    rp.depth + 1 AS depth
  FROM 
    "tiab_container" c
  JOIN 
    recur_pathname rp ON c.parent_id = rp.id
)
SELECT
  id,
  '/' || pathname AS pathname
FROM recur_pathname
ORDER BY pathname;
;
