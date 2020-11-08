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

import CryptoJS from 'crypto-js';
// @ts-ignore
import anyBase from 'any-base';
import logger from 'loglevel';

const DOT = '.';

type AnyBase = (s: string) => string;

const hexToBase36 = anyBase(anyBase.HEX, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ') as AnyBase;

/** Generate a SHA1 hash and base36 encode it, then return the first 3 chars separated by '.' and prefixed by '.'
 * The parameter is not checked and the caller must supply a correct value.
 * @param normalisedDomain
 */

export function hash(normalisedDomain: string): string {
  return hashByDepth(normalisedDomain, 3);
}

/**
 * Generate a SHA1 hash and base36 encode it, then return the first 3 chars separated by '.' and prefixed by '.'
 * The parameter is not checked and the caller must supply a correct value.
 *
 * @param  normalisedDomain domain name.
 * @param  depth
 * @return  the hash value.
 */
export function hashByDepth(normalisedDomain: string, depth: number): string {
  const hashed = CryptoJS.SHA1(normalisedDomain).toString();
  const converted = hexToBase36(hashed).toLowerCase();

  logger.debug(`Base36ed hash ${hashed} from ${normalisedDomain} to ${converted}`);

  let dottedHashByDepth = '';
  for (let i = depth - 1; i >= 0; i--) {
    dottedHashByDepth += `${DOT}${converted[i]}`;
  }

  return dottedHashByDepth;
}
