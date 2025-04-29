import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { items, containers } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

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
      return await ctx.db.transaction(async (tx) => {
        // Process container path and create container hierarchy
        const segments = input.container.split("/").filter(Boolean);
        const containerAncestry = segments.map((path, idx) => {
          return {
            path: path,
            parent: segments[idx - 1] ?? "/",
          };
        });

        for (const ancestor of containerAncestry) {
          
          // Check if container exists
          const existingContainer = await tx
            .select()
            .from(containers)
            .where(
              and(
                eq(containers.path, ancestor.path),
                eq(containers.parent, ancestor.parent),
                eq(containers.userId, ctx.session.user.id),
              )
            )
            .get();
          
          // If container doesn't exist, create it
          if (!existingContainer) {
            await tx.insert(containers).values({
              path: ancestor.path,
              parent: ancestor.parent,
              userId: ctx.session.user.id,
            });
          }
        }
        
        return await tx.insert(items).values({
          name: input.name,
          userId: ctx.session.user.id,
          container: input.container,
          description: input.description,
          count: input.count,
        });
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
