DROP VIEW `containers_pathname`;--> statement-breakpoint
CREATE VIEW `containers_pathname` AS 
WITH RECURSIVE recur_pathname AS (
  -- Base case: top-level containers (no parent)
  SELECT
    id,
    path,
    parentId,
    path AS pathname,
    0 AS depth
  FROM 
    "tiab_container"
  WHERE 
    parentId IS NULL

  UNION ALL

  -- Recursive case: add child containers to the path
  SELECT
    c.id,
    c.path,
    c.parentId,
    rp.pathname || '/' || c.path AS pathname,
    rp.depth + 1 AS depth
  FROM 
    "tiab_container" c
  JOIN 
    recur_pathname rp ON c.parentId = rp.id
)
SELECT
  id,
  '/' || pathname AS pathname
FROM recur_pathname
ORDER BY pathname;
;