import { and, eq, getTableColumns } from "drizzle-orm";
import {
  items,
  containersPathnameView,
  type ItemWithPathname,
} from "@/server/db/schema";
import type { Db, Tx } from "../db";
import type { ContainerRepository } from "./containers";

export type CreateItemSchema = {
  name: string;
  description?: string;
  count?: number;
  // The container path is a string that represents the hierarchy of containers
  container: string;
};

export default class ItemsRepository {
  constructor(
    private db: Db | Tx,
    private session: { userId: number },
    private containerRepo: ContainerRepository,
  ) {}

  /**
   * Creates a new instance of ItemsRepository with a transaction
   * This allows for operations to be performed within a transaction context
   * @param tx The transaction instance
   * @returns A new ItemsRepository instance with the transaction
   */
  withTransaction(tx: Tx): ItemsRepository {
    // Create a new container repository with the transaction
    const containerRepoWithTx = this.containerRepo.withTransaction(tx);

    // Create a new items repository with the transaction and the container repository
    return new ItemsRepository(tx, this.session, containerRepoWithTx);
  }

  async create(
    input: CreateItemSchema & { container: string },
  ): Promise<ItemWithPathname | null> {
    return this.db.transaction(async (tx) => {
      const containerTx = this.containerRepo.withTransaction(tx);
      const containerBase = await containerTx.ensurePathname({
        pathname: input.container,
      });

      if (!containerBase) {
        throw new Error(
          `Expected to find item container but found none for: ${input.container}`,
        );
      }

      const res = await tx
        .insert(items)
        .values({
          name: input.name,
          userId: this.session.userId,
          containerId: containerBase.id,
          description: input.description,
          count: input.count,
        })
        .returning();

      const newItem = res[0];

      if (!newItem) {
        return null;
      }

      return {
        ...newItem,
        pathname: await this.getPathname({ itemId: newItem.id }) ?? "",
      };
    });
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

  async getById(input: { itemId: number }): Promise<ItemWithPathname | null> {
    const res = await this.db
      .select({
        ...getTableColumns(items),
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
    return res ?? null;
  }

  async getAll(): Promise<ItemWithPathname[]> {
    return await this.db
      .select({
        ...getTableColumns(items),
        pathname: containersPathnameView.pathname,
      })
      .from(items)
      .innerJoin(
        containersPathnameView,
        eq(items.containerId, containersPathnameView.id),
      )
      .where(eq(items.userId, this.session.userId));
  }

  async update(input: {
    itemId: number;
    container: string;
    name?: string;
    description?: string;
    count?: number;
  }): Promise<ItemWithPathname | null> {
    return this.db.transaction(async (tx) => {
      const itemRepo = this.withTransaction(tx);
      const item = await itemRepo.getById({ itemId: input.itemId });
      if (!item) {
        throw new Error(`Item with ID ${input.itemId} not found`);
      }

      const containers = this.containerRepo.withTransaction(tx);
      const containerBase = await containers.ensurePathname({
        pathname: input.container,
      });

      if (!containerBase) {
        throw new Error(
          `Expected to find item container but found none for: ${input.container}`,
        );
      }

      const res = await tx
        .insert(items)
        .values({
          name: input.name ?? item.name,
          userId: this.session.userId,
          containerId: containerBase.id,
          description: input.description ?? item.description,
          count: input.count ?? item.count,
        })
        .returning();

      const newItem = res[0];

      if (!newItem) {
        return null;
      }

      return {
        ...newItem,
        pathname: await this.getPathname({ itemId: newItem.id }) ?? "",
      };
    });
  }
}
