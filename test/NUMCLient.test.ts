import { expect } from 'chai';
import { createClient } from '../lib/client';

describe('NUMClient', () => {
  it('should be able to create a new NUMClient', () => {
    expect(createClient()).not.to.be.null;
  });
});
