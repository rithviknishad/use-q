import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { createApiClient } from '../src/index.js';
import { testSchema } from './fixtures.js';

function makeClient(fetchImpl: typeof fetch) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

describe('useM', () => {
  it('runs a POST mutation and invalidates registered tags on settle', async () => {
    let petsCalls = 0;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.endsWith('/pets')) {
        return jsonResponse({ id: '1', name: 'Fido' }, 201);
      }
      petsCalls += 1;
      return jsonResponse({ items: [{ id: '1', name: 'Fido' }], total: 1 });
    });

    const { api, wrapper, queryClient } = makeClient(fetchMock);

    const { result: query } = renderHook(() => api.useQ('listPets'), { wrapper });
    await waitFor(() => expect(query.current.isSuccess).toBe(true));
    expect(petsCalls).toBeGreaterThan(0);
    const initialCalls = petsCalls;

    const { result: mutation } = renderHook(() => api.useM('createPet'), { wrapper });

    await act(async () => {
      await mutation.current.mutateAsync({ body: { name: 'Fido' } });
    });

    await waitFor(() => {
      const status = queryClient.getQueryState(api.queryKeys.listPets())?.fetchStatus;
      return expect(status).toBe('idle');
    });
    expect(petsCalls).toBeGreaterThan(initialCalls);
  });

  it('applies optimistic updates and rolls back on error', async () => {
    let petsCallCount = 0;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.endsWith('/pets')) {
        return jsonResponse({ message: 'boom' }, 500);
      }
      petsCallCount += 1;
      return jsonResponse({ items: [{ id: '1', name: 'Fido' }], total: 1 });
    });

    const { api, wrapper, queryClient } = makeClient(fetchMock);

    const { result: query } = renderHook(() => api.useQ('listPets'), { wrapper });
    await waitFor(() => expect(query.current.isSuccess).toBe(true));

    const initial = queryClient.getQueryData(api.queryKeys.listPets());
    expect(initial).toEqual({ items: [{ id: '1', name: 'Fido' }], total: 1 });

    const { result: mutation } = renderHook(
      () =>
        api.useM('createPet', {
          optimisticUpdates: [
            {
              target: { routeId: 'listPets' as const },
              updater: (prev: unknown, { body }) => {
                const page = (prev as { items: unknown[]; total: number } | undefined) ?? {
                  items: [],
                  total: 0,
                };
                return {
                  ...page,
                  items: [...page.items, { id: 'tmp', name: (body as { name: string }).name }],
                  total: page.total + 1,
                };
              },
            },
          ],
        }),
      { wrapper },
    );

    await act(async () => {
      try {
        await mutation.current.mutateAsync({ body: { name: 'Optimistic' } });
      } catch {
        // expected — server returned 500
      }
    });

    await waitFor(() => {
      const after = queryClient.getQueryData(api.queryKeys.listPets());
      expect(after).toEqual(initial);
    });
    expect(petsCallCount).toBeGreaterThan(0);
  });
});
