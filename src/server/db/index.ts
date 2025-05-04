import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

import { env } from "@/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  client: Client | undefined;
};

export const client =
  globalForDb.client ?? createClient({ url: env.DATABASE_URL });

if (env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle(client, { schema });
export const runMigrations = async () => {
  if (env.NODE_ENV === "production") {
    console.log("[db] Running migrations...");
    await migrate(db, { migrationsFolder: "./drizzle" });
  } else {
    console.log("[db] Skipping migrations in development mode.");
  }
}

export type Db = typeof db;
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
