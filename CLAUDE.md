# CLAUDE.md

This file provides guidance to Claude Code (and other AI agents) working with this repository. It also serves as an introduction to the ASD platform's capabilities for prospective customers.

## Overview

**ASD Angular Supabase** is a production-grade Angular boilerplate with Supabase integration, Tailwind CSS 4, DaisyUI 5, and full ASD platform orchestration. It demonstrates how the ASD platform handles service discovery, tunnel networking, credential management, and cloud IDEs — all from a single `asd.yaml` config file.

## Project Setup

> **Claude:** If `project_setup_done` is missing from your memory, read `.claude/first-time-setup.md` and run the setup flow. Otherwise, use the stored values from memory.

## Install ASD CLI

**Linux / macOS:**

```bash
curl -fsSL https://raw.githubusercontent.com/asd-engineering/asd-cli/main/install.sh | bash
```

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/asd-engineering/asd-cli/main/install.ps1 | iex
```

Verify installation:

```bash
asd --version
```

## ASD AI Knowledge Commands

The ASD CLI has built-in commands that expose its own documentation to AI agents at runtime. **Prefer these over static docs** — they are always in sync with the installed version.

| Command                | Purpose                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `asd rules`            | Behavioral rules for AI agents — routing, auth, abstraction, naming conventions             |
| `asd rules <category>` | Filter rules by category (e.g., `asd rules routing`, `asd rules auth`)                      |
| `asd schema`           | Config field reference derived from Zod `.describe()` — every `asd.yaml` and manifest field |
| `asd schema --ai`      | Extended reference including external tool docs and npm links                               |
| `asd flow`             | Visualize the template-to-`.env` data pipeline: how `tpl.env` → macro expansion → `.env`    |

**When to use:**

- **`asd schema`** — before editing `asd.yaml` or `net.manifest.yaml`, to see all available fields and their types
- **`asd flow`** — to understand how env vars are resolved: module `tpl.env` → package `tpl.env` → defaults file → existing `.env` (merge order)
- **`asd rules`** — before making architectural decisions about routing, auth, or service naming

## Tech Stack

- **Frontend:** Angular 21+ with SSR, standalone components, signals
- **Styling:** Tailwind CSS 4 + DaisyUI 5 (ASD brand system)
- **Database/Auth:** Supabase (PostgreSQL + Auth)
- **Payments:** Mollie (edge functions + webhook via ASD tunnel)
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Package Manager:** pnpm 10+
- **Orchestration:** ASD CLI (global `asd` binary, tasks defined in `asd.yaml`)

## ASD Vault Injection — AI-Safe Credential Management

### The Problem

AI agents need to run applications that require credentials (API keys, database URLs, payment secrets). Storing raw secrets in `.env` files means any agent with file access can read them. ASD Vault solves this by injecting credentials at runtime without ever writing them to disk.

### How It Works

Template files (`tpl.env`) use `asd://` references instead of raw values:

```bash
# tpl.env — safe to commit, safe for AI to read
MOLLIE_API_KEY=asd://payments/MOLLIE_API_KEY
SUPABASE_SERVICE_ROLE_KEY=asd://database/SERVICE_ROLE_KEY
```

The ASD CLI resolves these references at runtime:

```bash
# Store a secret in the vault
asd vault store payments/MOLLIE_API_KEY "live_xxxxxxxxxx"

# Run a command with vault-injected env vars
asd vault run -- pnpm dev

# List stored secrets (shows keys, not values)
asd vault list
```

### Three-Tier Encryption

1. **Server-side encryption** — secrets encrypted at rest on the ASD tunnel server
2. **Scope key** — each project/scope has its own encryption key
3. **Passphrase** — optional user passphrase for additional protection

### Graceful Fallback

Vault is an **optional ASD add-on**. Without it, the project works normally with `.env` files — vault just adds the AI-safety layer. No hard dependency.

- If `asd vault run` is available, secrets are injected from vault
- If not, the standard `.env` file is used (manual secret management)
- `tpl.env` always works as a plain template regardless of vault availability

### Comparison: Credential Management Approaches

| Approach      | AI Can Read? | Rotatable? | Audit Trail? | Works in CI?              |
| ------------- | ------------ | ---------- | ------------ | ------------------------- |
| `.env` files  | Yes (unsafe) | Manual     | No           | Copy/paste                |
| GH Secrets    | No           | Yes        | Limited      | Yes                       |
| **ASD Vault** | **No**       | **Yes**    | **Yes**      | **Yes (`asd vault run`)** |

### Rules for AI Agents

- **Never** write raw secrets to files — use `asd vault store` or environment variables
- **Never** log or print secret values — use `asd vault list` to verify keys exist
- `tpl.env` and `asd.yaml` are safe to read and modify — they contain references, not values
- Use `asd vault run` to inject secrets when running commands that need them

## ASD Orchestration

### Full-Stack Development with `asd run dev`

A single command starts the entire stack:

```bash
asd run dev
```

This executes the `dev` automation sequence defined in `asd.yaml`:

