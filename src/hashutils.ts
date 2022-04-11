/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

import sha1 from 'sha1';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const anyBase = require('any-base');

type AnyBase = (s: string) => string;

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
const hexToBase36 = anyBase(anyBase.HEX, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ') as AnyBase;

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------
/**
 * Generate a SHA1 hash and base36 encode it, then return the first `depth` chars separated by '.' and prefixed by '.'
 * The parameter is not checked and the caller must supply a correct value.
 *
 * @param  normalisedDomain domain name.
 * @param  depth
 * @return  the hash value.
 */
export const hashByDepth = (normalisedDomain: string, depth: number): string => {
  const hashed = sha1(normalisedDomain).toString();
  const converted = hexToBase36(hashed).toLowerCase();

  return generateHash(depth - 1, converted);
};

/**
 * Convert `abcd` into `.c.b.a`
 *
 * @param i index of the first letter to use in s
 * @param s a string of at least i+1 characters
 * @returns strings
 */
const generateHash = (i: number, s: string): string => (i < 0 || i > s.length - 1 ? '' : `.${s[i]}${generateHash(i - 1, s)}`);
