/**
 * Applies pending migrations, then exits.
 *
 * Railway runs this as the pre-deploy command, so it happens once per deploy
 * with the new code already built but before any instance starts serving.
 *
 * Deliberately built on `drizzle-orm/migrator` rather than the `drizzle-kit
 * migrate` CLI: drizzle-kit is a devDependency, and a production install won't
 * have it. The migrator ships inside drizzle-orm, which is a real dependency.
 */
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { env } from "../lib/env";

// Resolved relative to this file so the script works from any working
// directory. `fileURLToPath`, not `url.pathname` — the latter yields "/E:/..."
// on Windows, which no filesystem call accepts.
const migrationsFolder = fileURLToPath(new URL("./migration", import.meta.url));

// Its own connection, capped at one and set to close: the migrator runs
// sequentially, and a pool left open would keep the process alive after the
// last statement lands.
const connection = postgres(env.DATABASE_URL, { max: 1 });

try {
    await migrate(drizzle(connection), { migrationsFolder });
    console.log("Migrations applied.");
} catch (error) {
    console.error("Migration failed:", error);
    // Non-zero tells Railway to abort the deploy and keep the previous version
    // serving, rather than starting code against a database it doesn't match.
    process.exit(1);
} finally {
    await connection.end();
}
