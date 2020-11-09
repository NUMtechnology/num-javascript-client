import { expect } from 'chai';
import { createUrlLookupGenerator } from '../lib/lookupgenerators';
import { MODULE_1, parseNumUri } from '../lib/numuri';

describe('UrlLookupGenerator', () => {
  it('should be able to create valid lookup queries 1', () => {
    const gen = createUrlLookupGenerator(parseNumUri('http://numexample.com'));
    expect(gen.getIndependentLocation(MODULE_1)).to.equal('1._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 2', () => {
    const gen = createUrlLookupGenerator(parseNumUri('http://numexample.com/foo'));
    expect(gen.getIndependentLocation(MODULE_1)).to.equal('foo.1._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 3', () => {
    const gen = createUrlLookupGenerator(parseNumUri('http://numexample.com/foo/bar'));
    expect(gen.getIndependentLocation(MODULE_1)).to.equal('bar.foo.1._num.numexample.com.');
  });
});
