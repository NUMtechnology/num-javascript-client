import { expect } from 'chai';
import { checkForRedirection } from '../lib/modlservices';

describe('checkForRedirection', () => {
  it('Can find a redirection', () => {
    const obj = {
      structures: [{ a: 'b' }, { '@R': 'redirection' }],
    };
    expect(() => checkForRedirection(obj)).to.throw('redirection');
  });

  it('Can succeed if no redirection', () => {
    const obj = {
      structures: [{ a: 'b' }, { x: 'redirection' }],
    };
    expect(() => checkForRedirection(obj)).not.to.throw();
  });
});