1. **Bootstrap Supabase** — starts local PostgreSQL, Auth, Storage, Edge Functions
2. **Start Caddy** — reverse proxy with automatic TLS
3. **Wait for Caddy** — health check on admin API
4. **Apply network config** — registers services, seeds auth rules, connects tunnels
5. **Start ttyd** — browser terminal (background, skipped if port in use)
6. **Start code-server** — VS Code in browser (background, skipped if port in use)
7. **Start Angular dev server** — `pnpm dev` on port 4200 (background, skipped if running)
8. **Wait for Angular** — HTTP health check
9. **Display services** — lists configured services and their ports

### Network Services

All services are routed through Caddy for TLS termination and auth:

| Service         | Local URL         | Tunnel Subdomain | Auth             |
| --------------- | ----------------- | ---------------- | ---------------- |
| Angular app     | `app.localhost`   | `{prefix}app`    | Public           |
| Supabase API    | `127.0.0.1:54321` | `{prefix}api`    | Public (API key) |
| Supabase Studio | `127.0.0.1:54323` | `{prefix}studio` | Public           |
| code-server     | Internal          | Private          | Caddy basic auth |
| ttyd            | Internal          | Private          | Caddy basic auth |

### ENV_PREFIX for Multi-Instance Routing

Set `ENV_PREFIX` in `.env` to create unique tunnel subdomains per instance:

```bash
ENV_PREFIX=dev1-    # Produces: dev1-app-kelvin.eu1.tn.asd.engineer
ENV_PREFIX=staging- # Produces: staging-app-kelvin.eu1.tn.asd.engineer
```

### Hub Views

The ASD Hub provides a unified dashboard with four views:

- **App** — iframe embedding the Angular dev server
- **Studio** — Supabase Studio for database management
- **Code Studio** — VS Code (code-server) in the browser
- **Terminal** — ttyd browser terminal

## Mollie Payment Integration

### Architecture

Two Supabase Edge Functions handle the payment flow:

- **`create-payment`** — JWT-authenticated, creates a Mollie payment and stores an order
- **`mollie-webhook`** — No JWT (Mollie calls it), receives `application/x-www-form-urlencoded` POST with payment ID, verifies status via Mollie API, updates order

### Webhook Delivery via ASD Tunnel

In development/CI, Mollie needs to reach your local Supabase instance. ASD tunnels make this possible:

```
Mollie servers → ASD tunnel → Caddy → Supabase Edge Functions
```

The webhook URL is constructed from the tunnel domain:

```
https://{prefix}api-{client_id}.{tunnel_host}/functions/v1/mollie-webhook
```

### E2E Test Flow

1. Create test user via Supabase Admin API
2. Sign in to get JWT access token
3. Call `create-payment` edge function with tunnel webhook URL
4. Navigate to Mollie test checkout → select "Paid"
5. Mollie POSTs to webhook via tunnel → edge function updates order status
6. Poll database to verify order status changed to `paid`

### Commands

```bash
pnpm exec playwright test e2e/payment-webhook.spec.ts --project=chromium  # Local (requires tunnel + Mollie key)
```

The `playwright-e2e.yml` workflow runs payment E2E automatically after general tests when `MOLLIE_API_KEY` and `ASD_API_KEY` secrets are configured.

## DevInCi Cloud IDE

Launch a full cloud development environment from CI via the `devinci.yml` GitHub Action. Manage sessions with the `gh` CLI:

```bash
gh workflow run devinci.yml -f username="USER" -f password="PASS"  # Trigger
gh run list --workflow=devinci.yml --status=in_progress              # List active
gh run watch $(gh run list --workflow=devinci.yml --limit 1 --json databaseId -q '.[0].databaseId')  # Watch
```

### What Gets Started

- **ttyd** — browser terminal for running commands
- **code-server** — VS Code in the browser
- **Caddy** — reverse proxy with basic auth (auto-generated credentials)
- **ASD tunnel** — public HTTPS access to all services

### Cross-Platform Support

| Platform                    | code-server | ttyd | Basic Auth |
| --------------------------- | ----------- | ---- | ---------- |
| Linux (ubuntu-latest)       | Yes         | Yes  | 401/302    |
| macOS (macos-latest, ARM64) | Yes         | N/A  | 401/302    |
| Windows (windows-latest)    | No          | Yes  | 401/200    |

## Docker Infrastructure

### Multi-Stage Dockerfile

Three build targets in `docker/Dockerfile`:

| Target  | Base Image              | Purpose                           |
| ------- | ----------------------- | --------------------------------- |
| `dev`   | `asd-sandbox:latest`    | Full ASD toolkit for development  |
| `build` | `node:22-bookworm`      | CI build verification             |
| `prod`  | `node:22-bookworm-slim` | SSR production server (port 4000) |

### Docker Commands

```bash
docker compose -f docker/docker-compose.yml run --rm dev   # Enter ASD sandbox
docker compose -f docker/docker-compose.prod.yml up --build # Build and run production image
```

## Commands

All tasks are defined in `asd.yaml` and run via `asd run <task>`. A Justfile is included as a thin wrapper for convenience but `asd run` is the primary interface.

