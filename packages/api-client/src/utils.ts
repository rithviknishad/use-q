import type {
  AnyRouteDefinition,
  HttpMethod,
  RouteDefinition,
  SearchParams,
  Tag,
} from './types.js';

/**
 * Replace `{param}` placeholders in `path` with values from `params`. Each
 * value is URI-encoded. Throws when a placeholder has no corresponding value.
 */
export function resolveUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  return path.replace(/\{([^}]+)\}/g, (_match, rawName: string) => {
    const name = rawName.trim();
    const value = params?.[name];
    if (value === undefined || value === null) {
      throw new Error(`Missing path parameter "${name}" for path "${path}"`);
    }
    return encodeURIComponent(String(value));
  });
}

/**
 * Append `searchParams` to a URL. Skips `undefined`/`null` values. Arrays are
 * appended as repeated keys (e.g. `?id=1&id=2`). Returns the input string
 * unchanged when there are no params to append.
 */
export function appendSearch(url: string, searchParams?: SearchParams): string {
  if (!searchParams) return url;
  const entries = Object.entries(searchParams);
  if (entries.length === 0) return url;
  const usp = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        usp.append(key, String(item));
      }
    } else {
      usp.append(key, String(value));
    }
  }
  const qs = usp.toString();
  if (!qs) return url;
  return url + (url.includes('?') ? '&' : '?') + qs;
}

/**
 * Deterministic query-key shape used everywhere in the library:
 *   `["api", METHOD, resolvedPath, searchParams ?? {}]`
 *
 * `searchParams` keys are sorted so that `{ a:1, b:2 }` and `{ b:2, a:1 }`
 * produce the same key.
 */
export function buildQueryKey(
  method: HttpMethod,
  resolvedPath: string,
  searchParams?: SearchParams,
): readonly ['api', HttpMethod, string, Record<string, unknown>] {
  const sortedSearch: Record<string, unknown> = {};
  if (searchParams) {
    const keys = Object.keys(searchParams).sort();
    for (const key of keys) {
      const value = searchParams[key];
      if (value === undefined) continue;
      sortedSearch[key] = value;
    }
  }
  return ['api', method, resolvedPath, sortedSearch] as const;
}

/** Resolve a route's `tags` field, supporting both static arrays and functions. */
export function resolveTags<R extends AnyRouteDefinition>(
  route: R,
  ctx: { response: unknown; params: unknown },
): ReadonlyArray<Tag> {
  const tags = (route as RouteDefinition).tags;
  if (!tags) return [];
  if (typeof tags === 'function') {
    return tags({ response: ctx.response as never, params: ctx.params as never });
  }
  return tags;
}

/** Convenience accessor returning the route's HTTP method (defaults to GET). */
export function extractMethod(route: AnyRouteDefinition | undefined): HttpMethod {
  return (route?.method ?? 'GET') as HttpMethod;
}
