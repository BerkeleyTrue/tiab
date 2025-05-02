import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { items, containersPathnameView, type ItemWithPathname } from "@/server/db/schema";
import { eq, getTableColumns } from "drizzle-orm";

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
        name: input.name,
        container: input.container,
        description: input.description,
        count: input.count,
      });
    }),

  getAll: publicProcedure.query(async ({ ctx }): Promise<ItemWithPathname[]> => {
    const res = await ctx.db
      .select({
        ...getTableColumns(items),
        pathname: containersPathnameView.pathname,
      })
      .from(items)
      .innerJoin(containersPathnameView, eq(items.containerId, containersPathnameView.id))
      .where(eq(items.userId, ctx.session.user.id));

    return res;
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
        count: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.items.update(input);
    }),
});
