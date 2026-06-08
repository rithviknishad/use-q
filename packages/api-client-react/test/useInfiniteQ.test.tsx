import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { createApiClient } from '../src/index.js';
import { testSchema } from './fixtures.js';

function makeClient(fetchImpl: typeof fetch) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const api = createApiClient(testSchema, {
    baseUrl: 'https://api.example.com',
    fetch: fetchImpl,
    queryClient,
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return { api, queryClient, wrapper };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('useInfiniteQ', () => {
  it('injects the pagination pageParam into searchParams (page-number)', async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn(async (url: string) => {
      calls.push(url);
      const page = Number(new URL(url).searchParams.get('page') ?? '1');
      return jsonResponse({
        items: [{ id: String(page), name: `p${page}` }],
        total: 2,
      });
    });

    const { api, wrapper } = makeClient(fetchMock);

    const { result } = renderHook(() => api.useInfiniteQ('listPets'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('page=1');

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls[1]).toContain('page=2');
  });

  it('handles cursor pagination', async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn(async (url: string) => {
      calls.push(url);
      const cursor = new URL(url).searchParams.get('cursor');
      if (!cursor) {
        return jsonResponse({ items: [{ id: '1', name: 'a' }], total: 2, nextCursor: 'c1' });
      }
      return jsonResponse({ items: [{ id: '2', name: 'b' }], total: 2, nextCursor: null });
    });
    const { api, wrapper } = makeClient(fetchMock);

    const { result } = renderHook(() => api.useInfiniteQ('listPetsCursor'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(calls).toHaveLength(2);
    expect(calls[1]).toContain('cursor=c1');
  });

  it('throws when called on a non-paginated route', () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    const { api, wrapper } = makeClient(fetchMock);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      renderHook(() => api.useInfiniteQ('getPet' as never, { params: { id: '1' } } as never), { wrapper }),
    ).toThrow(/no `pagination` declaration/);
    spy.mockRestore();
  });
});
