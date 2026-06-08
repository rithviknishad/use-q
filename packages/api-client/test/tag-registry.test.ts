import { describe, expect, it } from 'vitest';
import { TagRegistry } from '../src/index.js';

describe('TagRegistry', () => {
  it('returns no keys when nothing is registered', () => {
    const r = new TagRegistry();
    expect(r.getKeysForTags(['Users'])).toEqual([]);
  });

  it('register + getKeysForTags round-trip', () => {
    const r = new TagRegistry();
    const key = ['api', 'GET', '/users', {}] as const;
    r.register(key, ['Users']);
    expect(r.getKeysForTags(['Users'])).toEqual([key]);
  });

  it('deduplicates when a key matches multiple tags', () => {
    const r = new TagRegistry();
    const key = ['api', 'GET', '/users/1', {}] as const;
    r.register(key, ['Users', { type: 'User', id: 1 }]);
    expect(r.getKeysForTags(['Users', { type: 'User', id: 1 }])).toHaveLength(1);
  });

  it('unregister removes the key from every tag bucket', () => {
    const r = new TagRegistry();
    const key = ['api', 'GET', '/users/1', {}] as const;
    r.register(key, ['Users', { type: 'User', id: 1 }]);
    r.unregister(key);
    expect(r.getKeysForTags(['Users'])).toEqual([]);
    expect(r.getKeysForTags([{ type: 'User', id: 1 }])).toEqual([]);
  });

  it('treats object tags by stable type:id string', () => {
    const r = new TagRegistry();
    const key = ['api', 'GET', '/users/1', {}] as const;
    r.register(key, [{ type: 'User', id: 1 }]);
    expect(r.getKeysForTags([{ type: 'User', id: 1 }])).toEqual([key]);
  });

  it('clear empties the registry', () => {
    const r = new TagRegistry();
    r.register(['k1'], ['T']);
    r.clear();
    expect(r.getKeysForTags(['T'])).toEqual([]);
  });
});
