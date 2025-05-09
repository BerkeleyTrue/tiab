import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { containerRouter } from "./routers/containers";
import { itemsRouter } from "./routers/items";
import { tagsRouter } from "./routers/tags";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  containers: containerRouter,
  items: itemsRouter,
  tags: tagsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
