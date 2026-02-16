# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy package manifests for dependency resolution
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
# API manifest needed for workspace resolution
COPY apps/api/package.json apps/api/

# Install all deps (including devDependencies for building)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

# Build shared first, then web
RUN pnpm --filter @planning-poker/shared build
RUN pnpm --filter @planning-poker/web build

# ── Stage 2: Serve with nginx ──────────────────────────────────
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/apps/web/dist/ /usr/share/nginx/html/

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
