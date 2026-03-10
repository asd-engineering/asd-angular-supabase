set dotenv-load

DOCKER_REGISTRY := "asd-stack.cr.de-fra.ionos.com"
DOCKER_IMAGE := "asd-angular-supabase"

# Start full development environment (idempotent)
dev:
    @asd run dev

# Start infrastructure only (Supabase, Caddy, network)
start:
    @asd run start

# Stop all services
stop:
    @asd run stop

# Stop all services and remove data
down:
    @asd run down

# Run all quality checks (lint, typecheck, format, tests, duplication)
check-all:
    @asd run check-all

# Enter ASD sandbox (Docker dev container)
sandbox:
    docker compose -f docker/docker-compose.yml run --rm dev

# Forward all args to pnpm
p *args:
    pnpm {{args}}

# ----------------------------------------
# Testing
# ----------------------------------------

# Run unit tests (watch mode)
test:
    pnpm test

# Run unit tests once (CI mode)
test-run:
    pnpm test:run

# Run unit tests with coverage
test-coverage:
    pnpm test:coverage

# Run Playwright E2E tests (headless)
test-e2e *args:
    pnpm exec playwright test {{args}}

# Run Playwright tests with visible browser
test-e2e-headed:
    pnpm exec playwright test --headed

# Run Playwright tests with UI mode
test-e2e-ui:
    pnpm exec playwright test --ui

# Run Playwright tests on Chromium only
test-e2e-chromium:
    pnpm exec playwright test --project=chromium

# Run Playwright tests on Firefox only
test-e2e-firefox:
    pnpm exec playwright test --project=firefox

# Run Playwright tests on WebKit only
test-e2e-webkit:
    pnpm exec playwright test --project=webkit

# View Playwright test report
test-e2e-report:
    pnpm exec playwright show-report

# ----------------------------------------
# Quality Checks
# ----------------------------------------

# Run linting
lint:
    pnpm lint

# Run TypeScript type checking
typecheck:
    pnpm typecheck

# Auto-format code
format:
    pnpm format

# Check code formatting (no changes)
format-check:
    pnpm format:check

# Run all quality checks
check:
    pnpm lint
    pnpm typecheck
    pnpm format:check

# ----------------------------------------
# Code Duplication
# ----------------------------------------

# Full duplication analysis with HTML report
duplication:
    pnpm duplication

# Check duplication threshold (CI mode)
duplication-check:
    pnpm duplication:check

# ----------------------------------------
# Supabase
# ----------------------------------------

# Start local Supabase
supa-start:
    npx supabase start

# Stop local Supabase
supa-stop:
    npx supabase stop

# Check Supabase status
supa-status:
    npx supabase status

# Generate TypeScript types from local database
supa-types-local:
    npx supabase gen types typescript --local > src/app/core/types/database.types.ts

# Reset local database (re-runs all migrations)
supa-reset:
    npx supabase db reset

# ----------------------------------------
# Docker
# ----------------------------------------

# Build and run production Docker image
docker-prod:
    docker compose -f docker/docker-compose.prod.yml up --build

# Build Docker image locally
docker-build:
    #!/usr/bin/env bash
    set -e
    VERSION="$(date +%-y.%-m.%-d)-alpha.$(date +%H%M)"
    COMMIT="$(git rev-parse --short HEAD)"
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      pkg.version = '$VERSION';
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
    echo "Building Docker image v$VERSION ($COMMIT)..."
    docker build \
      --build-arg APP_COMMIT="$COMMIT" \
      -t {{DOCKER_REGISTRY}}/{{DOCKER_IMAGE}}:$VERSION \
      -t {{DOCKER_REGISTRY}}/{{DOCKER_IMAGE}}:latest \
      .

# ----------------------------------------
# DeVinci Cloud IDE
# ----------------------------------------

# Launch cloud development environment in CI
devinci:
    #!/usr/bin/env bash
    set -e
    read -p "Username: " USERNAME
    read -sp "Password: " PASSWORD && echo
    gh workflow run devinci.yml \
      -f username="$USERNAME" \
      -f password="$PASSWORD"
    echo "Workflow triggered. Run 'just devinci-watch' to track."

# List active DeVinci sessions
devinci-active:
    gh run list --workflow=devinci.yml --status=in_progress

# Watch most recent DeVinci run
devinci-watch:
    gh run watch $(gh run list --workflow=devinci.yml --limit 1 --json databaseId -q '.[0].databaseId')

# Stop most recent DeVinci session
devinci-stop:
    gh run cancel $(gh run list --workflow=devinci.yml --status=in_progress --limit 1 --json databaseId -q '.[0].databaseId')

# Sync available tunnel regions into devinci workflow
devinci-sync-regions:
    ./scripts/sync-devinci-regions.sh

# Build + push Docker image
docker-release:
    #!/usr/bin/env bash
    set -e
    just docker-build
    VERSION="$(node -p "require('./package.json').version")"
    docker push {{DOCKER_REGISTRY}}/{{DOCKER_IMAGE}}:$VERSION
    docker push {{DOCKER_REGISTRY}}/{{DOCKER_IMAGE}}:latest
    echo "Released: {{DOCKER_REGISTRY}}/{{DOCKER_IMAGE}}:$VERSION"
