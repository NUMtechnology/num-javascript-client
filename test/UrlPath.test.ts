import { expect } from 'chai';
import { UrlPath } from '../lib/client';

const validPaths = ['/', '/a', '/a/b', '/例', '/例/例'];

const invalidPaths = ['', 'a', 'a/b', '/a b', '/a/b/c d', '/a\\b', '/a\nb', '/a\rb', '/a\tb', '/a\bb', '/a\fb'];

describe('UrlPath', () => {
  it('should be able to create a UrlPath', () => {
    for (const path of validPaths) {
      const p = new UrlPath(path);
      expect(p).not.to.throw;
      expect(p.s).to.equal(path);
    }
  });

  it('should not be able to create an invalid UrlPath', () => {
    for (const path of invalidPaths) {
      expect(() => new UrlPath(path)).to.throw();
    }
  });
});
