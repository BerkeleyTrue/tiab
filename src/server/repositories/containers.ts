import {
  containers,
  containersPathnameView,
  containersToTags,
  tags,
  type ContainerSelect,
} from "@/server/db/schema";
import {
  and,
  like,
  eq,
  getTableColumns,
  sql,
  isNull,
} from "drizzle-orm";
import type { Db, Tx } from "@/server/db";
import type { ContainerDTO, DirectoryNode } from "@/types/dto";
import type ItemsRepository from "./items";
import type { TagsRepository } from "./tags";

export class ContainerRepository {
  constructor(
    private db: Db | Tx,
    private session: { userId: number },
    private itemsRepo: ItemsRepository,
    private tagsRepo: TagsRepository,
  ) {}

  /**
   * Creates a new instance of ContainerRepository with a transaction
   * This allows for operations to be performed within a transaction context
   * @param tx The transaction instance
   * @returns A new ContainerRepository instance with the transaction
   */
  withTransaction(tx: Tx): ContainerRepository {
    const tagsRepoWithTx = this.tagsRepo.withTransaction(tx);
    const itemsRepoWithTx = this.itemsRepo.withTransaction(tx);

    return new ContainerRepository(
      tx,
      this.session,
      itemsRepoWithTx,
      tagsRepoWithTx,
    );
  }

  private async _getDirectoryTree(
    parent: ContainerDTO,
    userId: number,
  ): Promise<DirectoryNode> {
    const res: DirectoryNode = {
      parent,
      items: [],
      children: [],
    };

    const children = await this.getChildren({ directoryId: parent.id });

    res.items = await this.itemsRepo.getAll({ containerId: parent.id });

    for (const child of children) {
      const childNode = await this._getDirectoryTree(child, userId);
      res.children.push(childNode);
    }

    return res;
  }

  async create(input: {
    path: string;
    parentId: number | null;
  }): Promise<ContainerDTO | null> {
    const res = await this.db
      .insert(containers)
      .values({
        path: input.path,
        parentId: input.parentId,
        userId: this.session.userId,
      })
      .returning();

    const newContainer = res[0];

    if (!newContainer) {
      return null;
    }

    return {
      ...newContainer,
      tags: [],
    };
  }

  async getById(input: {
    id: number;
    includeDeleted?: boolean;
  }): Promise<ContainerDTO | null> {
    const queries = [
      eq(containers.id, input.id),
      eq(containers.userId, this.session.userId),
    ];

    if (input.includeDeleted !== true) {
      queries.push(eq(containers.isDeleted, input.includeDeleted ?? false));
    }

    const res = await this.db
      .select({
        ...getTableColumns(containers),
        tags: sql<string | null>`group_concat(${tags.name})`,
      })
      .from(containers)
      .where(and(...queries))
      .leftJoin(
        containersToTags,
        eq(containers.id, containersToTags.containerId),
      )
      .leftJoin(tags, eq(containersToTags.tagId, tags.id))
      .groupBy(containers.id)
      .get();

    if (!res) {
      return null;
    }

    return {
      ...res,
      tags: (res.tags?.split(",") ?? []).filter((tag) => tag !== ""),
    };
  }

  async getByPath(input: {
    path: string;
    parentId: number | null;
    includeDeleted?: boolean;
  }): Promise<ContainerDTO | null> {
    const queries = [
      eq(containers.path, input.path),
      eq(containers.userId, this.session.userId),
    ];
    if (input.parentId) {
      queries.push(eq(containers.parentId, input.parentId));
    } else {
      // if no parentId is provided, we want to check for root containers
      queries.push(isNull(containers.parentId));
    }

    if (input.includeDeleted !== true) {
      queries.push(eq(containers.isDeleted, input.includeDeleted ?? false));
    }

    const res = await this.db
      .select({
        ...getTableColumns(containers),
        tags: sql<string | null>`group_concat(${tags.name})`,
      })
      .from(containers)
      .where(and(...queries))
      .leftJoin(
        containersToTags,
        eq(containers.id, containersToTags.containerId),
      )
      .leftJoin(tags, eq(containersToTags.tagId, tags.id))
      .get();

    if (!res) {
      return null;
    }

    return {
      ...res,
      tags: (res.tags?.split(",") ?? []).filter((tag) => tag !== ""),
    };
  }

