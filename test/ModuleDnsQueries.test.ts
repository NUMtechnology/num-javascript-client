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
import { fail } from 'assert';
import { createModuleDnsQueries } from '../lib/modulednsqueries';
import { MODULE_1, parseNumUri } from '../lib/numuri';

class TestResult {
  constructor(readonly testData: TestData, readonly pass: boolean, readonly message: string) {}
}

class TestData {
  readonly type: string;
  readonly location: string;
  readonly address: string;
  readonly expectedResult: string | null;

  constructor(data: [string, string, string, string | null]) {
    this.type = data[0];
    this.location = data[1];
    this.address = data[2];
    this.expectedResult = data[3];
  }
}

const testData = new Array<TestData>(
  new TestData(['Domain', 'Independent', 'numexample.com', '1._num.numexample.com.']),
  new TestData(['Domain', 'Independent', 'numexample.com/', '1._num.numexample.com.']),
  new TestData(['Domain', 'Independent', 'numexample.com/foo', 'foo.1._num.numexample.com.']),
  new TestData(['Domain', 'Independent', 'www.numexample.com', '1._num.numexample.com.']),

  new TestData(['Domain', 'Hosted', 'numexample.com', '1._numexample.com.c.7.m.num.net.']),
  new TestData(['Domain', 'Hosted', 'numexample.com/', '1._numexample.com.c.7.m.num.net.']),
  new TestData(['Domain', 'Hosted', 'numexample.com/foo', 'foo.1._numexample.com.c.7.m.num.net.']),
  new TestData(['Domain', 'Hosted', 'www.numexample.com', '1._numexample.com.c.7.m.num.net.']),

  new TestData(['Domain', 'Populator', 'numexample.com', '1._numexample.com.populator.num.net.']),
  new TestData(['Domain', 'Populator', 'numexample.com/', '1._numexample.com.populator.num.net.']),
  new TestData(['Domain', 'Populator', 'numexample.com/foo', null]),
  new TestData(['Domain', 'Populator', 'www.numexample.com', '1._numexample.com.populator.num.net.']),

  new TestData(['URL', 'Independent', 'http://www.numexample.com/', '1._num.numexample.com.']),
  new TestData(['URL', 'Independent', 'http://www.numexample.com', '1._num.numexample.com.']),
  new TestData(['URL', 'Independent', 'http://www.numexample.com/foo', 'foo.1._num.numexample.com.']),
  new TestData(['URL', 'Independent', 'http://www.numexample.com/bar/foo/page', 'page.foo.bar.1._num.numexample.com.']),

  new TestData(['URL', 'Hosted', 'http://www.numexample.com/', '1._numexample.com.c.7.m.num.net.']),
  new TestData(['URL', 'Hosted', 'http://www.numexample.com', '1._numexample.com.c.7.m.num.net.']),
  new TestData(['URL', 'Hosted', 'http://www.numexample.com/foo', 'foo.1._numexample.com.c.7.m.num.net.']),
  new TestData(['URL', 'Hosted', 'http://www.numexample.com/bar/foo/page', 'page.foo.bar.1._numexample.com.c.7.m.num.net.']),

  new TestData(['URL', 'Populator', 'http://www.numexample.com/', '1._numexample.com.populator.num.net.']),
  new TestData(['URL', 'Populator', 'http://www.numexample.com', '1._numexample.com.populator.num.net.']),
  new TestData(['URL', 'Populator', 'http://www.numexample.com/foo', null]),
  new TestData(['URL', 'Populator', 'http://www.numexample.com/bar/foo/page', null]),

  new TestData(['Email', 'Independent', 'john.smith@example.com', '1._john.smith.e._num.example.com.']),
  new TestData(['Email', 'Independent', 'john.smith@example.com/', '1._john.smith.e._num.example.com.']),
  new TestData(['Email', 'Independent', 'john.smith@example.com/foo/bar', 'bar.foo.1._john.smith.e._num.example.com.']),

  new TestData(['Email', 'Hosted', 'john.smith@example.com', '1._john.smith.e._example.com.9.h.1.num.net.']),
  new TestData(['Email', 'Hosted', 'john.smith@example.com/', '1._john.smith.e._example.com.9.h.1.num.net.']),
  new TestData(['Email', 'Hosted', 'john.smith@example.com/foo/bar', 'bar.foo.1._john.smith.e._example.com.9.h.1.num.net.']),

  new TestData(['Email', 'Populator', 'john.smith@example.com', null]),
  new TestData(['Email', 'Populator', 'john.smith@example.com/', null]),
  new TestData(['Email', 'Populator', 'john.smith@example.com/foo/bar', null])
);

const runTest = (td: TestData): TestResult => {
  let pass = false;
  let message = '';

  try {
    const q = createModuleDnsQueries(MODULE_1, parseNumUri(td.address));
    const actual =
      td.location === 'Independent'
        ? q.independentRecordLocation
        : td.location === 'Hosted'
        ? q.hostedRecordLocation
        : td.location === 'Populator'
        ? q.populatorLocation
        : 'Invalid test data';

    if ((td.expectedResult === null && actual === null) || (actual !== null && actual === td.expectedResult)) {
      pass = true;
    } else {
      message = 'Expected: ' + td.expectedResult + ', but found: ' + actual;
    }
  } catch (e) {
    if (td.expectedResult === null) {
      pass = true;
    } else {
      message = e.message;
    }
  }
  return new TestResult(td, pass, message);
};

describe('ModuleDnsQueries', () => {
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
