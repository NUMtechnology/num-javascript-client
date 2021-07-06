import { expect } from 'chai';
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
import { createTNUMLookupGenerator } from '../src/lookupgenerators';
import { MODULE_1, parseNumUri } from '../src/numuri';

describe('TNUMLookupGenerator', () => {
  it('testBDSNoBranches', () => {
    const gen = createTNUMLookupGenerator(parseNumUri('num://+442030957100'));
    expect("1._0017.590.302.44._t.num.net.").to.equal(gen.getHostedLocation(MODULE_1));
    expect("1._num.0017.590.302.44.tnum.net.").to.equal(gen.getIndependentLocation(MODULE_1));
    expect("1._0017.590.302.44._t.num.net.").to.equal(gen.getRootHostedLocation(MODULE_1));
    expect("_0017.590.302.44._t.num.net.").to.equal(gen.getRootHostedLocationNoModuleNumber(true));
    expect("1._num.0017.590.302.44.tnum.net.").to.equal(gen.getRootIndependentLocation(MODULE_1));
    expect("_num.0017.590.302.44.tnum.net.").to.equal(gen.getRootIndependentLocationNoModuleNumber(true));
  });

  it('testBDSNoBranchesNoProtocol', () => {
    const gen = createTNUMLookupGenerator(parseNumUri('+442030957100'));
    expect("1._0017.590.302.44._t.num.net.").to.equal(gen.getHostedLocation(MODULE_1));
    expect("1._num.0017.590.302.44.tnum.net.").to.equal(gen.getIndependentLocation(MODULE_1));
    expect("1._0017.590.302.44._t.num.net.").to.equal(gen.getRootHostedLocation(MODULE_1));
    expect("_0017.590.302.44._t.num.net.").to.equal(gen.getRootHostedLocationNoModuleNumber(true));
    expect("1._num.0017.590.302.44.tnum.net.").to.equal(gen.getRootIndependentLocation(MODULE_1));
    expect("_num.0017.590.302.44.tnum.net.").to.equal(gen.getRootIndependentLocationNoModuleNumber(true));
  });

  it('testBDSNoBranchesNoTrailingDot', () => {
    const gen = createTNUMLookupGenerator(parseNumUri('+442030957100'));
    expect("_0017.590.302.44._t.num.net").to.equal(gen.getRootHostedLocationNoModuleNumber(false));
    expect("_num.0017.590.302.44.tnum.net").to.equal(gen.getRootIndependentLocationNoModuleNumber(false));
  });

  it('testSDSNoBranches', () => {
    const gen = createTNUMLookupGenerator(parseNumUri('+99991865332244'));
    expect("1._4.4.2.2.3.3.5.6.8.1.9.9.9.9.e164.arpa.").to.equal(gen.getHostedLocation(MODULE_1));
    expect("1._num.4.4.2.2.3.3.5.6.8.1.9.9.9.9.e164.arpa.").to.equal(gen.getIndependentLocation(MODULE_1));
    expect("1._4.4.2.2.3.3.5.6.8.1.9.9.9.9.e164.arpa.").to.equal(gen.getRootHostedLocation(MODULE_1));
    expect("_4.4.2.2.3.3.5.6.8.1.9.9.9.9.e164.arpa.").to.equal(gen.getRootHostedLocationNoModuleNumber(true));
    expect("1._num.4.4.2.2.3.3.5.6.8.1.9.9.9.9.e164.arpa.").to.equal(gen.getRootIndependentLocation(MODULE_1));
    expect("_num.4.4.2.2.3.3.5.6.8.1.9.9.9.9.e164.arpa.").to.equal(gen.getRootIndependentLocationNoModuleNumber(true));
  });

  it('testBDSBranches', () => {
    const gen = createTNUMLookupGenerator(parseNumUri('+442030957100/foo/bar'));
    expect("bar.foo.1._0017.590.302.44._t.num.net.").to.equal(gen.getHostedLocation(MODULE_1));
    expect("bar.foo.1._num.0017.590.302.44.tnum.net.").to.equal(gen.getIndependentLocation(MODULE_1));
    expect("1._0017.590.302.44._t.num.net.").to.equal(gen.getRootHostedLocation(MODULE_1));
    expect("_0017.590.302.44._t.num.net.").to.equal(gen.getRootHostedLocationNoModuleNumber(true));
    expect("1._num.0017.590.302.44.tnum.net.").to.equal(gen.getRootIndependentLocation(MODULE_1));
    expect("_num.0017.590.302.44.tnum.net.").to.equal(gen.getRootIndependentLocationNoModuleNumber(true));
  });

  it('testBDSBranchesWithNumUri', () => {
    const gen = createTNUMLookupGenerator(parseNumUri('num://+442030957100:100/foo/bar'));
    expect("bar.foo.1._0017.590.302.44._t.num.net.").to.equal(gen.getHostedLocation(MODULE_1));
    expect("bar.foo.1._num.0017.590.302.44.tnum.net.").to.equal(gen.getIndependentLocation(MODULE_1));
    expect("1._0017.590.302.44._t.num.net.").to.equal(gen.getRootHostedLocation(MODULE_1));
    expect("_0017.590.302.44._t.num.net.").to.equal(gen.getRootHostedLocationNoModuleNumber(true));
    expect("1._num.0017.590.302.44.tnum.net.").to.equal(gen.getRootIndependentLocation(MODULE_1));
    expect("_num.0017.590.302.44.tnum.net.").to.equal(gen.getRootIndependentLocationNoModuleNumber(true));
  });

});
