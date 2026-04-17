# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### cristina-site (React + Vite)
- **Preview path**: `/`
- **Description**: Cristina Lucero personal creator platform — a private membership/content site inspired by OnlyFans but fully independent. Features dark mode with burgundy/plum accents.
- **Pages**: Home (profile + content grid), Content Detail (/content/:id), Checkout (/checkout)

### api-server (Express)
- **Preview path**: `/api`
- **Routes**: /api/profile, /api/stats, /api/categories, /api/content, /api/content/featured, /api/content/:id, /api/purchases

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## DB Schema

- `profile` — creator profile (single row)
- `categories` — content categories (Photos, Videos, Bundles)
- `content` — individual content items with price, lock status, preview URL
- `purchases` — purchase records

## Notes

- The `lib/api-zod/src/index.ts` is overwritten after codegen to avoid duplicate exports (orval generates conflicting re-exports in split mode). This is handled in the codegen script.
- The api-spec orval config uses `mode: "single"` for zod output to generate a single `api.ts` file.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
