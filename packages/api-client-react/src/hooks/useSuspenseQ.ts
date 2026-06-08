import { useSuspenseQuery, type UseSuspenseQueryResult } from '@tanstack/react-query';
import {
  resolveUrl,
  type AnyRouteDefinition,
  type FetcherInstance,
  type RouteInput,
  type RouteResponse,
  type Schema,
  type TagRegistry,
} from '@use-q/api-client';
import type { QueryKeysFactory } from '../createApiClient.js';
import type { UseSuspenseQOptions } from '../types.js';

export function makeUseSuspenseQ<TSchema extends Schema>(
  schema: TSchema,
  fetcher: FetcherInstance,
  _tagRegistry: TagRegistry,
  queryKeys: QueryKeysFactory<TSchema>,
) {
  return function useSuspenseQ<RouteId extends keyof TSchema & string>(
    routeId: RouteId,
    input?: RouteInput<TSchema[RouteId]>,
    options?: UseSuspenseQOptions<RouteResponse<TSchema[RouteId]>>,
  ): UseSuspenseQueryResult<RouteResponse<TSchema[RouteId]>> {
    const route = schema[routeId] as AnyRouteDefinition;
    const queryKey = queryKeys[routeId](input);

    return useSuspenseQuery<RouteResponse<TSchema[RouteId]>>({
      queryKey,
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
      ...(options ?? {}),
    });
  };
}
