import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { faker } from "@faker-js/faker";
import { TRPCError } from "@trpc/server";

export const containerRouter = createTRPCRouter({
  ensurePathname: protectedProcedure
    .input(z.object({ pathname: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.repos.containers.ensurePathname({
        pathname: input.pathname.trim().toLowerCase().replace(/\s+/g, "_"),
      });
    }),

  getRandomName: publicProcedure.query(async () => {
    const adj = faker.word.adjective({
      length: { min: 3, max: 6 },
      strategy: "shortest"
    }).replace(/\s/g, "_");
    const noun = faker.word.noun({
      length: { min: 3, max: 6 },
      strategy: "shortest"
    }).replace(/\s/g, "_");

    const name = `${adj}_${noun}`;
    return name;
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

  update: protectedProcedure
    .input(
      z.object({
        containerId: z.number(),
        isPublic: z.boolean().optional(),
        pathname: z.string().optional(),
        path: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const containerRepo = ctx.repos.containers.withTransaction(tx);
        const updates: Parameters<typeof containerRepo.update>[0] = {
          containerId: input.containerId,
        };

        const currentContainer = await containerRepo.getById({
          id: input.containerId,
        });

        if (!currentContainer) {
          throw new TRPCError({
            message: "Expected to find container for pathname but found none",
            code: "NOT_FOUND",
          });
        }

        if (input.pathname) {
          const parent = await containerRepo.ensurePathname({
            pathname: input.pathname,
          });

          if (!parent) {
            throw new TRPCError({
              message: "Expected to find container for pathname but found none",
              code: "NOT_FOUND",
            });
          }

          updates.parentId = parent.id;
        }

        if (input.isPublic !== undefined) {
          updates.isPublic = input.isPublic;
        }

        if (input.path) {
          const path = input.path.trim().toLowerCase().replace(/\s+/g, "_");
          updates.path = path;
        }

        const container = await containerRepo.update(updates);

        return container;
      });
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
        const itemCount = await itemRepo.getCount({
          containerId: input.containerId,
        });

        if (itemCount > 0) {
          if (!input.newPathname) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Container has items, please provide a new pathname for the container",
            });
          }

          const newCont = await containerRepo.ensurePathname({
            pathname: input.newPathname
              .trim()
              .toLowerCase()
              .replace(/\s+/g, "_"),
          });

          if (!newCont) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Expected to find container for pathname but found none",
            });
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
