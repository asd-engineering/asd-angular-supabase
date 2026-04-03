---
name: asd-expose
description: Guide for exposing services via ASD tunnels — asd expose, asd.yaml network config, with/without Caddy, auth rules
user_invocable: true
arg_description: "What to expose, e.g. 'port 3000', 'angular dev server', 'expose without caddy', 'add tunnel to asd.yaml'"
---

# ASD Expose — Service Exposure Guide

Expose any local service to the internet via ASD tunnels. Two approaches: quick ad-hoc or declarative via `asd.yaml`.

## Live Documentation

Always consult the ASD CLI's built-in docs — they match your installed version:

```bash
asd rules routing   # Routing architecture rules
asd rules auth      # Auth layer rules
asd schema          # All asd.yaml fields with types
asd schema --ai     # Extended reference with external docs
```

Install ASD skills for deeper AI assistance:

```bash
asd skills install  # Installs ASD-provided Claude Code skills
```

## Quick Expose (Ad-Hoc)

Expose any port instantly — no `asd.yaml` changes needed:

```bash
# Basic: expose port 3000
asd expose 3000

# Named service with subdomain prefix
asd expose 3000 myapp --name api

# With explicit auth
asd expose 3000 myapp --auth=basic   # Force basic auth
asd expose 3000 myapp --auth=none    # No auth

# Local only (Caddy route, no tunnel)
asd expose 3000 --local-only
```

### Manage Exposed Services

```bash
asd expose list      # Show all exposed services + status
asd expose stop api  # Stop by name
asd expose stop 3000 # Stop by port
asd expose cleanup   # Remove stale entries
```

## Declarative Expose (asd.yaml)

For persistent services, define them in `asd.yaml` under `network.services`:

```yaml
tunnels:
  mode: 'caddy' # Route all tunnels through Caddy (recommended)

network:
  caddy:
    enable: true
    tls:
      enabled: true
      auto: true
  services:
    my-api:
      dial: 127.0.0.1:3000
      host: api.localhost # Local domain
      subdomain: ${{ env.ENV_PREFIX }}api # Tunnel subdomain
      tunnelPort: 3000
      tunnelProtocol: http
      public: true # false = requires basic auth
      description: My API server
```

Then apply:

```bash
asd net apply --seed --caddy --tunnel   # Full apply: auth rules + Caddy routes + tunnels
asd net apply --caddy                   # Caddy routes only (no tunnel)
asd net apply --tunnel                  # Tunnel only
```

## With Caddy vs Without Caddy

### With Caddy (Recommended)

All traffic flows through Caddy for TLS + auth:

```
Internet -> ASD Tunnel -> Caddy:443 -> basic auth -> reverse_proxy -> service:port
```

```yaml
tunnels:
  mode: 'caddy' # Tunnel points to Caddy, Caddy proxies to service
```

- Single tunnel serves all services via path/subdomain routing
- Basic auth applied automatically for private services
- TLS termination at Caddy

### Without Caddy (Direct)

Tunnel connects directly to service port — **no auth layer**:

```bash
asd expose 3000 --local-only   # Caddy route only, no tunnel
```

**Warning:** Direct tunneling (`--direct` or `tunnels.mode: 'direct'`) bypasses Caddy entirely. No auth middleware applies. Only use for public services that handle their own auth.

## Architecture Rule

> **Caddy owns auth.** Services (ttyd, code-server) skip their own auth when Caddy handles it. One auth layer at the proxy. Never tunnel directly to service ports unless you explicitly want no auth.

## Auth Configuration

Auth rules are seeded from `asd.yaml` service definitions:

| `public` value | Auth behavior                                 |
| -------------- | --------------------------------------------- |
| `true`         | No auth required                              |
| `false`        | Caddy basic auth (auto-generated credentials) |

Override credentials via `.env`:

```bash
ASD_BASIC_AUTH_USER=myuser
ASD_BASIC_AUTH_PASS=mypass
```

Sync after changing:

```bash
asd caddy sync-auth
```

## This Project's Services

Current `asd.yaml` exposes:

| Service           | Port  | Subdomain        | Public          |
| ----------------- | ----- | ---------------- | --------------- |
| `angular:dev`     | 4200  | `{prefix}app`    | Yes             |
| `supabase:studio` | 54323 | `{prefix}studio` | Yes             |
| `codeserver`      | auto  | via hub          | No (basic auth) |
| `ttyd`            | auto  | via hub          | No (basic auth) |

## Useful Commands

```bash
asd net              # Show all services (TUI in interactive terminal)
asd caddy list       # Show Caddy servers and routes
asd caddy routes     # Regenerate Caddy routes from config
asd caddy config     # Show raw Caddy JSON config
```
