import {
  containers,
  containersPathnameView,
  items,
  type Container,
  type DirectoryNode,
} from "@/server/db/schema";
import { and, like, eq, getTableColumns } from "drizzle-orm";
import type { Db, Tx } from "@/server/db";

export async function getDirectoryTree(
  db: Tx,
  parent: Container,
  userId: number,
): Promise<DirectoryNode> {
  const res: DirectoryNode = {
    parent,
    items: [],
    children: [],
  };

  const children = await db
    .select()
    .from(containers)
    .where(
      and(eq(containers.parent, parent.path), eq(containers.userId, userId)),
    )
    .all();

  res.items = await db
    .select({
      ...getTableColumns(items),
      pathname: containersPathnameView.pathname,
    })
    .from(items)
    .innerJoin(
      containersPathnameView,
      eq(items.containerId, containersPathnameView.id),
    )
    .where(and(eq(items.containerId, parent.id), eq(items.userId, userId)))
    .all();

  for (const child of children) {
    const childNode = await getDirectoryTree(db, child, userId);
    res.children.push(childNode);
  }

  return res;
}

export class ContainerRepository {
  constructor(
    private db: Db | Tx,
    private session: { userId: number },
  ) {}

  /**
   * Creates a new instance of ContainerRepository with a transaction
   * This allows for operations to be performed within a transaction context
   * @param tx The transaction instance
   * @returns A new ContainerRepository instance with the transaction
   */
  withTransaction(tx: Tx): ContainerRepository {
    return new ContainerRepository(tx, this.session);
  }

  async create(input: {
    path: string;
    parent: string;
  }): Promise<Container | null> {
    const res = await this.db
      .insert(containers)
      .values({
        path: input.path,
        parent: input.parent,
        userId: this.session.userId,
      })
      .returning();

    return res[0] ?? null;
  }

  async getById(input: { id: number }): Promise<Container | null> {
    const res = await this.db
      .select()
      .from(containers)
      .where(
        and(
          eq(containers.id, input.id),
          eq(containers.userId, this.session.userId),
        ),
      )
      .get();

    return res ?? null;
  }

  async getByPath(input: {
    path: string;
    parent: string;
  }): Promise<Container | null> {
    const res = await this.db
      .select()
      .from(containers)
      .where(
        and(
          eq(containers.path, input.path),
          eq(containers.parent, input.parent),
          eq(containers.userId, this.session.userId),
        ),
      )
      .get();

    return res ?? null;
  }

  async getOrCreate(input: {
    path: string;
    parent: string;
  }): Promise<Container | null> {
    const existingContainer = await this.getByPath({
      path: input.path,
      parent: input.parent,
    });

    // If container doesn't exist, create it
    if (!existingContainer) {
      return await this.create({
        path: input.path,
        parent: input.parent,
      });
    }

    return existingContainer;
  }

  async ensurePathname(input: { pathname: string }): Promise<Container | null> {
    // Process container path and create container hierarchy
    const segments = input.pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => segment.trim().toLowerCase());

    const containerAncestry = segments.map((path, idx) => {
      return {
        path: path,
        parent: segments[idx - 1] ?? "/",
      };
    });

    for (const ancestor of containerAncestry) {
      await this.getOrCreate({
        path: ancestor.path,
        parent: ancestor.parent,
      });
    }

    const itemContainer = containerAncestry[containerAncestry.length - 1];

    const containerBase = await this.getByPath({
      path: itemContainer?.path ?? "",
      parent: itemContainer?.parent ?? "",
    });

    return containerBase;
  }

  async search(input: { query: string }): Promise<Container[]> {
    const segments = input.query.split("/").filter(Boolean);

    // root query
    let query = "";
    let parent = "/";

    if (input.query !== "/") {
      // "/abc/" or "/abc/def/"
      if (input.query.endsWith("/")) {
        parent = segments.pop() ?? "/";
        // "/abc" or "/abc/def"
      } else {
        // we have a search query
        parent = segments[segments.length - 2] ?? "/";
        query = segments.pop() ?? "-1";
      }
    }

    const queries = [
      eq(containers.parent, parent),
      eq(containers.userId, this.session.userId),
    ];

    if (query?.length) {
      queries.push(like(containers.path, `%${query}%`));
    }

    const res = await this.db
      .select()
      .from(containers)
      .where(and(...queries))
      .limit(10)
      .all();

    return res;
  }

  async getDirectoryTree(input: {
    containerId: number;
  }): Promise<DirectoryNode> {
    return this.db.transaction(async (tx) => {
      // Handle root path specially
      let parent: Container | undefined;
      if (input.containerId === 0) {
        // Create a virtual root container
        parent = {
          id: 0,
          path: "/",
          parent: "",
          userId: this.session.userId,
          createdAt: new Date().toISOString(),
          updatedAt: null,
        };
      } else {
        // Non-root path handling
        parent = await tx
          .select()
          .from(containers)
          .where(
            and(
              eq(containers.id, input.containerId),
              eq(containers.userId, this.session.userId),
            ),
          )
          .get();
      }

      if (!parent) {
        throw new Error("Container not found");
      }

      return getDirectoryTree(tx, parent, this.session.userId);
    });
  }

  async getPathname(input: { containerId: number }): Promise<string | null> {
    const res = await this.db
      .select({
        pathname: containersPathnameView.pathname,
      })
      .from(containersPathnameView)
      .where(eq(containersPathnameView.id, input.containerId))
      .get();

    return res?.pathname ?? null;
  }

  async delete(input: { containerId: number }): Promise<boolean> {
    return await this.db
      .delete(containers)
      .where(
        and(
          eq(containers.id, input.containerId),
          eq(containers.userId, this.session.userId),
        ),
      )
      .execute()
      .then((res) => res.rowsAffected > 0);
  }
}
