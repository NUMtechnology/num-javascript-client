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
import { createClient } from '../src/client';
import { UserVariable } from '../src/context';
import { PositiveInteger } from '../src/numuri';
import { DummyResourceLoader } from './DummyResourceLoader';
import { log } from 'num-easy-log';

const dummyResourceLoader = new DummyResourceLoader();

describe('NUMClient with Interpreter', () => {
  it('should be able to lookup a NUM record using the NUMClient', async () => {
    const client = createClient();
    client.setResourceLoader(dummyResourceLoader);

    const modl = "@n=1;o(n=NUM;s=Organising the world's open data;c[tw(v=NUMprotocol);li(v=company/20904983)])";
    const moduleNumber = new PositiveInteger(1);
    const userVariables = new Map<string, UserVariable>();
    const result = await client.interpret(modl, moduleNumber, userVariables, '2');

    expect(result).not.equal(null);

    const expected =
      '{"@n":1,"@version":2,"object_type":"organization","object_display_name":"Organization","name":"NUM","slogan":"Organising the world\'s open data","contacts":[{"method_type":"twitter","method_display_name":"Twitter","description_default":"View Twitter profile","description":null,"action":"https://www.twitter.com/NUMprotocol","controller":"twitter.com","value":"@NUMprotocol"},{"method_type":"linkedin","method_display_name":"LinkedIn","description_default":"View LinkedIn page","description":null,"action":"https://www.linkedin.com/company/20904983","controller":"linkedin.com","value":"/company/20904983"}]}';
    const same = deepEql(JSON.parse(result as string), JSON.parse(expected));
    if (!same) {
      console.log(`Actual  : ${result}`);
      console.log(`Expected: ${expected}`);
    }
    expect(same).to.equal(true);
  });
});
