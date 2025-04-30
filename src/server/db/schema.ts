// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import type { z } from "zod";
import { relations, sql } from "drizzle-orm";
import { index, sqliteTableCreator, sqliteView, integer, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";


export const createTable = sqliteTableCreator((name) => `tiab_${name}`);

export const users = createTable("user", (d) => ({
  id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  username: d.text({ length: 255 }),
  password: d.text({ length: 255 }),
}));

// a user is a person who can create containers and items
export const userRelationships = relations(users, ({ many }) => ({
  containers: many(containers),
  items: many(items),
}))

// a container contains items or other containers
// it is a tree structure
// the root container is the top level
// the path is the path to the container
// the parent is the path to the parent container
// if you are in the root container, the path is "/"
// the parent is null
// if you are in a sub container, the path is "/subcontainer"
// the parent is "/"
// if you climb from path to parent all the way to the root node, you can build
// the full path to the container like this: "/subcontainer/parent/container"
export const containers = createTable(
  "container",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    path: d.text({ length: 256 }).notNull(),
    parent: d.text({ length: 256 }).notNull(),
    userId: d.integer({ mode: "number" }).notNull(),
    createdAt: d
      .text()
      .notNull()
      .$defaultFn(() => new Date().toISOString()), // When the fast record was created
    updatedAt: d.text().$onUpdate(() => new Date().toISOString()), // When the fast record was last updated
  }),
  // a path and parent path index
  (t) => [index("path_parent_idx").on(t.path, t.parent)],
);

// a container has one user
// a user can have many containers
// a container can have many items
export const containerRelationships = relations(containers, ({ one, many }) => ({
  user: one(users, {
    fields: [containers.userId],
    references: [users.id],
  }),
  items: many(items),
}));

// an item is a thing that can be in a container
// it has a name and a description
// there can only be one item with the same name in a container
// it can be multiple items of the same type by count
export const items = createTable(
  "item",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 256 }).notNull(),
    userId: d.integer({ mode: "number" }).notNull(),
    count: d.integer({ mode: "number" }).default(1),
    description: d.text(),
    containerId: d.integer({ mode: "number" }).notNull(),
    createdAt: d
      .text()
      .notNull()
      .$defaultFn(() => new Date().toISOString()), // When the fast record was created
    updatedAt: d.text().$onUpdate(() => new Date().toISOString()), // When the fast record was last updated
  }),
  // a container index
  (t) => [index("item_container_idx").on(t.containerId, t.name)],
);

export const itemSelectSchema = createInsertSchema(items);

export type Item = z.infer<typeof itemSelectSchema>;

// an item has one container
// an item has one user
export const itemRelationships = relations(items, ({ one }) => ({
  container: one(containers, {
    fields: [items.containerId],
    references: [containers.id],
  }),
  user: one(users, {
    fields: [items.userId],
    references: [users.id],
  }),
}));

export const containersPathnameView = sqliteView("containers_pathname", { 
  id: integer("id").primaryKey(),
  pathname: text("pathname").notNull(),
}).as(sql`
WITH RECURSIVE recur_pathname AS (
  -- Base case: Start with the target container
  SELECT 
    id,
    path,
    parent,
    path as pathname,
    0 AS depth
  FROM 
    ${containers}
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
    ${containers} c
  JOIN 
    recur_pathname rp ON c.parent = rp.path
)    
-- Select all containers in the path ordered from root to target
SELECT 
  id,
  pathname
FROM recur_pathname 
ORDER BY pathname;
`)
