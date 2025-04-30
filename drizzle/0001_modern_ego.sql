CREATE VIEW `containers_pathname` AS 
WITH RECURSIVE recur_pathname AS (
  -- Base case: Start with the target container
  SELECT 
    id,
    path,
    parent,
    path as pathname,
    0 AS depth
  FROM 
    "tiab_container"
  WHERE 
    parent = '/'
  
  UNION ALL
  
  -- Recursive case: Get the parent container
  SELECT 
    c.id,
    c.path,
    c.parent,
    rp.pathname || '/' || c.path AS pathname,
    rp.depth + 1 AS depth
  FROM 
    "tiab_container" c
  JOIN 
    recur_pathname rp ON c.parent = rp.path
)    
-- Select all containers in the path ordered from root to target
SELECT 
  id,
  pathname
FROM recur_pathname 
ORDER BY pathname;
;