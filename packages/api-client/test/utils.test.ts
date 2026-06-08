import { describe, expect, it } from 'vitest';
import { appendSearch, buildQueryKey, resolveTags, resolveUrl } from '../src/index.js';
import type { RouteDefinition } from '../src/index.js';

describe('resolveUrl', () => {
  it('replaces a single placeholder', () => {
    expect(resolveUrl('/users/{id}', { id: 42 })).toBe('/users/42');
  });

  it('throws on a missing required param', () => {
    expect(() => resolveUrl('/users/{id}')).toThrow(/Missing path parameter "id"/);
    expect(() => resolveUrl('/users/{id}', { id: undefined })).toThrow(/Missing path parameter "id"/);
  });

  it('URI-encodes special characters', () => {
    expect(resolveUrl('/users/{id}', { id: 'a/b c' })).toBe('/users/a%2Fb%20c');
  });

  it('handles multiple placeholders', () => {
    expect(resolveUrl('/orgs/{org}/repos/{repo}', { org: 'acme', repo: 'tool' })).toBe(
      '/orgs/acme/repos/tool',
    );
  });
});

describe('appendSearch', () => {
  it('returns input unchanged for empty object', () => {
    expect(appendSearch('/x', {})).toBe('/x');
  });

  it('returns input unchanged when params is undefined', () => {
    expect(appendSearch('/x')).toBe('/x');
  });

  it('skips undefined and null values', () => {
    expect(appendSearch('/x', { a: undefined, b: null, c: 1 })).toBe('/x?c=1');
  });

  it('expands arrays into repeated keys', () => {
    expect(appendSearch('/x', { id: [1, 2, 3] })).toBe('/x?id=1&id=2&id=3');
  });

  it('appends with `&` when URL already has a query string', () => {
    expect(appendSearch('/x?a=1', { b: 2 })).toBe('/x?a=1&b=2');
  });
});

describe('buildQueryKey', () => {
  it('produces the canonical shape', () => {
    expect(buildQueryKey('GET', '/users/42', { page: 1 })).toEqual([
      'api',
      'GET',
      '/users/42',
      { page: 1 },
    ]);
  });

  it('is deterministic regardless of search-param order', () => {
    const a = buildQueryKey('GET', '/x', { a: 1, b: 2 });
    const b = buildQueryKey('GET', '/x', { b: 2, a: 1 });
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('emits an empty record when no search params', () => {
    expect(buildQueryKey('GET', '/x')).toEqual(['api', 'GET', '/x', {}]);
  });
});

describe('resolveTags', () => {
  it('returns static tag arrays as-is', () => {
    const route = {
      method: 'GET',
      path: '/x',
      tags: ['Users'],
    } satisfies RouteDefinition<unknown, unknown, unknown, unknown>;
    expect(resolveTags(route, { response: null, params: null })).toEqual(['Users']);
  });

  it('invokes a function with ({ response, params })', () => {
    const route: RouteDefinition<{ id: number }, unknown, unknown, { id: number }> = {
      method: 'GET',
      path: '/x',
      tags: ({ response }) => [{ type: 'User', id: response.id }],
    };
    expect(resolveTags(route, { response: { id: 1 }, params: { id: 1 } })).toEqual([
      { type: 'User', id: 1 },
    ]);
  });

  it('returns [] when route has no tags', () => {
    const route = { method: 'GET', path: '/x' } satisfies RouteDefinition;
    expect(resolveTags(route, { response: null, params: null })).toEqual([]);
  });
});
