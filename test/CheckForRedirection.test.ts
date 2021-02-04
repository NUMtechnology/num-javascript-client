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
import { checkForRedirection } from '../src/modlservices';

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

  it('Can succeed if the parameter is not an object', () => {
    expect(() => checkForRedirection(null)).not.to.throw();
    expect(() => checkForRedirection(undefined)).not.to.throw();
    expect(() => checkForRedirection(true)).not.to.throw();
    expect(() => checkForRedirection(1)).not.to.throw();
    expect(() => checkForRedirection([])).not.to.throw();
    expect(() => checkForRedirection({})).not.to.throw();
  });
});
