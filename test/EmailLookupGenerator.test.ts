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
import { expect } from 'chai';
import { createEmailLookupGenerator } from '../src/lookupgenerators';
import { MODULE_1, parseNumUri, PositiveInteger } from '../src/numuri';

const ONE_LEVEL = new PositiveInteger(1);
const TWO_LEVELS = new PositiveInteger(2);
const THREE_LEVELS = new PositiveInteger(3);

describe('EmailLookupGenerator', () => {
  it('should be able to create valid lookup queries 1', () => {
    const gen = createEmailLookupGenerator(parseNumUri('john.😀smith@😀numexample.com/foo/😀/bar'));
    expect(gen.getHostedLocation(MODULE_1)).to.equal('bar.xn--e28h.foo.1._john.xn--smith-y224d.e._xn--numexample-j366i.com.o.z.s.num.net.');
  });

  it('should be able to create valid lookup queries 2', () => {
    const gen = createEmailLookupGenerator(parseNumUri('john.smith@numexample.com'));
    expect(gen.getDistributedIndependentLocation(MODULE_1, ONE_LEVEL)).to.equal('1._john.smith.3.e._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 3', () => {
    const gen = createEmailLookupGenerator(parseNumUri('john.smith@numexample.com/foo/bar'));
    expect(gen.getDistributedIndependentLocation(MODULE_1, ONE_LEVEL)).to.equal('bar.foo.1._john.smith.3.e._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 4', () => {
    const gen = createEmailLookupGenerator(parseNumUri('john.smith@numexample.com'));
    expect(gen.getDistributedHostedLocation(MODULE_1, ONE_LEVEL)).to.equal('1._john.smith.3.e._numexample.com.c.7.m.num.net.');
  });

  it('should be able to create valid lookup queries 5', () => {
    const gen = createEmailLookupGenerator(parseNumUri('john.smith@numexample.com/foo/bar'));
    expect(gen.getDistributedHostedLocation(MODULE_1, ONE_LEVEL)).to.equal('bar.foo.1._john.smith.3.e._numexample.com.c.7.m.num.net.');
  });

  it('should be able to create valid lookup queries 6', () => {
    const gen = createEmailLookupGenerator(parseNumUri('john.smith@numexample.com'));
    expect(gen.getDistributedIndependentLocation(MODULE_1, TWO_LEVELS)).to.equal('1._john.smith.6.3.e._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 7', () => {
    const gen = createEmailLookupGenerator(parseNumUri('john.smith@numexample.com/foo/bar'));
    expect(gen.getDistributedIndependentLocation(MODULE_1, TWO_LEVELS)).to.equal('bar.foo.1._john.smith.6.3.e._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 8', () => {
    const gen = createEmailLookupGenerator(parseNumUri('john.smith@numexample.com'));
    expect(gen.getDistributedHostedLocation(MODULE_1, TWO_LEVELS)).to.equal('1._john.smith.6.3.e._numexample.com.c.7.m.num.net.');
  });

  it('should be able to create valid lookup queries 9', () => {
    const gen = createEmailLookupGenerator(parseNumUri('john.smith@numexample.com/foo/bar'));
    expect(gen.getDistributedHostedLocation(MODULE_1, TWO_LEVELS)).to.equal('bar.foo.1._john.smith.6.3.e._numexample.com.c.7.m.num.net.');
  });

  it('should be able to create valid lookup queries 10', () => {
    const gen = createEmailLookupGenerator(parseNumUri('john.smith@numexample.com'));
    expect(gen.getDistributedIndependentLocation(MODULE_1, THREE_LEVELS)).to.equal('1._john.smith.d.6.3.e._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 11', () => {
    const gen = createEmailLookupGenerator(parseNumUri('john.smith@numexample.com/foo/bar'));
    expect(gen.getDistributedIndependentLocation(MODULE_1, THREE_LEVELS)).to.equal('bar.foo.1._john.smith.d.6.3.e._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 12', () => {
    const gen = createEmailLookupGenerator(parseNumUri('john.smith@numexample.com'));
    expect(gen.getDistributedHostedLocation(MODULE_1, THREE_LEVELS)).to.equal('1._john.smith.d.6.3.e._numexample.com.c.7.m.num.net.');
  });

  it('should be able to create valid lookup queries 13', () => {
    const gen = createEmailLookupGenerator(parseNumUri('john.smith@numexample.com/foo/bar'));
    expect(gen.getDistributedHostedLocation(MODULE_1, THREE_LEVELS)).to.equal('bar.foo.1._john.smith.d.6.3.e._numexample.com.c.7.m.num.net.');
  });
});
