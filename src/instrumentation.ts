import { runMigrations } from "./server/db";

export async function register() {
  // Run migrations on server start
  await runMigrations();
}
