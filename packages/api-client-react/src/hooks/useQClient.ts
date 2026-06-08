import { useMemo } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import {
  resolveUrl,
  type AnyRouteDefinition,
  type FetcherInstance,
  type RouteInput,
  type RouteResponse,
  type Schema,
  type Tag,
  type TagRegistry,
} from '@use-q/api-client';
import type { QueryKeysFactory } from '../createApiClient.js';

/**
 * Either an exact-match key, or a `{ prefix: [...] }` wrapper indicating that
 * TanStack's prefix-based invalidation should be used.
 */
export type InvalidateTarget =
  | ReadonlyArray<unknown>
  | { prefix: ReadonlyArray<unknown> };

export function makeUseQClient<TSchema extends Schema>(
  schema: TSchema,
  fetcher: FetcherInstance,
  tagRegistry: TagRegistry,
  queryKeys: QueryKeysFactory<TSchema>,
  queryClient: QueryClient,
) {
  return function useQClient() {
    return useMemo(() => {
      const api = {
        /** Invalidate every query registered against any of the given tags. */
        async invalidateTag(tags: Tag | ReadonlyArray<Tag>): Promise<void> {
          const list = Array.isArray(tags) ? tags : [tags as Tag];
          const keys = tagRegistry.getKeysForTags(list);
          await Promise.all(
            keys.map((key) => queryClient.invalidateQueries({ queryKey: key as readonly unknown[] })),
          );
        },
        /**
         * Invalidate either an exact key or every key starting with the given prefix.
         * The shape mirrors TanStack's underlying `invalidateQueries({ queryKey, exact })`.
         */
        async invalidate(target: InvalidateTarget): Promise<void> {
          if (Array.isArray(target)) {
            await queryClient.invalidateQueries({ queryKey: target as readonly unknown[], exact: true });
          } else {
            await queryClient.invalidateQueries({
              queryKey: (target as { prefix: ReadonlyArray<unknown> }).prefix as readonly unknown[],
              exact: false,
            });
          }
        },
        /** Invalidate every query the client knows about. */
        async invalidateAll(): Promise<void> {
          await queryClient.invalidateQueries();
        },
        /** Set the cached value for a specific route input. */
        setData<RouteId extends keyof TSchema & string>(
          routeId: RouteId,
          input: RouteInput<TSchema[RouteId]> | undefined,
          data: RouteResponse<TSchema[RouteId]>,
        ): void {
          queryClient.setQueryData(queryKeys[routeId](input) as readonly unknown[], data);
        },
        /** Functionally update the cached value (no-op if not present). */
        updateData<RouteId extends keyof TSchema & string>(
          routeId: RouteId,
          input: RouteInput<TSchema[RouteId]> | undefined,
          updater: (previous: RouteResponse<TSchema[RouteId]> | undefined) => RouteResponse<TSchema[RouteId]>,
        ): void {
          queryClient.setQueryData(queryKeys[routeId](input) as readonly unknown[], (previous: unknown) =>
            updater(previous as RouteResponse<TSchema[RouteId]> | undefined),
          );
        },
        /** Prefetch a query into the cache without subscribing. */
        async prefetch<RouteId extends keyof TSchema & string>(
          routeId: RouteId,
          input?: RouteInput<TSchema[RouteId]>,
        ): Promise<void> {
          const route = schema[routeId] as AnyRouteDefinition;
          await queryClient.prefetchQuery({
            queryKey: queryKeys[routeId](input),
            queryFn: async ({ signal }) => {
              const resolved = resolveUrl(
                route.path,
                input?.params as Record<string, string | number | boolean | undefined | null> | undefined,
              );
              return fetcher.fetch<RouteResponse<TSchema[RouteId]>>(resolved, {
                method: route.method,
                ...(input?.searchParams !== undefined
                  ? { searchParams: input.searchParams as Record<string, unknown> as never }
                  : {}),
                signal,
              });
            },
          });
        },
      };
      return api;
    }, []);
  };
}
