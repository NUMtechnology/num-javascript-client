/**
 * A LRU cache courtesy of https://medium.com/sparkles-blog/a-simple-lru-cache-in-typescript-cba0d9807c40
 * with some minor changes.
 */
export class LruCache<T> {
  private values: Map<string, T> = new Map<string, T>();
  private maxEntries = 20;

  public get(key: string): T | null {
    const hasKey = this.values.has(key);
    if (hasKey) {
      // peek the entry, re-insert for LRU strategy
      const entry = this.values.get(key) as T;
      this.values.delete(key);
      this.values.set(key, entry);
      return entry;
    }
    return null;
  }

  public put(key: string, value: T): void {
    if (this.values.size >= this.maxEntries) {
      // least-recently used cache eviction strategy
      const keyToDelete = this.values.keys().next().value as string;
      this.values.delete(keyToDelete);
    }

    this.values.set(key, value);
  }
}
