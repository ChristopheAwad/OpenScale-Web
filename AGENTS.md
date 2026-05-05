# AGENTS.md

## Commands

- `npm run dev` - Dev server (port 5173)
- `npm run build` - Build for production
- `npm run start` - Build and start production server (port 3000)
- `npm run preview` - Preview production build (port 4173)
- `npm run check` - Type check (`svelte-kit sync` + `svelte-check`)
- `npm run test` - Run all tests (`vitest run`)
- `npx vitest run tests/unit/db.test.ts` - Run a single test file
- `npm run test:coverage` - Run tests with coverage (`src/lib/server/db.ts` excluded)

## Environment

- **Node.js 20+ required** - `.npmrc` sets `engine-strict=true`
- **Database**: SQLite via `better-sqlite3`, stored at `data/openweight.db` (dev) or `$DATA_DIR/openweight.db`
- **Production**: Set `SESSION_SECRET` env var (required for cookie signing)
- **Test environment**: jsdom, setup file at `tests/setup.ts`

## Architecture

- **Framework**: SvelteKit with `@sveltejs/adapter-node` (not adapter-auto)
- **Svelte 5 runes**: Enabled for all files outside `node_modules` (`svelte.config.js`)
- **UI**: Skeleton UI + Tailwind CSS v4, dark mode only
- **Auth**: Cookie-based sessions (DB `sessions` table), no JWT
- **DB init**: Tables created in `src/lib/server/db.ts` on startup via `initDb()`; WAL mode enabled
- **Tests**: Unit in `tests/unit/`, integration (API) in `tests/integration/`

## Docker

- Multi-stage build: `node:20-alpine` builder + runner
- `better-sqlite3` requires native rebuild in container (python3, make, g++ installed)
- Runs as non-root user (UID 1001, GID 1001 by default)
- Override with `PUID`/`PGID` env vars (Unraid: PUID=99, PGID=100)

## Gotchas

- `svelte-kit sync` must run before type checking (handled in `npm run check`)
- `.svelte-kit/tsconfig.json` is generated - `tsconfig.json` extends it
- Two Docker CI workflows exist: `docker.yml` (simple push) and `docker-publish.yml` (adds attestation + multi-tag)
- `vitest.config.ts` reuses SvelteKit + Tailwind plugins; tests run in jsdom
- Uploads stored in `uploads/` (dev) or `/app/uploads` (Docker)

## GitHub Process

- Every feature change or fix must bump the **patch version** (last number) in `package.json` before pushing to GitHub
- Version format: `major.minor.patch` (e.g., `0.1.2` → `0.1.3`)
- Commit the version bump alongside your changes, then push to GitHub
