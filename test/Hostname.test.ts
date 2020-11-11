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
import { Hostname } from '../lib/numuri';

const validUriStrings = [
  'test_$*&.example.com',
  'numexample.com',
  '_test.example.com',
  'test_123.example.com',
  'test.test.',
  'a.b.c.d.e.f.g.h',
  '例.例',
  'numexample.com',
  'test.test',
  'gmail.com',
  'e226c478-c284-4c57-8187-95bfe204dbe7.com',
  'test.com',
  'example.com',
  'subdomain.example.com',
  '123.123.123.123',
  'example-one.com',
  'example.name',
  'example.museum',
  'example.co.jp',
  '\uD83D\uDE00numexample.com',
];

const invalidUriStrings = [
  'test.test.com:1/test\\ test/',
  'example.t_l_d',
  'test_domain.com',
  '例',
  'test...test',
  'test..test',
  '.bad',
  'bad.',
  'test@test',
  'test@test@test.test',
  'test\ntest@test.com',
  'test\ttest@test.com',
  'test\rtest@test.com',
  'test\btest@test.com',
  'test\ftest@test.com',
  'test\ntesttest.com',
  'test\ttesttest.com',
  'test\rtesttest.com',
  'test\btesttest.com',
  'test\ftesttest.com',
  'john.smith@numexample.com:test',
  'test:a/a',
  'test:-1/a',
  'test:-1000/a',
  'thislabeltoolongthislabeltoolongthislabeltoolongthislabeltoolong.test.com',
  'thisdomainistoolong.thisdomainistoolong.thisdomainistoolong.thisdomainistoolong.thisdomainistoolong.thisdomainistoolong.thisdomainistoolong.thisdomainistoolong.thisdomainistoolong.thisdomainistoolong.thisdomainistoolong.thisdomainistoolong.thisdomainistoolong.test.com',
  'this label has a space in it.test.com',
  'much."more\\ unusual"@example.com',
  'test\\test.domain.com',
];

describe('Hostname', () => {
  it('should be able to create a Hostname', () => {
    for (const domain of validUriStrings) {
      const h = new Hostname(domain);
      expect(h).not.to.throw;
      expect(h.s).to.equal(domain);
    }
  });

  it('should not be able to create an invalid Hostname', () => {
    for (const domain of invalidUriStrings) {
      expect(() => new Hostname(domain)).to.throw(`Invalid domain name: '${domain}'`, `Expected an Error for: ${domain}`);
    }
  });
});
