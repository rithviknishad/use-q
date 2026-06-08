import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import {
  resolveUrl,
  type AnyRouteDefinition,
  type FetcherInstance,
  type PaginationDef,
  type RouteInput,
  type RouteResponse,
  type Schema,
  type TagRegistry,
} from '@use-q/api-client';
import type { QueryKeysFactory } from '../createApiClient.js';
import type { UseInfiniteQOptions } from '../types.js';

function defaultGetNextPageParam(pagination: PaginationDef) {
  if (pagination.kind === 'cursor') {
    const cursorKey = pagination.cursorKey ?? 'nextCursor';
    return (lastPage: unknown): unknown => {
      const v = (lastPage as Record<string, unknown> | null | undefined)?.[cursorKey];
      return v ?? null;
    };
  }
  const itemsKey = pagination.itemsKey ?? 'items';
  const totalKey = pagination.totalKey ?? 'total';
  return (lastPage: unknown, _all: unknown[], lastPageParam: unknown): unknown => {
    const page = lastPage as Record<string, unknown> | null | undefined;
    const items = (page?.[itemsKey] ?? []) as unknown[];
    const total = page?.[totalKey] as number | undefined;
    if (typeof total !== 'number') return null;
    const currentPage = typeof lastPageParam === 'number' ? lastPageParam : 1;
    const seen = currentPage * items.length;
    return seen >= total ? null : currentPage + 1;
  };
}

export function makeUseInfiniteQ<TSchema extends Schema>(
  schema: TSchema,
  fetcher: FetcherInstance,
  _tagRegistry: TagRegistry,
  queryKeys: QueryKeysFactory<TSchema>,
) {
  return function useInfiniteQ<RouteId extends keyof TSchema & string>(
    routeId: RouteId,
    input?: RouteInput<TSchema[RouteId]>,
    options?: UseInfiniteQOptions<RouteResponse<TSchema[RouteId]>, unknown>,
  ): UseInfiniteQueryResult<InfiniteData<RouteResponse<TSchema[RouteId]>, unknown>> {
    const route = schema[routeId] as AnyRouteDefinition;
    if (!route.pagination) {
      throw new Error(
        `useInfiniteQ: route "${String(routeId)}" has no \`pagination\` declaration in the schema.`,
      );
    }
    const pagination = route.pagination;
    const queryKey = queryKeys[routeId](input);

    const initialPageParam: unknown =
      options?.initialPageParam !== undefined
        ? options.initialPageParam
        : pagination.kind === 'cursor'
          ? null
          : 1;

    const getNextPageParam = options?.getNextPageParam ?? defaultGetNextPageParam(pagination);

    return useInfiniteQuery<
      RouteResponse<TSchema[RouteId]>,
      Error,
      InfiniteData<RouteResponse<TSchema[RouteId]>, unknown>,
      readonly unknown[],
      unknown
    >({
      queryKey,
      queryFn: async ({ pageParam, signal }) => {
        const resolved = resolveUrl(
          route.path,
          input?.params as Record<string, string | number | boolean | undefined | null> | undefined,
        );
        const search: Record<string, unknown> = {
          ...((input?.searchParams as Record<string, unknown> | undefined) ?? {}),
        };
        if (pageParam !== undefined && pageParam !== null) {
          search[pagination.pageParam] = pageParam as never;
        }
        return fetcher.fetch<RouteResponse<TSchema[RouteId]>>(resolved, {
          method: route.method,
          searchParams: search as never,
          signal,
        });
      },
      initialPageParam,
      getNextPageParam: getNextPageParam as never,
      ...(options ?? {}),
    });
  };
}
