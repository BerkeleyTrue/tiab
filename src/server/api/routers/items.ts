import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { items } from "@/server/db/schema";
import { eq } from "drizzle-orm";

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
      await ctx.db.insert(items).values({
        name: input.name,
        userId: ctx.session.user.id,
        container: input.container,
        description: input.description,
        count: input.count,
      });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const res = await ctx.db
      .select()
      .from(items)
      .where(eq(items.userId, ctx.session.user.id));

    return res;
  }),
});
