import { expect } from 'chai';
import { PositiveInteger } from '../lib/numuri';

describe('PositiveInteger', () => {
  it('should be able to create a PositiveInteger', () => {
    expect(new PositiveInteger(0)).not.to.throw;
    expect(new PositiveInteger(1)).not.to.throw;
    expect(new PositiveInteger(1000)).not.to.throw;
    expect(new PositiveInteger(1000000)).not.to.throw;
    const pi = new PositiveInteger(1);
    expect(pi.n).to.equal(1);
  });

  it('should not be able to create an invalid PositiveInteger', () => {
    expect(() => new PositiveInteger(-1)).to.throw('Value should be zero or a positive integer: -1');
    expect(() => new PositiveInteger(-0.00001)).to.throw('Value should be zero or a positive integer: -0.00001');
    expect(() => new PositiveInteger(1.1)).to.throw('Value should be zero or a positive integer: 1.1');
  });
});
