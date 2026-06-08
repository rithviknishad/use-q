import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import {
  resolveTags,
  resolveUrl,
  type AnyRouteDefinition,
  type FetcherInstance,
  type RouteInput,
  type RouteResponse,
  type Schema,
  type TagRegistry,
} from '@use-q/api-client';
import type { QueryKeysFactory } from '../createApiClient.js';
import type { UseQOptions } from '../types.js';

export function makeUseQ<TSchema extends Schema>(
  schema: TSchema,
  fetcher: FetcherInstance,
  tagRegistry: TagRegistry,
  queryKeys: QueryKeysFactory<TSchema>,
) {
  return function useQ<RouteId extends keyof TSchema & string>(
    routeId: RouteId,
    input?: RouteInput<TSchema[RouteId]>,
    options?: UseQOptions<RouteResponse<TSchema[RouteId]>>,
  ): UseQueryResult<RouteResponse<TSchema[RouteId]>> {
    const route = schema[routeId] as AnyRouteDefinition;
    const queryKey = queryKeys[routeId](input);

    const result = useQuery<RouteResponse<TSchema[RouteId]>>({
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

    // Register tags exactly once per (key, response identity) so the registry
    // stays in sync with the cache for tag-based invalidation.
    const lastTagsRef = useRef<string | null>(null);
    useEffect(() => {
      if (result.data === undefined) return;
      const tags = resolveTags(route, { response: result.data, params: input?.params ?? {} });
      if (tags.length === 0) return;
      const fingerprint = JSON.stringify([queryKey, tags]);
      if (fingerprint === lastTagsRef.current) return;
      tagRegistry.register(queryKey, tags);
      lastTagsRef.current = fingerprint;
      return () => {
        tagRegistry.unregister(queryKey);
        lastTagsRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result.data]);

    return result;
  };
}
