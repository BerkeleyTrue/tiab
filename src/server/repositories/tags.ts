import { and, or, like, eq, getTableColumns, not, count } from "drizzle-orm";
import {
  containers,
  containersToTags,
  items,
  itemsToTags,
  tags,
  usersToTags,
} from "@/server/db/schema";
import type { Db, Tx } from "@/server/db";

export type TagSchema = {
  name: string;
};

export type TagWithUsers = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string | null;
  users: { userId: number }[];
};

export class TagsRepository {
  constructor(
    private db: Db | Tx,
    private session: { userId: number },
  ) {}

  /**
   * Creates a new instance of TagsRepository with a transaction
   * This allows for operations to be performed within a transaction context
   * @param tx The transaction instance
   * @returns A new TagsRepository instance with the transaction
   */
  withTransaction(tx: Tx): TagsRepository {
    return new TagsRepository(tx, this.session);
  }

  /**
   * Creates a new tag and associates it with the current user
   * If a tag with the same name already exists for this user, it returns that tag
   * should be done in a transaction
   * @returns The created tag
   */
  async create(input: TagSchema) {
    // Check if tag with the same name already exists for this user
    const existingTag = await this.db
      .select(getTableColumns(tags))
      .from(tags)
      .innerJoin(usersToTags, eq(tags.id, usersToTags.tagId))
      .where(
        and(
          eq(tags.name, input.name),
          eq(usersToTags.userId, this.session.userId),
        ),
      )
      .get();

    if (existingTag) {
      return existingTag;
    }

    // Create the tag
    const res = await this.db
      .insert(tags)
      .values({
        name: input.name,
      })
      .returning();

    const newTag = res[0];

    if (!newTag) {
      return null;
    }

    // Associate the tag with the current user
    await this.db
      .insert(usersToTags)
      .values({
        tagId: newTag.id,
        userId: this.session.userId,
      })
      .onConflictDoNothing();

    return newTag;
  }

  /**
   * Gets all tags for the current user
   * @returns All tags for the current user
   */
  async getAll() {
    return await this.db
      .select({
        ...getTableColumns(tags),
      })
      .from(tags)
      .innerJoin(usersToTags, eq(tags.id, usersToTags.tagId))
      .where(eq(usersToTags.userId, this.session.userId));
  }

  /**
   * Gets a tag by ID for the current user
   * @returns The tag or null if not found
   */
  async getById(input: { tagId: number }) {
    return await this.db
      .select()
      .from(tags)
      .innerJoin(usersToTags, eq(tags.id, usersToTags.tagId))
      .where(
        and(
          eq(tags.id, input.tagId),
          eq(usersToTags.userId, this.session.userId),
        ),
      )
      .get();
  }

  async search(input: { query: string }) {
    return await this.db
      .select(getTableColumns(tags))
      .from(tags)
      .innerJoin(usersToTags, eq(tags.id, usersToTags.tagId))
      .where(
        and(
          eq(usersToTags.userId, this.session.userId),
          or(eq(tags.name, input.query), like(tags.name, `%${input.query}%`)),
        ),
      );
  }

  /**
   * Updates a tag for the current user
   * @returns The updated tag or null if not found
   */
  async update(input: { tagId: number; name: string }) {
    return this.db.transaction(async (tx) => {
      // Check if tag exists and is associated with the current user
      const existingTag = await tx
        .select({
          ...getTableColumns(tags),
        })
        .from(tags)
        .innerJoin(usersToTags, eq(tags.id, usersToTags.tagId))
        .where(
          and(
            eq(tags.id, input.tagId),
            eq(usersToTags.userId, this.session.userId),
          ),
        )
        .get();

      if (!existingTag) {
        throw new Error(
          `Tag with ID ${input.tagId} not found or not associated with current user`,
        );
      }

      // Check if another tag with the same name already exists for this user
      const duplicateTag = await tx
        .select({
          ...getTableColumns(tags),
        })
        .from(tags)
        .innerJoin(usersToTags, eq(tags.id, usersToTags.tagId))
        .where(
          and(
            eq(tags.name, input.name),
            eq(usersToTags.userId, this.session.userId),
            not(eq(tags.id, input.tagId)), // Not the same tag
          ),
        )
        .get();

      if (duplicateTag) {
        throw new Error(
          `Another tag with name "${input.name}" already exists for this user`,
        );
      }

      // Update the tag
      const res = await tx
        .update(tags)
        .set({
          name: input.name,
        })
        .where(eq(tags.id, input.tagId))
        .returning();

      return res[0] ?? null;
    });
  }

