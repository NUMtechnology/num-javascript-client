// Copyright 2020 NUM Technology Ltd
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
import axios from 'axios';
import log from 'loglevel';
import { NumLookupRedirect } from './exceptions';

const INTERPRETER_URL = 'https://api.apps.num.uk/v1/mtoj';

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------
/**
 * Modl services
 */
export interface ModlServices {
  interpretNumRecord(modl: string, timeout: number): Promise<string>;
}

/**
 * Creates modl services
 *
 * @returns modl services
 */
export const createModlServices = (): ModlServices => new ModlServicesImpl();

/**
 * Look for a redirect instruction in the interpreted NUM record, recursively.
 *
 * @param obj the ModlValue to check.
 * @throws NumLookupRedirect on error
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const checkForRedirection = (obj: any): void => {
  if (typeof obj === 'object') {
    // Check the pairs in a Map
    for (const key in obj) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      if (obj.hasOwnProperty(key)) {
        if ('@R' === key) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
          const value = obj[key];
          if (typeof value === 'string') {
            throw new NumLookupRedirect(value);
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        checkForRedirection(obj[key]);
      }
    }
  }
};

//------------------------------------------------------------------------------------------------------------------------
// Internals
//------------------------------------------------------------------------------------------------------------------------
/**
 * Modl services impl
 */
class ModlServicesImpl implements ModlServices {
  /**
   * Interprets num record
   *
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
      log.warn((e as Error).message);
    }
    return '';
  }
}
