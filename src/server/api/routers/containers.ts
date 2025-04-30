import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { containers } from "@/server/db/schema";
import { and, like, eq } from "drizzle-orm";

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
});
