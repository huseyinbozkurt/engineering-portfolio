import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import { getPostgresSslOptions } from "./database-url";
import * as schema from "./schema";

export type PortfolioDb = PostgresJsDatabase<typeof schema>;

const defaultConnectTimeoutSeconds = 10;
const idleTimeoutSeconds = 10;

type CachedConnection = {
  client: Sql;
  db: PortfolioDb;
};

export interface DatabaseConnectionCheckResult {
  ok: boolean;
  durationMs: number;
  source: string;
  eventId: string;
  reason?: "missing_database_url" | "connection_failed";
}

interface DatabaseConnectionCheckOptions {
  source?: string;
  force?: boolean;
}

const globalForDb = globalThis as unknown as {
  portfolioDbConnection: CachedConnection | undefined;
  portfolioDbInitialConnectionCheck: Promise<DatabaseConnectionCheckResult> | undefined;
  portfolioDbMissingDatabaseUrlLogged: boolean | undefined;
};

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): PortfolioDb {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    logMissingDatabaseUrlOnce("getDb");
    throw new Error("DATABASE_URL is required for database access.");
  }

  if (!globalForDb.portfolioDbConnection) {
    const connectTimeoutSeconds = getConnectTimeoutSeconds();
    const poolMax = getPoolMax();
    const connectionMetadata = getConnectionMetadata(connectionString, {
      connectTimeoutSeconds,
      poolMax,
    });

    try {
      const sslOptions = getPostgresSslOptions(connectionString);
      const client = postgres(connectionString, {
        connect_timeout: connectTimeoutSeconds,
        max: poolMax,
        idle_timeout: idleTimeoutSeconds,
        prepare: false,
        ...sslOptions,
      });

      globalForDb.portfolioDbConnection = {
        client,
        db: drizzle(client, { schema }),
      };

      writeDbLog("info", "db_client_initialized", {
        ...connectionMetadata,
        sslConfigured: Boolean(sslOptions.ssl),
        message: "Postgres client initialized; the network connection opens on the first query.",
      });
    } catch (error) {
      writeDbLog("error", "db_client_initialization_failed", {
        ...connectionMetadata,
        ...getErrorLogFields(error, connectionString),
      });
      throw error;
    }
  }

  return globalForDb.portfolioDbConnection.db;
}

export async function verifyInitialDbConnection(
  options: DatabaseConnectionCheckOptions = {},
): Promise<DatabaseConnectionCheckResult> {
  if (!options.force && globalForDb.portfolioDbInitialConnectionCheck) {
    return globalForDb.portfolioDbInitialConnectionCheck;
  }

  const check = performDatabaseConnectionCheck(options.source ?? "initial-db-connection");

  if (!options.force) {
    globalForDb.portfolioDbInitialConnectionCheck = check;
  }

  return check;
}

