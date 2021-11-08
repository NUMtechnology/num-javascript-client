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
import { UrlUserInfo } from '../src/numuri';

const validUserInfoStrings = [
  'john.smith',
  'test',
  'test=test',
  '',
  'firstname+lastname',
  '"email"',
  '1234567890',
  '_______',
  'firstname-lastname',
  'john.\uD83D\uDE00smith',
];

const invalidUserInfoStrings = ['#@%^%#$@#$', 'Joe Smith <email@example.com>', 'email@example', '.email', 'email.', 'email..email', 'ema\\il', 'Abc..123'];

describe('UrlUserInfo', () => {
  it('should be able to create a UrlUserInfo', () => {
    for (const info of validUserInfoStrings) {
      const ui = new UrlUserInfo(info);
      expect(ui).not.to.throw;
      expect(ui.s).to.equal(info);
    }
  });

  it('should not be able to create an invalid UrlUserInfo', () => {
    for (const info of invalidUserInfoStrings) {
      expect(() => new UrlUserInfo(info)).to.throw(`Invalid URL userinfo: ${info.toLowerCase()}`, `Expected an Error for: ${info}`);
    }
  });
});
