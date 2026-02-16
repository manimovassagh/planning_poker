.PHONY: up down test test-e2e db-up db-migrate dev clean

API_PORT := 3001
WEB_PORT := 5173

# Start everything: postgres → migrations → dev servers
up: db-up db-migrate dev

# Stop everything
down:
	@echo "Stopping dev servers..."
	-@lsof -ti:$(API_PORT) | xargs kill -9 2>/dev/null || true
	-@lsof -ti:$(WEB_PORT) | xargs kill -9 2>/dev/null || true
	@echo "Stopping Docker..."
	docker compose down
	@echo "Done."

# Start PostgreSQL via Docker
db-up:
	docker compose up -d
	@echo "Waiting for PostgreSQL..."
	@until pg_isready -h localhost -p 5432 -U postgres 2>/dev/null; do sleep 1; done
	@echo "PostgreSQL is ready."

# Run Prisma migrations
db-migrate:
	cd apps/api && npx prisma migrate dev --skip-generate 2>/dev/null || true
	cd apps/api && npx prisma generate

# Start API and Web dev servers (via Turborepo)
dev:
	pnpm dev

# Run all tests
test:
	pnpm test

# Run Playwright E2E tests
test-e2e:
	cd apps/web && npx playwright test

# Remove build artifacts
clean:
	pnpm clean
