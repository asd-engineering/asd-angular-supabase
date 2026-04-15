# DevInCi Cloud IDE

Launch a full cloud development environment from CI via the `devinci.yml` GitHub Action.

## Manage Sessions

```bash
gh workflow run devinci.yml -f username="USER" -f password="PASS"  # Trigger
gh run list --workflow=devinci.yml --status=in_progress              # List active
gh run watch $(gh run list --workflow=devinci.yml --limit 1 --json databaseId -q '.[0].databaseId')  # Watch
```

## What Gets Started

- **ttyd** — browser terminal for running commands
- **code-server** — VS Code in the browser
- **Caddy** — reverse proxy with basic auth (auto-generated credentials)
- **ASD tunnel** — public HTTPS access to all services

## Cross-Platform Support

| Platform                    | code-server | ttyd | Basic Auth |
| --------------------------- | ----------- | ---- | ---------- |
| Linux (ubuntu-latest)       | Yes         | Yes  | 401/302    |
| macOS (macos-latest, ARM64) | Yes         | N/A  | 401/302    |
| Windows (windows-latest)    | No          | Yes  | 401/200    |
