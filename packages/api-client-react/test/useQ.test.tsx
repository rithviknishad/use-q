import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
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

describe('useQ', () => {
  it('fetches and returns data', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ items: [{ id: '1', name: 'Fido' }], total: 1 }),
    );
    const { api, wrapper } = makeClient(fetchMock);

    const { result } = renderHook(() => api.useQ('listPets'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items[0]?.name).toBe('Fido');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]![0]).toBe('https://api.example.com/pets');
  });

  it('registers tags in the registry on success and unregisters on unmount', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: '42', name: 'Rex' }));
    const { api, wrapper } = makeClient(fetchMock);

    const { result, unmount } = renderHook(() => api.useQ('getPet', { params: { id: '42' } }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = api._tagRegistry.getKeysForTags([{ type: 'Pet', id: '42' }]);
    expect(keys).toHaveLength(1);

    unmount();
    await waitFor(() => {
      const after = api._tagRegistry.getKeysForTags([{ type: 'Pet', id: '42' }]);
      expect(after).toHaveLength(0);
    });
  });
});
