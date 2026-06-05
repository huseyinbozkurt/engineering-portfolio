import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import { getPostgresSslOptions } from "./database-url";
import * as schema from "./schema";

export type PortfolioDb = PostgresJsDatabase<typeof schema>;

const defaultConnectTimeoutSeconds = 3;

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
      connect_timeout: getConnectTimeoutSeconds(),
      max: 10,
      prepare: false,
      ...getPostgresSslOptions(connectionString),
    });

    cachedConnection = {
      client,
      db: drizzle(client, { schema }),
    };
  }

  return cachedConnection.db;
}

function getConnectTimeoutSeconds(): number {
  const rawTimeout = process.env.DATABASE_CONNECT_TIMEOUT_SECONDS?.trim();

  if (!rawTimeout) {
    return defaultConnectTimeoutSeconds;
  }

  const timeout = Number(rawTimeout);

  if (!Number.isInteger(timeout) || timeout < 1) {
    throw new Error("DATABASE_CONNECT_TIMEOUT_SECONDS must be a positive integer.");
  }

  return timeout;
}

export async function closeDb(): Promise<void> {
  if (!cachedConnection) {
    return;
  }

  await cachedConnection.client.end();
  cachedConnection = undefined;
}
