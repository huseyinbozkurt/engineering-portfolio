import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import { getPostgresSslOptions } from "./database-url";
import * as schema from "./schema";

export type PortfolioDb = PostgresJsDatabase<typeof schema>;

const defaultConnectTimeoutSeconds = 10;

type CachedConnection = {
  client: Sql;
  db: PortfolioDb;
};

const globalForDb = globalThis as unknown as {
  portfolioDbConnection: CachedConnection | undefined;
};

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): PortfolioDb {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for database access.");
  }

  if (!globalForDb.portfolioDbConnection) {
    const client = postgres(connectionString, {
      connect_timeout: getConnectTimeoutSeconds(),
      max: process.env.NODE_ENV === "production" ? 10 : 3,
      idle_timeout: 10,
      prepare: false,
      ...getPostgresSslOptions(connectionString),
    });

    globalForDb.portfolioDbConnection = {
      client,
      db: drizzle(client, { schema }),
    };
  }

  return globalForDb.portfolioDbConnection.db;
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
  const connection = globalForDb.portfolioDbConnection;

  if (!connection) {
    return;
  }

  await connection.client.end();
  globalForDb.portfolioDbConnection = undefined;
}