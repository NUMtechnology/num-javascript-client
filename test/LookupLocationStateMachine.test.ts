import { createLookupLocationStateMachine } from '../lib/lookupstatemachine';
import { expect } from 'chai';
import { Context } from '../lib/context';
import { Hostname, MODULE_1, NumUri } from '../lib/client';
import loglevel, { Logger } from 'loglevel';

const log = loglevel as Logger;

log.setLevel('warn');

const TEST_DELAYS = [100, 100, 100, 100, 100, 100, 100, 100, 100];

const testUri = new NumUri(new Hostname('example.com'), MODULE_1);

describe('LookupLocationStateMachine', () => {
  it('should be able to step through all the best-case states', async () => {
    const sm = createLookupLocationStateMachine(TEST_DELAYS);
    const ctx = new Context(testUri);

    let count = 0;
    while (!sm.complete()) {
      ctx.location = await sm.step(true);
      count++;
      log.debug('ctx.location: ', ctx.location);
      expect(count).to.be.lessThan(20);
    }
    expect(count).to.equal(1);
  });

  it('should be able to step through all the worst-case states', async () => {
    const sm = createLookupLocationStateMachine(TEST_DELAYS);
    const ctx = new Context(testUri);

    let count = 0;
    while (!sm.complete()) {
      ctx.location = await sm.step(1);
      count++;
      log.debug('ctx.location: ', ctx.location);
      expect(count).to.be.lessThan(20);
    }
    expect(count).to.equal(12);
  });

  it('should be able to succeed at INDY2', async () => {
    const sm = createLookupLocationStateMachine(TEST_DELAYS);
    const ctx = new Context(testUri);

    let count = 0;
    while (!sm.complete()) {
      ctx.location = await sm.step(2);
      count++;
      log.debug('ctx.location: ', ctx.location);
      expect(count).to.be.lessThan(20);
    }
    expect(count).to.equal(4);
  });

  it('should be able to succeed at HOSTED2', async () => {
    const sm = createLookupLocationStateMachine(TEST_DELAYS);
    const ctx = new Context(testUri);

    let count = 0;
    while (!sm.complete()) {
      ctx.location = await sm.step(3);
      count++;
      log.debug('ctx.location: ', ctx.location);
      expect(count).to.be.lessThan(20);
    }
    expect(count).to.equal(4);
  });
});
