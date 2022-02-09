import axios, { AxiosResponse } from 'axios';
import { LruCache } from './lrucache';
import { log } from 'num-easy-log';

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------

export interface ResourceLoader {
  setenv(env: string);

  load(url: string): Promise<AxiosResponse<any> | null>;
}

export const createResourceLoader = (): ResourceLoader => new ResourceLoaderImpl() as ResourceLoader;

//------------------------------------------------------------------------------------------------------------------------
// Internals
//------------------------------------------------------------------------------------------------------------------------

class ResourceLoaderImpl implements ResourceLoader {
  private static cache: LruCache<Promise<AxiosResponse<any>>>;
  private env: string | null;

  constructor() {
    ResourceLoaderImpl.cache = new LruCache();
    this.env = null;
  }

  setenv(env: string): void {
    this.env = env === 'test' || env === 'staging' ? env : null;
  }

  async load(url: string): Promise<AxiosResponse<any> | null> {
    try {
      if (url) {
        url = this.env ? url.replace('modules.numprotocol.com', `${this.env}.modules.numprotocol.com`) : url;
        const cached = ResourceLoaderImpl.cache.get(url);
        if (cached) {
          return cached;
        } else {
          const loadedResourcePromise: Promise<AxiosResponse<any>> = axios.get(url);
          ResourceLoaderImpl.cache.put(url, loadedResourcePromise);
          return loadedResourcePromise;
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
