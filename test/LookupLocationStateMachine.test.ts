import { LookupLocationStateMachine } from '../lib/lookupstatemachine';
import { expect } from 'chai';

describe('LookupLocationStateMachine', () => {
  it('should be able to step through all the best-case states', () => {
    const sm = new LookupLocationStateMachine();

    var count = 0;
    while (!sm.complete()) {
      sm.step(() => true);
      count++;
    }
    expect(count).to.equal(1);
  });

  it('should be able to step through all the worst-case states', () => {
    const sm = new LookupLocationStateMachine();

    var count = 0;
    while (!sm.complete()) {
      sm.step(() => 1);
      count++;
    }
    expect(count).to.equal(12);
  });

  it('should be able to succeed at INDY2', () => {
    const sm = new LookupLocationStateMachine();

    var count = 0;
    while (!sm.complete()) {
      sm.step(() => 2);
      count++;
    }
    expect(count).to.equal(4);
  });

  it('should be able to succeed at HOSTED2', () => {
    const sm = new LookupLocationStateMachine();

    var count = 0;
    while (!sm.complete()) {
      sm.step(() => 3);
      count++;
    }
    expect(count).to.equal(4);
  });
});
