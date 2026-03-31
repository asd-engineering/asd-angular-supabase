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
    @asd run test

# Run unit tests once (CI mode)
test-run:
    @asd run test-run

# Run unit tests with coverage
test-coverage:
    @asd run test-coverage

# Run Playwright E2E tests (headless)
test-e2e *args:
    pnpm exec playwright test {{args}}

# Run Playwright tests with visible browser
test-e2e-headed:
    @asd run test-e2e-headed

# Run Playwright tests with UI mode
test-e2e-ui:
    @asd run test-e2e-ui

# Run Playwright tests on Chromium only
test-e2e-chromium:
    @asd run test-e2e-chromium

# Run Playwright tests on Firefox only
test-e2e-firefox:
    @asd run test-e2e-firefox

# Run Playwright tests on WebKit only
test-e2e-webkit:
    @asd run test-e2e-webkit

# View Playwright test report
test-e2e-report:
    @asd run test-e2e-report

# Run payment webhook E2E test (requires API_TUNNEL_URL)
test-payment:
    pnpm exec playwright test e2e/payment-webhook.spec.ts --project=chromium

# ----------------------------------------
# Quality Checks
# ----------------------------------------

# Run linting
lint:
    @asd run lint

# Run TypeScript type checking
typecheck:
    @asd run typecheck

# Auto-format code
format:
    @asd run format

# Check code formatting (no changes)
format-check:
    @asd run format-check

# Run all quality checks
check:
    @asd run check

# ----------------------------------------
# Code Duplication
# ----------------------------------------

# Full duplication analysis with HTML report
duplication:
    @asd run duplication

# Check duplication threshold (CI mode)
duplication-check:
    @asd run duplication-check

# ----------------------------------------
# Supabase
# ----------------------------------------

# Start local Supabase
supa-start:
    @asd run supa-start

# Stop local Supabase
supa-stop:
    @asd run supa-stop

# Check Supabase status
supa-status:
    @asd run supa-status

# Generate TypeScript types from local database
supa-types-local:
    @asd run supa-types-local

# Reset local database (re-runs all migrations)
supa-reset:
    @asd run supa-reset

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
