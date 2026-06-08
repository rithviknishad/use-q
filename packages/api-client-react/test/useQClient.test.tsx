import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { createApiClient } from '../src/index.js';
import { testSchema } from './fixtures.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

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

describe('useQClient', () => {
  it('setData / updateData write through to the cache', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ items: [{ id: '1', name: 'A' }], total: 1 }),
    );
    const { api, wrapper, queryClient } = makeClient(fetchMock);

    const { result: query } = renderHook(() => api.useQ('listPets'), { wrapper });
    await waitFor(() => expect(query.current.isSuccess).toBe(true));

    const { result: qc } = renderHook(() => api.useQClient(), { wrapper });
    act(() => {
      qc.current.setData('listPets', undefined, { items: [], total: 0 });
    });
    expect(queryClient.getQueryData(api.queryKeys.listPets())).toEqual({ items: [], total: 0 });

    act(() => {
      qc.current.updateData('listPets', undefined, (prev) => ({
        items: [...(prev?.items ?? []), { id: '99', name: 'X' }],
        total: (prev?.total ?? 0) + 1,
      }));
    });
    expect(queryClient.getQueryData(api.queryKeys.listPets())).toEqual({
      items: [{ id: '99', name: 'X' }],
      total: 1,
    });
  });

  it('invalidate supports both exact and prefix shapes', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ items: [], total: 0 }));
    const { api, wrapper, queryClient } = makeClient(fetchMock);

    const { result: query } = renderHook(() => api.useQ('listPets'), { wrapper });
    await waitFor(() => expect(query.current.isSuccess).toBe(true));

    const { result: qc } = renderHook(() => api.useQClient(), { wrapper });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      await qc.current.invalidate(api.queryKeys.listPets());
    });
    expect(invalidateSpy).toHaveBeenLastCalledWith({
      queryKey: api.queryKeys.listPets(),
      exact: true,
    });

    await act(async () => {
      await qc.current.invalidate({ prefix: ['api', 'GET'] });
    });
    expect(invalidateSpy).toHaveBeenLastCalledWith({ queryKey: ['api', 'GET'], exact: false });

    await act(async () => {
      await qc.current.invalidateAll();
    });
    expect(invalidateSpy).toHaveBeenLastCalledWith();
  });

  it('invalidateTag dispatches against keys registered in the tag registry', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ id: '42', name: 'Rex' }),
    );
    const { api, wrapper, queryClient } = makeClient(fetchMock);
    const { result: query } = renderHook(() => api.useQ('getPet', { params: { id: '42' } }), {
      wrapper,
    });
    await waitFor(() => expect(query.current.isSuccess).toBe(true));

    const { result: qc } = renderHook(() => api.useQClient(), { wrapper });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      await qc.current.invalidateTag({ type: 'Pet', id: '42' });
    });
    expect(invalidateSpy).toHaveBeenCalled();
  });
});
