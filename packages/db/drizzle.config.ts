import { defineConfig } from "drizzle-kit";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getDrizzleDbCredentials } from "./src/database-url";

const packageDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(packageDir, "../..");

for (const envFile of [".env.local", ".env"]) {
  loadEnvFile(join(workspaceRoot, envFile));
  loadEnvFile(join(packageDir, envFile));
}

const databaseUrl = process.env.DATABASE_URL ?? "";
const commandContext = `${process.env.npm_lifecycle_event ?? ""} ${process.argv.join(" ")}`;
const allowsMissingDatabaseUrl = commandContext.includes("generate");

if (!databaseUrl && !allowsMissingDatabaseUrl) {
  throw new Error(
    [
      "DATABASE_URL is required to run Drizzle database commands.",
      "Create /Users/huseyin/Documents/engineering-portfolio/.env and set DATABASE_URL to a real PostgreSQL connection string.",
      "Local Docker example: DATABASE_URL=\"postgresql://portfolio:portfolio@localhost:5432/engineering_portfolio\"",
      "Production example: DATABASE_URL=\"postgresql://<user>:<password>@<db-host>:5432/<database>?sslmode=require\"",
    ].join("\n"),
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: getDrizzleDbCredentials(databaseUrl),
  strict: true,
  verbose: true,
});

function loadEnvFile(path: string): void {
  if (!existsSync(path)) {
    return;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = unwrapEnvValue(rawValue);
  }
}

function unwrapEnvValue(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
