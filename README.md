# use-q

An opinionated, type-safe way to use [TanStack Query](https://tanstack.com/query) v5 — the patterns from [TkDodo's Practical React Query](https://tkdodo.eu/blog/practical-react-query) series, encoded as a schema-driven API client.

You describe each endpoint once. use-q infers types, builds hierarchical query keys, and invalidates the right caches after mutations. You still own the `QueryClient`.

Docs: [use-q.dev](https://use-q.dev) · [why these defaults](https://use-q.dev/docs/getting-started/practical-react-query)

## Packages

| Package | Description |
| ------- | ----------- |
| [`@use-q/api-client`](./packages/api-client) | Zero-dependency, type-safe fetcher driven by an OpenAPI-derived schema. |
| [`@use-q/api-client-codegen`](./packages/api-client-codegen) | CLI + programmatic API that turns an OpenAPI 3.x spec into a typed `schema.ts`. |
| [`@use-q/api-client-react`](./packages/api-client-react) | Opinionated TanStack Query v5 hooks (`useQ`, `useM`, `useInfiniteQ`, `useSuspenseQ`, …) following TkDodo's Practical React Query patterns. |

## Repo layout

```
packages/
  api-client/           # @use-q/api-client (core)
  api-client-codegen/   # @use-q/api-client-codegen (CLI)
  api-client-react/     # @use-q/api-client-react (hooks)
apps/
  docs/                 # Next.js documentation site (use-q.dev)
```

## Development

This is a [pnpm](https://pnpm.io) workspace with [Changesets](https://github.com/changesets/changesets) for versioning.

```bash
pnpm install        # install workspace deps
pnpm -r build       # build every package
pnpm -r test        # run all tests
pnpm -r typecheck   # type-check every package
pnpm -r lint        # lint every package
pnpm changeset      # author a release note
```

Node 20+ and pnpm 9+ are required.

## License

MIT
