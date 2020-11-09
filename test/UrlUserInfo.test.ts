import { expect } from 'chai';
import { UrlUserInfo } from '../lib/numuri';

const validUserInfoStrings = [
  'john.smith',
  'test',
  'test with spaces',
  'test=test',
  '',
  'firstname+lastname',
  '"email"',
  '1234567890',
  '_______',
  'firstname-lastname',
  'john.\uD83D\uDE00smith',
];

const invalidUserInfoStrings = ['#@%^%#$@#$', 'Joe Smith <email@example.com>', 'email@example', '.email', 'email.', 'email..email', 'ema\\il', 'Abc..123'];

describe('UrlUserInfo', () => {
  it('should be able to create a UrlUserInfo', () => {
    for (const info of validUserInfoStrings) {
      const ui = new UrlUserInfo(info);
      expect(ui).not.to.throw;
      expect(ui.s).to.equal(info);
    }
  });

  it('should not be able to create an invalid UrlUserInfo', () => {
    for (const info of invalidUserInfoStrings) {
      expect(() => new UrlUserInfo(info)).to.throw(`Invalid URL userinfo: ${info}`, `Expected an Error for: ${info}`);
    }
  });
});
