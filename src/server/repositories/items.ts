import {
  and,
  count,
  eq,
  inArray,
  notInArray,
  isNotNull,
  sql,
} from "drizzle-orm";
import {
  items,
  tags,
  containersPathnameView,
  itemWithPathnameColumns,
  itemsToTags,
  containers,
} from "@/server/db/schema";
import type { Db, Tx } from "../db";
import type { ItemDTO } from "@/types/dto";
import type { TagsRepository } from "./tags";

export default class ItemsRepository {
  constructor(
    private db: Db | Tx,
    private session: { userId: number },
    private tagsRepo: TagsRepository,
  ) {}

  /**
   * Creates a new instance of ItemsRepository with a transaction
   * This allows for operations to be performed within a transaction context
   * @param tx The transaction instance
   * @returns A new ItemsRepository instance with the transaction
   */
  withTransaction(tx: Tx): ItemsRepository {
    const tagsRepoWithTx = this.tagsRepo.withTransaction(tx);

    // Create a new items repository with the transaction and the container repository
    return new ItemsRepository(tx, this.session, tagsRepoWithTx);
  }

  /**
   * Creates a new item
   */
  async create(input: {
    name: string;
    description?: string;
    count?: number;
    containerId: number;
    isPublic?: boolean;
    tags?: string[];
  }): Promise<ItemDTO | null> {
    const res = await this.db
      .insert(items)
      .values({
        name: input.name,
        userId: this.session.userId,
        containerId: input.containerId,
        description: input.description,
        count: input.count,
        isPublic: input.isPublic ?? false,
      })
      .returning();

    const newItem = res[0];

    if (!newItem) {
      return null;
    }

    // Update tags
    await this.tagsRepo.assignTagsToItem({
      itemId: newItem.id,
      tags: input.tags ?? [],
    });

    return {
      ...newItem,
      pathname: (await this.getPathname({ itemId: newItem.id })) ?? "",
      tags: (
        (await this.tagsRepo.getTagsForItem({ itemId: newItem.id })) ?? []
      ).map((tag) => tag.name),
    };
  }

  async getPathname(input: { itemId: number }): Promise<string | null> {
    const res = await this.db
      .select({
        pathname: containersPathnameView.pathname,
      })
      .from(items)
      .innerJoin(
        containersPathnameView,
        eq(items.containerId, containersPathnameView.id),
      )
      .where(
        and(eq(items.id, input.itemId), eq(items.userId, this.session.userId)),
      )
      .get();

    return res?.pathname ?? null;
  }

  async getById(input: {
    itemId: number;
    includeDeleted?: boolean;
  }): Promise<ItemDTO | null> {
    const queries = [
      eq(items.id, input.itemId),
      eq(items.userId, this.session.userId),
    ];

    if (input.includeDeleted !== true) {
      queries.push(eq(items.isDeleted, input.includeDeleted ?? false));
    }

    const res = await this.db
      .select({
        ...itemWithPathnameColumns,
        tagsString: sql<string | null>`group_concat(${tags.name})`,
      })
      .from(items)
      .where(and(...queries))
      .leftJoin(
        containersPathnameView,
        eq(items.containerId, containersPathnameView.id),
      )
      .leftJoin(itemsToTags, eq(items.id, itemsToTags.itemId))
      .leftJoin(tags, eq(itemsToTags.tagId, tags.id))
      .groupBy(items.id)
      .get();

    if (!res) {
      return null;
    }

    const tagList =
      res.tagsString?.split(",").filter((tag) => tag !== "") ?? [];

    return {
      ...res,
      tags: tagList,
      pathname: res.pathname ?? "/", // Ensure pathname is always a string
    };
  }

