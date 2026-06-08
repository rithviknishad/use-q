export { createFetcher } from './createFetcher.js';
export { ApiError, isApiError } from './errors.js';
export { TagRegistry, tagToString } from './tag-registry.js';
export {
  appendSearch,
  buildQueryKey,
  extractMethod,
  resolveTags,
  resolveUrl,
} from './utils.js';

export type {
  AnyRouteDefinition,
  CreateFetcherOptions,
  FetcherFetchOptions,
  FetcherInstance,
  HttpMethod,
  PaginationDef,
  RouteBody,
  RouteDefinition,
  RouteInput,
  RouteParams,
  RouteResponse,
  RouteSearch,
  Schema,
  SearchParamValue,
  SearchParams,
  Tag,
} from './types.js';
