/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { expect } from 'chai';
import deepEql from 'deep-eql';
import { createReferencesResolver } from '../src/referencesresolver';
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
const resolver = createReferencesResolver();

describe('ReferencesResolver', () => {
  it('should be able to resolve references in the locale and the index', () => {

    const locale = { 'locale.o.name': 'Organisation' };
    const numRecord = { '?': ['first', 'second'], x: '%locale.o.name', y: '%0', z: '%1' };
    const expected = { '?': ['first', 'second'], 'x': 'Organisation', 'y': 'first', 'z': 'second' };

    const result = resolver.resolve(locale, numRecord);

    const same = deepEql(result, expected);
    if (!same) {
      console.log(`Actual  : ${JSON.stringify(result)}`);
      console.log(`Expected: ${JSON.stringify(expected)}`);
    }
    expect(same).to.equal(true);
  });

});
