export { createApiClient } from './createApiClient.js';
export type { ApiClient, CreateApiClientOptions, QueryKeysFactory } from './createApiClient.js';
export { ApiErrorBoundary } from './components/ApiErrorBoundary.js';
export type { ApiErrorBoundaryProps } from './components/ApiErrorBoundary.js';
export type {
  OptimisticTarget,
  UseInfiniteQOptions,
  UseMOptions,
  UseQOptions,
  UseSuspenseQOptions,
} from './types.js';
export type { InvalidateTarget } from './hooks/useQClient.js';

// Re-export the entire core surface so consumers can import everything from
// `@use-q/api-client-react` without juggling two packages.
export * from '@use-q/api-client';
