# ============================================================
# ASD Angular Supabase — Multi-stage Dockerfile
# ============================================================
# Targets:
#   dev   — sandbox with full ASD toolkit (asd sandbox shell)
#   build — CI build verification
#   prod  — SSR production server
# ============================================================

# ----------------------------------------------------------
# DEV: ASD Sandbox with pnpm
# ----------------------------------------------------------
FROM ghcr.io/asd-engineering/asd-sandbox:latest AS dev

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /workspace

# ----------------------------------------------------------
# BUILD: CI — install deps + build
# ----------------------------------------------------------
FROM node:22-bookworm AS build

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ----------------------------------------------------------
# PROD: SSR production server
# ----------------------------------------------------------
FROM node:22-bookworm-slim AS prod

RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid appuser --shell /bin/sh --create-home appuser

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

USER appuser

EXPOSE 4000
ENV PORT=4000

CMD ["node", "dist/asd-angular-supabase/server/server.mjs"]
