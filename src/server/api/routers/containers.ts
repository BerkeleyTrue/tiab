import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { containers } from "@/server/db/schema";

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
});
