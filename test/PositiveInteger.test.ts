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
import { PositiveInteger } from '../lib/numuri';

describe('PositiveInteger', () => {
  it('should be able to create a PositiveInteger', () => {
    expect(new PositiveInteger(0)).not.to.throw;
    expect(new PositiveInteger(1)).not.to.throw;
    expect(new PositiveInteger(1000)).not.to.throw;
    expect(new PositiveInteger(1000000)).not.to.throw;
    const pi = new PositiveInteger(1);
    expect(pi.n).to.equal(1);
  });

  it('should not be able to create an invalid PositiveInteger', () => {
    expect(() => new PositiveInteger(-1)).to.throw('Value should be zero or a positive integer: -1');
    expect(() => new PositiveInteger(-0.00001)).to.throw('Value should be zero or a positive integer: -0.00001');
    expect(() => new PositiveInteger(1.1)).to.throw('Value should be zero or a positive integer: 1.1');
  });
});
