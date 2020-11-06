import { expect } from 'chai';
import { UrlLookupGenerator } from '../lib/lookupgenerators';

describe('UrlLookupGenerator', () => {
  it('should be able to create valid lookup queries 1', () => {
    const gen = new UrlLookupGenerator('http://numexample.com');
    expect(gen.domain).to.equal('numexample.com');
    expect(gen.branch).to.be.null;
  });

  it('should be able to create valid lookup queries 2', () => {
    const gen = new UrlLookupGenerator('http://numexample.com/foo');
    expect(gen.domain).to.equal('numexample.com');
    expect(gen.branch).to.equal('foo');
  });

  it('should be able to create valid lookup queries 3', () => {
    const gen = new UrlLookupGenerator('http://numexample.com/foo/bar');
    expect(gen.domain).to.equal('numexample.com');
    expect(gen.branch).to.equal('bar.foo');
  });
});
