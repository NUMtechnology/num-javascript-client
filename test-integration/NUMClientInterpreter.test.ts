/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-template-curly-in-string */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import deepEql from 'deep-eql';
import loglevel, { Logger } from 'loglevel';
import { createClient } from '../src/client';
import { UserVariable } from '../src/context';
import { PositiveInteger } from '../src/numuri';


const log = loglevel as Logger;

log.setLevel('info');

describe('NUMClient with Interpreter', () => {

  it('should be able to lookup a NUM record using the NUMClient', async () => {

    const client = createClient();

    const modl = '@n=1;o(n=NUM;s=Organising the world\'s open data;c[tw=NUMprotocol;li=company/20904983])';
    const moduleNumber = new PositiveInteger(1);
    const userVariables = new Map<string, UserVariable>();
    const result = await client.interpret(modl, moduleNumber, userVariables);

    expect(result).not.equal(null);

    const expected = '{"@n":1,"organisation":{"name":"NUM","contacts":[{"twitter":{"value":"NUMprotocol","object_display_name":"Twitter","description_default":"View Twitter profile","prefix":"https://www.twitter.com/","method_type":"third_party","value_prefix":"@","controller":"twitter.com"}},{"linkedin":{"value":"company/20904983","object_display_name":"LinkedIn","description_default":"View LinkedIn page","prefix":"https://www.linkedin.com/","method_type":"third_party","controller":"linkedin.com"}}],"slogan":"Organising the world\'s open data","object_display_name":"Organisation","description_default":"View Organisation"}}';
    const same = deepEql(
      JSON.parse(result as string),
      JSON.parse(expected)
    );
    if (!same) {
      console.log(`Actual  : ${result}`);
      console.log(`Expected: ${expected}`);
    }
    expect(same).to.equal(true);
  });

});