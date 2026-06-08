import { QueryClient } from '@tanstack/react-query';
import {
  TagRegistry,
  buildQueryKey,
  createFetcher,
  isApiError,
  resolveUrl,
  type AnyRouteDefinition,
  type CreateFetcherOptions,
  type FetcherInstance,
  type HttpMethod,
  type RouteInput,
  type RouteResponse,
  type Schema,
} from '@use-q/api-client';

import { makeUseQ } from './hooks/useQ.js';
import { makeUseM } from './hooks/useM.js';
import { makeUseInfiniteQ } from './hooks/useInfiniteQ.js';
import { makeUseSuspenseQ } from './hooks/useSuspenseQ.js';
import { makeUseQClient } from './hooks/useQClient.js';

export interface CreateApiClientOptions extends CreateFetcherOptions {
  /**
   * Optional pre-existing `QueryClient`. If omitted, `createApiClient` creates
   * its own — handy for tests but in apps you typically pass the same instance
   * you wrap the tree with via `<QueryClientProvider>`.
   */
  queryClient?: QueryClient;
}

/**
 * Type-friendly factory exposed to query-key consumers. Each entry is a
 * function that accepts the route's input (params/search) and returns the
 * canonical `["api", METHOD, resolvedPath, sortedSearch]` key.
 */
export type QueryKeysFactory<TSchema extends Schema> = {
  [K in keyof TSchema & string]: (input?: RouteInput<TSchema[K]>) => readonly [
    'api',
    HttpMethod,
    string,
    Record<string, unknown>,
  ];
};

function buildQueryKeys<TSchema extends Schema>(schema: TSchema): QueryKeysFactory<TSchema> {
  const out = {} as QueryKeysFactory<TSchema>;
  for (const key of Object.keys(schema) as Array<keyof TSchema & string>) {
    const route = schema[key] as AnyRouteDefinition;
    out[key] = (input?: RouteInput) => {
      const resolved = resolveUrl(
        route.path,
        input?.params as Record<string, string | number | boolean | undefined | null> | undefined,
      );
      return buildQueryKey(
        route.method,
        resolved,
        input?.searchParams as Parameters<typeof buildQueryKey>[2],
      );
    };
  }
  return out;
}

/**
 * Build a fully-typed API client bound to a user schema.
 *
 * NOTE — Adjustment from the original handoff spec: `createApiClient` requires
 * the schema as a *runtime* argument (not just a type parameter) because the
 * hooks need to read `routeDef.tags`, `routeDef.invalidatesTags`, and
 * `routeDef.pagination` at runtime to dispatch invalidation and pagination.
 * Passing the schema both as a value and as a type keeps inference automatic
 * while giving the hooks the runtime metadata they need.
 */
export function createApiClient<TSchema extends Schema>(
  schema: TSchema,
  options: CreateApiClientOptions,
) {
  const queryClient = options.queryClient ?? new QueryClient();
  const fetcher: FetcherInstance = createFetcher({
    baseUrl: options.baseUrl,
    ...(options.headers !== undefined ? { headers: options.headers } : {}),
    ...(options.fetch !== undefined ? { fetch: options.fetch } : {}),
    ...(options.parseError !== undefined ? { parseError: options.parseError } : {}),
    ...(options.onError !== undefined ? { onError: options.onError } : {}),
  });
  const tagRegistry = new TagRegistry();
  const queryKeys = buildQueryKeys(schema);

  const useQ = makeUseQ<TSchema>(schema, fetcher, tagRegistry, queryKeys);
  const useM = makeUseM<TSchema>(schema, fetcher, tagRegistry, queryKeys, queryClient);
  const useInfiniteQ = makeUseInfiniteQ<TSchema>(schema, fetcher, tagRegistry, queryKeys);
  const useSuspenseQ = makeUseSuspenseQ<TSchema>(schema, fetcher, tagRegistry, queryKeys);
  const useQClient = makeUseQClient<TSchema>(schema, fetcher, tagRegistry, queryKeys, queryClient);

  return {
    queryClient,
    fetcher,
    queryKeys,
    isApiError,
    /** Exposed for introspection / advanced cases — treat as semi-private. */
    _tagRegistry: tagRegistry,
    schema,
    useQ,
    useM,
    useInfiniteQ,
    useSuspenseQ,
    useQClient,
  };
}

export type ApiClient<TSchema extends Schema> = ReturnType<typeof createApiClient<TSchema>>;

// Re-export for hook implementations.
export type { AnyRouteDefinition, RouteResponse };
