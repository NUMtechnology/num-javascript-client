import { expect } from 'chai';
import { createDomainLookupGenerator, createUrlLookupGenerator } from '../lib/lookupgenerators';
import { MODULE_1, parseNumUri } from '../lib/numuri';

const EXPECTED_INDEPENDENT = '1._num.numexample.com.';

const EXPECTED_HOSTED = '1._numexample.com.c.7.m.num.net.';

const EXPECTED_POPULATOR = '1._numexample.com.populator.num.net.';

describe('DomainLookupGenerator', () => {
  it('should be able to create valid lookup queries 1', () => {
    const gen = createDomainLookupGenerator(parseNumUri('example.com'));
    expect(gen.getRootHostedLocationNoModuleNumber(true)).to.equal('_example.com.9.h.1.num.net.');
    expect(gen.getRootHostedLocationNoModuleNumber(false)).to.equal('_example.com.9.h.1.num.net');
  });

  it('should be able to create valid lookup queries 2', () => {
    const gen = createDomainLookupGenerator(parseNumUri('example.com'));
    expect(gen.getRootIndependentLocationNoModuleNumber(true)).to.equal('_num.example.com.');
    expect(gen.getRootIndependentLocationNoModuleNumber(false)).to.equal('_num.example.com');
  });

  it('should be able to create valid lookup queries 3', () => {
    const gen = createDomainLookupGenerator(parseNumUri('\uD83D\uDE00.ell.me.uk'));
    expect(gen.getRootIndependentLocationNoModuleNumber(true)).to.equal('_num.xn--e28h.ell.me.uk.');
    expect(gen.getRootIndependentLocationNoModuleNumber(false)).to.equal('_num.xn--e28h.ell.me.uk');
  });

  it('should be able to create valid lookup queries 4', () => {
    const gen = createDomainLookupGenerator(parseNumUri('testdomain例.com/test1例/test2例/test3例'));
    expect(gen.getIndependentLocation(MODULE_1)).to.equal('xn--test3-9d3h.xn--test2-9d3h.xn--test1-9d3h.1._num.xn--testdomain-4y5p.com.');
    expect(gen.getHostedLocation(MODULE_1)).to.equal('xn--test3-9d3h.xn--test2-9d3h.xn--test1-9d3h.1._xn--testdomain-4y5p.com.b.5.m.num.net.');
  });

  it('should be able to create valid lookup queries 5', () => {
    const gen = createDomainLookupGenerator(parseNumUri('testdomain例.com'));
    expect(gen.getIndependentLocation(MODULE_1)).to.equal('1._num.xn--testdomain-4y5p.com.');
    expect(gen.getHostedLocation(MODULE_1)).to.equal('1._xn--testdomain-4y5p.com.b.5.m.num.net.');
    expect(gen.getPopulatorLocation(MODULE_1)).to.equal('1._xn--testdomain-4y5p.com.populator.num.net.');
  });

  it('should be able to handle many NUM ID formats 1', () => {
    const s1 = createDomainLookupGenerator(parseNumUri('numexample.com')).getHostedLocation(MODULE_1);
    const s2 = createDomainLookupGenerator(parseNumUri('www.numexample.com')).getHostedLocation(MODULE_1);
    const s3 = createDomainLookupGenerator(parseNumUri('numexample.com/')).getHostedLocation(MODULE_1);
    const s4 = createDomainLookupGenerator(parseNumUri('www.numexample.com/')).getHostedLocation(MODULE_1);
    const s5 = createUrlLookupGenerator(parseNumUri('http://numexample.com')).getHostedLocation(MODULE_1);
    const s6 = createUrlLookupGenerator(parseNumUri('https://numexample.com')).getHostedLocation(MODULE_1);
    const s7 = createUrlLookupGenerator(parseNumUri('http://www.numexample.com')).getHostedLocation(MODULE_1);
    const s8 = createUrlLookupGenerator(parseNumUri('https://www.numexample.com')).getHostedLocation(MODULE_1);
    const s9 = createUrlLookupGenerator(parseNumUri('http://numexample.com/')).getHostedLocation(MODULE_1);
    const s10 = createUrlLookupGenerator(parseNumUri('https://numexample.com/')).getHostedLocation(MODULE_1);
    const s11 = createUrlLookupGenerator(parseNumUri('http://www.numexample.com/')).getHostedLocation(MODULE_1);
    const s12 = createUrlLookupGenerator(parseNumUri('https://www.numexample.com/')).getHostedLocation(MODULE_1);

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
    const s1 = createDomainLookupGenerator(parseNumUri('numexample.com')).getIndependentLocation(MODULE_1);
    const s2 = createDomainLookupGenerator(parseNumUri('www.numexample.com')).getIndependentLocation(MODULE_1);
    const s3 = createDomainLookupGenerator(parseNumUri('numexample.com/')).getIndependentLocation(MODULE_1);
    const s4 = createDomainLookupGenerator(parseNumUri('www.numexample.com/')).getIndependentLocation(MODULE_1);
    const s5 = createUrlLookupGenerator(parseNumUri('http://numexample.com')).getIndependentLocation(MODULE_1);
    const s6 = createUrlLookupGenerator(parseNumUri('https://numexample.com')).getIndependentLocation(MODULE_1);
    const s7 = createUrlLookupGenerator(parseNumUri('http://www.numexample.com')).getIndependentLocation(MODULE_1);
    const s8 = createUrlLookupGenerator(parseNumUri('https://www.numexample.com')).getIndependentLocation(MODULE_1);
    const s9 = createUrlLookupGenerator(parseNumUri('http://numexample.com/')).getIndependentLocation(MODULE_1);
    const s10 = createUrlLookupGenerator(parseNumUri('https://numexample.com/')).getIndependentLocation(MODULE_1);
    const s11 = createUrlLookupGenerator(parseNumUri('http://www.numexample.com/')).getIndependentLocation(MODULE_1);
    const s12 = createUrlLookupGenerator(parseNumUri('https://www.numexample.com/')).getIndependentLocation(MODULE_1);

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
    const s1 = createDomainLookupGenerator(parseNumUri('numexample.com')).getPopulatorLocation(MODULE_1);
    const s2 = createDomainLookupGenerator(parseNumUri('www.numexample.com')).getPopulatorLocation(MODULE_1);
    const s3 = createDomainLookupGenerator(parseNumUri('numexample.com/')).getPopulatorLocation(MODULE_1);
    const s4 = createDomainLookupGenerator(parseNumUri('www.numexample.com/')).getPopulatorLocation(MODULE_1);
    const s5 = createUrlLookupGenerator(parseNumUri('http://numexample.com')).getPopulatorLocation(MODULE_1);
    const s6 = createUrlLookupGenerator(parseNumUri('https://numexample.com')).getPopulatorLocation(MODULE_1);
    const s7 = createUrlLookupGenerator(parseNumUri('http://www.numexample.com')).getPopulatorLocation(MODULE_1);
    const s8 = createUrlLookupGenerator(parseNumUri('https://www.numexample.com')).getPopulatorLocation(MODULE_1);
    const s9 = createUrlLookupGenerator(parseNumUri('http://numexample.com/')).getPopulatorLocation(MODULE_1);
    const s10 = createUrlLookupGenerator(parseNumUri('https://numexample.com/')).getPopulatorLocation(MODULE_1);
    const s11 = createUrlLookupGenerator(parseNumUri('http://www.numexample.com/')).getPopulatorLocation(MODULE_1);
    const s12 = createUrlLookupGenerator(parseNumUri('https://www.numexample.com/')).getPopulatorLocation(MODULE_1);

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