  async getAll({
    containerId,
    includeDeleted = false,
  }: {
    containerId?: number;
    includeDeleted?: boolean;
  }): Promise<ItemDTO[]> {
    const queries = [eq(items.userId, this.session.userId)];

    if (containerId) {
      queries.push(eq(items.containerId, containerId));
    }

    if (includeDeleted !== true) {
      queries.push(eq(items.isDeleted, includeDeleted ?? false));
    }

    const res = await this.db
      .select({
        ...itemWithPathnameColumns,
        tagsString: sql<string | null>`group_concat(${tags.name})`,
      })
      .from(items)
      .where(and(...queries))
      .innerJoin(
        containersPathnameView,
        eq(items.containerId, containersPathnameView.id),
      )
      .leftJoin(itemsToTags, eq(items.id, itemsToTags.itemId))
      .leftJoin(tags, eq(itemsToTags.tagId, tags.id))
      .groupBy(items.id);

    return res.map(({ tagsString, ...item }) => {
      const tagsList = tagsString?.split(",").filter((tag) => tag !== "") ?? [];

      return { ...item, tags: tagsList };
    });
  }

  async getCount(input: { containerId?: number }): Promise<number> {
    const queries = [eq(items.userId, this.session.userId)];

    if (input.containerId) {
      queries.push(eq(items.containerId, input.containerId));
    }

    const countRes = await this.db
      .select({ count: count() })
      .from(items)
      .where(and(...queries))
      .get();

    if (!countRes) {
      return 0;
    }

    return countRes.count;
  }

  /**
   * Updates an item
   * should be done in a transaction
   * @returns The updated item
   */
  async update(input: {
    itemId: number;
    containerId: number;
    name?: string;
    description?: string;
    count?: number;
    isPublic?: boolean;
    tags?: string[];
  }): Promise<ItemDTO | null> {
    const item = await this.getById({ itemId: input.itemId });

    if (!item) {
      throw new Error(`Item with ID ${input.itemId} not found`);
    }

    const res = await this.db
      .update(items)
      .set({
        containerId: input.containerId,
        userId: this.session.userId,

        name: input.name ?? item.name,
        isPublic: input.isPublic ?? item.isPublic ?? false,
        description: input.description ?? item.description,
        count: input.count ?? item.count,
      })
      .where(
        and(eq(items.id, input.itemId), eq(items.userId, this.session.userId)),
      )
      .returning();

    const newItem = res[0];

    if (!newItem) {
      return null;
    }

    // Update tags
    await this.tagsRepo.assignTagsToItem({
      itemId: newItem.id,
      tags: input.tags ?? [],
    });

    return {
      ...newItem,
      pathname: (await this.getPathname({ itemId: newItem.id })) ?? "",
      tags: (
        (await this.tagsRepo.getTagsForItem({ itemId: newItem.id })) ?? []
      ).map((tag) => tag.name),
    };
  }

  /**
   * Moves items to a new container
   */
  async moveItemsToContainer({
    containerId,
    newContainerId,
  }: {
    containerId: number;
    newContainerId: number;
  }) {
    const itemsToMove = await this.getAll({ containerId });

    if (itemsToMove.length === 0) {
      return false;
    }

    const itemIds = itemsToMove.map((item) => item.id);

    return await this.db
      .update(items)
      .set({
        containerId: newContainerId,
      })
      .where(
        and(eq(items.userId, this.session.userId), inArray(items.id, itemIds)),
      )
      .execute()
      .then((res) => {
        return res.rowsAffected > 0;
      });
  }

  async delete(input: { itemId: number }): Promise<boolean> {
    return this.db
      .update(items)
      .set({
        isDeleted: true,
      })
      .where(
        and(eq(items.id, input.itemId), eq(items.userId, this.session.userId)),
      )
      .returning()
      .then((res) => res.length > 0);
  }

  /**
   * Orphan items that are not in any container or a deleted container
   * @returns ItemDTO[]
   */
  async orphaned() {
    const allContainerIdsSq = this.db
      .select({ id: containers.id })
      .from(containers);
    // get all items in containers that do not exist
    const itemsInDeletedContainers = await this.db
      .select({
        id: items.id,
        name: items.name,
      })
      .from(items)
      .where(
        and(
          isNotNull(items.containerId),
          notInArray(items.containerId, allContainerIdsSq),
          eq(items.isDeleted, false),
        ),
      );

    return itemsInDeletedContainers;
  }
}
