import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hash } from "@node-rs/argon2";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const authRouter = createTRPCRouter({
  signUp: publicProcedure
    .input(
      z.object({
        username: z.string().min(3),
        password: z.string().min(6),
      }),
    )
    .mutation(async ({ input }) => {
      const { username, password } = input;

      // Find user by username
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already exists",
        });
      }

      const passwordHash = await hash(password);

      const res = await db
        .insert(users)
        .values({
          id: 1,
          username,
          password: passwordHash,
        })
        .returning({
          id: users.id,
          username: users.username,
        });

      return res[0];
    }),

  getUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
    });

    return user ?? null;
  }),
});
