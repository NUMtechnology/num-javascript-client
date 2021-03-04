import { expect } from 'chai';
import { createResourceLoader } from '../src/resourceloader';
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
const loader = createResourceLoader();

describe('ResourceLoader', () => {
  it('should be able to load a valid resource', async () => {
    const rcf = await loader.load('https://modules.numprotocol.com/1/rcf.txt');
    expect(rcf).not.equal(null);
  });

  it('should return null for an invalid resource', async () => {
    const rcf = await loader.load('https://modules.numprotocol.com/1/blahblah.txt');
    expect(rcf).equal(null);
  });

  it('should return null for an invalid web site', async () => {
    const rcf = await loader.load('https://doesnotexisthdgfksajhdgfkahsdgfhkjdgsdjhfg.com/1/blahblah.txt');
    expect(rcf).equal(null);
  });
});
