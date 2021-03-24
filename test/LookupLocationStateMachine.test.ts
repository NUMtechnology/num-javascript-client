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
import loglevel, { Logger } from 'loglevel';
import { Context } from '../src/context';
import { createLookupLocationStateMachine } from '../src/lookupstatemachine';
import { parseNumUri } from '../src/numuri';

const log = loglevel as Logger;

const testUri = parseNumUri('example.com:1');

describe('LookupLocationStateMachine', () => {
  it('should be able to step through all the best-case states', async () => {
    const sm = createLookupLocationStateMachine();
    const ctx = new Context(testUri);

    let count = 0;
    while (!sm.complete()) {
      ctx.location = await sm.step(true);
      count++;
      log.debug('ctx.location: ', ctx.location);
    }
    expect(count).to.equal(1);
  });

  it('should be able to step through all the worst-case states', async () => {
    const sm = createLookupLocationStateMachine();
    const ctx = new Context(testUri);

    let count = 0;
    while (!sm.complete()) {
      ctx.location = await sm.step(1);
      count++;
      log.debug('ctx.location: ', ctx.location);
    }
    expect(count).to.equal(2);
  });

  it('should be able to succeed at INDY2', async () => {
    const sm = createLookupLocationStateMachine();
    const ctx = new Context(testUri);

    let count = 0;
    while (!sm.complete()) {
      ctx.location = await sm.step(2);
      count++;
      log.debug('ctx.location: ', ctx.location);
    }
    expect(count).to.equal(2);
  });

  it('should be able to succeed at HOSTED2', async () => {
    const sm = createLookupLocationStateMachine();
    const ctx = new Context(testUri);

    let count = 0;
    while (!sm.complete()) {
      ctx.location = await sm.step(3);
      count++;
      log.debug('ctx.location: ', ctx.location);
    }
    expect(count).to.equal(2);
  });
});
