# CLAUDE.md

## FDAID (Feedback-Driven AI Development)

Verify in layers (status → body → network → UI → integration). Use `asd run` / `just` recipes, never raw commands. Commit every 2-3 pieces, one concern per session. Run tests before AND after — if they fail after your commit, you broke them. Find root causes autonomously, no temporary fixes.

## Commands

**Never run raw `pnpm`, `ng`, `vitest`, or `playwright` directly.** Discover available commands at runtime:

```bash
asd run          # List all asd.yaml tasks (primary)
just --list      # List Justfile recipes (tasks not in asd.yaml)
```

Prefer `asd run` — use `just` only for commands not available in `asd run`.

## ASD AI Knowledge Commands

Run these **before** making changes — they expose live documentation from the installed ASD CLI:

| Command                  | When to run                                                                    |
| ------------------------ | ------------------------------------------------------------------------------ |
| `asd rules`              | Before ANY architectural decision (routing, auth, networking). Non-negotiable. |
| `asd schema`             | Before editing `asd.yaml` or `net.manifest.yaml`                               |
| `asd flow`               | Before touching env vars or tunnel URLs                                        |
| `asd expose list --json` | To get exposed service URLs. Never hardcode tunnel URLs.                       |

**Anti-pattern:** Writing custom scripts to derive tunnel URLs or service configs. Use ASD macros (`exposedOrigin()`, `exposedOriginWithAuth()`) and CLI commands instead.

## Verification Sequence

If a step fails, fix before proceeding:

1. `asd run check` — lint + typecheck + format
2. `asd run test-run` — unit tests
3. `asd run test-e2e-chromium` — E2E (when touching UI/routes)
4. `asd run test-payment` — payment flow (only when touching Mollie/webhook)

## Layered Verification

| Layer          | What to check                                                              | How                                                  |
| -------------- | -------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1. Status      | HTTP 200 from dev server, Supabase API, edge functions                     | `asd run supa-status`, curl                          |
| 2. Body        | JSON shape from Supabase queries, edge function responses, Mollie payloads | Inspect response body, not just status               |
| 3. Network     | Auth headers, correct Supabase keys, webhook POST arrives via tunnel       | DevTools, Playwright route interception, tunnel logs |
| 4. UI          | Component renders, signals update, DaisyUI styling, subscription badge     | Playwright assertions, `asd run test-e2e-chromium`   |
| 5. Integration | Full payment: create-subscription → Mollie checkout → webhook → DB → UI    | `asd run test-payment`                               |

**Anti-pattern:** A 200 from the edge function does not mean the webhook updated the database. Always verify downstream effects.

## Project Setup

> **Claude:** If `project_setup_done` is missing from your memory, read `.claude/first-time-setup.md` and run the setup flow. Otherwise, use the stored values from memory.

## Tech Stack

Angular 21+ (SSR, standalone components, signals) · Tailwind CSS 4 + DaisyUI 5 · Supabase (PostgreSQL + Auth) · Mollie payments (edge functions + webhook via tunnel) · Vitest + Playwright · pnpm 10+ · ASD CLI orchestration via `asd.yaml`

## ASD Features

| Feature   | Status       | Docs                      |
| --------- | ------------ | ------------------------- |
| ASD Vault | **disabled** | `.claude/docs/vault.md`   |
| Mollie    | **enabled**  | `.claude/docs/mollie.md`  |
| DevInCi   | **enabled**  | `.claude/docs/devinci.md` |

> Only read the docs file for a feature when its status is **enabled** and you need to work with it.

## ASD Orchestration

`asd run dev` starts the full stack: Supabase → Caddy → network config → service config generation → Angular dev server. ttyd and code-server are auto-started by platform features (`auto_start_ttyd` / `auto_start_codeserver` in `asd.yaml`).

### Network Services

| Service         | Local URL         | Tunnel Subdomain | Auth             |
| --------------- | ----------------- | ---------------- | ---------------- |
| Angular app     | `app.localhost`   | `{prefix}app`    | Public           |
| Supabase API    | `127.0.0.1:54321` | `{prefix}api`    | Public (API key) |
| Supabase Studio | `127.0.0.1:54323` | `{prefix}studio` | Public           |
| code-server     | Internal          | Private          | Caddy basic auth |
| ttyd            | Internal          | Private          | Caddy basic auth |

`ENV_PREFIX` in `.env` creates unique tunnel subdomains: `dev1-` → `dev1-app-kelvin.eu1.tn.asd.engineer`.

## Architecture

```
src/app/
├── core/           # Singletons: guards/, services/ (supabase, auth), types/ (database.types.ts)
├── shared/         # Reusable UI: components/ (toast, confirm-modal, avatar)
├── features/       # Lazy-loaded routes: auth/, home/, pricing/, payment/, dashboard/
├── layouts/        # main-layout/ (header+footer), auth-layout/ (centered card)
├── app.routes.ts   # Main routing config
└── app.routes.server.ts  # SSR render modes
```

**Aliases:** `@core/*`, `@shared/*`, `@features/*`, `@env/*` → corresponding `src/` paths.

**Patterns:** Standalone components (no NgModules), Angular signals, lazy-loaded routes, functional guards (`CanActivateFn`), SSR with client-side auth (`RenderMode.Client` for dashboard/auth callback).

**Env files:** `src/environments/environment.ts` (prod), `environment.development.ts` (local), `tpl.env` (template, safe to commit), `.env` (gitignored, generated by `asd init`).

## Docker

Three targets in `docker/Dockerfile`: `dev` (asd-sandbox), `build` (CI verification), `prod` (SSR on port 4000). Use `just docker-build` / `just docker-prod` / `just sandbox`.

## CI/CD

Workflows in `.github/workflows/`: `build`, `linting`, `format`, `tests`, `duplication`, `docker` (all on push/PR, no secrets). `playwright-e2e` (push/PR, needs `MOLLIE_API_KEY` + `ASD_API_KEY`). `devinci` (manual, needs `ASD_API_KEY`). Secret-gated workflows skip gracefully in forks.

## Hooks (AI Safety)

Project hooks in `.claude/hooks/`: **asd-guard.sh** (prompts before internet exposure), **inject-ai-session.sh** (audit trail on tickets), **asd-validator.sh** (blocks hallucinated ASD subcommands). Global hooks in `~/.claude/hooks/` guard git/GitHub operations.

## Working Style

- **Plan first** — Plan mode for 3+ step tasks. Re-plan if things go sideways.
- **Subagents** — Offload research to keep main context clean.
- **Autonomous** — Fix bugs, failing CI, errors without being told how.
- **Learn** — Capture corrections in `tasks/lessons.md`.
- **Task management** — Plan in `tasks/todo.md`, check in before implementing, never mark done without proof.

## Git Conventions

No "Co-Authored-By". Feature branches → main. Versioning: `YY.M.D-alpha.HHMM`.

## Mailpit

Runs automatically with Supabase. Web UI: `http://localhost:54324`, SMTP: `localhost:54325`, REST API: `http://localhost:54324/api/v1/messages`.
