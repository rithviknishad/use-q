import {
  useMutation,
  type QueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import {
  resolveUrl,
  type AnyRouteDefinition,
  type FetcherInstance,
  type RouteBody,
  type RouteParams,
  type RouteResponse,
  type RouteSearch,
  type Schema,
  type Tag,
  type TagRegistry,
} from '@use-q/api-client';
import type { QueryKeysFactory } from '../createApiClient.js';
import type { OptimisticTarget, UseMOptions } from '../types.js';

export interface UseMVariables<TSchema extends Schema, RouteId extends keyof TSchema & string> {
  params?: RouteParams<TSchema[RouteId]>;
  body?: RouteBody<TSchema[RouteId]>;
  searchParams?: RouteSearch<TSchema[RouteId]>;
}

export interface UseMContext {
  /** [queryKey, previousData] pairs captured pre-mutation for rollback. */
  snapshots: Array<{ key: ReadonlyArray<unknown>; previous: unknown }>;
}

type Variables<TSchema extends Schema, RouteId extends keyof TSchema & string> = UseMVariables<TSchema, RouteId>;
type MutationContext = UseMContext;

function resolveTargetKeys<TSchema extends Schema>(
  target: OptimisticTarget<TSchema>,
  queryKeys: QueryKeysFactory<TSchema>,
  tagRegistry: TagRegistry,
): ReadonlyArray<ReadonlyArray<unknown>> {
  if ('routeId' in target) {
    return [queryKeys[target.routeId](target.input)];
  }
  return tagRegistry.getKeysForTags(target.tags);
}

export function makeUseM<TSchema extends Schema>(
  schema: TSchema,
  fetcher: FetcherInstance,
  tagRegistry: TagRegistry,
  queryKeys: QueryKeysFactory<TSchema>,
  queryClient: QueryClient,
) {
  return function useM<RouteId extends keyof TSchema & string>(
    routeId: RouteId,
    options?: UseMOptions<TSchema, RouteId>,
  ): UseMutationResult<RouteResponse<TSchema[RouteId]>, Error, Variables<TSchema, RouteId>, MutationContext> {
    const route = schema[routeId] as AnyRouteDefinition;

    return useMutation<RouteResponse<TSchema[RouteId]>, Error, Variables<TSchema, RouteId>, MutationContext>({
      mutationFn: async (variables) => {
        const resolved = resolveUrl(
          route.path,
          variables.params as Record<string, string | number | boolean | undefined | null> | undefined,
        );
        return fetcher.fetch<RouteResponse<TSchema[RouteId]>>(resolved, {
          method: route.method,
          ...(variables.searchParams !== undefined
            ? { searchParams: variables.searchParams as Record<string, unknown> as never }
            : {}),
          ...(variables.body !== undefined ? { body: variables.body } : {}),
        });
      },
      onMutate: (async (variables: Variables<TSchema, RouteId>, ...rest: unknown[]) => {
        const snapshots: MutationContext['snapshots'] = [];
        for (const op of options?.optimisticUpdates ?? []) {
          const targetKeys = resolveTargetKeys(op.target, queryKeys, tagRegistry);
          for (const key of targetKeys) {
            await queryClient.cancelQueries({ queryKey: key as readonly unknown[] });
            const previous = queryClient.getQueryData(key as readonly unknown[]);
            snapshots.push({ key, previous });
            queryClient.setQueryData(key as readonly unknown[], (current: unknown) =>
              op.updater(current ?? previous, {
                ...(variables.params !== undefined ? { params: variables.params } : {}),
                ...(variables.body !== undefined ? { body: variables.body } : {}),
              }),
            );
          }
        }
        await (options?.onMutate as ((...a: unknown[]) => unknown) | undefined)?.(variables, ...rest);
        return { snapshots };
      }) as never,
      onError: ((error: Error, variables: Variables<TSchema, RouteId>, onMutateResult: MutationContext | undefined, ...rest: unknown[]) => {
        for (const snapshot of onMutateResult?.snapshots ?? []) {
          queryClient.setQueryData(snapshot.key as readonly unknown[], snapshot.previous);
        }
        (options?.onError as ((...a: unknown[]) => unknown) | undefined)?.(error, variables, onMutateResult, ...rest);
      }) as never,
      onSettled: (async (
        data: RouteResponse<TSchema[RouteId]> | undefined,
        error: Error | null,
        variables: Variables<TSchema, RouteId>,
        onMutateResult: MutationContext | undefined,
        ...rest: unknown[]
      ) => {
        const tagsFromSchema: ReadonlyArray<Tag> =
          typeof route.invalidatesTags === 'function'
            ? route.invalidatesTags({
                response: data,
                variables: {
                  ...(variables.params !== undefined ? { params: variables.params } : {}),
                  ...(variables.body !== undefined ? { body: variables.body } : {}),
                },
              })
            : (route.invalidatesTags ?? []);
        const extra = options?.additionalInvalidatesTags ?? [];
        const allTags = [...tagsFromSchema, ...extra];

        if (allTags.length > 0) {
          const keys = tagRegistry.getKeysForTags(allTags);
          await Promise.all(
            keys.map((key) => queryClient.invalidateQueries({ queryKey: key as readonly unknown[] })),
          );
        }
        await (options?.onSettled as ((...a: unknown[]) => unknown) | undefined)?.(
          data,
          error,
          variables,
          onMutateResult,
          ...rest,
        );
      }) as never,
      ...(options?.onSuccess !== undefined ? { onSuccess: options.onSuccess } : {}),
      ...(options?.retry !== undefined ? { retry: options.retry } : {}),
      ...(options?.retryDelay !== undefined ? { retryDelay: options.retryDelay } : {}),
      ...(options?.mutationKey !== undefined ? { mutationKey: options.mutationKey } : {}),
    });
  };
}
