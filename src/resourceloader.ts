import axios from 'axios';
import log from 'loglevel';

export interface ResourceLoader {
  load(url: URL): Promise<string | null>;
}

export const createResourceLoader = (): ResourceLoader => new ResourceLoaderImpl() as ResourceLoader;

class ResourceLoaderImpl implements ResourceLoader {
  async load(url: URL): Promise<string | null> {
    try {
      if (url) {
        return await axios.get(url.toString());
      }
    } catch (e) {
      if (e instanceof Error) {
        log.error(`Cannot load resource from ${JSON.stringify(url)} - ${e.message}`);
      }
    }
    return null;
  }
}
