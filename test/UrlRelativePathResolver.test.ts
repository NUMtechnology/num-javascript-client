import { expect } from 'chai';
import { resolvePath } from '../lib/urlrelativepathresolver';

describe('UrlrelativePathResolver', () => {
  it('testResolveEmptyString', () => {
    expect(resolvePath('', '')).to.equal('/');
  });

  it('testResolveSuccess_1', () => {
    expect(resolvePath('', 'level1')).to.equal('/level1');
  });

  it('testResolveSuccess_2', () => {
    expect(resolvePath('/', 'level1')).to.equal('/level1');
  });

  it('testResolveSuccess_3_1', () => {
    expect(resolvePath('/level1', 'level2')).to.equal('/level1/level2');
  });

  it('testResolveSuccess_3_2', () => {
    expect(resolvePath('level1', 'level2')).to.equal('/level1/level2');
  });

  it('testResolveSuccess_4', () => {
    expect(resolvePath('/level1/level2/', 'level3')).to.equal('/level1/level2/level3');
  });

  it('testResolveSuccess_5', () => {
    expect(resolvePath('/level1/level2/', '..')).to.equal('/level1');
  });

  it('testResolveSuccess_6', () => {
    expect(resolvePath('/level1/level2/', '../..')).to.equal('/');
  });

  it('testResolveSuccess_7', () => {
    expect(resolvePath('/level1/level2/', '/')).to.equal('/');
  });

  it('testResolveSuccess_8', () => {
    expect(resolvePath('/level1/level2/', '../lev2/../lev3/../lev2again/')).to.equal('/level1/lev2again');
  });

  it('testResolveSuccess_9', () => {
    expect(resolvePath('/level1/level2/', '../../lev2/../lev3/../lev2again/../lev1again')).to.equal('/lev1again');
  });

  it('testResolveSuccess_10', () => {
    expect(resolvePath('/level1/level2', 'level3/../../..')).to.equal('/');
  });

  it('testResolveSuccess_11', () => {
    expect(resolvePath('/level1/level2', './level3/../../..')).to.equal('/');
  });

  it('testResolveSuccess_12', () => {
    expect(resolvePath('/level1/level2', './level3/.././../..')).to.equal('/');
  });

  it('testResolveSuccess_13', () => {
    expect(resolvePath('/level1/level2', './level3/..//../..')).to.equal('/');
  });

  it('testResolveSuccess_14', () => {
    expect(resolvePath('/level1/level2', './././././/////')).to.equal('/level1/level2');
  });

  it('testResolveSuccess_15', () => {
    expect(resolvePath('//level1/level2', './././././/////')).to.equal('/level1/level2');
  });

  it('testResolveSuccess_16', () => {
    expect(resolvePath('/./level1/level2', './././././/////')).to.equal('/level1/level2');
  });

  it('testResolveSuccess_17', () => {
    expect(resolvePath('/./level1/level2', '')).to.equal('/level1/level2');
  });

  it('testResolveFail_1', () => {
    expect(() => resolvePath('', '..')).to.throw;
  });

  it('testResolveFail_2', () => {
    expect(() => resolvePath('', '/..')).to.throw;
  });

  it('testResolveFail_3', () => {
    expect(() => resolvePath('', '../..')).to.throw;
  });

  it('testResolveFail_4', () => {
    expect(() => resolvePath('/', '../..')).to.throw;
  });

  it('testResolveFail_5', () => {
    expect(() => resolvePath('/level1', '../..')).to.throw;
  });

  it('testResolveFail_6', () => {
    expect(() => resolvePath('level1', '../..')).to.throw;
  });

  it('testResolveFail_7', () => {
    expect(() => resolvePath('/level1/level2', 'level3/../../../level1again/../../oops')).to.throw;
  });

  it('testResolveFail_8', () => {
    expect(() => resolvePath('/..', '')).to.throw;
  });

  it('testResolveFail_9', () => {
    expect(() => resolvePath('..', '')).to.throw;
  });
});
