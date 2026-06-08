# use-q docs

Documentation site for [use-q](https://github.com/rithviknishad/use-q) — a type-safe API client for TypeScript and React, built on top of TanStack Query v5.

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

## Running locally

From the monorepo root:

```bash
pnpm install
pnpm --filter docs dev
```

Or from this directory:

```bash
pnpm dev
```

The dev server starts on [http://localhost:4321](http://localhost:4321).

## Building

```bash
pnpm --filter docs build
```

The static site is emitted to `apps/docs/dist/`.

## Where pages live

All Markdown/MDX content lives under `src/content/docs/`:

- `getting-started/` — installation, quick-start, anatomy of a schema
- `core/` — the framework-agnostic `createFetcher` and codegen
- `react/` — `createApiClient`, hooks (`useQ`, `useM`, etc.), and `<ApiErrorBoundary>`
- `guides/` — query keys, tag invalidation, optimistic updates, SSR, BYO query client, monorepo usage
- `api-reference/` — typed reference for the public API surface

Sidebar groups are auto-generated per directory in `astro.config.mjs`.

## Deploying

The site is built as a static export. `wrangler.toml` configures Cloudflare Pages with `pages_build_output_dir = "dist"`.
