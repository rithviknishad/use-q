import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { Suspense, type ReactNode } from 'react';
import { ApiErrorBoundary, createApiClient } from '../src/index.js';
import { testSchema } from './fixtures.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function PetView({
  api,
}: {
  api: ReturnType<typeof createApiClient<typeof testSchema>>;
}) {
  const query = api.useSuspenseQ('getPet', { params: { id: '7' } });
  return <span data-testid="name">{query.data.name}</span>;
}

describe('useSuspenseQ', () => {
  it('suspends, then renders data', async () => {
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) =>
          setTimeout(() => resolve(jsonResponse({ id: '7', name: 'Suspended' })), 10),
        ),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const api = createApiClient(testSchema, {
      baseUrl: 'https://api.example.com',
      fetch: fetchMock,
      queryClient,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<span data-testid="fallback">loading</span>}>
          <PetView api={api} />
        </Suspense>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('name')).toHaveTextContent('Suspended'));
  });

  it('routes ApiErrors to ApiErrorBoundary', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ message: 'nope' }, 500));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const api = createApiClient(testSchema, {
      baseUrl: 'https://api.example.com',
      fetch: fetchMock,
      queryClient,
    });

    const Fallback = ({ error }: { error: { status: number } }) => (
      <span data-testid="err">err-{error.status}</span>
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ApiErrorBoundary fallback={(props) => <Fallback error={props.error} />}>
          <Suspense fallback={<span>loading</span>}>
            <PetView api={api} />
          </Suspense>
        </ApiErrorBoundary>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('err')).toHaveTextContent('err-500'));
  });
});
