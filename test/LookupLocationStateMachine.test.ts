import { LookupLocationStateMachine } from '../lib/lookupstatemachine';
import { expect } from 'chai';
import { Context } from '../lib/context';
import { Logger } from 'loglevel';
import { Hostname, MODULE_1, NumUri } from '../lib/client';

const log = require('loglevel') as Logger;

log.setLevel('warn');

const testUri = new NumUri(new Hostname('example.com'), MODULE_1);

describe('LookupLocationStateMachine', () => {
  it('should be able to step through all the best-case states', () => {
    const sm = new LookupLocationStateMachine();
    const ctx = new Context(testUri);

    var count = 0;
    while (!sm.complete()) {
      sm.step(() => true, ctx);
      count++;
      log.debug('ctx.location: ', ctx.location);
    }
    expect(count).to.equal(1);
  });

  it('should be able to step through all the worst-case states', () => {
    const sm = new LookupLocationStateMachine();
    const ctx = new Context(testUri);

    var count = 0;
    while (!sm.complete()) {
      sm.step(() => 1, ctx);
      count++;
      log.debug('ctx.location: ', ctx.location);
    }
    expect(count).to.equal(12);
  });

  it('should be able to succeed at INDY2', () => {
    const sm = new LookupLocationStateMachine();
    const ctx = new Context(testUri);

    var count = 0;
    while (!sm.complete()) {
      sm.step(() => 2, ctx);
      count++;
      log.debug('ctx.location: ', ctx.location);
    }
    expect(count).to.equal(4);
  });

  it('should be able to succeed at HOSTED2', () => {
    const sm = new LookupLocationStateMachine();
    const ctx = new Context(testUri);

    var count = 0;
    while (!sm.complete()) {
      sm.step(() => 3, ctx);
      count++;
      log.debug('ctx.location: ', ctx.location);
    }
    expect(count).to.equal(4);
  });
});
