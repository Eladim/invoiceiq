import "server-only";

import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";

import { env } from "@/lib/env";
import * as schema from "./schema";

// The app's default db client (drizzle-orm/neon-http) cannot run interactive
// transactions. This helper opens a short-lived WebSocket pool for the rare
// paths that need one (e.g. atomic quota + invoice creation, SPEC §4).
neonConfig.webSocketConstructor = ws;

type Database = NeonDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function withTransaction<T>(
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    const db = drizzle(pool, { schema });
    return await db.transaction(fn);
  } finally {
    await pool.end();
  }
}
