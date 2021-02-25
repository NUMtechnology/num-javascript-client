import axios from 'axios';
import log from 'loglevel';

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------

export interface ResourceLoader {
  load(url: URL): Promise<string | null>;
}

export const createResourceLoader = (): ResourceLoader => new ResourceLoaderImpl() as ResourceLoader;

//------------------------------------------------------------------------------------------------------------------------
// Internals
//------------------------------------------------------------------------------------------------------------------------

class ResourceLoaderImpl implements ResourceLoader {
  private cache: LruCache<string>;

  constructor() {
    this.cache = new LruCache();
  }

  async load(url: URL): Promise<string | null> {
    try {
      if (url) {
        const urlStr = url.toString();
        const cached = this.cache.get(urlStr);
        if (cached) {
          return cached;
        } else {
          return await axios.get(urlStr);
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        log.error(`Cannot load resource from ${JSON.stringify(url)} - ${e.message}`);
      }
    }
    return null;
  }
}

/**
 * A LRU cache courtesy of https://medium.com/sparkles-blog/a-simple-lru-cache-in-typescript-cba0d9807c40
 * with some minor changes.
 */
class LruCache<T> {
  private values: Map<string, T> = new Map<string, T>();
  private maxEntries = 20;

  public get(key: string): T | null {
    const hasKey = this.values.has(key);
    let entry: T;
    if (hasKey) {
      // peek the entry, re-insert for LRU strategy
      entry = this.values.get(key) as T;
      this.values.delete(key);
      this.values.set(key, entry);
      return entry;
    }
    return null;
  }

  public put(key: string, value: T) {
    if (this.values.size >= this.maxEntries) {
      // least-recently used cache eviction strategy
      const keyToDelete = this.values.keys().next().value as string;

      this.values.delete(keyToDelete);
    }

    this.values.set(key, value);
  }
}
