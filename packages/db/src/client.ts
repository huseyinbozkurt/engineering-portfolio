import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import * as schema from "./schema";

export type PortfolioDb = PostgresJsDatabase<typeof schema>;

let cachedConnection: { client: Sql; db: PortfolioDb } | undefined;

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): PortfolioDb {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for database access.");
  }

  if (!cachedConnection) {
    const client = postgres(connectionString, {
      max: 10,
      prepare: false,
    });

    cachedConnection = {
      client,
      db: drizzle(client, { schema }),
    };
  }

  return cachedConnection.db;
}

export async function closeDb(): Promise<void> {
  if (!cachedConnection) {
    return;
  }

  await cachedConnection.client.end();
  cachedConnection = undefined;
}
