import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const itemsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        container: z.string().min(1),
        description: z.string().optional(),
        count: z.number().optional().default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.items.create({
        name: input.name.trim().toLowerCase().replace(/\s+/g, "_"),
        container: input.container.trim().toLowerCase().replace(/\s+/g, "_"),
        description: input.description,
        count: input.count,
      });
    }),

  getAll: publicProcedure
    .input(
      z.object({
        containerId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.repos.items.getAll(input);
    }),

  getById: publicProcedure
    .input(z.object({ itemId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.repos.items.getById({ itemId: input.itemId });
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.items.update(input);
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
        const itemRepo = ctx.repos.items.withTransaction(tx);

        return itemRepo.moveItemsToContainer(input);
      });
    }),

  delete: publicProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.items.delete({ itemId: input.itemId });
    }),
});
