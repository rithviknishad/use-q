/**
 * Core types for the use-q API client.
 *
 * A `Schema` is a record of `RouteDefinition`s keyed by an arbitrary route id
 * (typically `"<METHOD> <path>"`). All hooks and the core fetcher operate
 * generically over a user-provided schema.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type SearchParamValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | null
  | undefined;

export type SearchParams = Record<string, SearchParamValue>;

/** Tag descriptor used by the optional `TagRegistry` for cache invalidation. */
export type Tag = string | { type: string; id?: string | number };

/**
 * Pagination metadata attached to a route. Two shapes are supported:
 *  - `page-number`: classic `?page=N` style.
 *  - `cursor`: a server-issued opaque cursor (e.g. `?cursor=…`).
 */
export type PaginationDef =
  | {
      kind: 'page-number';
      pageParam: string; // e.g. "page"
      itemsKey?: string; // default "items"
      totalKey?: string; // default "total"
    }
  | {
      kind: 'cursor';
      pageParam: string; // e.g. "cursor"
      cursorKey?: string; // default "nextCursor"
      itemsKey?: string; // default "items"
    };

/**
 * A single route declaration. `TParams`/`TSearch`/`TBody`/`TResponse` are
 * inferred from the OpenAPI codegen output (or hand-rolled) and feed every
 * hook in the React layer.
 */
export interface RouteDefinition<
  TParams = unknown,
  TSearch = unknown,
  TBody = unknown,
  TResponse = unknown,
> {
  /** HTTP method. */
  method: HttpMethod;
  /** Path template with `{param}` placeholders, e.g. `/users/{id}`. */
  path: string;
  /** Static tags or a function that derives tags from response/params. */
  tags?: ReadonlyArray<Tag> | ((ctx: { response: TResponse; params: TParams }) => ReadonlyArray<Tag>);
  /** Tags to invalidate after a successful mutation. */
  invalidatesTags?:
    | ReadonlyArray<Tag>
    | ((ctx: {
        response: TResponse | undefined;
        variables: { params?: TParams; body?: TBody };
      }) => ReadonlyArray<Tag>);
  /** Pagination metadata for infinite queries. */
  pagination?: PaginationDef;
  /** Phantom carriers — never used at runtime, exist purely for inference. */
  __params?: TParams;
  __search?: TSearch;
  __body?: TBody;
  __response?: TResponse;
}

export type AnyRouteDefinition = RouteDefinition<any, any, any, any>;

export type Schema = Record<string, AnyRouteDefinition>;

/** Helpers to extract per-route generics from a schema. */
export type RouteParams<R extends AnyRouteDefinition> = R extends RouteDefinition<infer P, any, any, any> ? P : never;
export type RouteSearch<R extends AnyRouteDefinition> = R extends RouteDefinition<any, infer S, any, any> ? S : never;
export type RouteBody<R extends AnyRouteDefinition> = R extends RouteDefinition<any, any, infer B, any> ? B : never;
export type RouteResponse<R extends AnyRouteDefinition> = R extends RouteDefinition<any, any, any, infer T>
  ? T
  : never;

/** Shape of values supplied to fetcher/hooks. */
export interface RouteInput<R extends AnyRouteDefinition = AnyRouteDefinition> {
  params?: RouteParams<R>;
  searchParams?: RouteSearch<R>;
  body?: RouteBody<R>;
}

/**
 * Options that may be passed when constructing a fetcher instance.
 *
 * `parseError` lets callers normalize backend error payloads into the
 * `ApiError` shape exposed throughout the library. `onError` is invoked
 * after `parseError` (or after constructing a default `ApiError`) and is a
 * good place to wire up logging or auth-refresh logic.
 */
export interface CreateFetcherOptions {
  baseUrl: string;
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  fetch?: typeof fetch;
  parseError?: (input: { response: Response; data: unknown }) => unknown;
  onError?: (error: unknown) => void;
}

/** Options forwarded to the `coreFetch` call performed by the fetcher. */
export interface FetcherFetchOptions {
  method?: HttpMethod;
  params?: Record<string, string | number | boolean>;
  searchParams?: SearchParams;
  body?: unknown;
  signal?: AbortSignal;
  headers?: HeadersInit;
}

/** Public fetcher instance returned from `createFetcher`. */
export interface FetcherInstance {
  baseUrl: string;
  /** Low-level fetch — resolves URL, encodes body and parses response. */
  fetch: <TResponse = unknown>(path: string, options?: FetcherFetchOptions) => Promise<TResponse>;
}
