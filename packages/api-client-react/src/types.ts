import type {
  DefaultError,
  InfiniteData,
  QueryKey,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  UseQueryOptions,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import type {
  AnyRouteDefinition,
  RouteBody,
  RouteInput,
  RouteParams,
  RouteResponse,
  RouteSearch,
  Schema,
  Tag,
} from '@use-q/api-client';

/**
 * Options accepted by `useQ`. Extends TanStack Query's `useQuery` options but
 * strips the fields the hooks manage internally (`queryKey`, `queryFn`).
 */
export type UseQOptions<TData = unknown> = Omit<
  UseQueryOptions<TData, DefaultError, TData, QueryKey>,
  'queryKey' | 'queryFn'
>;

/**
 * Identifies a query (or queries) targeted by an optimistic update. Either an
 * exact route id (with its input) or a tag list — both forms are resolved
 * against the registry to the underlying TanStack query keys.
 */
export type OptimisticTarget<TSchema extends Schema = Schema> =
  | { routeId: keyof TSchema & string; input?: RouteInput<TSchema[keyof TSchema & string]> }
  | { tags: ReadonlyArray<Tag> };

/**
 * Options accepted by `useM`. Adds optimistic-update + extra-invalidation
 * machinery on top of TanStack's `useMutation` options. The `mutationFn` is
 * supplied by the hook itself.
 */
export interface UseMOptions<
  TSchema extends Schema,
  RouteId extends keyof TSchema & string,
  TError = DefaultError,
> extends Omit<
    UseMutationOptions<
      RouteResponse<TSchema[RouteId]>,
      TError,
      { params?: RouteParams<TSchema[RouteId]>; body?: RouteBody<TSchema[RouteId]>; searchParams?: RouteSearch<TSchema[RouteId]> },
      unknown
    >,
    'mutationFn'
  > {
  optimisticUpdates?: ReadonlyArray<{
    target: OptimisticTarget<TSchema>;
    updater: (previous: unknown, variables: {
      params?: RouteParams<TSchema[RouteId]>;
      body?: RouteBody<TSchema[RouteId]>;
    }) => unknown;
  }>;
  additionalInvalidatesTags?: ReadonlyArray<Tag>;
}

/**
 * Options accepted by `useInfiniteQ`. Wraps TanStack's `useInfiniteQuery`
 * options with the same omit set as `useQ` plus `initialPageParam`/`getNextPageParam`
 * (those are usually inferred from the route's `pagination` field, but may be
 * overridden here).
 */
export type UseInfiniteQOptions<TData = unknown, TPageParam = unknown> = Omit<
  UseInfiniteQueryOptions<TData, DefaultError, InfiniteData<TData, TPageParam>, QueryKey, TPageParam>,
  'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
> & {
  initialPageParam?: TPageParam;
  getNextPageParam?: (lastPage: TData, allPages: TData[], lastPageParam: TPageParam) => TPageParam | undefined | null;
};

export type UseSuspenseQOptions<TData = unknown> = Omit<
  UseSuspenseQueryOptions<TData, DefaultError, TData, QueryKey>,
  'queryKey' | 'queryFn'
>;

/** Helper alias used heavily inside the hooks. */
export type AnyRoute = AnyRouteDefinition;
