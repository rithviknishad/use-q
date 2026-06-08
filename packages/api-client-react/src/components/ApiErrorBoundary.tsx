import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ApiError, isApiError } from '@use-q/api-client';

export interface ApiErrorBoundaryProps {
  /** Render when an `ApiError` is caught. Receives a `reset` to clear state. */
  fallback: (state: { error: ApiError<unknown>; reset: () => void }) => ReactNode;
  /** Optional logger; non-API errors are re-thrown after this fires. */
  onError?: (error: unknown, info: ErrorInfo) => void;
  children: ReactNode;
}

interface ApiErrorBoundaryState {
  error: ApiError<unknown> | null;
}

/**
 * React error boundary specialized for `ApiError`s. Any caught error that is
 * not an `ApiError` is re-thrown so a higher-level boundary can handle it.
 */
export class ApiErrorBoundary extends Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  override state: ApiErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ApiErrorBoundaryState {
    if (isApiError(error)) return { error };
    return { error: null };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    this.props.onError?.(error, info);
    if (!isApiError(error)) {
      // Re-throw on the next tick so React surfaces it to the next boundary.
      throw error;
    }
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (this.state.error) {
      return this.props.fallback({ error: this.state.error, reset: this.reset });
    }
    return this.props.children;
  }
}
