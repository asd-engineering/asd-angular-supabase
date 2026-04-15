# ASD Vault Injection — AI-Safe Credential Management

## The Problem

AI agents need to run applications that require credentials (API keys, database URLs, payment secrets). Storing raw secrets in `.env` files means any agent with file access can read them. ASD Vault solves this by injecting credentials at runtime without ever writing them to disk.

## How It Works

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

## Three-Tier Encryption

1. **Server-side encryption** — secrets encrypted at rest on the ASD tunnel server
2. **Scope key** — each project/scope has its own encryption key
3. **Passphrase** — optional user passphrase for additional protection

## Graceful Fallback

Vault is an **optional ASD add-on**. Without it, the project works normally with `.env` files — vault just adds the AI-safety layer. No hard dependency.

- If `asd vault run` is available, secrets are injected from vault
- If not, the standard `.env` file is used (manual secret management)
- `tpl.env` always works as a plain template regardless of vault availability

## Comparison: Credential Management Approaches

| Approach      | AI Can Read? | Rotatable? | Audit Trail? | Works in CI?              |
| ------------- | ------------ | ---------- | ------------ | ------------------------- |
| `.env` files  | Yes (unsafe) | Manual     | No           | Copy/paste                |
| GH Secrets    | No           | Yes        | Limited      | Yes                       |
| **ASD Vault** | **No**       | **Yes**    | **Yes**      | **Yes (`asd vault run`)** |

## Rules for AI Agents

- **Never** write raw secrets to files — use `asd vault store` or environment variables
- **Never** log or print secret values — use `asd vault list` to verify keys exist
- `tpl.env` and `asd.yaml` are safe to read and modify — they contain references, not values
- Use `asd vault run` to inject secrets when running commands that need them
