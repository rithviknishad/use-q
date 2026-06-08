# use-q

Type-safe API client monorepo built on top of TanStack Query v5.

## Packages

| Package | Description |
| ------- | ----------- |
| [`@use-q/api-client`](./packages/api-client) | Zero-dependency, type-safe fetcher driven by an OpenAPI-derived schema. |
| [`@use-q/api-client-codegen`](./packages/api-client-codegen) | CLI + programmatic API that turns an OpenAPI 3.x spec into a typed `schema.ts`. |
| [`@use-q/api-client-react`](./packages/api-client-react) | React hooks layer (`useQ`, `useM`, `useInfiniteQ`, `useSuspenseQ`, …) bridging the core client to TanStack Query. |

## Repo layout

```
packages/
  api-client/           # @use-q/api-client (core)
  api-client-codegen/   # @use-q/api-client-codegen (CLI)
  api-client-react/     # @use-q/api-client-react (hooks)
apps/
  docs/                 # Astro + Starlight documentation
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
