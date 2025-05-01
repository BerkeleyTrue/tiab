import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  containers,
  items,
  type Container,
  type DirectoryNode,
} from "@/server/db/schema";
import { and, like, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { Tx } from "@/server/db";

async function getDirectoryTree(
  db: Tx,
  parent: Container,
  userId: number,
): Promise<DirectoryNode> {
  const res: DirectoryNode = {
    parent,
    items: [],
    children: [],
  };

  const children = await db
    .select()
    .from(containers)
    .where(
      and(eq(containers.parent, parent.path), eq(containers.userId, userId)),
    )
    .all();

  res.items = await db
    .select()
    .from(items)
    .where(and(eq(items.containerId, parent.id), eq(items.userId, userId)))
    .all();

  for (const child of children) {
    const childNode = await getDirectoryTree(db, child, userId);
    res.children.push(childNode);
  }

  return res;
}

export const containerRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        path: z.string().min(1),
        parent: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.db.insert(containers).values({
        path: input.path,
        parent: input.parent,
        userId: ctx.session.user.id,
      });

      return res;
    }),

  searchContainer: publicProcedure
    .input(
      z.object({
        // query is a path or container name
        // starting with /
        query: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const segments = input.query.split("/").filter(Boolean);

      // root query
      let query = "";
      let parent = "/";

      if (input.query !== "/") {
        // "/abc/" or "/abc/def/"
        if (input.query.endsWith("/")) {
          parent = segments.pop() ?? "/";
          // "/abc" or "/abc/def"
        } else {
          // we have a search query
          parent = segments[segments.length - 2] ?? "/";
          query = segments.pop() ?? "-1";
        }
      }

      const queries = [
        eq(containers.parent, parent),
        eq(containers.userId, ctx.session.user.id),
      ];

      if (query?.length) {
        queries.push(like(containers.path, `%${query}%`));
      }

      const res = await ctx.db
        .select()
        .from(containers)
        .where(and(...queries))
        .limit(10)
        .all();

      return res;
    }),

  getDirectoryTree: publicProcedure
    .input(
      z.object({
        containerId: z.number(),
      }),
    )
    .query(async ({ ctx, input }): Promise<DirectoryNode> => {
      return ctx.db.transaction(async (tx) => {
        // Handle root path specially
        let parent: Container | undefined;
        if (input.containerId === 0) {
          // Create a virtual root container
          parent = {
            id: 0,
            path: "/",
            parent: "",
            userId: ctx.session.user.id,
            createdAt: new Date().toISOString(),
            updatedAt: null,
          };
        } else {
          // Non-root path handling
          parent = await tx
            .select()
            .from(containers)
            .where(
              and(
                eq(containers.id, input.containerId),
                eq(containers.userId, ctx.session.user.id),
              ),
            )
            .get();
        }

        if (!parent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Container not found",
          });
        }

        return getDirectoryTree(tx, parent, ctx.session.user.id);
      });
    }),
});