  /**
   * Deletes a tag if it's only associated with the current user,
   * otherwise just removes the association
   * @returns True if the operation was successful, false otherwise
   */
  async delete(input: { tagId: number }) {
    return this.db.transaction(async (tx) => {
      // Check if tag exists and is associated with the current user
      const existingTag = await tx
        .select({
          ...getTableColumns(tags),
        })
        .from(tags)
        .innerJoin(usersToTags, eq(tags.id, usersToTags.tagId))
        .where(
          and(
            eq(tags.id, input.tagId),
            eq(usersToTags.userId, this.session.userId),
          ),
        )
        .get();

      if (!existingTag) {
        throw new Error(
          `Tag with ID ${input.tagId} not found or not associated with current user`,
        );
      }

      // Count how many users are associated with this tag
      const userCount = await tx
        .select({ count: count() })
        .from(usersToTags)
        .where(eq(usersToTags.tagId, input.tagId))
        .get();

      // Delete the user-tag relationship
      await tx
        .delete(usersToTags)
        .where(
          and(
            eq(usersToTags.tagId, input.tagId),
            eq(usersToTags.userId, this.session.userId),
          ),
        );

      // If this was the only user associated with the tag, delete the tag as well
      if (userCount?.count === 1) {
        await tx.delete(tags).where(eq(tags.id, input.tagId));
      }

      return true;
    });
  }

  /**
   * Assigns a tag to a user
   * @returns True if the tag was assigned, false otherwise
   */
  async assignTagToUser(input: { tagId: number; userId: number }) {
    return this.db.transaction(async (tx) => {
      // Check if tag exists
      const existingTag = await tx
        .select()
        .from(tags)
        .where(eq(tags.id, input.tagId))
        .get();

      if (!existingTag) {
        throw new Error(`Tag with ID ${input.tagId} not found`);
      }

      // Check if relationship already exists
      const existingRelationship = await tx
        .select()
        .from(usersToTags)
        .where(
          and(
            eq(usersToTags.tagId, input.tagId),
            eq(usersToTags.userId, input.userId),
          ),
        )
        .get();

      if (existingRelationship) {
        return true; // Already assigned
      }

      // Create the relationship
      await tx.insert(usersToTags).values({
        tagId: input.tagId,
        userId: input.userId,
      });

      return true;
    });
  }

  /**
   * Removes a tag from a user
   * @returns True if the tag was removed, false otherwise
   */
  async removeTagFromUser(input: { tagId: number; userId: number }) {
    const res = await this.db
      .delete(usersToTags)
      .where(
        and(
          eq(usersToTags.tagId, input.tagId),
          eq(usersToTags.userId, input.userId),
        ),
      );

    return res.rowsAffected > 0;
  }

  /**
   * Gets all tags for a user
   */
  async getTagsForUser(input: { userId: number }) {
    return await this.db
      .select(getTableColumns(tags))
      .from(tags)
      .innerJoin(usersToTags, eq(tags.id, usersToTags.tagId))
      .where(eq(usersToTags.userId, input.userId));
  }

  /**
   * Get all the tags for an item
   */
  async getTagsForItem(input: { itemId: number }) {
    return await this.db
      .select(getTableColumns(tags))
      .from(tags)
      .innerJoin(itemsToTags, eq(tags.id, itemsToTags.tagId))
      .innerJoin(items, eq(items.id, itemsToTags.itemId))
      .where(eq(items.id, input.itemId));
  }

  /**
   * Get all the tags for a container
   */
  async getTagsForContainer(input: { containerId: number }) {
    return await this.db
      .select(getTableColumns(tags))
      .from(tags)
      .innerJoin(containersToTags, eq(tags.id, containersToTags.tagId))
      .innerJoin(containers, eq(containers.id, containersToTags.containerId))
      .where(eq(containers.id, input.containerId));
  }

  /**
   * Assigns many tags to an item
   * @returns True if the tag was assigned, false otherwise
   */
  async assignTagsToItem(input: { tags: string[]; itemId: number }) {
    const tags = await Promise.all(
      input.tags.map((tag) => this.create({ name: tag })),
    );

    const newTags = tags.filter((tag) => tag !== null);

    const res = await this.db
      .insert(itemsToTags)
      .values(
        tags
          .filter((tag) => tag !== null)
          .map((tag) => ({
            tagId: tag.id,
            itemId: input.itemId,
          })),
      )
      .onConflictDoNothing()
      .returning();

    return res.length > 0;
  }
}
