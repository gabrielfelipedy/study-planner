import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Database client singleton.
 *
 * Development: Uses a local SQLite file (`file:./data/dev.db`).
 * Production: Uses Turso remote database URL + auth token.
 *
 * Switch via TURSO_CONNECTION_TYPE or TURSO_DATABASE_URL env var.
 * Per D-03: local SQLite dev, Turso remote prod.
 */
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./data/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(turso, { schema });
