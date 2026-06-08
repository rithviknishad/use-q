import { ApiError } from './errors.js';
import type {
  CreateFetcherOptions,
  FetcherFetchOptions,
  FetcherInstance,
  HttpMethod,
} from './types.js';
import { appendSearch, resolveUrl } from './utils.js';

const METHODS_WITH_BODY: ReadonlySet<HttpMethod> = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function resolveHeaders(
  headers: CreateFetcherOptions['headers'],
): Promise<Record<string, string>> {
  if (!headers) return {};
  const raw = typeof headers === 'function' ? await headers() : headers;
  if (raw instanceof Headers) {
    const out: Record<string, string> = {};
    raw.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(raw)) {
    return Object.fromEntries(raw);
  }
  return { ...(raw as Record<string, string>) };
}

function joinUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

async function parseBody(response: Response): Promise<unknown> {
  // Avoid `Response.json()` rejecting on empty bodies (e.g. 204 No Content).
  const text = await response.text();
  if (!text) return undefined;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

/**
 * Create a configured fetcher instance. All hooks in `@use-q/api-client-react`
 * consume the resulting `FetcherInstance` via `createApiClient`.
 *
 * For non-GET methods with a `body`, the body is JSON-stringified and a
 * `Content-Type: application/json` header is added (unless the caller already
 * supplied one). HTTP failures are normalized into `ApiError`, optionally
 * passed through `parseError`, and bubbled up through `onError`.
 */
export function createFetcher(options: CreateFetcherOptions): FetcherInstance {
  const { baseUrl, headers, fetch: customFetch, parseError, onError } = options;
  const fetchImpl: typeof fetch = customFetch ?? globalThis.fetch.bind(globalThis);

  async function coreFetch<TResponse>(
    path: string,
    init: FetcherFetchOptions = {},
  ): Promise<TResponse> {
    const method = (init.method ?? 'GET') as HttpMethod;
    const resolved = resolveUrl(path, init.params);
    const withSearch = appendSearch(resolved, init.searchParams);
    const url = joinUrl(baseUrl, withSearch);

    const baseHeaders = await resolveHeaders(headers);
    const callHeaders: Record<string, string> = { ...baseHeaders };
    if (init.headers) {
      const provided = await resolveHeaders(init.headers as CreateFetcherOptions['headers']);
      Object.assign(callHeaders, provided);
    }

    const requestInit: RequestInit = {
      method,
      headers: callHeaders,
      ...(init.signal !== undefined ? { signal: init.signal } : {}),
    };

    if (init.body !== undefined && METHODS_WITH_BODY.has(method)) {
      requestInit.body = JSON.stringify(init.body);
      if (!('content-type' in lowercaseKeys(callHeaders))) {
        callHeaders['Content-Type'] = 'application/json';
        requestInit.headers = callHeaders;
      }
    }

    let response: Response;
    try {
      response = await fetchImpl(url, requestInit);
    } catch (err) {
      onError?.(err);
      throw err;
    }

    if (!response.ok) {
      const data = await parseBody(response);
      const parsed = parseError ? parseError({ response, data }) : undefined;
      const err =
        parsed instanceof ApiError
          ? parsed
          : new ApiError({
              status: response.status,
              statusText: response.statusText,
              data: parsed ?? data,
              url,
              method,
            });
      onError?.(err);
      throw err;
    }

    const data = (await parseBody(response)) as TResponse;
    return data;
  }

  return {
    baseUrl,
    fetch: coreFetch,
  };
}

function lowercaseKeys(obj: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(obj)) out[key.toLowerCase()] = obj[key] as string;
  return out;
}
