import axios from 'axios';
import log from 'loglevel';
import { NumLookupRedirect } from './exceptions';

const INTERPRETER_URL = 'https://api.apps.num.uk/v1/mtoj';

/**
 * Modl services
 */
export interface ModlServices {
  interpretNumRecord(modl: string, timeout: number): Promise<string>;
}

/**
 * Creates modl services
 * @returns modl services
 */
export function createModlServices(): ModlServices {
  return new ModlServicesImpl();
}

/**
 * Modl services impl
 */
class ModlServicesImpl implements ModlServices {
  /**
   * Interprets num record
   * @param modl
   * @param timeout
   * @returns num record
   */
  async interpretNumRecord(modl: string, timeout: number): Promise<string> {
    try {
      const response = await axios.post(INTERPRETER_URL, modl, {
        headers: {
          'content-type': 'text/plain',
        },
        timeout,
      });

      if (response.status === 200) {
        checkForRedirection(response.data);
        return JSON.stringify(response.data);
      }
    } catch (e) {
      if (e instanceof NumLookupRedirect) {
        throw e;
      }
      log.error(e.message);
    }
    return '';
  }
}

export function checkForRedirection(obj: any): void {
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        findRedirect(obj[key]);
      }
    }
  }
}

/**
 * Look for a redirect instruction in the interpreted NUM record, recursively.
 *
 * @param obj the ModlValue to check.
 * @throws NumLookupRedirect on error
 */
function findRedirect(obj: any): void {
  // Check the pairs in a Map
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if ('@R' === key) {
          const value = obj[key];
          if (typeof value === 'string') {
            throw new NumLookupRedirect(value);
          }
        }
        findRedirect(obj[key]);
      }
    }
  }
}
