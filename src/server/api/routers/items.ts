import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { items, containers, containersPathnameView } from "@/server/db/schema";
import { and, eq, getTableColumns } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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
        const segments = input.container
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
          // Check if container exists
          const existingContainer = await tx
            .select()
            .from(containers)
            .where(
              and(
                eq(containers.path, ancestor.path),
                eq(containers.parent, ancestor.parent),
                eq(containers.userId, ctx.session.user.id),
              ),
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

        const itemContainer = containerAncestry[containerAncestry.length - 1];

        const containerId = await tx
          .select({ id: containers.id })
          .from(containers)
          .where(
            and(
              eq(containers.path, itemContainer?.path ?? ""),
              eq(containers.parent, itemContainer?.parent ?? ""),
              eq(containers.userId, ctx.session.user.id),
            ),
          )
          .get();

        if (!containerId) {
          throw new TRPCError({
            message: `Expected to find item container but found none: ${itemContainer?.path}`,
            code: "NOT_FOUND",
          });
        }

        return await tx.insert(items).values({
          name: input.name,
          userId: ctx.session.user.id,
          containerId: containerId.id,
          description: input.description,
          count: input.count,
        });
      });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
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
});
