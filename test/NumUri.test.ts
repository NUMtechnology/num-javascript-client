// Copyright 2020 NUM Technology Ltd
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
import { expect } from 'chai';

import { NO_USER_INFO, parseNumUri } from '../lib/numuri';

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
