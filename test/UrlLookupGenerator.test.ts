import { expect } from 'chai';
import { createUrlLookupGenerator } from '../lib/lookupgenerators';

describe('UrlLookupGenerator', () => {
  it('should be able to create valid lookup queries 1', () => {
    const gen = createUrlLookupGenerator('http://numexample.com');
    expect(gen.getIndependentLocation(1)).to.equal('1._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 2', () => {
    const gen = createUrlLookupGenerator('http://numexample.com/foo');
    expect(gen.getIndependentLocation(1)).to.equal('foo.1._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 3', () => {
    const gen = createUrlLookupGenerator('http://numexample.com/foo/bar');
    expect(gen.getIndependentLocation(1)).to.equal('bar.foo.1._num.numexample.com.');
  });
});
