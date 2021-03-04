import axios from 'axios';
import log from 'loglevel';

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------

export interface ResourceLoader {
  setenv(env: string);

  load(url: string): Promise<Record<string, unknown> | null>;
}

export const createResourceLoader = (): ResourceLoader => new ResourceLoaderImpl() as ResourceLoader;

//------------------------------------------------------------------------------------------------------------------------
// Internals
//------------------------------------------------------------------------------------------------------------------------

class ResourceLoaderImpl implements ResourceLoader {
  private cache: LruCache<Record<string, unknown>>;
  private env: string | null;

  constructor() {
    this.cache = new LruCache();
    this.env = null;
  }

  setenv(env: string) {
    this.env = env;
  }

  async load(url: string): Promise<Record<string, unknown> | null> {
    try {
      if (url) {
        url = this.env ? url.replace('modules.numprotocol.com', `${this.env}.modules.numprotocol.com`) : url;
        const cached = this.cache.get(url);
        if (cached) {
          return cached;
        } else {
          return await axios.get(url);
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        log.error(`Cannot load resource from ${url} - ${e.message}`);
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
