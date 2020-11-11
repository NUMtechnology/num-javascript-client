import { expect } from 'chai';
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
import { createUrlLookupGenerator } from '../lib/lookupgenerators';
import { MODULE_1, parseNumUri } from '../lib/numuri';

describe('UrlLookupGenerator', () => {
  it('should be able to create valid lookup queries 1', () => {
    const gen = createUrlLookupGenerator(parseNumUri('http://numexample.com'));
    expect(gen.getIndependentLocation(MODULE_1)).to.equal('1._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 2', () => {
    const gen = createUrlLookupGenerator(parseNumUri('http://numexample.com/foo'));
    expect(gen.getIndependentLocation(MODULE_1)).to.equal('foo.1._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 3', () => {
    const gen = createUrlLookupGenerator(parseNumUri('http://numexample.com/foo/bar'));
    expect(gen.getIndependentLocation(MODULE_1)).to.equal('bar.foo.1._num.numexample.com.');
  });
});
