import { expect } from 'chai';
import { punydecode } from '../src/dnsservices';

describe('Punydecoding', () => {
  it('Should be able to decode punycode - 1', () => {
    expect(punydecode('@n=1;@pn=1;x=-8paa2vb3095lca372hda')).to.equal('@n=1;@pn=1;x=•¶§∞•¶§∞');
  });
});