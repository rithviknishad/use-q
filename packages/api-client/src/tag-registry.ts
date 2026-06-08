import type { Tag } from './types.js';

/**
 * Normalize a `Tag` to a stable string suitable for keying/equality checks.
 * Object tags `{ type, id }` become `"type:id"` (or just `"type"` when no id).
 */
export function tagToString(tag: Tag): string {
  if (typeof tag === 'string') return tag;
  if (tag.id === undefined || tag.id === null) return tag.type;
  return `${tag.type}:${tag.id}`;
}

/**
 * Bookkeeping helper that maps tags <-> query keys so the React layer can
 * implement tag-based invalidation without forcing TanStack Query to scan
 * every key in the cache.
 *
 * Hooks call `register` on mount and `unregister` on unmount. Mutations look
 * up affected query keys via `getKeysForTags` and dispatch invalidations.
 */
export class TagRegistry {
  // tagString -> set of stringified-keys
  private readonly tagToKeys = new Map<string, Set<string>>();
  // stringifiedKey -> { key, tags }
  private readonly keyMap = new Map<string, { key: ReadonlyArray<unknown>; tags: Set<string> }>();

  /** Stable JSON encoding for query keys. */
  private keyString(key: ReadonlyArray<unknown>): string {
    return JSON.stringify(key);
  }

  register(key: ReadonlyArray<unknown>, tags: ReadonlyArray<Tag>): void {
    if (tags.length === 0) return;
    const keyStr = this.keyString(key);
    let entry = this.keyMap.get(keyStr);
    if (!entry) {
      entry = { key, tags: new Set<string>() };
      this.keyMap.set(keyStr, entry);
    }
    for (const tag of tags) {
      const tagStr = tagToString(tag);
      entry.tags.add(tagStr);
      let set = this.tagToKeys.get(tagStr);
      if (!set) {
        set = new Set();
        this.tagToKeys.set(tagStr, set);
      }
      set.add(keyStr);
    }
  }

  unregister(key: ReadonlyArray<unknown>): void {
    const keyStr = this.keyString(key);
    const entry = this.keyMap.get(keyStr);
    if (!entry) return;
    for (const tagStr of entry.tags) {
      const set = this.tagToKeys.get(tagStr);
      if (!set) continue;
      set.delete(keyStr);
      if (set.size === 0) this.tagToKeys.delete(tagStr);
    }
    this.keyMap.delete(keyStr);
  }

  /**
   * Return every registered query key whose tag set intersects `tags`,
   * deduplicated and returned as the original array references.
   */
  getKeysForTags(tags: ReadonlyArray<Tag>): ReadonlyArray<ReadonlyArray<unknown>> {
    const seen = new Set<string>();
    const out: Array<ReadonlyArray<unknown>> = [];
    for (const tag of tags) {
      const tagStr = tagToString(tag);
      const set = this.tagToKeys.get(tagStr);
      if (!set) continue;
      for (const keyStr of set) {
        if (seen.has(keyStr)) continue;
        seen.add(keyStr);
        const entry = this.keyMap.get(keyStr);
        if (entry) out.push(entry.key);
      }
    }
    return out;
  }

  clear(): void {
    this.tagToKeys.clear();
    this.keyMap.clear();
  }
}
