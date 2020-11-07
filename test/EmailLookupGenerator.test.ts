import { expect } from 'chai';
import { createEmailLookupGenerator } from '../lib/lookupgenerators';

describe('EmailLookupGenerator', () => {
  it('should be able to create valid lookup queries 1', () => {
    const gen = createEmailLookupGenerator('john.😀smith@😀numexample.com/foo/😀/bar');
    expect(gen.getHostedLocation(1)).to.equal('bar.xn--e28h.foo.1._john.xn--smith-y224d.e._xn--numexample-j366i.com.o.z.s.num.net.');
  });

  it('should be able to create valid lookup queries 2', () => {
    const gen = createEmailLookupGenerator('john.smith@numexample.com');
    expect(gen.getDistributedIndependentLocation(1, 1)).to.equal('1._john.smith.3.e._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 3', () => {
    const gen = createEmailLookupGenerator('john.smith@numexample.com/foo/bar');
    expect(gen.getDistributedIndependentLocation(1, 1)).to.equal('bar.foo.1._john.smith.3.e._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 4', () => {
    const gen = createEmailLookupGenerator('john.smith@numexample.com');
    expect(gen.getDistributedHostedLocation(1, 1)).to.equal('1._john.smith.3.e._numexample.com.c.7.m.num.net.');
  });

  it('should be able to create valid lookup queries 5', () => {
    const gen = createEmailLookupGenerator('john.smith@numexample.com/foo/bar');
    expect(gen.getDistributedHostedLocation(1, 1)).to.equal('bar.foo.1._john.smith.3.e._numexample.com.c.7.m.num.net.');
  });

  it('should be able to create valid lookup queries 6', () => {
    const gen = createEmailLookupGenerator('john.smith@numexample.com');
    expect(gen.getDistributedIndependentLocation(1, 2)).to.equal('1._john.smith.6.3.e._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 7', () => {
    const gen = createEmailLookupGenerator('john.smith@numexample.com/foo/bar');
    expect(gen.getDistributedIndependentLocation(1, 2)).to.equal('bar.foo.1._john.smith.6.3.e._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 8', () => {
    const gen = createEmailLookupGenerator('john.smith@numexample.com');
    expect(gen.getDistributedHostedLocation(1, 2)).to.equal('1._john.smith.6.3.e._numexample.com.c.7.m.num.net.');
  });

  it('should be able to create valid lookup queries 9', () => {
    const gen = createEmailLookupGenerator('john.smith@numexample.com/foo/bar');
    expect(gen.getDistributedHostedLocation(1, 2)).to.equal('bar.foo.1._john.smith.6.3.e._numexample.com.c.7.m.num.net.');
  });

  it('should be able to create valid lookup queries 10', () => {
    const gen = createEmailLookupGenerator('john.smith@numexample.com');
    expect(gen.getDistributedIndependentLocation(1, 3)).to.equal('1._john.smith.d.6.3.e._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 11', () => {
    const gen = createEmailLookupGenerator('john.smith@numexample.com/foo/bar');
    expect(gen.getDistributedIndependentLocation(1, 3)).to.equal('bar.foo.1._john.smith.d.6.3.e._num.numexample.com.');
  });

  it('should be able to create valid lookup queries 12', () => {
    const gen = createEmailLookupGenerator('john.smith@numexample.com');
    expect(gen.getDistributedHostedLocation(1, 3)).to.equal('1._john.smith.d.6.3.e._numexample.com.c.7.m.num.net.');
  });

  it('should be able to create valid lookup queries 13', () => {
    const gen = createEmailLookupGenerator('john.smith@numexample.com/foo/bar');
    expect(gen.getDistributedHostedLocation(1, 3)).to.equal('bar.foo.1._john.smith.d.6.3.e._numexample.com.c.7.m.num.net.');
  });
});
