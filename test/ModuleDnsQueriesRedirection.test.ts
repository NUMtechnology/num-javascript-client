/*
 *    Copyright 2020 NUM Technology Ltd
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import { fail } from 'assert';
import { Context, NumLocation } from '../src/context';
import { MODULE_1, parseNumUri } from '../src/numuri';

class TestResult {
  constructor(readonly testData: TestData, readonly pass: boolean, readonly message: string) {}
}

class TestData {
  readonly type: string;
  readonly location: string;
  readonly redirect: string;
  readonly address: string;
  readonly expectedResult: string | null;

  constructor(data: [string, string, string, string, string | null]) {
    this.type = data[0];
    this.location = data[1];
    this.redirect = data[2];
    this.address = data[3];
    this.expectedResult = data[4];
  }
}

const testData = new Array<TestData>(
  new TestData(['Domain', 'Independent', 'new', 'redir.numexample.com', 'new.1._num.redir.numexample.com.']),
  new TestData(['Domain', 'Independent', '/new', 'redir.numexample.com', 'new.1._num.redir.numexample.com.']),
  new TestData(['Domain', 'Independent', '../new', 'redir.numexample.com', 'error']),
  new TestData(['Domain', 'Independent', '../../new', 'redir.numexample.com', 'error']),
  new TestData(['Domain', 'Independent', 'test.com:1', 'redir.numexample.com', '1._num.test.com.']),
  new TestData(['Domain', 'Independent', 'test.com:1/', 'redir.numexample.com', '1._num.test.com.']),
  new TestData(['Domain', 'Independent', 'test.com:3/', 'redir.numexample.com', '3._num.test.com.']),
  new TestData(['Domain', 'Independent', 'test.com:1/c/b/a', 'redir.numexample.com', 'a.b.c.1._num.test.com.']),
  new TestData(['Domain', 'Independent', 'test.com:3/c/b/a', 'redir.numexample.com', 'a.b.c.3._num.test.com.']),

  new TestData(['Domain', 'Hosted', 'new', 'redir.numexample.com', 'new.1._redir.numexample.com.u.b.s.num.net.']),
  new TestData(['Domain', 'Hosted', '/new', 'redir.numexample.com', 'new.1._redir.numexample.com.u.b.s.num.net.']),
  new TestData(['Domain', 'Hosted', '../new', 'redir.numexample.com', 'error']),
  new TestData(['Domain', 'Hosted', '../../new', 'redir.numexample.com', 'error']),
  new TestData(['Domain', 'Hosted', 'test.com:1', 'redir.numexample.com', '1._test.com.v.4.b.num.net.']),
  new TestData(['Domain', 'Hosted', 'test.com:1/', 'redir.numexample.com', '1._test.com.v.4.b.num.net.']),
  new TestData(['Domain', 'Hosted', 'test.com:3/', 'redir.numexample.com', '3._test.com.v.4.b.num.net.']),
  new TestData(['Domain', 'Hosted', 'test.com:1/c/b/a', 'redir.numexample.com', 'a.b.c.1._test.com.v.4.b.num.net.']),
  new TestData(['Domain', 'Hosted', 'test.com:3/c/b/a', 'redir.numexample.com', 'a.b.c.3._test.com.v.4.b.num.net.']),

  new TestData(['URL', 'Independent', 'new', 'http://redir.numexample.com', 'new.1._num.redir.numexample.com.']),
  new TestData(['URL', 'Independent', '/new', 'http://redir.numexample.com', 'new.1._num.redir.numexample.com.']),
  new TestData(['URL', 'Independent', '../new', 'http://redir.numexample.com', 'error']),
  new TestData(['URL', 'Independent', '../../new', 'http://redir.numexample.com', 'error']),
  new TestData(['URL', 'Independent', 'test.com:1', 'http://redir.numexample.com', '1._num.test.com.']),
  new TestData(['URL', 'Independent', 'test.com:1/', 'http://redir.numexample.com', '1._num.test.com.']),
  new TestData(['URL', 'Independent', 'test.com:3/', 'http://redir.numexample.com', '3._num.test.com.']),
  new TestData(['URL', 'Independent', 'test.com:1/c/b/a', 'http://redir.numexample.com', 'a.b.c.1._num.test.com.']),
  new TestData(['URL', 'Independent', 'test.com:3/c/b/a', 'http://redir.numexample.com', 'a.b.c.3._num.test.com.']),

  new TestData(['URL', 'Hosted', 'new', 'http://redir.numexample.com', 'new.1._redir.numexample.com.u.b.s.num.net.']),
  new TestData(['URL', 'Hosted', '/new', 'http://redir.numexample.com', 'new.1._redir.numexample.com.u.b.s.num.net.']),
  new TestData(['URL', 'Hosted', '../new', 'http://redir.numexample.com', 'error']),
  new TestData(['URL', 'Hosted', '../../new', 'http://redir.numexample.com', 'error']),
  new TestData(['URL', 'Hosted', 'test.com:1', 'http://redir.numexample.com', '1._test.com.v.4.b.num.net.']),
  new TestData(['URL', 'Hosted', 'test.com:1/', 'http://redir.numexample.com', '1._test.com.v.4.b.num.net.']),
  new TestData(['URL', 'Hosted', 'test.com:3/', 'http://redir.numexample.com', '3._test.com.v.4.b.num.net.']),
  new TestData(['URL', 'Hosted', 'test.com:1/c/b/a', 'http://redir.numexample.com', 'a.b.c.1._test.com.v.4.b.num.net.']),
  new TestData(['URL', 'Hosted', 'test.com:3/c/b/a', 'http://redir.numexample.com', 'a.b.c.3._test.com.v.4.b.num.net.']),

  new TestData(['URL', 'Independent', 'new', 'http://redir.numexample.com/foo/bar', 'new.bar.foo.1._num.redir.numexample.com.']),
  new TestData(['URL', 'Independent', '/new', 'http://redir.numexample.com/foo/bar', 'new.1._num.redir.numexample.com.']),
  new TestData(['URL', 'Independent', '../new', 'http://redir.numexample.com/foo/bar', 'new.foo.1._num.redir.numexample.com.']),
  new TestData(['URL', 'Independent', '../../new', 'http://redir.numexample.com/foo/bar', 'new.1._num.redir.numexample.com.']),
  new TestData(['URL', 'Independent', '../new/../bar', 'http://redir.numexample.com/foo/bar', 'error']),
  new TestData(['URL', 'Independent', '../../../new', 'http://redir.numexample.com/foo/bar', 'error']),

  new TestData(['URL', 'Hosted', 'new', 'http://redir.numexample.com/foo/bar', 'new.bar.foo.1._redir.numexample.com.u.b.s.num.net.']),
  new TestData(['URL', 'Hosted', '/new', 'http://redir.numexample.com/foo/bar', 'new.1._redir.numexample.com.u.b.s.num.net.']),
  new TestData(['URL', 'Hosted', '../new', 'http://redir.numexample.com/foo/bar', 'new.foo.1._redir.numexample.com.u.b.s.num.net.']),
  new TestData(['URL', 'Hosted', '../../new', 'http://redir.numexample.com/foo/bar', 'new.1._redir.numexample.com.u.b.s.num.net.']),
  new TestData(['URL', 'Hosted', '../new/../bar', 'http://redir.numexample.com/foo/bar', 'error']),
  new TestData(['URL', 'Hosted', '../../../new', 'http://redir.numexample.com/foo/bar', 'error']),

  new TestData(['Email', 'Independent', 'new', 'john.smith@numexample.com', 'new.1._john.smith.e._num.numexample.com.']),
  new TestData(['Email', 'Independent', '/new', 'john.smith@numexample.com', 'new.1._john.smith.e._num.numexample.com.']),
  new TestData(['Email', 'Independent', '../new', 'john.smith@numexample.com', 'error']),
  new TestData(['Email', 'Independent', '../../new', 'john.smith@numexample.com', 'error']),
  new TestData(['Email', 'Independent', 'jane.doe@test.com:1', 'http://redir.numexample.com', '1._jane.doe.e._num.test.com.']),
  new TestData(['Email', 'Independent', 'jane.doe@test.com:1/', 'http://redir.numexample.com', '1._jane.doe.e._num.test.com.']),
  new TestData(['Email', 'Independent', 'jane.doe@test.com:3/', 'http://redir.numexample.com', '3._jane.doe.e._num.test.com.']),
  new TestData(['Email', 'Independent', 'jane.doe@test.com:1/c/b/a', 'http://redir.numexample.com', 'a.b.c.1._jane.doe.e._num.test.com.']),
  new TestData(['Email', 'Independent', 'jane.doe@test.com:3/c/b/a', 'http://redir.numexample.com', 'a.b.c.3._jane.doe.e._num.test.com.']),

  new TestData(['Email', 'Hosted', 'new', 'john.smith@numexample.com', 'new.1._john.smith.e._numexample.com.c.7.m.num.net.']),
  new TestData(['Email', 'Hosted', '/new', 'john.smith@numexample.com', 'new.1._john.smith.e._numexample.com.c.7.m.num.net.']),
  new TestData(['Email', 'Hosted', '../new', 'john.smith@numexample.com', 'error']),
  new TestData(['Email', 'Hosted', '../../new', 'john.smith@numexample.com', 'error']),
  new TestData(['Email', 'Hosted', 'jane.doe@test.com:1', 'redir.numexample.com', '1._jane.doe.e._test.com.v.4.b.num.net.']),
  new TestData(['Email', 'Hosted', 'jane.doe@test.com:1/', 'redir.numexample.com', '1._jane.doe.e._test.com.v.4.b.num.net.']),
  new TestData(['Email', 'Hosted', 'jane.doe@test.com:3/', 'redir.numexample.com', '3._jane.doe.e._test.com.v.4.b.num.net.']),
  new TestData(['Email', 'Hosted', 'jane.doe@test.com:1/c/b/a', 'redir.numexample.com', 'a.b.c.1._jane.doe.e._test.com.v.4.b.num.net.']),
  new TestData(['Email', 'Hosted', 'jane.doe@test.com:3/c/b/a', 'redir.numexample.com', 'a.b.c.3._jane.doe.e._test.com.v.4.b.num.net.'])
);

const runTest = (td: TestData): TestResult => {
  let pass = false;
  let message = '';

  try {
    const ctx = new Context(parseNumUri(td.address).withPort(MODULE_1));
    ctx.location = td.location === 'Independent' ? NumLocation.independent : NumLocation.hosted;

    ctx.handleQueryRedirect(td.redirect);

    if (td.location === 'Independent') {
      const actual = ctx.queries.independentRecordLocation;
      if (td.expectedResult === actual) {
        pass = true;
      } else {
        message = 'Expected: ' + td.expectedResult + ', but found: ' + actual;
      }
    } else if (td.location === 'Hosted') {
      const actual = ctx.queries.hostedRecordLocation;
      if (td.expectedResult === actual) {
        pass = true;
      } else {
        message = 'Expected: ' + td.expectedResult + ', but found: ' + actual;
      }
    }
  } catch (e) {
    if (td.expectedResult === 'error') {
      pass = true;
    } else {
      message = e.message;
    }
  }
  return new TestResult(td, pass, message);
};

describe('ModuleDnsQueriesRedirections', () => {
  it('can pass bulk testing', () => {
    const failures = testData.map(runTest).filter((x) => !x.pass);
    failures.forEach((f) => {
      console.error(f.message);
    });
    if (failures.length > 0) {
      fail(`${failures.length} test[s] failed.`);
    }
  });
});
