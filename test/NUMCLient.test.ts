import { expect } from 'chai';
import { NUMClient } from '../lib/client';

describe('NUMClient', () => {
  it('should be able to create a new NUMClient', () => {
    expect(new NUMClient()).not.to.be.null;
  });
});
