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
import { UrlPath } from '../lib/numuri';

const validPaths = ['/', '/a', '/a/b', '/例', '/例/例'];

const invalidPaths = ['', 'a', 'a/b', '/a b', '/a/b/c d', '/a\\b', '/a\nb', '/a\rb', '/a\tb', '/a\bb', '/a\fb'];

describe('UrlPath', () => {
  it('should be able to create a UrlPath', () => {
    for (const path of validPaths) {
      const p = new UrlPath(path);
      expect(p).not.to.throw;
      expect(p.s).to.equal(path);
    }
  });

  it('should not be able to create an invalid UrlPath', () => {
    for (const path of invalidPaths) {
      expect(() => new UrlPath(path)).to.throw();
    }
  });
});
