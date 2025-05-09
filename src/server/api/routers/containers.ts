import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { faker } from "@faker-js/faker";

export const containerRouter = createTRPCRouter({
  getRandomName: publicProcedure.query(async () => {
    const name = `${faker.color.human().replace(/\s/g, "_")}_${faker.word.noun()}`;
    return name;
  }),

  create: publicProcedure
    .input(
      z.object({
        path: z.string().min(1),
        parent: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.repos.containers.create(input);
    }),

  getById: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.repos.containers.getById(input);
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
      return ctx.repos.containers.search(input);
    }),

  getDirectoryTree: publicProcedure
    .input(
      z.object({
        containerId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.repos.containers.getDirectoryTree(input);
    }),

  getPathname: publicProcedure
    .input(
      z.object({
        containerId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.repos.containers.getPathname(input);
    }),

  delete: publicProcedure
    .input(
      z.object({
        containerId: z.number(),
        newPathname: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const itemRepo = ctx.repos.items.withTransaction(tx);
        const containerRepo = ctx.repos.containers.withTransaction(tx);
        const itemCount = await itemRepo.getCount({ containerId: input.containerId });

        if (itemCount > 0) {

          if (!input.newPathname) {
            throw new Error("Container has items, please provide a new pathname");
          }

          const newCont = await containerRepo.ensurePathname({
            pathname: input.newPathname.trim().toLowerCase().replace(/\s+/g, "_"),
          });
        
          if (!newCont) {
            throw new Error(
              "Expected to find container for pathname but found none",
            );
          }

          await itemRepo.moveItemsToContainer({
            containerId: input.containerId,
            newContainerId: newCont.id,
          });
        }

        return await containerRepo.delete(input).then((res) => ({
          message: res ? "Container deleted" : "Container not affected",
        }));
      });
    }),
});
