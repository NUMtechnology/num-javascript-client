import { expect } from 'chai';

import { NO_USER_INFO, parseNumUri } from '../lib/client';

describe('NumUri Parsing', () => {
  it('can parse a full NUM URI', () => {
    const uri = parseNumUri('num://jane.doe@nowhere.com:1/my/details');

    expect(uri.userinfo.s).equal('jane.doe');
    expect(uri.host.s).equal('nowhere.com');
    expect(uri.port.n).equal(1);
    expect(uri.path.s).equal('/my/details');
  });

  it('can parse a full HTTPS URI', () => {
    const uri = parseNumUri('https://jane.doe@nowhere.com:1/my/details');

    expect(uri.userinfo.s).equal('jane.doe');
    expect(uri.host.s).equal('nowhere.com');
    expect(uri.port.n).equal(1);
    expect(uri.path.s).equal('/my/details');
  });

  it('can parse a URI with no protocol', () => {
    const uri = parseNumUri('jane.doe@nowhere.com:1/my/details');

    expect(uri.userinfo.s).equal('jane.doe');
    expect(uri.host.s).equal('nowhere.com');
    expect(uri.port.n).equal(1);
    expect(uri.path.s).equal('/my/details');
  });

  it('can parse a URI with no userinfo', () => {
    const uri = parseNumUri('https://nowhere.com:1/my/details');

    expect(uri.userinfo).equal(NO_USER_INFO);
    expect(uri.host.s).equal('nowhere.com');
    expect(uri.port.n).equal(1);
    expect(uri.path.s).equal('/my/details');
  });

  it('can parse a URI with no port', () => {
    const uri = parseNumUri('https://nowhere.com/my/details');

    expect(uri.userinfo).equal(NO_USER_INFO);
    expect(uri.host.s).equal('nowhere.com');
    expect(uri.port.n).equal(0);
    expect(uri.path.s).equal('/my/details');
  });

  it('can parse a URI with no port, but with a colon', () => {
    const uri = parseNumUri('https://nowhere.com:/my/details');

    expect(uri.userinfo).equal(NO_USER_INFO);
    expect(uri.host.s).equal('nowhere.com');
    expect(uri.port.n).equal(0);
    expect(uri.path.s).equal('/my/details');
  });

  it('can parse a URI with no path', () => {
    const uri = parseNumUri('https://nowhere.com:1');

    expect(uri.userinfo).equal(NO_USER_INFO);
    expect(uri.host.s).equal('nowhere.com');
    expect(uri.port.n).equal(1);
    expect(uri.path.s).equal('/');
  });

  it('can parse a URI with no path or port but with a colon', () => {
    const uri = parseNumUri('https://nowhere.com:');

    expect(uri.userinfo).equal(NO_USER_INFO);
    expect(uri.host.s).equal('nowhere.com');
    expect(uri.port.n).equal(0);
    expect(uri.path.s).equal('/');
  });

  it('can parse a URI with no path or port', () => {
    const uri = parseNumUri('https://nowhere.com');

    expect(uri.userinfo).equal(NO_USER_INFO);
    expect(uri.host.s).equal('nowhere.com');
    expect(uri.port.n).equal(0);
    expect(uri.path.s).equal('/');
  });

  it('can parse a minimal URI', () => {
    const uri = parseNumUri('nowhere.com');

    expect(uri.userinfo).equal(NO_USER_INFO);
    expect(uri.host.s).equal('nowhere.com');
    expect(uri.port.n).equal(0);
    expect(uri.path.s).equal('/');
  });

  it('can parse an email address', () => {
    const uri = parseNumUri('jane.doe@nowhere.com');

    expect(uri.userinfo.s).equal('jane.doe');
    expect(uri.host.s).equal('nowhere.com');
    expect(uri.port.n).equal(0);
    expect(uri.path.s).equal('/');
  });
});
