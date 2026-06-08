/**
 * Normalized API error thrown by `createFetcher` (and re-thrown by hooks).
 * Consumers can narrow `unknown` errors via the `isApiError` type guard.
 */
export class ApiError<TData = unknown> extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly data: TData;
  readonly url: string;
  readonly method: string;

  constructor(init: {
    message?: string;
    status: number;
    statusText: string;
    data: TData;
    url: string;
    method: string;
  }) {
    super(init.message ?? `${init.method} ${init.url} failed with ${init.status} ${init.statusText}`);
    this.name = 'ApiError';
    this.status = init.status;
    this.statusText = init.statusText;
    this.data = init.data;
    this.url = init.url;
    this.method = init.method;
    // Preserve prototype chain when targeting older runtimes via downleveling.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isApiError<TData = unknown>(error: unknown): error is ApiError<TData> {
  return error instanceof ApiError;
}