  async getOrCreate(input: {
    path: string;
    parentId: number | null;
  }): Promise<ContainerDTO | null> {
    const existingContainer = await this.getByPath({
      path: input.path,
      parentId: input.parentId,
      includeDeleted: true,
    });

    // If container doesn't exist, create it
    if (!existingContainer) {
      return await this.create(input);
    }

    if (existingContainer.isDeleted) {
      return await this.update({
        containerId: existingContainer.id,
        unDeleted: true,
      });
    }

    return existingContainer;
  }

  /**
   * Ensures the existence of a container hierarchy based on the provided pathname.
   * This method will create any missing containers in the hierarchy.
   * And will undelete any deleted containers in the hierarchy.
   */
  async ensurePathname(input: {
    pathname: string;
  }): Promise<ContainerSelect | null> {
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

    let parent: ContainerDTO | null = null;
    for (const ancestor of containerAncestry) {
      parent = await this.getOrCreate({
        path: ancestor.path,
        parentId: parent?.id ?? null,
      });
    }

    return parent;
  }

  async search(input: { query: string }): Promise<ContainerSelect[]> {
    const segments = input.query.split("/").filter(Boolean);

    // root query
    let query = "";

    const queries = [
      eq(containers.userId, this.session.userId),
      eq(containers.isDeleted, false),
    ];

    if (input.query !== "/") {
      let pathname = "";
      // "/abc/" or "/abc/def/"
      if (input.query.endsWith("/")) {
        pathname = input.query.slice(0, -1);
        // "/abc" or "/abc/def"
      } else {
        // we have a search query
        query = segments.pop() ?? "-1";
        pathname = segments.join("/");
      }
      const parent = await this.ensurePathname({
        pathname,
      });

      if (!parent) {
        return [];
      }

      queries.push(eq(containers.parentId, parent.id));
    } else {
      // find all root containers
      queries.push(isNull(containers.parentId));
    }

    if (query.length > 0) {
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

  async getChildren(input: {
    directoryId: number;
  }): Promise<ContainerDTO[]> {
    const res = await this.db
      .select({
        ...getTableColumns(containers),
        tags: sql<string | null>`group_concat(${tags.name})`,
      })
      .from(containers)
      .where(
        and(
          eq(containers.parentId, input.directoryId),
          eq(containers.userId, this.session.userId),
          eq(containers.isDeleted, false),
        ),
      )
      .leftJoin(
        containersToTags,
        eq(containers.id, containersToTags.containerId),
      )
      .leftJoin(tags, eq(containersToTags.tagId, tags.id))
      .groupBy(containers.id)
      .all();

    return res.map((res) => ({
      ...res,
      tags: (res.tags?.split(",") ?? []).filter((tag) => tag !== ""),
    }));
  }

  async getDirectoryTree(input: {
    containerId: number;
  }): Promise<DirectoryNode> {
    return this.db.transaction(async (tx) => {
      const repo = this.withTransaction(tx);
      // Handle root path specially
      let parent: ContainerDTO | null;
      if (input.containerId === 0) {
        // Create a virtual root container
        parent = {
          id: 0,
          path: "/",
          parentId: null,
          isDeleted: false,
          isPublic: true,
          userId: this.session.userId,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          tags: [],
        };
      } else {
        // Non-root path handling
        parent = await repo.getById({ id: input.containerId });
      }

      if (!parent) {
        throw new Error("Container not found");
      }

      return repo._getDirectoryTree(parent, this.session.userId);
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

  async update(input: {
    containerId: number;
    isPublic?: boolean;
    unDeleted?: boolean;
  }): Promise<ContainerDTO | null> {
    const res = await this.db
      .update(containers)
      .set({
        isPublic: input.isPublic,
        isDeleted: input.unDeleted ? false : undefined,
      })
      .where(
        and(
          eq(containers.id, input.containerId),
          eq(containers.userId, this.session.userId),
        ),
      )
      .returning();

    const updatedContainer = res[0];

    if (!updatedContainer) {
      return null;
    }

    return {
      ...updatedContainer,
      tags: (
        (await this.tagsRepo.getTagsForContainer({
          containerId: updatedContainer.id,
        })) ?? []
      ).map((tag) => tag.name),
    };
  }

  async delete(input: { containerId: number }): Promise<boolean> {
    return await this.db
      .update(containers)
      .set({
        isDeleted: true,
      })
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
