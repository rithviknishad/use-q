# AGENTS.md

Instructions for coding agents. Human-facing docs live in `README.md` and `apps/docs/`. Prefer those over restating project pitch here.

## What this is

pnpm workspace for **use-q**: an opinionated, schema-driven API client on TanStack Query v5 (TkDodo's [Practical React Query](https://tkdodo.eu/blog/practical-react-query) patterns).

| Package | Role |
| --- | --- |
| `@use-q/api-client` | Zero-runtime-dep core: `createFetcher`, `Schema` / `RouteDefinition`, tags, `ApiError` |
| `@use-q/api-client-codegen` | OpenAPI 3.x → typed `schema.ts`. CLI bin: `use-q-codegen` |
| `@use-q/api-client-react` | `createApiClient` + hooks (`useQ`, `useM`, `useInfiniteQ`, `useSuspenseQ`, `useQClient`) |

Docs site: `apps/docs` (Next.js App Router, static export to `out/`, [use-q.dev](https://use-q.dev)).

Node 20+, pnpm 10 (`packageManager` in the root `package.json`). ESM everywhere (`"type": "module"`).

## Commands

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint

pnpm --filter @use-q/api-client test
pnpm --filter @use-q/api-client-react exec vitest run test/useQ.test.tsx
pnpm --filter @use-q/api-client-react exec vitest run -t "fetches and returns data"

pnpm --filter docs dev          # http://localhost:3000
pnpm changeset                  # consumer-facing package changes only
```

CI (`.github/workflows/ci.yml`) runs build, typecheck, lint, and test on Node 20 and 22. Do not finish with any of those red.

## Layout

```
packages/api-client/                 core library
packages/api-client-codegen/         generate() + CLI
packages/api-client-react/           React + TanStack Query v5
apps/docs/content/docs/              MDX user docs
apps/docs/src/config/docs-nav.ts     sidebar, search, prev/next, llms.txt — keep in sync with MDX
```

Each library: `src/` with the public surface in `src/index.ts`, tests in `test/`, `tsup` → `dist/`. Do not edit `dist/` or hand-edit `pnpm-lock.yaml`.

`@use-q/api-client-react` re-exports the core so consumers can import from one package. Hook factories (`makeUseQ`, …) are internal; `createApiClient` is the public factory.

## Code style

- TypeScript `strict` with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` (`tsconfig.base.json`).
- Prettier (`.prettierrc`): semicolons, **single quotes**, trailing commas, printWidth 100.
- ESM imports in TypeScript use `.js` extensions: `import { ApiError } from './errors.js'`.
- Named exports. Unused bindings: prefix `_`.
- Optional object fields: omit the key or conditional-spread. Never pass explicit `undefined` (it fails `exactOptionalPropertyTypes`).

```ts
// ❌
generate({ input, output: options.output, baseUrl: options.baseUrl });

// ✅
generate({
  input,
  ...(options.output !== undefined ? { output: options.output } : {}),
  ...(options.baseUrl !== undefined ? { baseUrl: options.baseUrl } : {}),
});
```

- Keep `@use-q/api-client` dependency-free. React peers: `react` ^18 || ^19, `@tanstack/react-query` ^5, `@use-q/api-client`.
- Match local patterns. Extend existing helpers and test fixtures before adding abstractions.
- Comment non-obvious contracts (inference, tag invalidation, pagination). Do not narrate obvious code.
- Schema route ids are named keys (`listPets`), not `"GET /pets"`. Use `satisfies RouteDefinition<TParams, TSearch, TBody, TResponse>` plus `as const`.

## Testing

Every feature and bug fix should **improve coverage**. That is a goal of the change, not a follow-up.

**Do**

- New behavior: cover the happy path and the edge cases the public API promises.
- Bug fixes: add a regression test that fails without the fix.
- Prefer testing through exported APIs (`src/index.ts`), not private internals.
- Reuse fixtures (`packages/api-client-react/test/fixtures.ts`, codegen `test/fixtures/`). Mock `fetch`; do not hit the network.
- React tests: jsdom + Testing Library (`renderHook`, `waitFor`). Set `queries.retry: false` on test `QueryClient`s.
- Run the affected package, then `pnpm test` if the change crosses packages.

**Do not**

- Land behavior changes with only manual checks.
- Add tests for refactors already covered, or snapshots that only restate types.
- Invent a docs-app test suite (`apps/docs` currently stubs `test` / `lint`). Library coverage is the priority unless the task is explicitly about the site.

Vitest configs live next to each package. File pattern: `test/**/*.test.ts(x)`.

## Documentation

Docs exist for **users**, not as a log of agent work. Most small changes should not touch docs.

**Update docs when a consumer would notice the change**

- Public API, types, CLI flags, or package exports
- Observable behavior, error shapes, or other contracts
- New features or breaking changes
- Install, version, or usage instructions

**Skip docs when**

- Internal refactors, typing cleanups, CI / tooling
- Bug fixes that do not change contracts, errors, or user-visible behavior
- Test-only work, or performance tweaks with no consumer-facing difference

Where to edit:

- Consumer docs: `apps/docs/content/docs/**/*.mdx` with `title` and `description` frontmatter. **New pages must be registered** in `apps/docs/src/config/docs-nav.ts` (sidebar, search, pagers, llms.txt).
- Repo overview (`README.md`): only if packages, layout, or commands change.
- MDX examples may use double quotes (consumer style). Package source uses Prettier single quotes. Do not "fix" docs examples to match Prettier.

Do not add extra markdown (ADRs, CONTRIBUTING, per-PR notes) unless asked. Do not restyle docs-site chrome unless the task is about the site.

## Releases and git

Treat `src/index.ts` exports as the contract. Breaking changes need docs **and** a changeset.

- Consumer-facing package changes: `pnpm changeset`. Skip changesets for docs-only, test-only, or internal-only work.
- Do not bump versions by hand; Changesets owns versioning (`.changeset/`).
- Commit only when the user asks. Match existing history (`feat(api-client):`, `fix(codegen):`, `docs:`).
- Never commit secrets, `.env`, or credentials. Never skip hooks, force-push `main`, or rewrite published history.

## Boundaries

- Do not add runtime dependencies to `@use-q/api-client`.
- Do not expand the public export surface without updating types, tests, and (if user-visible) docs.
- `**/dist/**` is build output, not source.
- Prefer `pnpm --filter <pkg>` over ad-hoc `cd` + npm.
