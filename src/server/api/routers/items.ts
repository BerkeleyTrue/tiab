import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";

export const itemsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        container: z.string().min(1),
        description: z.string().optional(),
        count: z.number().optional().default(1),
        isPublic: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const containerRepo = ctx.repos.containers.withTransaction(tx);
        const itemRepo = ctx.repos.items.withTransaction(tx);

        const newCont = await containerRepo.ensurePathname({
          pathname: input.container.trim().toLowerCase().replace(/\s+/g, "_"),
        });

        if (!newCont) {
          throw new Error(
            "Expected to find container for pathname but found none",
          );
        }

        return itemRepo.create({
          name: input.name.trim().toLowerCase().replace(/\s+/g, "_"),
          description: input.description,
          containerId: newCont.id,
          count: input.count,
          isPublic: input.isPublic,
          tags: input.tags,
        });
      });
    }),

  getAll: publicProcedure
    .input(
      z.object({
        containerId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.repos.items.getAll(input);
    }),

  getById: publicProcedure
    .input(z.object({ itemId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.repos.items.getById({ itemId: input.itemId });
    }),

  orphaned: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.repos.items.orphaned();
  }),

  update: publicProcedure
    .input(
      z.object({
        itemId: z.number(),
        container: z.string().min(1),
        name: z.string().optional(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
        count: z.number().optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const containerRepo = ctx.repos.containers.withTransaction(tx);
        const itemRepo = ctx.repos.items.withTransaction(tx);

        const newCont = await containerRepo.ensurePathname({
          pathname: input.container.trim().toLowerCase().replace(/\s+/g, "_"),
        });

        if (!newCont) {
          throw new Error(
            "Expected to find container for pathname but found none",
          );
        }

        return itemRepo.update({
          ...input,
          containerId: newCont.id,
        });
      });
    }),

  moveItemsToContainer: publicProcedure
    .input(
      z.object({
        containerId: z.number(),
        newPathname: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const containerRepo = ctx.repos.containers.withTransaction(tx);
        const itemRepo = ctx.repos.items.withTransaction(tx);

        const newCont = await containerRepo.ensurePathname({
          pathname: input.newPathname.trim().toLowerCase().replace(/\s+/g, "_"),
        });

        if (!newCont) {
          throw new Error(
            "Expected to find container for pathname but found none",
          );
        }

        return itemRepo.moveItemsToContainer({
          containerId: input.containerId,
          newContainerId: newCont.id,
        });
      });
    }),

  moveOrphanedItems: protectedProcedure
    .input(
      z.object({
        itemIds: z.array(z.number()),
        container: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const containerRepo = ctx.repos.containers.withTransaction(tx);
        const itemRepo = ctx.repos.items.withTransaction(tx);

        // Ensure the container exists
        const container = await containerRepo.ensurePathname({
          pathname: input.container.trim().toLowerCase().replace(/\s+/g, "_"),
        });

        if (!container) {
          throw new Error(`Container not found: ${input.container}`);
        }

        // Move each item to the container
        const results = await Promise.all(
          input.itemIds.map(itemId => 
            itemRepo.update({
              itemId,
              containerId: container.id,
            })
          )
        );

        return results.every(result => result !== null);
      });
    }),

  delete: publicProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.items.delete({ itemId: input.itemId });
    }),
});
