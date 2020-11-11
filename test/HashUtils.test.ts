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

import { hashByDepth } from '../lib/hashutils';

describe('HashUtils', () => {
  it('Can hash correctly 1', () => {
    const hash = hashByDepth('test', 1);
    expect(hash).to.equal('.j');
  });
  it('Can hash correctly 2', () => {
    const hash = hashByDepth('test', 2);
    expect(hash).to.equal('.r.j');
  });
  it('Can hash correctly 3', () => {
    const hash = hashByDepth('test', 3);
    expect(hash).to.equal('.w.r.j');
  });
});
