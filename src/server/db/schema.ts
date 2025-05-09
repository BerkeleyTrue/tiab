// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import type { z } from "zod";
import { getTableColumns, relations, sql } from "drizzle-orm";
import {
  uniqueIndex,
  sqliteTableCreator,
  sqliteView,
  integer,
  text,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

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
  tags: many(usersToTags),
}));

// Many-to-many relationship between users and tags
export const usersToTags = createTable(
  "users_to_tags",
  (d) => ({
    userId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => users.id),
    tagId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => tags.id),
    createdAt: d
      .text()
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: d.text().$onUpdate(() => new Date().toISOString()),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.tagId] })],
);

export const usersToTagsRelationships = relations(usersToTags, ({ one }) => ({
  user: one(users, {
    fields: [usersToTags.userId],
    references: [users.id],
  }),
  tag: one(tags, {
    fields: [usersToTags.tagId],
    references: [tags.id],
  }),
}));

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
    isPublic: d.integer({ mode: "boolean" }).default(false), // 0 = private, 1 = public
    isDeleted: d.integer({ mode: "boolean" }).default(false), // 0 = not deleted, 1 = deleted
    createdAt: d
      .text()
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: d.text().$onUpdate(() => new Date().toISOString()),
  }),
  // a path and parent path index
  (t) => [uniqueIndex("path_parent_idx").on(t.path, t.parent)],
);

// a container has one user
// a user can have many containers
// a container can have many items
export const containerRelationships = relations(
  containers,
  ({ one, many }) => ({
    user: one(users, {
      fields: [containers.userId],
      references: [users.id],
    }),
    items: many(items),
    parent: one(containers, {
      fields: [containers.parent],
      references: [containers.path],
    }),
    children: many(containers),
    tags: many(containersToTags),
  }),
);

// a container can have many tags
// a tag can have many containers
export const containersToTags = createTable(
  "containers_to_tags",
  (d) => ({
    containerId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => containers.id),
    tagId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => tags.id),
    createdAt: d
      .text()
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: d.text().$onUpdate(() => new Date().toISOString()),
  }),
  (t) => [primaryKey({ columns: [t.containerId, t.tagId] })],
);

export const containersToTagsRelationships = relations(
  containersToTags,
  ({ one }) => ({
    tag: one(tags, {
      fields: [containersToTags.tagId],
      references: [tags.id],
    }),
    container: one(containers, {
      fields: [containersToTags.containerId],
      references: [containers.id],
    }),
  }),
);

const containerSelectSchema = createSelectSchema(containers); // eslint-disable-line @typescript-eslint/no-unused-vars
const containerInsertSchema = createInsertSchema(containers); // eslint-disable-line @typescript-eslint/no-unused-vars

export type Container = z.infer<typeof containerSelectSchema>;
export type ContainerInsert = z.infer<typeof containerInsertSchema>;

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
    isPublic: d.integer({ mode: "boolean" }).default(false), // 0 = private, 1 = public
    isDeleted: d.integer({ mode: "boolean" }).default(false), // 0 = not deleted, 1 = deleted
    createdAt: d
      .text()
      .notNull()
      .$defaultFn(() => new Date().toISOString()), // When the fast record was created
    updatedAt: d.text().$onUpdate(() => new Date().toISOString()), // When the fast record was last updated
  }),
  // a container index
  (t) => [uniqueIndex("item_container_idx").on(t.containerId, t.name)],
);

const itemSelectSchema = createSelectSchema(items); // eslint-disable-line @typescript-eslint/no-unused-vars
const createItemSchema = createInsertSchema(items); // eslint-disable-line @typescript-eslint/no-unused-vars

export type Item = z.infer<typeof itemSelectSchema>;
export type ItemInsert = z.infer<typeof createItemSchema>;

export type ItemWithPathname = Item & {
  pathname: string;
};

// an item can have many tags
export const itemsToTags = createTable(
  "items_to_tags",
  (d) => ({
    itemId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => items.id),
    tagId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => tags.id),
    createdAt: d
      .text()
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: d.text().$onUpdate(() => new Date().toISOString()),
  }),
  (t) => [primaryKey({ columns: [t.itemId, t.tagId] })],
);

// an item has one container
// an item has one user
export const itemRelationships = relations(items, ({ one, many }) => ({
  container: one(containers, {
    fields: [items.containerId],
    references: [containers.id],
  }),
  user: one(users, {
    fields: [items.userId],
    references: [users.id],
  }),
  tags: many(itemsToTags),
}));

// a tag can be used to categorize items and containers
export const tags = createTable(
  "tag",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 256 }).notNull(),
    createdAt: d
      .text()
      .notNull()
      .$defaultFn(() => new Date().toISOString()), // When the fast record was created
    updatedAt: d.text().$onUpdate(() => new Date().toISOString()), // When the fast record was last updated
  }),
  (t) => [uniqueIndex("tag_name_idx").on(t.name)],
);

// a tag can have many items
// a tag can have many containers
// a tag can have many users
export const tagsRelationships = relations(tags, ({ many }) => ({
  containers: many(containersToTags),
  items: many(itemsToTags),
  users: many(usersToTags),
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
  '/' || pathname as pathname
FROM recur_pathname 
ORDER BY pathname;
`);

export type DirectoryNode = {
  parent: Container;
  items?: ItemWithPathname[];
  children: DirectoryNode[];
};

export const itemWithPathnameColumns = {
  ...getTableColumns(items),
  pathname: containersPathnameView.pathname,
};
