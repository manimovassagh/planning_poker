# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy package manifests for dependency resolution
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install all deps (including devDependencies for building)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Build shared package first, then API
RUN pnpm --filter @planning-poker/shared build
RUN pnpm --filter @planning-poker/api exec prisma generate
RUN pnpm --filter @planning-poker/api build

# ── Stage 2: Production ────────────────────────────────────────
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package manifests
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy built shared package
COPY --from=builder /app/packages/shared/dist/ packages/shared/dist/

# Copy built API + prisma client + migrations
COPY --from=builder /app/apps/api/dist/ apps/api/dist/
COPY --from=builder /app/apps/api/prisma/ apps/api/prisma/
COPY --from=builder /app/apps/api/node_modules/.prisma/ apps/api/node_modules/.prisma/
COPY --from=builder /app/apps/api/node_modules/@prisma/ apps/api/node_modules/@prisma/

ENV NODE_ENV=production
EXPOSE 3001

# Run migrations then start
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/index.js"]
