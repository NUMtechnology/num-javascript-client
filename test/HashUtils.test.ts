import { expect } from 'chai';

import { HashUtils } from '../lib/hashutils';

describe('HashUtils', () => {
  it('Can hash correctly 1', () => {
    const hash = HashUtils.hashByDepth('test', 1);
    expect(hash).to.equal('.j');
  });
  it('Can hash correctly 2', () => {
    const hash = HashUtils.hashByDepth('test', 2);
    expect(hash).to.equal('.r.j');
  });
  it('Can hash correctly 3', () => {
    const hash = HashUtils.hashByDepth('test', 3);
    expect(hash).to.equal('.w.r.j');
  });
});
