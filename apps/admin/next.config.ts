import { join } from "node:path";

import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// In this monorepo the single source of truth for environment variables is the
// workspace-root .env.local. Next.js only auto-loads env files from each app's
// own directory, so without this the app never sees DATABASE_URL / NEXT_PUBLIC_*
// and renders the "DATABASE_URL is not configured" state. `next dev`/`next build`
// run with cwd set to this app package (apps/admin), so the root is two levels up.
// loadEnvConfig does not overwrite variables already present in the environment.
loadEnvConfig(join(process.cwd(), "..", ".."), process.env.NODE_ENV !== "production");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@portfolio/db", "@portfolio/types", "@portfolio/validators"],
};

export default nextConfig;