async function performDatabaseConnectionCheck(
  source: string,
): Promise<DatabaseConnectionCheckResult> {
  const connectionString = process.env.DATABASE_URL;
  const startedAt = Date.now();
  const eventId = createEventId();

  if (!connectionString) {
    const result: DatabaseConnectionCheckResult = {
      ok: false,
      durationMs: 0,
      source,
      eventId,
      reason: "missing_database_url",
    };

    writeDbLog("warn", "db_initial_connection_skipped", {
      eventId,
      source,
      reason: result.reason,
      databaseUrlConfigured: false,
      ...getAwsLogContext(),
    });

    return result;
  }

  const connectTimeoutSeconds = getConnectTimeoutSeconds();
  const poolMax = getPoolMax();
  const connectionMetadata = getConnectionMetadata(connectionString, {
    connectTimeoutSeconds,
    poolMax,
  });

  writeDbLog("info", "db_initial_connection_check_started", {
    eventId,
    source,
    ...connectionMetadata,
  });

  try {
    getDb();
    const connection = globalForDb.portfolioDbConnection;

    if (!connection) {
      throw new Error("Database client was not initialized.");
    }

    await connection.client`select 1`;

    const result: DatabaseConnectionCheckResult = {
      ok: true,
      durationMs: Date.now() - startedAt,
      source,
      eventId,
    };

    writeDbLog("info", "db_initial_connection_succeeded", {
      eventId,
      source,
      durationMs: result.durationMs,
      ...connectionMetadata,
    });

    return result;
  } catch (error) {
    const result: DatabaseConnectionCheckResult = {
      ok: false,
      durationMs: Date.now() - startedAt,
      source,
      eventId,
      reason: "connection_failed",
    };

    writeDbLog("error", "db_initial_connection_failed", {
      eventId,
      source,
      durationMs: result.durationMs,
      reason: result.reason,
      ...connectionMetadata,
      ...getErrorLogFields(error, connectionString),
    });

    return result;
  }
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

function getPoolMax(): number {
  return process.env.NODE_ENV === "production" ? 10 : 3;
}

function logMissingDatabaseUrlOnce(source: string): void {
  if (globalForDb.portfolioDbMissingDatabaseUrlLogged) {
    return;
  }

  globalForDb.portfolioDbMissingDatabaseUrlLogged = true;
  writeDbLog("error", "db_missing_database_url", {
    source,
    databaseUrlConfigured: false,
    ...getAwsLogContext(),
  });
}

function getConnectionMetadata(
  connectionString: string,
  pool: { connectTimeoutSeconds: number; poolMax: number },
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    databaseUrlConfigured: true,
    connectTimeoutSeconds: pool.connectTimeoutSeconds,
    poolMax: pool.poolMax,
    idleTimeoutSeconds,
    prepareStatements: false,
    databaseSslModeEnv: process.env.DATABASE_SSL_MODE || null,
    databaseSslCaFileConfigured: Boolean(process.env.DATABASE_SSL_CA_FILE),
    ...getAwsLogContext(),
  };

  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode") ?? url.searchParams.get("ssl");

    return {
      ...metadata,
      databaseUrlValid: true,
      databaseProtocol: url.protocol.replace(":", ""),
      databaseHost: url.hostname,
      databasePort: url.port || "5432",
      databaseName: decodeURIComponent(url.pathname.replace(/^\//, "")),
      databaseSslMode: sslMode || process.env.DATABASE_SSL_MODE || null,
      databaseUsernameConfigured: Boolean(url.username),
      databasePasswordConfigured: Boolean(url.password),
    };
  } catch {
    return {
      ...metadata,
      databaseUrlValid: false,
    };
  }
}

function getAwsLogContext(): Record<string, unknown> {
  return {
    nodeEnv: process.env.NODE_ENV || null,
    nextRuntime: process.env.NEXT_RUNTIME || null,
    awsExecutionEnv: process.env.AWS_EXECUTION_ENV || null,
    awsRegion: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || null,
    ecsMetadataAvailable: Boolean(process.env.ECS_CONTAINER_METADATA_URI_V4),
  };
}

function writeDbLog(
  level: "info" | "warn" | "error",
  event: string,
  fields: Record<string, unknown>,
): void {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    component: "portfolio-db",
    event,
    ...fields,
  };
  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

function getErrorLogFields(error: unknown, connectionString: string): Record<string, unknown> {
  if (error instanceof Error) {
    const codedError = error as Error & {
      code?: unknown;
      errno?: unknown;
      syscall?: unknown;
      address?: unknown;
      port?: unknown;
    };

    return {
      errorName: error.name,
      errorMessage: redactSecrets(error.message, connectionString),
      errorStack: error.stack ? redactSecrets(error.stack, connectionString) : undefined,
      errorCode: codedError.code,
      errorErrno: codedError.errno,
      errorSyscall: codedError.syscall,
      errorAddress: codedError.address,
      errorPort: codedError.port,
    };
  }

  return {
    errorMessage: redactSecrets(String(error), connectionString),
  };
}

function redactSecrets(value: string, connectionString: string): string {
  return value
    .replaceAll(connectionString, "[redacted DATABASE_URL]")
    .replace(/postgres(?:ql)?:\/\/([^:\s/@]+):([^@\s]+)@/g, "postgresql://$1:[redacted]@");
}

function createEventId(): string {
  return `db-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function closeDb(): Promise<void> {
  const connection = globalForDb.portfolioDbConnection;

  if (!connection) {
    return;
  }

  await connection.client.end();
  globalForDb.portfolioDbConnection = undefined;
}
