# ASD Angular Supabase

Production-grade Angular + Supabase boilerplate with full ASD platform integration. Zero local toolchain needed — everything runs inside Docker via `asd sandbox shell`.

## Tech Stack

| Layer           | Technology                                        |
| --------------- | ------------------------------------------------- |
| Frontend        | Angular 21+ (SSR, standalone components, signals) |
| Styling         | Tailwind CSS 4 + DaisyUI 5                        |
| Database & Auth | Supabase (PostgreSQL + Auth + Edge Functions)     |
| Payments        | Mollie                                            |
| Unit Tests      | Vitest                                            |
| E2E Tests       | Playwright                                        |
| Package Manager | pnpm 10+                                          |
| Task Runner     | Just                                              |
| Orchestration   | ASD CLI                                           |
| CI/CD           | GitHub Actions                                    |

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [ASD CLI](https://asd.host) (`asd` binary)

### 1. Clone & enter sandbox

```bash
git clone https://github.com/asd-engineering/asd-angular-supabase.git
cd asd-angular-supabase
asd sandbox shell
```

This drops you into a Docker container with Node.js, pnpm, ASD CLI, and all tooling pre-installed.

### 2. Start the full stack

```bash
asd run dev
```

This single command:

1. Bootstraps local Supabase (PostgreSQL, Auth, Studio, Edge Functions)
2. Starts Caddy reverse proxy with TLS
3. Applies network configuration (routes, tunnel seeds, basic auth)
4. Starts ttyd (web terminal) and code-server (VS Code in browser)
5. Starts Angular dev server on port 4200
6. Displays the ASD Hub URL

### 3. Open the app

- **App**: http://localhost:4200
- **Supabase Studio**: http://localhost:54323
- **ASD Hub**: shown in terminal output

## Available Commands

### Just recipes

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `just dev`            | Start full development environment |
| `just start`          | Start infrastructure only          |
| `just stop`           | Stop all services                  |
| `just down`           | Stop all services and remove data  |
| `just sandbox`        | Enter ASD sandbox container        |
| `just check-all`      | Run all quality checks             |
| `just test`           | Unit tests (watch mode)            |
| `just test-run`       | Unit tests (CI mode)               |
| `just test-e2e`       | Playwright E2E tests               |
| `just docker-prod`    | Build and run production image     |
| `just docker-build`   | Build Docker image                 |
| `just docker-release` | Build and push Docker image        |

### ASD automation sequences

| Command             | Description                                |
| ------------------- | ------------------------------------------ |
| `asd run dev`       | Full stack startup                         |
| `asd run start`     | Infrastructure only                        |
| `asd run stop`      | Stop services                              |
| `asd run down`      | Stop + clean                               |
| `asd run check-all` | Lint, typecheck, format, test, duplication |
| `asd run test-e2e`  | Playwright E2E tests                       |

### pnpm scripts

| Command                  | Description                |
| ------------------------ | -------------------------- |
| `pnpm dev`               | Angular dev server         |
| `pnpm build`             | Production build           |
| `pnpm test`              | Unit tests (watch)         |
| `pnpm test:run`          | Unit tests (CI)            |
| `pnpm lint`              | ESLint                     |
| `pnpm typecheck`         | TypeScript type check      |
| `pnpm format`            | Prettier auto-format       |
| `pnpm format:check`      | Prettier check             |
| `pnpm duplication:check` | Code duplication threshold |

## Architecture

### Project Structure

```
src/app/
├── core/                    # Singletons, guards, interceptors
│   ├── guards/              # Route guards (auth.guard.ts)
│   ├── services/            # Global services (supabase, auth, payment)
│   └── types/               # TypeScript types (database.types.ts)
├── shared/                  # Reusable UI components
│   └── components/          # toast, confirm-modal, avatar
├── features/                # Feature routes (lazy-loaded)
│   ├── auth/                # Login, signup, callback
│   ├── home/                # Public home page
│   ├── pricing/             # Pricing plans
│   ├── payment/             # Payment callback
│   └── dashboard/           # Protected dashboard
│       ├── settings/        # User settings
│       └── orders/          # Order history
├── layouts/                 # Page layouts
│   ├── main-layout/         # Header + footer + content
│   └── auth-layout/         # Centered card layout
├── app.routes.ts            # Main routing config
└── app.routes.server.ts     # SSR render modes
```

### Path Aliases

| Alias         | Path                 |
| ------------- | -------------------- |
| `@core/*`     | `src/app/core/*`     |
| `@shared/*`   | `src/app/shared/*`   |
| `@features/*` | `src/app/features/*` |
| `@env/*`      | `src/environments/*` |

### Key Patterns

- **Standalone components** — no NgModules, all components are standalone
- **Signals** — Angular signals for reactive state
- **Lazy loading** — all feature routes are lazy-loaded
- **Functional guards** — `authGuard` is a `CanActivateFn`
- **SSR with client-side auth** — dashboard and payment callback use `RenderMode.Client`

## Quality Tools

| Tool        | Purpose               | Config               |
| ----------- | --------------------- | -------------------- |
| ESLint      | Linting               | `eslint.config.js`   |
| Prettier    | Formatting            | `.prettierrc`        |
| TypeScript  | Type checking         | `tsconfig.app.json`  |
| jscpd       | Duplication detection | threshold 15%        |
| commitlint  | Commit message format | `.commitlintrc.json` |
| lint-staged | Pre-commit checks     | `.lintstagedrc.json` |
| Husky       | Git hooks             | `.husky/`            |

### Git Hooks

| Hook         | Action                                          |
| ------------ | ----------------------------------------------- |
| `pre-commit` | lint-staged (ESLint + Prettier on staged files) |
| `commit-msg` | commitlint (conventional commits)               |
| `pre-push`   | typecheck + unit tests                          |

## CI/CD

GitHub Actions workflows run on push to `main` and pull requests:

| Workflow    | File                 | Checks                        |
| ----------- | -------------------- | ----------------------------- |
| Build       | `build.yml`          | `pnpm build`                  |
| Linting     | `linting.yml`        | ESLint + TypeScript           |
| Format      | `format.yml`         | Prettier                      |
| Tests       | `tests.yml`          | Vitest unit tests             |
| Duplication | `duplication.yml`    | jscpd threshold               |
| E2E         | `playwright-e2e.yml` | Playwright                    |
| Docker      | `docker.yml`         | Build `build` + `prod` images |

## Docker

### Development (ASD Sandbox)

```bash
# Enter sandbox — full ASD toolkit, pnpm, Node.js 22
just sandbox
# or
docker compose -f docker/docker-compose.yml run --rm dev
```

### Production

```bash
# Build and run SSR server on port 3000
just docker-prod
# or
docker compose -f docker/docker-compose.prod.yml up --build
```

### Multi-stage targets

| Target  | Base                    | Purpose                           |
| ------- | ----------------------- | --------------------------------- |
| `dev`   | `asd-sandbox:latest`    | Development with full ASD toolkit |
| `build` | `node:22-bookworm`      | CI build verification             |
| `prod`  | `node:22-bookworm-slim` | SSR production server             |

## Tunnels & Remote Access

Expose your local dev environment to the internet with HTTPS and basic auth:

```bash
asd expose
```

This creates an SSH tunnel through the ASD Tunnel Server, routed through Caddy for authentication. All services (app, studio, ttyd, code-server) are accessible via subdomains of the tunnel URL.

Architecture: `tunnel → Caddy → basic auth → reverse_proxy → service`

## DevInCi Cloud IDE

Launch a full cloud development environment via GitHub Actions:

```bash
just devinci
```

This triggers a workflow that:

1. Spins up a runner with ASD sandbox
2. Starts ttyd (web terminal) and code-server (VS Code)
3. Opens an SSH tunnel for browser access
4. Keeps the session alive until timeout or manual stop

Manage sessions:

- `just devinci-active` — list active sessions
- `just devinci-watch` — watch the latest run
- `just devinci-stop` — stop the latest session

## Payments (Mollie)

### Architecture

```
Angular (client)  →  Supabase Edge Function  →  Mollie API
                  ←  redirect to checkout     ←
Mollie webhook    →  Supabase Edge Function  →  update orders table
```

### Setup

1. Get a Mollie API key from [mollie.com](https://www.mollie.com)
2. Set the secret in Supabase:
   ```bash
   npx supabase secrets set MOLLIE_API_KEY=test_xxxxx
   ```
3. Deploy edge functions:
   ```bash
   npx supabase functions deploy create-payment --no-verify-jwt
   npx supabase functions deploy mollie-webhook --no-verify-jwt
   ```

### Flow

1. User selects a plan on `/pricing`
2. `create-payment` edge function creates a Mollie payment and an order record
3. User is redirected to Mollie checkout
4. After payment, user returns to `/payment/callback`
5. Mollie sends webhook to `mollie-webhook` edge function
6. Order status updated in database
7. User sees order history at `/dashboard/orders`

## Supabase

### Local development

```bash
just supa-start       # Start local Supabase
just supa-stop        # Stop local Supabase
just supa-status      # Check status
just supa-reset       # Reset database (re-runs migrations)
just supa-types-local # Regenerate TypeScript types
```

### Migrations

Migrations live in `supabase/migrations/`. Apply with:

```bash
just supa-reset
```

## Claude Code

This project includes a `CLAUDE.md` with full project context for [Claude Code](https://claude.com/claude-code). Use the `/asd-setup` skill to interactively generate or update the `asd.yaml` configuration.

## Troubleshooting

### Supabase won't start

Ensure Docker is running and ports 54321-54323 are free:

```bash
docker ps
just supa-status
```

### `pnpm install` fails

Make sure you're using Node.js 22+ and pnpm 10+:

```bash
node -v && pnpm -v
```

Inside the sandbox container, pnpm is pre-installed via corepack.

### Tunnel not connecting

Check that `ASD_API_KEY` is set in your `.env` and the tunnel server is reachable:

```bash
asd tunnel status
```

### Commit rejected by commitlint

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add pricing page
fix: resolve auth redirect
chore: update dependencies
```

### Edge functions return stale data

After database migrations, redeploy edge functions:

```bash
npx supabase functions deploy create-payment --no-verify-jwt
npx supabase functions deploy mollie-webhook --no-verify-jwt
```
