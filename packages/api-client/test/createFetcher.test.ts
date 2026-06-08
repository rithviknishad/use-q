import { describe, expect, it, vi } from 'vitest';
import { ApiError, createFetcher, isApiError } from '../src/index.js';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(body), { ...init, headers });
}

describe('createFetcher', () => {
  it('returns parsed JSON on success', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ hello: 'world' }));
    const f = createFetcher({ baseUrl: 'https://api.example.com', fetch: fetchMock });
    const data = await f.fetch<{ hello: string }>('/greet');
    expect(data).toEqual({ hello: 'world' });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.example.com/greet');
    expect((init as RequestInit).method).toBe('GET');
  });

  it('serializes body and sets Content-Type for non-GET methods', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }, { status: 201 }));
    const f = createFetcher({ baseUrl: 'https://api.example.com', fetch: fetchMock });
    await f.fetch('/items', { method: 'POST', body: { name: 'x' } });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ name: 'x' }));
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type'] ?? headers['content-type']).toBe('application/json');
  });

  it('does not send a body for GET requests', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    const f = createFetcher({ baseUrl: 'https://api.example.com', fetch: fetchMock });
    await f.fetch('/x', { body: { ignored: true } });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.body).toBeUndefined();
  });

  it('throws ApiError on non-ok responses and calls onError', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ message: 'nope' }, { status: 400 }));
    const onError = vi.fn();
    const f = createFetcher({
      baseUrl: 'https://api.example.com',
      fetch: fetchMock,
      onError,
    });
    await expect(f.fetch('/x')).rejects.toBeInstanceOf(ApiError);
    expect(onError).toHaveBeenCalledOnce();
    const err = onError.mock.calls[0]![0] as unknown;
    expect(isApiError(err)).toBe(true);
  });

  it('feeds the parsed body through parseError', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ message: 'bad' }, { status: 422 }));
    const parseError = vi.fn(({ data }: { response: Response; data: unknown }) => ({
      normalized: true,
      raw: data,
    }));
    const f = createFetcher({
      baseUrl: 'https://api.example.com',
      fetch: fetchMock,
      parseError,
    });
    try {
      await f.fetch('/x');
      throw new Error('expected reject');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) {
        expect(err.status).toBe(422);
        expect(err.data).toEqual({ normalized: true, raw: { message: 'bad' } });
      }
    }
    expect(parseError).toHaveBeenCalledOnce();
  });

  it('propagates the AbortSignal', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn(async (_url: string, init: RequestInit | undefined) => {
      expect(init?.signal).toBe(controller.signal);
      return jsonResponse({});
    });
    const f = createFetcher({ baseUrl: 'https://api.example.com', fetch: fetchMock });
    await f.fetch('/x', { signal: controller.signal });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('resolves dynamic headers (function form)', async () => {
    let token = 't1';
    const fetchMock = vi.fn(async () => jsonResponse({}));
    const f = createFetcher({
      baseUrl: 'https://api.example.com',
      fetch: fetchMock,
      headers: () => ({ Authorization: `Bearer ${token}` }),
    });
    await f.fetch('/x');
    token = 't2';
    await f.fetch('/y');
    const h1 = fetchMock.mock.calls[0]![1] as RequestInit;
    const h2 = fetchMock.mock.calls[1]![1] as RequestInit;
    expect((h1.headers as Record<string, string>).Authorization).toBe('Bearer t1');
    expect((h2.headers as Record<string, string>).Authorization).toBe('Bearer t2');
  });

  it('returns undefined for an empty 204 body', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    const f = createFetcher({ baseUrl: 'https://api.example.com', fetch: fetchMock });
    const data = await f.fetch('/x', { method: 'DELETE' });
    expect(data).toBeUndefined();
  });
});
