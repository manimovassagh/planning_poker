# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:25-alpine AS builder
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

# Patch shared package.json to point to dist/ for production runtime
RUN sed -i 's|"./src/index.ts"|"./dist/index.js"|g' packages/shared/package.json

# ── Stage 2: Production ────────────────────────────────────────
FROM node:25-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package manifests (use patched shared package.json from builder)
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install all deps (need prisma CLI for generate + migrate)
RUN pnpm install --frozen-lockfile

# Copy prisma schema + migrations
COPY --from=builder /app/apps/api/prisma/ apps/api/prisma/

# Generate Prisma client with correct version from lockfile
RUN pnpm --filter @planning-poker/api exec prisma generate

# Copy built shared package (dist/)
COPY --from=builder /app/packages/shared/dist/ packages/shared/dist/

# Copy built API
COPY --from=builder /app/apps/api/dist/ apps/api/dist/

ENV NODE_ENV=production
EXPOSE 3001

# Run migrations then start
CMD ["sh", "-c", "cd apps/api && pnpm exec prisma migrate deploy && node dist/index.js"]
