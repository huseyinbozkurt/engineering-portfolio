import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

const databaseSslModes = ["disable", "require", "allow", "prefer", "verify-full"] as const;

type DatabaseSslMode = (typeof databaseSslModes)[number];
type PostgresSslMode = Exclude<DatabaseSslMode, "disable">;
type DatabaseSslOptions = false | PostgresSslMode | { ca: string; rejectUnauthorized: true };

interface DrizzleUrlCredentials {
  url: string;
}

interface DrizzleHostCredentials {
  host: string;
  port: number;
  user?: string;
  password?: string;
  database: string;
  ssl?: DatabaseSslOptions;
}

const defaultSslCaFile = "global-bundle.pem";

export function getPostgresSslOptions(connectionString: string): { ssl?: DatabaseSslOptions } {
  const sslMode = getEffectiveDatabaseSslMode(connectionString);

  if (!sslMode) {
    return {};
  }

  if (sslMode === "disable") {
    return { ssl: false };
  }

  if (sslMode === "allow" || sslMode === "prefer") {
    return { ssl: sslMode };
  }

  return {
    ssl: {
      ca: readDatabaseSslCa(),
      rejectUnauthorized: true,
    },
  };
}

export function getDrizzleDbCredentials(
  connectionString: string,
): DrizzleUrlCredentials | DrizzleHostCredentials {
  if (!connectionString) {
    return { url: connectionString };
  }

  const databaseUrl = databaseUrlWithSslMode(connectionString);
  const sslOptions = getPostgresSslOptions(databaseUrl);

  if (!sslOptions.ssl || typeof sslOptions.ssl !== "object") {
    return { url: databaseUrl };
  }

  const url = parseDatabaseUrl(databaseUrl);
  const credentials: DrizzleHostCredentials = {
    host: url.hostname,
    port: Number(url.port || "5432"),
    database: decodeURIComponent(url.pathname.slice(1)),
    ssl: sslOptions.ssl,
  };

  if (url.username) {
    credentials.user = decodeURIComponent(url.username);
  }

  if (url.password) {
    credentials.password = decodeURIComponent(url.password);
  }

  return credentials;
}

export function databaseUrlWithSslMode(connectionString: string): string {
  if (!connectionString || connectionStringHasSslConfig(connectionString)) {
    return connectionString;
  }

  const sslMode = getDatabaseSslMode();

  if (!sslMode) {
    return connectionString;
  }

  const url = parseDatabaseUrl(connectionString);
  url.searchParams.set("sslmode", sslMode);

  return url.toString();
}

function getEffectiveDatabaseSslMode(connectionString: string): DatabaseSslMode | undefined {
  const url = parseDatabaseUrl(connectionString);

  return getConnectionStringSslMode(url) ?? getDatabaseSslMode();
}

function getConnectionStringSslMode(url: URL): DatabaseSslMode | undefined {
  const rawSslMode = url.searchParams.get("sslmode") ?? url.searchParams.get("ssl");

  if (!rawSslMode) {
    return undefined;
  }

  const normalizedSslMode = rawSslMode.trim().toLowerCase();

  if (normalizedSslMode === "true") {
    return "require";
  }

  if (normalizedSslMode === "false") {
    return "disable";
  }

  return parseDatabaseSslMode(normalizedSslMode, "DATABASE_URL sslmode");
}

function getDatabaseSslMode(): DatabaseSslMode | undefined {
  const rawSslMode = process.env.DATABASE_SSL_MODE?.trim().toLowerCase();

  if (!rawSslMode) {
    return undefined;
  }

  return parseDatabaseSslMode(rawSslMode, "DATABASE_SSL_MODE");
}

function parseDatabaseSslMode(value: string, label: string): DatabaseSslMode {
  if (isDatabaseSslMode(value)) {
    return value;
  }

  throw new Error(`${label} must be one of: ${databaseSslModes.join(", ")}.`);
}

function connectionStringHasSslConfig(connectionString: string): boolean {
  const url = parseDatabaseUrl(connectionString);

  return url.searchParams.has("ssl") || url.searchParams.has("sslmode");
}

function readDatabaseSslCa(): string {
  const caFilePath = getDatabaseSslCaFilePath();

  if (!caFilePath) {
    throw new Error(
      `DATABASE_SSL_CA_FILE must point to ${defaultSslCaFile} when database SSL is enabled.`,
    );
  }

  return readFileSync(caFilePath, "utf8");
}

function getDatabaseSslCaFilePath(): string | undefined {
  const configuredPath = process.env.DATABASE_SSL_CA_FILE?.trim() || defaultSslCaFile;
  const candidatePaths = isAbsolute(configuredPath)
    ? [configuredPath]
    : [
        resolve(process.cwd(), configuredPath),
        resolve(process.cwd(), "..", "..", configuredPath),
      ];

  return candidatePaths.find((candidatePath) => existsSync(candidatePath));
}

function parseDatabaseUrl(connectionString: string): URL {
  try {
    return new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection string.");
  }
}

function isDatabaseSslMode(value: string): value is DatabaseSslMode {
  return databaseSslModes.includes(value as DatabaseSslMode);
}
