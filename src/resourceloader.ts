import axios from 'axios';
import log from 'loglevel';
import { LruCache } from './lrucache';

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
          const loadedResource = await axios.get(url);
          const result = loadedResource.data as Record<string, unknown>;
          this.cache.put(url, result);
          return result;
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
