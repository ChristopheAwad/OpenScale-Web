# AGENTS.md

## Commands

- `npm run dev` - Start dev server (port 5173)
- `npm run build` - Build for production
- `npm run start` - Build **and** start production server (port 3000) in one command
- `npm run check` - Type check (runs `svelte-kit sync` first, then `svelte-check`)
- `npm run check:watch` - Type check in watch mode

## Environment

- **Node.js 20+ required** - `.npmrc` sets `engine-strict=true`
- **Database**: SQLite via `better-sqlite3`, stored at `data/openweight.db` (dev) or `$DATA_DIR/openweight.db`
- **Data directory**: Override with `DATA_DIR` env var (default: `data/` in dev, `/app/data` in Docker)

## Architecture

- **Framework**: SvelteKit with `@sveltejs/adapter-node` (Node.js adapter, not adapter-auto)
- **Svelte 5 runes**: Enabled for all files outside `node_modules` (see `svelte.config.js`)
- **UI**: Skeleton UI + Tailwind CSS v4, dark mode only
- **Auth**: Session tokens stored in DB (`sessions` table), simple cookie-based (no JWT)
- **DB init**: Tables created in `src/lib/server/db.ts` on startup via `initDb()`

## Docker

- Multi-stage build: `node:20-alpine` builder + runner
- `better-sqlite3` requires native rebuild in container (python3, make, g++ installed)
- Runs as non-root user (UID 1001, GID 1001 by default)
- Override user ID with `PUID`/`PGID` env vars for host permission matching (Unraid: PUID=99, PGID=100)

## Gotchas

- No test framework configured - don't expect or look for tests
- `svelte-kit sync` must run before type checking (handled in `npm run check`)
- `.svelte-kit/tsconfig.json` is generated - main `tsconfig.json` extends it
- CI has two Docker workflows (`docker.yml` and `docker-publish.yml`) that appear redundant
- Production start port is 3000, dev port is 5173