### Development

```bash
pnpm install          # Install dependencies
pnpm dev              # Start Angular dev server only (port 4200)
asd run dev           # Start full stack (Supabase + Caddy + Angular + ttyd + code-server)
asd run start         # Start infrastructure only (Supabase + Caddy)
asd run stop          # Stop all services
asd run down          # Stop all services and remove data
```

### Testing

```bash
asd run test          # Unit tests (watch mode)
asd run test-run      # Unit tests (CI mode)
asd run test-coverage # Unit tests with coverage (enforces thresholds)

asd run test-e2e           # Playwright E2E tests (all browsers)
asd run test-e2e-chromium  # Chromium only
asd run test-e2e-ui        # Playwright UI mode
```

### Quality Checks

```bash
asd run lint          # ESLint
asd run typecheck     # TypeScript type checking
asd run format        # Auto-format with Prettier
asd run format-check  # Check formatting
asd run check         # Lint + typecheck + format
asd run check-all     # Lint + typecheck + format + tests + duplication
```

### Supabase

```bash
asd run supa-start       # Start local Supabase
asd run supa-stop        # Stop local Supabase
asd run supa-status      # Check status
asd run supa-types-local # Regenerate database.types.ts
asd run supa-reset       # Reset database
```

### Mailpit (Local Email Testing)

Supabase local includes Mailpit for capturing auth emails (signup confirmations, password resets, magic links). No configuration needed — it runs automatically with `asd run supa-start`.

- **Web UI**: `http://localhost:54324` — browse all captured emails
- **SMTP**: `localhost:54325` — Supabase Auth sends emails here automatically
- **REST API**: `http://localhost:54324/api/v1/messages` — query emails programmatically

```bash
# Fetch latest email (useful in E2E tests)
curl -s http://localhost:54324/api/v1/messages?limit=1 | jq '.messages[0].Subject'
```

## Architecture

### Project Structure

```
src/app/
├── core/              # Singletons, guards, interceptors
│   ├── guards/        # Route guards (auth.guard.ts)
│   ├── services/      # Global services (supabase, auth)
│   └── types/         # TypeScript types (database.types.ts)
├── shared/            # Reusable UI components
│   └── components/    # toast, confirm-modal, avatar
├── features/          # Feature routes (lazy-loaded)
│   ├── auth/          # Login, signup, callback
│   ├── home/          # Public home page
│   ├── pricing/       # Plan selection + Mollie checkout
│   ├── payment/       # Payment callback page
│   └── dashboard/     # Protected dashboard + settings
├── layouts/           # Page layouts
│   ├── main-layout/   # Header + footer + content
│   └── auth-layout/   # Centered card layout
├── app.routes.ts      # Main routing config
└── app.routes.server.ts # SSR render modes
```

### Path Aliases

- `@core/*` → `src/app/core/*`
- `@shared/*` → `src/app/shared/*`
- `@features/*` → `src/app/features/*`
- `@env/*` → `src/environments/*`

### Key Patterns

- **Standalone components** — No NgModules, all components are standalone
- **Signals** — Angular signals for reactive state
- **Lazy loading** — All feature routes are lazy-loaded
- **Functional guards** — `authGuard` is a `CanActivateFn`
- **SSR with client-side auth** — Dashboard and auth callback use `RenderMode.Client`

### Environment Files

- `src/environments/environment.ts` — Production config
- `src/environments/environment.development.ts` — Local development (auto-replaced in prod builds)
- `tpl.env` — Template with vault references and placeholders (safe to commit)
- `.env` — Local overrides (gitignored, generated by `asd init`)

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow             | Trigger          | Secrets Required                                |
| -------------------- | ---------------- | ----------------------------------------------- |
| `build.yml`          | push/PR          | None                                            |
| `linting.yml`        | push/PR          | None                                            |
| `format.yml`         | push/PR          | None                                            |
| `tests.yml`          | push/PR          | None                                            |
| `duplication.yml`    | push/PR          | None                                            |
| `playwright-e2e.yml` | push/PR + manual | `MOLLIE_API_KEY`, `ASD_API_KEY` (payment tests) |
| `docker.yml`         | push/PR          | None                                            |
| `devinci.yml`        | manual           | `ASD_API_KEY`                                   |

Workflows that require secrets are gated with `if` conditions — they skip gracefully in forks or when secrets aren't configured.

## Hooks (AI Safety)

Project-level hooks in `.claude/hooks/` guard risky operations:

- **asd-guard.sh** — prompts before `asd expose` or `asd net apply --tunnel` (internet exposure)
- **inject-ai-session.sh** — adds AI session audit trail to ticket creation
- **asd-validator.sh** — validates ASD CLI commands against cached `asd help` output (blocks typos/hallucinated subcommands)

Global hooks (`~/.claude/hooks/`) provide additional guards for git and GitHub operations.

## Git Conventions

- No "Co-Authored-By" in commit messages
- Branch: feature branches -> main
- Versioning: `YY.M.D-alpha.HHMM`
