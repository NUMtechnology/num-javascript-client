import { expect } from 'chai';
import { DomainLookupGenerator, UrlLookupGenerator } from '../lib/lookupgenerators';

const EXPECTED_INDEPENDENT = '1._num.numexample.com.';

const EXPECTED_HOSTED = '1._numexample.com.c.7.m.num.net.';

const EXPECTED_POPULATOR = '1._numexample.com.populator.num.net.';

describe('DomainLookupGenerator', () => {
  it('should be able to create valid lookup queries 1', () => {
    const gen = new DomainLookupGenerator('example.com');
    expect(gen.getRootHostedLocationNoModuleNumber(true)).to.equal('_example.com.9.h.1.num.net.');
    expect(gen.getRootHostedLocationNoModuleNumber(false)).to.equal('_example.com.9.h.1.num.net');
    expect(gen.domain).to.equal('example.com');
    expect(gen.branch).to.be.null;
  });

  it('should be able to create valid lookup queries 2', () => {
    const gen = new DomainLookupGenerator('example.com');
    expect(gen.getRootIndependentLocationNoModuleNumber(true)).to.equal('_num.example.com.');
    expect(gen.getRootIndependentLocationNoModuleNumber(false)).to.equal('_num.example.com');
  });

  it('should be able to create valid lookup queries 3', () => {
    const gen = new DomainLookupGenerator('\uD83D\uDE00.ell.me.uk');
    expect(gen.getRootIndependentLocationNoModuleNumber(true)).to.equal('_num.xn--e28h.ell.me.uk.');
    expect(gen.getRootIndependentLocationNoModuleNumber(false)).to.equal('_num.xn--e28h.ell.me.uk');
  });

  it('should be able to create valid lookup queries 4', () => {
    const gen = new DomainLookupGenerator('numexample.com/foo');
    expect(gen.domain).to.equal('numexample.com');
    expect(gen.branch).to.equal('foo');
  });

  it('should be able to create valid lookup queries 5', () => {
    const gen = new DomainLookupGenerator('numexample.com/foo/bar');
    expect(gen.domain).to.equal('numexample.com');
    expect(gen.branch).to.equal('bar.foo');
  });

  it('should be able to create valid lookup queries 6', () => {
    const gen = new DomainLookupGenerator('testdomain例.com/test1例');
    expect(gen.domain).to.equal('xn--testdomain-4y5p.com');
    expect(gen.branch).to.equal('xn--test1-9d3h');
  });

  it('should be able to create valid lookup queries 7', () => {
    const gen = new DomainLookupGenerator('testdomain例.com/test1例/test2例/test3例');
    expect(gen.domain).to.equal('xn--testdomain-4y5p.com');
    expect(gen.branch).to.equal('xn--test3-9d3h.xn--test2-9d3h.xn--test1-9d3h');
    expect(gen.getIndependentLocation(1)).to.equal('xn--test3-9d3h.xn--test2-9d3h.xn--test1-9d3h.1._num.xn--testdomain-4y5p.com.');
    expect(gen.getHostedLocation(1)).to.equal('xn--test3-9d3h.xn--test2-9d3h.xn--test1-9d3h.1._xn--testdomain-4y5p.com.b.5.m.num.net.');
  });

  it('should be able to create valid lookup queries 8', () => {
    const gen = new DomainLookupGenerator('testdomain例.com');
    expect(gen.domain).to.equal('xn--testdomain-4y5p.com');
    expect(gen.branch).to.be.null;
    expect(gen.getIndependentLocation(1)).to.equal('1._num.xn--testdomain-4y5p.com.');
    expect(gen.getHostedLocation(1)).to.equal('1._xn--testdomain-4y5p.com.b.5.m.num.net.');
    expect(gen.getPopulatorLocation(1)).to.equal('1._xn--testdomain-4y5p.com.populator.num.net.');
  });

  it('should be able to handle many NUM ID formats 1', () => {
    const s1 = new DomainLookupGenerator('numexample.com').getHostedLocation(1);
    const s2 = new DomainLookupGenerator('www.numexample.com').getHostedLocation(1);
    const s3 = new DomainLookupGenerator('numexample.com/').getHostedLocation(1);
    const s4 = new DomainLookupGenerator('www.numexample.com/').getHostedLocation(1);
    const s5 = new UrlLookupGenerator('http://numexample.com').getHostedLocation(1);
    const s6 = new UrlLookupGenerator('https://numexample.com').getHostedLocation(1);
    const s7 = new UrlLookupGenerator('http://www.numexample.com').getHostedLocation(1);
    const s8 = new UrlLookupGenerator('https://www.numexample.com').getHostedLocation(1);
    const s9 = new UrlLookupGenerator('http://numexample.com/').getHostedLocation(1);
    const s10 = new UrlLookupGenerator('https://numexample.com/').getHostedLocation(1);
    const s11 = new UrlLookupGenerator('http://www.numexample.com/').getHostedLocation(1);
    const s12 = new UrlLookupGenerator('https://www.numexample.com/').getHostedLocation(1);

    expect(s1).equal(EXPECTED_HOSTED);
    expect(s2).equal(EXPECTED_HOSTED);
    expect(s3).equal(EXPECTED_HOSTED);
    expect(s4).equal(EXPECTED_HOSTED);
    expect(s5).equal(EXPECTED_HOSTED);
    expect(s6).equal(EXPECTED_HOSTED);
    expect(s7).equal(EXPECTED_HOSTED);
    expect(s8).equal(EXPECTED_HOSTED);
    expect(s9).equal(EXPECTED_HOSTED);
    expect(s10).equal(EXPECTED_HOSTED);
    expect(s11).equal(EXPECTED_HOSTED);
    expect(s12).equal(EXPECTED_HOSTED);
  });

  it('should be able to handle many NUM ID formats 2', () => {
    const s1 = new DomainLookupGenerator('numexample.com').getIndependentLocation(1);
    const s2 = new DomainLookupGenerator('www.numexample.com').getIndependentLocation(1);
    const s3 = new DomainLookupGenerator('numexample.com/').getIndependentLocation(1);
    const s4 = new DomainLookupGenerator('www.numexample.com/').getIndependentLocation(1);
    const s5 = new UrlLookupGenerator('http://numexample.com').getIndependentLocation(1);
    const s6 = new UrlLookupGenerator('https://numexample.com').getIndependentLocation(1);
    const s7 = new UrlLookupGenerator('http://www.numexample.com').getIndependentLocation(1);
    const s8 = new UrlLookupGenerator('https://www.numexample.com').getIndependentLocation(1);
    const s9 = new UrlLookupGenerator('http://numexample.com/').getIndependentLocation(1);
    const s10 = new UrlLookupGenerator('https://numexample.com/').getIndependentLocation(1);
    const s11 = new UrlLookupGenerator('http://www.numexample.com/').getIndependentLocation(1);
    const s12 = new UrlLookupGenerator('https://www.numexample.com/').getIndependentLocation(1);

    expect(s1).equal(EXPECTED_INDEPENDENT);
    expect(s2).equal(EXPECTED_INDEPENDENT);
    expect(s3).equal(EXPECTED_INDEPENDENT);
    expect(s4).equal(EXPECTED_INDEPENDENT);
    expect(s5).equal(EXPECTED_INDEPENDENT);
    expect(s6).equal(EXPECTED_INDEPENDENT);
    expect(s7).equal(EXPECTED_INDEPENDENT);
    expect(s8).equal(EXPECTED_INDEPENDENT);
    expect(s9).equal(EXPECTED_INDEPENDENT);
    expect(s10).equal(EXPECTED_INDEPENDENT);
    expect(s11).equal(EXPECTED_INDEPENDENT);
    expect(s12).equal(EXPECTED_INDEPENDENT);
  });

  it('should be able to handle many NUM ID formats 3', () => {
    const s1 = new DomainLookupGenerator('numexample.com').getPopulatorLocation(1);
    const s2 = new DomainLookupGenerator('www.numexample.com').getPopulatorLocation(1);
    const s3 = new DomainLookupGenerator('numexample.com/').getPopulatorLocation(1);
    const s4 = new DomainLookupGenerator('www.numexample.com/').getPopulatorLocation(1);
    const s5 = new UrlLookupGenerator('http://numexample.com').getPopulatorLocation(1);
    const s6 = new UrlLookupGenerator('https://numexample.com').getPopulatorLocation(1);
    const s7 = new UrlLookupGenerator('http://www.numexample.com').getPopulatorLocation(1);
    const s8 = new UrlLookupGenerator('https://www.numexample.com').getPopulatorLocation(1);
    const s9 = new UrlLookupGenerator('http://numexample.com/').getPopulatorLocation(1);
    const s10 = new UrlLookupGenerator('https://numexample.com/').getPopulatorLocation(1);
    const s11 = new UrlLookupGenerator('http://www.numexample.com/').getPopulatorLocation(1);
    const s12 = new UrlLookupGenerator('https://www.numexample.com/').getPopulatorLocation(1);

    expect(s1).equal(EXPECTED_POPULATOR);
    expect(s2).equal(EXPECTED_POPULATOR);
    expect(s3).equal(EXPECTED_POPULATOR);
    expect(s4).equal(EXPECTED_POPULATOR);
    expect(s5).equal(EXPECTED_POPULATOR);
    expect(s6).equal(EXPECTED_POPULATOR);
    expect(s7).equal(EXPECTED_POPULATOR);
    expect(s8).equal(EXPECTED_POPULATOR);
    expect(s9).equal(EXPECTED_POPULATOR);
    expect(s10).equal(EXPECTED_POPULATOR);
    expect(s11).equal(EXPECTED_POPULATOR);
    expect(s12).equal(EXPECTED_POPULATOR);
  });
});
