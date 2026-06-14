FROM node:22-alpine AS base

WORKDIR /app

ARG PNPM_VERSION=11.6.0
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/public-site/package.json ./apps/public-site/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/validators/package.json ./packages/validators/package.json

RUN pnpm --filter @portfolio/public-site... install --frozen-lockfile

FROM deps AS builder

COPY tsconfig.base.json ./
COPY apps/public-site ./apps/public-site
COPY packages/db ./packages/db
COPY packages/types ./packages/types
COPY packages/validators ./packages/validators

RUN pnpm --filter @portfolio/public-site build
RUN mkdir -p apps/public-site/public

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_SSL_CA_FILE=/app/global-bundle.pem
ENV DATABASE_SSL_CA_URL=https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

RUN apk add --no-cache ca-certificates wget \
  && addgroup -S nextjs \
  && adduser -S nextjs -G nextjs \
  && chown nextjs:nextjs /app

COPY --chown=nextjs:nextjs apps/public-site/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --chown=nextjs:nextjs global-bundle.pem ./global-bundle.pem
COPY --from=builder --chown=nextjs:nextjs /app/apps/public-site/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/apps/public-site/.next/static ./apps/public-site/.next/static
COPY --from=builder --chown=nextjs:nextjs /app/apps/public-site/public ./apps/public-site/public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1

ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
CMD ["node", "apps/public-site/server.js"]
